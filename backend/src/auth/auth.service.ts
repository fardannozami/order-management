import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createHmac, createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { DatabaseService } from '../database/database.service.js';
import { refreshSessions, users } from '../database/schema.js';

type LoginInput = { email?: unknown; password?: unknown };
type AccessClaims = { sub: string; sid: string; email: string; iat: number; exp: number; typ: 'access' | 'refresh' };
type RefreshClaims = Omit<AccessClaims, 'typ'> & { typ: 'refresh'; jti: string };

@Injectable()
export class AuthService {
  private readonly accessSecret = process.env.JWT_SECRET;
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  private readonly accessTtl = parsePositiveInt(process.env.JWT_ACCESS_TOKEN_TTL_SECONDS, 3600);
  private readonly refreshTtl = parsePositiveInt(process.env.JWT_REFRESH_TOKEN_TTL_SECONDS, 30 * 24 * 3600);

  constructor(private readonly database: DatabaseService) {}

  async login(input: LoginInput) {
    const errors: Record<string, string[]> = {};
    if (typeof input?.email !== 'string' || !isEmail(input.email)) errors.email = ['Email tidak valid'];
    if (typeof input?.password !== 'string' || input.password.length === 0) errors.password = ['Password wajib diisi'];
    if (Object.keys(errors).length) {
      throw new UnprocessableEntityException({ message: 'Validasi gagal', errors });
    }

    const [user] = await this.database.db.select().from(users).where(eq(users.email, input.email as string)).limit(1);
    if (!user || !(await compare(input.password as string, user.password))) {
      throw new UnauthorizedException('Email atau password salah');
    }

    this.assertSecrets();
    const sessionId = randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const refreshExpiresAt = new Date((now + this.refreshTtl) * 1000);
    const refreshToken = this.createRefreshToken(user.id, sessionId, user.email, now, refreshExpiresAt);
    await this.database.db.insert(refreshSessions).values({
      sessionId,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiresAt,
    });

    return {
      user: { id: user.id, name: user.name, email: user.email },
      ...this.createTokenResponse(user, sessionId, now, refreshToken, this.refreshTtl),
    };
  }

  async refresh(input: { refresh_token?: unknown }) {
    if (typeof input?.refresh_token !== 'string' || input.refresh_token.length < 32) {
      throw new UnprocessableEntityException({
        message: 'Validasi gagal',
        errors: { refresh_token: ['Refresh token wajib diisi'] },
      });
    }
    this.assertSecrets();
    const claims = this.verifyRefreshToken(input.refresh_token);
    const tokenHash = hashToken(input.refresh_token);
    const result = await this.database.db.transaction(async (tx) => {
      const [session] = await tx.select().from(refreshSessions)
        .where(eq(refreshSessions.tokenHash, tokenHash)).for('update').limit(1);
      if (!session) return { status: 'invalid' as const };
      if (session.sessionId !== claims.sid || String(session.userId) !== claims.sub) return { status: 'invalid' as const };

      if (session.revokedAt) {
        await tx.update(refreshSessions).set({ revokedAt: new Date() })
          .where(and(eq(refreshSessions.sessionId, session.sessionId), isNull(refreshSessions.revokedAt)));
        return { status: 'reused' as const };
      }
      if (session.expiresAt.getTime() <= Date.now()) {
        await tx.update(refreshSessions).set({ revokedAt: new Date() })
          .where(eq(refreshSessions.id, session.id));
        return { status: 'expired' as const };
      }

      const [user] = await tx.select().from(users).where(eq(users.id, session.userId)).limit(1);
      if (!user) return { status: 'invalid' as const };
      const nextToken = this.createRefreshToken(
        user.id,
        session.sessionId,
        user.email,
        Math.floor(Date.now() / 1000),
        session.expiresAt,
      );
      await tx.update(refreshSessions).set({ revokedAt: new Date() }).where(eq(refreshSessions.id, session.id));
      await tx.insert(refreshSessions).values({
        sessionId: session.sessionId,
        userId: session.userId,
        tokenHash: hashToken(nextToken),
        expiresAt: session.expiresAt,
      });
      return { status: 'ok' as const, user, sessionId: session.sessionId, nextToken, expiresAt: session.expiresAt };
    });

    if (result.status !== 'ok') throw new UnauthorizedException('Refresh token tidak valid atau sudah kedaluwarsa');
    const now = Math.floor(Date.now() / 1000);
    return {
      user: { id: result.user.id, name: result.user.name, email: result.user.email },
      ...this.createTokenResponse(
        result.user,
        result.sessionId,
        now,
        result.nextToken,
        Math.max(1, Math.floor((result.expiresAt.getTime() - Date.now()) / 1000)),
      ),
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.database.db.update(refreshSessions).set({ revokedAt: new Date() })
      .where(and(eq(refreshSessions.sessionId, sessionId), isNull(refreshSessions.revokedAt)));
  }

  async profile(userId: number) {
    const [user] = await this.database.db.select({ id: users.id, name: users.name, email: users.email })
      .from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new UnauthorizedException('User tidak ditemukan');
    return user;
  }

  verifyAccessToken(token: string): AccessClaims {
    this.assertSecrets();
    try {
      const [encodedHeader, encodedPayload, signature] = token.split('.');
      if (!encodedHeader || !encodedPayload || !signature) throw new Error('Malformed token');
      const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString()) as { alg?: string };
      const claims = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as AccessClaims;
      if (header.alg !== 'HS256' || claims.typ !== 'access' || claims.exp <= Date.now() / 1000) throw new Error('Invalid token');
      const expected = createHmac('sha256', this.accessSecret!).update(`${encodedHeader}.${encodedPayload}`).digest();
      const actual = Buffer.from(signature, 'base64url');
      if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('Invalid signature');
      if (!/^\d+$/.test(claims.sub) || !claims.sid || !claims.email) throw new Error('Invalid claims');
      return claims;
    } catch {
      throw new UnauthorizedException('Access token tidak valid atau sudah kedaluwarsa');
    }
  }

  private verifyRefreshToken(token: string): RefreshClaims {
    try {
      const claims = this.verifyJwt<RefreshClaims>(token, this.refreshSecret!);
      if (claims.typ !== 'refresh' || !claims.jti) throw new Error('Invalid refresh token');
      return claims;
    } catch {
      throw new UnauthorizedException('Refresh token tidak valid atau sudah kedaluwarsa');
    }
  }

  async isSessionActive(sessionId: string): Promise<boolean> {
    const [session] = await this.database.db.select({ id: refreshSessions.id })
      .from(refreshSessions)
      .where(and(
        eq(refreshSessions.sessionId, sessionId),
        isNull(refreshSessions.revokedAt),
        gt(refreshSessions.expiresAt, new Date()),
      ))
      .limit(1);
    return Boolean(session);
  }

  private createTokenResponse(
    user: { id: number; email: string }, sessionId: string, now: number, refreshToken: string, refreshExpiresIn: number,
  ) {
    const accessToken = this.signAccessToken({
      sub: String(user.id), sid: sessionId, email: user.email, iat: now, exp: now + this.accessTtl, typ: 'access',
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: this.accessTtl,
      refresh_expires_in: refreshExpiresIn,
    };
  }

  private createRefreshToken(userId: number, sessionId: string, email: string, now: number, expiresAt: Date): string {
    return this.signJwt({
      sub: String(userId), sid: sessionId, email, iat: now,
      exp: Math.floor(expiresAt.getTime() / 1000), typ: 'refresh', jti: randomUUID(),
    }, this.refreshSecret!);
  }

  private signAccessToken(payload: AccessClaims): string {
    return this.signJwt(payload, this.accessSecret!);
  }

  private signJwt(payload: Record<string, string | number>, secret: string): string {
    const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = base64Url(JSON.stringify(payload));
    const unsigned = `${header}.${body}`;
    return `${unsigned}.${createHmac('sha256', secret).update(unsigned).digest('base64url')}`;
  }

  private verifyJwt<T extends { exp: number; sub: string; sid: string; email: string }>(token: string, secret: string): T {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !signature) throw new Error('Malformed token');
    const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString()) as { alg?: string };
    const claims = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as T;
    if (header.alg !== 'HS256' || !Number.isFinite(claims.exp) || claims.exp <= Date.now() / 1000) {
      throw new Error('Invalid token');
    }
    const expected = createHmac('sha256', secret).update(`${encodedHeader}.${encodedPayload}`).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('Invalid signature');
    if (!/^\d+$/.test(claims.sub) || !claims.sid || !claims.email) throw new Error('Invalid claims');
    return claims;
  }

  private assertSecrets(): void {
    if (!this.accessSecret || this.accessSecret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
    if (!this.refreshSecret || this.refreshSecret.length < 32) throw new Error('JWT_REFRESH_SECRET must contain at least 32 characters');
  }
}

function isEmail(value: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
function base64Url(value: string): string { return Buffer.from(value).toString('base64url'); }
function hashToken(value: string): string { return createHash('sha256').update(value).digest('hex'); }
