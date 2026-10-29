import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { DatabaseService } from './database.service.js';
import { users } from './db/schema.js';

type LoginInput = {
  email?: unknown;
  password?: unknown;
};

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET;
  private readonly expiresIn = parsePositiveInt(
    process.env.JWT_ACCESS_TOKEN_TTL_SECONDS,
    3600,
  );

  constructor(private readonly database: DatabaseService) {}

  async login(input: LoginInput) {
    const errors: Record<string, string[]> = {};
    if (typeof input?.email !== 'string' || !isEmail(input.email)) {
      errors.email = ['Email tidak valid'];
    }
    if (typeof input?.password !== 'string' || input.password.length === 0) {
      errors.password = ['Password wajib diisi'];
    }
    if (Object.keys(errors).length) {
      throw new UnprocessableEntityException({
        message: 'Validasi gagal',
        errors,
      });
    }

    const [user] = await this.database.db
      .select()
      .from(users)
      .where(eq(users.email, input.email as string))
      .limit(1);

    if (!user || !(await compare(input.password as string, user.password))) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const now = Math.floor(Date.now() / 1000);
    const accessToken = this.signToken({
      sub: String(user.id),
      email: user.email,
      iat: now,
      exp: now + this.expiresIn,
    });

    return {
      user: { id: user.id, name: user.name, email: user.email },
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.expiresIn,
    };
  }

  private signToken(payload: Record<string, string | number>) {
    if (!this.jwtSecret || this.jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must contain at least 32 characters');
    }

    const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = base64Url(JSON.stringify(payload));
    const unsignedToken = `${header}.${body}`;
    const signature = createHmac('sha256', this.jwtSecret)
      .update(unsignedToken)
      .digest('base64url');
    return `${unsignedToken}.${signature}`;
  }
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function base64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}
