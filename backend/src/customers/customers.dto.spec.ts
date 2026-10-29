import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCustomerDto } from './customers.dto.js';

describe('CreateCustomerDto', () => {
  it('accepts the fields defined for a customer', async () => {
    const dto = plainToInstance(CreateCustomerDto, {
      customer_name: 'Budi Santoso',
      customer_address: 'Jakarta',
      gender: 'Pria',
      birth_date: '1995-02-10',
      phone: '081234567890',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects unsupported gender and malformed birth date', async () => {
    const dto = plainToInstance(CreateCustomerDto, {
      customer_name: 'Budi Santoso',
      customer_address: 'Jakarta',
      gender: 'Other',
      birth_date: '10/02/1995',
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(['gender', 'birth_date']));
  });
});
