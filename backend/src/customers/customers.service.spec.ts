import { NotFoundException } from '@nestjs/common';
import { customers } from '../database/schema.js';
import { CustomersService } from './customers.service.js';

describe('CustomersService', () => {
  it('get throws NotFoundException when customer not found', async () => {
    const db = {
      db: {
        select: vi.fn(() => ({
          from: () => ({
            where: () => ({
              limit: async () => [],
            }),
          }),
        })),
      },
    };
    const service = new CustomersService(db as any);
    await expect(service.get('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update throws NotFoundException when customer not found', async () => {
    const db = { db: {} };
    const service = new CustomersService(db as any);
    vi.spyOn(service, 'get').mockRejectedValue(new NotFoundException('Pelanggan tidak ditemukan'));
    await expect(service.update('missing-id', { customer_name: 'X' } as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove throws NotFoundException when customer not found', async () => {
    const returning = vi.fn().mockResolvedValue([]);
    const db = {
      db: {
        update: vi.fn(() => ({
          set: vi.fn(() => ({ where: vi.fn(() => ({ returning })) })),
        })),
      },
    };
    const service = new CustomersService(db as any);
    await expect(service.remove('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create returns mapped customer', async () => {
    const returning = vi.fn().mockResolvedValue([
      {
        id: 'cust-1',
        customerName: 'Budi',
        customerAddress: 'Jakarta',
        gender: 'Pria',
        birthDate: '1995-02-10',
        phone: '0812',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const db = {
      db: { insert: vi.fn(() => ({ values: vi.fn(() => ({ returning })) })) },
    };
    const service = new CustomersService(db as any);
    const result = await service.create({
      customer_name: 'Budi',
      customer_address: 'Jakarta',
      gender: 'Pria',
      birth_date: '1995-02-10',
      phone: '0812',
    } as any);
    expect(result.id).toBe('cust-1');
    expect(result.customer_name).toBe('Budi');
  });
});