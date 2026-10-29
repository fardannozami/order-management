import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { IS_PUBLIC_KEY } from './auth.decorator.js';

export type AuthenticatedRequest = Request & {
  auth: { userId: number; sessionId: string; email: string };
};

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const match = authorization?.match(/^Bearer\s+(.+)$/i);
    if (!match) throw new UnauthorizedException('Bearer access token wajib disertakan');
    const claims = this.authService.verifyAccessToken(match[1]);
    if (!(await this.authService.isSessionActive(claims.sid))) {
      throw new UnauthorizedException('Sesi sudah dicabut atau kedaluwarsa');
    }
    request.auth = { userId: Number(claims.sub), sessionId: claims.sid, email: claims.email };
    return true;
  }
}
