import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductDto, UpdateProductDto } from './products.dto.js';

describe('CreateProductDto', () => {
  it('accepts a valid product and transforms numeric fields', async () => {
    const dto = plainToInstance(CreateProductDto, {
      product_code: 'P0001',
      product_name: 'Hydrococo 150ml',
      stock: '10',
      price: '12000.00',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.stock).toBe(10);
    expect(dto.price).toBe(12000);
  });

  it('accepts the lower valid boundaries: stock zero and price 0.01', async () => {
    const dto = plainToInstance(CreateProductDto, {
      product_code: 'P0001', product_name: 'Hydrococo', stock: 0, price: 0.01,
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it.each([-1, 1.5])('rejects invalid stock value %s', async (stock) => {
    const dto = plainToInstance(CreateProductDto, {
      product_code: 'P0001', product_name: 'Hydrococo', stock, price: 1,
    });

    expect((await validate(dto)).map((error) => error.property)).toContain('stock');
  });

  it.each([0, -1, 1.001])('rejects invalid price value %s', async (price) => {
    const dto = plainToInstance(CreateProductDto, {
      product_code: 'P0001', product_name: 'Hydrococo', stock: 1, price,
    });

    expect((await validate(dto)).map((error) => error.property)).toContain('price');
  });

  it.each(['', '                     ', 'P'.repeat(21)])(
    'rejects invalid product_code %j',
    async (product_code) => {
      const dto = plainToInstance(CreateProductDto, {
        product_code, product_name: 'Hydrococo', stock: 1, price: 1,
      });

      expect((await validate(dto)).map((error) => error.property)).toContain('product_code');
    },
  );

  it('rejects invalid values on product update too', async () => {
    const dto = plainToInstance(UpdateProductDto, { stock: -1, price: 0 });

    expect((await validate(dto)).map((error) => error.property)).toEqual(
      expect.arrayContaining(['stock', 'price']),
    );
  });
});
