import { ConflictException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { ApiExceptionFilter } from './api-exception.filter.js';

describe('ApiExceptionFilter', () => {
  it('preserves conflict status and field error details', () => {
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ArgumentsHost;
    const exception = new ConflictException({
      message: 'Kode produk sudah digunakan',
      errors: { product_code: ['Kode produk sudah digunakan'] },
    });

    new ApiExceptionFilter().catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: 'Kode produk sudah digunakan',
      errors: { product_code: ['Kode produk sudah digunakan'] },
    });
  });
});
