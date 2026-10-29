import { ConflictException } from '@nestjs/common';
import { DrizzleQueryError } from 'drizzle-orm';
import { ProductsService } from './products.service.js';

describe('ProductsService', () => {
  it('converts a wrapped PostgreSQL unique violation into a product code conflict', async () => {
    const postgresError = Object.assign(new Error('duplicate key'), {
      code: '23505',
      constraint: 'products_product_code_unique',
    });
    const returning = vi.fn().mockRejectedValue(
      new DrizzleQueryError('insert product', [], postgresError),
    );
    const database = {
      db: { insert: vi.fn(() => ({ values: vi.fn(() => ({ returning })) })) },
    };
    const service = new ProductsService(database as any);

    try {
      await service.create({
        product_code: 'P0001',
        product_name: 'Hydrococo 150ml',
        stock: 10,
        price: 12000,
      });
      throw new Error('Expected create to reject');
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toEqual({
        message: 'Kode produk sudah digunakan',
        errors: { product_code: ['Kode produk sudah digunakan'] },
      });
    }
  });
});
