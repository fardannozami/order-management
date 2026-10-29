import { UnauthorizedException } from '@nestjs/common';
import { AccessTokenGuard } from './auth.guard.js';
import type { AuthService } from './auth.service.js';
import type { Reflector } from '@nestjs/core';

describe('AccessTokenGuard', () => {
  const claims = { sub: '42', sid: 'session-id', email: 'admin@azatech.id', iat: 1, exp: 9999999999, typ: 'access' as const };

  function setup(authorization?: string, isPublic = false) {
    const request = { headers: { authorization } } as any;
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(isPublic) };
    const authService = {
      verifyAccessToken: vi.fn().mockReturnValue(claims),
      isSessionActive: vi.fn().mockResolvedValue(true),
    };
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;
    const guard = new AccessTokenGuard(reflector as unknown as Reflector, authService as unknown as AuthService);
    return { guard, context, request, authService };
  }

  it('attaches the verified identity for a valid bearer token', async () => {
    const { guard, context, request } = setup('Bearer valid.jwt.token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.auth).toEqual({ userId: 42, sessionId: 'session-id', email: 'admin@azatech.id' });
  });

  it('rejects a request without a bearer token', async () => {
    const { guard, context } = setup();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows a public route without validating a token', async () => {
    const { guard, context, authService } = setup(undefined, true);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(authService.verifyAccessToken).not.toHaveBeenCalled();
  });
});
