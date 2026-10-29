import type { ExecutionContext, CallHandler } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { ApiResponseInterceptor } from './api-response.interceptor.js';

describe('ApiResponseInterceptor', () => {
  async function intercept(result: unknown, statusCode: number) {
    const context = {
      switchToHttp: () => ({ getResponse: () => ({ statusCode }) }),
    } as unknown as ExecutionContext;
    const handler = { handle: () => of(result) } as CallHandler;
    return firstValueFrom(new ApiResponseInterceptor().intercept(context, handler));
  }

  it('wraps a normal success response', async () => {
    await expect(intercept({ id: 1 }, 200)).resolves.toEqual({
      success: true,
      message: 'OK',
      data: { id: 1 },
    });
  });

  it('keeps pagination metadata at the response root', async () => {
    await expect(intercept({ data: [{ id: 1 }], meta: { page: 1, total: 1 } }, 200)).resolves.toEqual({
      success: true,
      message: 'OK',
      data: [{ id: 1 }],
      meta: { page: 1, total: 1 },
    });
  });

  it('leaves 204 responses empty', async () => {
    await expect(intercept(undefined, 204)).resolves.toBeUndefined();
  });
});
