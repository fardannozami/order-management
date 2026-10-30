import { Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, isNull, lt, sql, sum } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { orderItems, orders, products } from '../database/schema.js';

@Injectable()
export class DashboardService {
  constructor(private readonly database: DatabaseService) {}

  async summary() {
    const [[totals], topProducts, lowStockProducts] = await Promise.all([
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
        })
        .from(orderItems)
        .innerJoin(products, eq(products.id, orderItems.productId))
        .where(isNull(products.deletedAt))
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
    ]);

    return {
      total_transactions: totals?.total_transactions ?? 0,
      total_sales: totals?.total_sales ?? '0',
      top_products: topProducts,
      low_stock_products: lowStockProducts,
    };
  }
}
