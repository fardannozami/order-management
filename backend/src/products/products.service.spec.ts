import { ConflictException } from '@nestjs/common';
import { DrizzleQueryError } from 'drizzle-orm';
import { ProductsService } from './products.service.js';

describe('ProductsService', () => {
  function wrappedUniqueViolation() {
    const postgresError = Object.assign(new Error('duplicate key'), {
      code: '23505',
      constraint: 'products_product_code_unique',
    });
    return new DrizzleQueryError('write product', [], postgresError);
  }

  async function expectProductCodeConflict(operation: Promise<unknown>) {
    const error = await operation.catch((value) => value);
    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toEqual({
      message: 'Kode produk sudah digunakan',
      errors: { product_code: ['Kode produk sudah digunakan'] },
    });
  }

  it('returns 409 when create violates the unique product_code constraint', async () => {
    const returning = vi.fn().mockRejectedValue(wrappedUniqueViolation());
    const database = {
      db: { insert: vi.fn(() => ({ values: vi.fn(() => ({ returning })) })) },
    };
    const service = new ProductsService(database as any);

    await expectProductCodeConflict(service.create({
      product_code: 'P0001', product_name: 'Hydrococo 150ml', stock: 10, price: 12000,
    }));
  });

  it('returns 409 when update changes product_code to an existing code', async () => {
    const returning = vi.fn().mockRejectedValue(wrappedUniqueViolation());
    const database = {
      db: {
        update: vi.fn(() => ({
          set: vi.fn(() => ({ where: vi.fn(() => ({ returning })) })),
        })),
      },
    };
    const service = new ProductsService(database as any);
    vi.spyOn(service, 'get').mockResolvedValue({ id: 1 } as any);

    await expectProductCodeConflict(service.update(1, { product_code: 'P0001' }));
  });
});
