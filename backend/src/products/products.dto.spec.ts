import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductDto } from './products.dto.js';

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

  it('rejects a negative stock or non-positive price', async () => {
    const dto = plainToInstance(CreateProductDto, {
      product_code: 'P0001',
      product_name: 'Hydrococo 150ml',
      stock: -1,
      price: 0,
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(['stock', 'price']));
  });
});
