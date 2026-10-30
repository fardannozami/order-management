import { DashboardService } from './dashboard.service.js';

describe('DashboardService', () => {
  function mockDatabase(results: unknown[][]) {
    const select = vi.fn();
    for (const rows of results) {
      const query: any = {};
      query.from = vi.fn(() => query);
      query.innerJoin = vi.fn(() => query);
      query.where = vi.fn(() => query);
      query.groupBy = vi.fn(() => query);
      query.orderBy = vi.fn(() => query);
      query.limit = vi.fn(() => Promise.resolve(rows));
      // eslint-disable-next-line unicorn/no-thenable -- mock must be awaitable for queries the service awaits directly
      query.then = (resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) =>
        Promise.resolve(rows).then(resolve, reject);
      select.mockReturnValueOnce(query);
    }
    return { db: { select } };
  }

  it('returns totals, top sellers and low-stock products', async () => {
    const database = mockDatabase([
      [{ total_transactions: 8, total_sales: '123456.78' }],
      [{ id: 1, product_code: 'P0001', product_name: 'Drink', quantity_sold: '13', revenue: '1200.00' }],
      [{ id: 2, product_code: 'P0002', product_name: 'Water', stock: 2 }],
      [{ active_products: 10 }],
      [{ active_customers: 6 }],
      [],
      [{ total_sales: '0' }],
    ]);
    const service = new DashboardService(database as any);

    const result = await service.summary();
    expect(result).toMatchObject({
      total_transactions: 8, total_sales: '123456.78', active_products: 10, active_customers: 6,
      top_products: [{ id: 1, product_code: 'P0001', product_name: 'Drink', quantity_sold: 13, revenue: '1200.00' }],
      low_stock_products: [{ id: 2, product_code: 'P0002', product_name: 'Water', stock: 2 }],
      current_week_sales: '0.00', sales_change_percent: 0,
    });
    expect(result.sales_trend).toHaveLength(7);
    expect(result.sales_trend.every((row) => row.total_sales === '0')).toBe(true);
  });

  it('returns zero totals and empty product lists when there is no data', async () => {
    const database = mockDatabase([
      [{ total_transactions: 0, total_sales: '0' }],
      [],
      [],
      [{ active_products: 0 }],
      [{ active_customers: 0 }],
      [],
      [{ total_sales: '0' }],
    ]);
    const service = new DashboardService(database as any);

    const result = await service.summary();
    expect(result).toMatchObject({
      total_transactions: 0, total_sales: '0', active_products: 0, active_customers: 0,
      top_products: [], low_stock_products: [], current_week_sales: '0.00', sales_change_percent: 0,
    });
    expect(result.sales_trend).toHaveLength(7);
  });
});
