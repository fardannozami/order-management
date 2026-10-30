import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { orders, orderItems, customers, products } from '../database/schema.js';
import { OrdersService } from './orders.service.js';

describe('OrdersService', () => {
  function makeDatabase(tx: any) {
    return { db: { transaction: vi.fn(async (cb: any) => cb(tx)) } };
  }

  function baseTx(overrides: any = {}) {
    const customer = overrides.customer === undefined ? { id: 'cust-1' } : overrides.customer;
    const productList = overrides.products ?? [
      { id: 1, productName: 'Hydrococo 150ml', stock: 10, price: '12000.00', deletedAt: null },
      { id: 2, productName: 'Air Mineral 600ml', stock: 5, price: '5000.00', deletedAt: null },
    ];
    const orderCount = overrides.orderCount ?? 0;
    const insertedOrder = overrides.insertedOrder ?? { id: 1, orderNumber: 'INV-20261029-0001', customerId: 'cust-1', totalAmount: '29000.00', orderDate: new Date() };
    const insertedItems = overrides.insertedItems ?? [
      { id: 1, orderId: 1, productId: 1, quantity: 2, unitPrice: '12000.00', subtotal: '24000.00' },
      { id: 2, orderId: 1, productId: 2, quantity: 1, unitPrice: '5000.00', subtotal: '5000.00' },
    ];

    const productMap = new Map(productList.map((p: any) => [p.id, p]));

    const tx: any = {
      execute: vi.fn(async () => undefined),
      select: vi.fn((cols?: any) => ({
        from: (table: any) => {
          if (table === customers) {
            return {
              where: () => ({ limit: async () => (customer ? [customer] : []) }),
            };
          }
          if (table === products) {
            return {
              where: () => ({ for: async () => productList }),
            };
          }
          if (table === orders) {
            return {
              where: async () => [{ total: orderCount }],
            };
          }
          return { where: async () => [] };
        },
      })),
      insert: vi.fn((table: any) => ({
        values: (vals: any) => ({
          returning: async () => (table === orders ? [insertedOrder] : insertedItems),
        }),
      })),
      update: vi.fn(() => ({
        set: () => ({ where: async () => undefined }),
      })),
    };
    // store product map for assertions if needed
    (tx as any).__productMap = productMap;
    return tx;
  }

  it('creates order successfully within a transaction', async () => {
    const tx = baseTx();
    const db = makeDatabase(tx);
    const service = new OrdersService(db as any);

    const result = await service.create(
      { customer_id: 'cust-1', items: [{ product_id: 1, quantity: 2 }, { product_id: 2, quantity: 1 }] } as any,
      { userId: 1, sessionId: 's', email: 'a@b.com' } as any,
    );

    expect(db.db.transaction).toHaveBeenCalled();
    expect(tx.execute).toHaveBeenCalledOnce();
    expect(result.id).toBe(1);
    expect(result.items).toHaveLength(2);
    expect(result.total_amount).toBe('29000.00');
  });

  it('throws UnprocessableEntityException when stock is insufficient', async () => {
    const tx = baseTx({ products: [{ id: 1, productName: 'Hydrococo 150ml', stock: 3, price: '12000.00', deletedAt: null }] });
    const db = makeDatabase(tx);
    const service = new OrdersService(db as any);

    await expect(
      service.create(
        { customer_id: 'cust-1', items: [{ product_id: 1, quantity: 5 }] } as any,
        { userId: 1, sessionId: 's', email: 'a@b.com' } as any,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('throws when customer not found', async () => {
    const tx = baseTx({ customer: null });
    const db = makeDatabase(tx);
    const service = new OrdersService(db as any);

    await expect(
      service.create(
        { customer_id: 'cust-x', items: [{ product_id: 1, quantity: 1 }] } as any,
        { userId: 1, sessionId: 's', email: 'a@b.com' } as any,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('throws when product not found', async () => {
    const tx = baseTx({ products: [] });
    const db = makeDatabase(tx);
    const service = new OrdersService(db as any);

    await expect(
      service.create(
        { customer_id: 'cust-1', items: [{ product_id: 999, quantity: 1 }] } as any,
        { userId: 1, sessionId: 's', email: 'a@b.com' } as any,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('get throws NotFoundException for missing order', async () => {
    const db = {
      db: {
        select: vi.fn(() => ({
          from: () => ({
            leftJoin: () => ({
              where: () => ({
                limit: async () => [],
              }),
            }),
          }),
        })),
      },
    };
    const service = new OrdersService(db as any);
    await expect(service.get(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propagates transaction errors (e.g. deadlock)', async () => {
    const db = { db: { transaction: vi.fn(async () => { throw new Error('deadlock detected'); }) } };
    const service = new OrdersService(db as any);
    await expect(
      service.create(
        { customer_id: 'cust-1', items: [{ product_id: 1, quantity: 1 }] } as any,
        { userId: 1, sessionId: 's', email: 'a@b.com' } as any,
      ),
    ).rejects.toThrow('deadlock detected');
  });
});
