import { DashboardService } from './dashboard.service.js';

describe('DashboardService', () => {
  function mockDatabase(results: [unknown[], unknown[], unknown[]]) {
    const select = vi.fn();
    for (const rows of results) {
      const query: any = {};
      query.from = vi.fn(() => query);
      query.innerJoin = vi.fn(() => query);
      query.where = vi.fn(() => query);
      query.groupBy = vi.fn(() => query);
      query.orderBy = vi.fn(() => query);
      query.limit = vi.fn(() => Promise.resolve(rows));
      query.then = (resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) =>
        Promise.resolve(rows).then(resolve, reject);
      select.mockReturnValueOnce(query);
    }
    return { db: { select } };
  }

  it('returns totals, top sellers and low-stock products', async () => {
    const database = mockDatabase([
      [{ total_transactions: 8, total_sales: '123456.78' }],
      [{ id: 1, product_code: 'P0001', product_name: 'Drink', quantity_sold: '13' }],
      [{ id: 2, product_code: 'P0002', product_name: 'Water', stock: 2 }],
    ]);
    const service = new DashboardService(database as any);

    await expect(service.summary()).resolves.toEqual({
      total_transactions: 8,
      total_sales: '123456.78',
      top_products: [{ id: 1, product_code: 'P0001', product_name: 'Drink', quantity_sold: '13' }],
      low_stock_products: [{ id: 2, product_code: 'P0002', product_name: 'Water', stock: 2 }],
    });
  });

  it('returns zero totals and empty product lists when there is no data', async () => {
    const database = mockDatabase([
      [{ total_transactions: 0, total_sales: '0' }],
      [],
      [],
    ]);
    const service = new DashboardService(database as any);

    await expect(service.summary()).resolves.toEqual({
      total_transactions: 0,
      total_sales: '0',
      top_products: [],
      low_stock_products: [],
    });
  });
});
