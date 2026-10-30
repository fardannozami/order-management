import { Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, gte, isNull, lt, sql, sum } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { customers, orderItems, orders, products } from '../database/schema.js';

@Injectable()
export class DashboardService {
  constructor(private readonly database: DatabaseService) {}

  async summary() {
    const today = dateInJakarta(new Date());
    const todayStart = new Date(`${today}T00:00:00+07:00`);
    const trendStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    const previousStart = new Date(todayStart.getTime() - 13 * 24 * 60 * 60 * 1000);
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const dayExpression = sql<string>`to_char(date_trunc('day', ${orders.orderDate} at time zone 'Asia/Jakarta'), 'YYYY-MM-DD')`;

    const [[totals], topProducts, lowStockProducts, [productCount], [customerCount], dailySales, [previousSales]] = await Promise.all([
      this.database.db
        .select({
          total_transactions: count(orders.id),
          // Keep PostgreSQL numeric precision; serialize as a decimal string.
          total_sales: sql<string>`coalesce(sum(${orders.totalAmount}), 0)::text`,
        })
        .from(orders),
      this.database.db
        .select({
          id: products.id,
          product_code: products.productCode,
          product_name: products.productName,
          quantity_sold: sum(orderItems.quantity),
          revenue: sql<string>`coalesce(sum(${orderItems.subtotal}), 0)::text`,
        })
        .from(orderItems)
        .innerJoin(products, eq(products.id, orderItems.productId))
        .groupBy(products.id, products.productCode, products.productName)
        .orderBy(desc(sum(orderItems.quantity)), asc(products.id))
        .limit(5),
      this.database.db
        .select({
          id: products.id,
          product_code: products.productCode,
          product_name: products.productName,
          stock: products.stock,
        })
        .from(products)
        .where(and(isNull(products.deletedAt), lt(products.stock, 5)))
        .orderBy(asc(products.stock), asc(products.productName), asc(products.id)),
      this.database.db
        .select({ active_products: count() })
        .from(products)
        .where(isNull(products.deletedAt)),
      this.database.db
        .select({ active_customers: count() })
        .from(customers)
        .where(isNull(customers.deletedAt)),
      this.database.db
        .select({ date: dayExpression, total_sales: sql<string>`sum(${orders.totalAmount})::text` })
        .from(orders)
        .where(and(gte(orders.orderDate, trendStart), lt(orders.orderDate, tomorrowStart)))
        .groupBy(dayExpression)
        .orderBy(dayExpression),
      this.database.db
        .select({ total_sales: sql<string>`coalesce(sum(${orders.totalAmount}), 0)::text` })
        .from(orders)
        .where(and(gte(orders.orderDate, previousStart), lt(orders.orderDate, trendStart))),
    ]);

    const salesByDate = new Map(dailySales.map((row) => [row.date, row.total_sales]));
    const salesTrend = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(trendStart.getTime() + index * 24 * 60 * 60 * 1000);
      const dateKey = dateInJakarta(date);
      return { date: dateKey, total_sales: salesByDate.get(dateKey) ?? '0' };
    });
    const currentWeekSales = salesTrend.reduce((total, row) => total + Number(row.total_sales), 0);
    const previousWeekTotal = Number(previousSales?.total_sales ?? 0);
    const salesChangePercent = previousWeekTotal === 0
      ? (currentWeekSales === 0 ? 0 : null)
      : Number((((currentWeekSales - previousWeekTotal) / previousWeekTotal) * 100).toFixed(1));

    return {
      total_transactions: totals?.total_transactions ?? 0,
      total_sales: totals?.total_sales ?? '0',
      active_products: productCount?.active_products ?? 0,
      active_customers: customerCount?.active_customers ?? 0,
      top_products: topProducts.map((product) => ({
        ...product,
        quantity_sold: Number(product.quantity_sold ?? 0),
      })),
      low_stock_products: lowStockProducts,
      sales_trend: salesTrend,
      current_week_sales: currentWeekSales.toFixed(2),
      sales_change_percent: salesChangePercent,
    };
  }
}

function dateInJakarta(value: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${values.year}-${values.month}-${values.day}`;
}
