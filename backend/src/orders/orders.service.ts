import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  sql,
  type SQL,
} from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { customers, orderItems, orders, products } from '../database/schema.js';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import type { CreateOrderDto, ListOrdersQuery } from './orders.dto.js';

type Authed = AuthenticatedRequest['auth'];

@Injectable()
export class OrdersService {
  constructor(private readonly database: DatabaseService) {}

  async list(query: ListOrdersQuery) {
    const { page, per_page, from, to, customer_id } = query;
    const conditions: SQL[] = [];
    if (customer_id) conditions.push(eq(orders.customerId, customer_id));
    if (from) conditions.push(gte(orders.orderDate, startOfDay(from)));
    if (to) conditions.push(lte(orders.orderDate, endOfDay(to)));
    const where = conditions.length ? and(...conditions) : undefined;

    const [data, [totalRow]] = await Promise.all([
      this.database.db
        .select({
          id: orders.id,
          order_number: orders.orderNumber,
          customer_id: orders.customerId,
          customer_name: customers.customerName,
          total_amount: orders.totalAmount,
          order_date: orders.orderDate,
          created_at: orders.createdAt,
          item_count: sql<number>`(select count(*)::int from ${orderItems} where ${orderItems.orderId} = ${orders.id})`,
        })
        .from(orders)
        .leftJoin(customers, eq(customers.id, orders.customerId))
        .where(where)
        .orderBy(desc(orders.orderDate), desc(orders.id))
        .limit(per_page)
        .offset((page - 1) * per_page),
      this.database.db.select({ total: count() }).from(orders).where(where),
    ]);
    const total = totalRow?.total ?? 0;
    return { data, meta: { page, per_page, total, total_pages: Math.ceil(total / per_page) } };
  }

  async get(id: number) {
    const [order] = await this.database.db
      .select({
        id: orders.id,
        order_number: orders.orderNumber,
        customer_id: orders.customerId,
        customer_name: customers.customerName,
        customer_address: customers.customerAddress,
        created_by: orders.createdBy,
        total_amount: orders.totalAmount,
        order_date: orders.orderDate,
        created_at: orders.createdAt,
        updated_at: orders.updatedAt,
      })
      .from(orders)
      .leftJoin(customers, eq(customers.id, orders.customerId))
      .where(eq(orders.id, id))
      .limit(1);
    if (!order) throw new NotFoundException('Order tidak ditemukan');

    const items = await this.database.db
      .select({
        id: orderItems.id,
        product_id: orderItems.productId,
        product_code: products.productCode,
        product_name: products.productName,
        quantity: orderItems.quantity,
        unit_price: orderItems.unitPrice,
        subtotal: orderItems.subtotal,
      })
      .from(orderItems)
      .leftJoin(products, eq(products.id, orderItems.productId))
      .where(eq(orderItems.orderId, id))
      .orderBy(asc(orderItems.id));

    return { ...order, items };
  }

  async create(input: CreateOrderDto, auth: Authed) {
    return this.database.db.transaction(async (tx) => {
      // validate customer
      const [customer] = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.id, input.customer_id), isNull(customers.deletedAt)))
        .limit(1);
      if (!customer) {
        throw new UnprocessableEntityException({
          message: 'Validasi gagal',
          errors: { customer_id: ['Pelanggan tidak ditemukan'] },
        });
      }

      // fetch products with lock
      const productIds = input.items.map((i) => i.product_id);
      const sortedProductIds = [...new Set(productIds)].sort((a, b) => a - b);
      const fetched = await tx
        .select()
        .from(products)
        .where(inArray(products.id, sortedProductIds))
        .for('update');
      const productMap = new Map(fetched.map((p) => [p.id, p]));

      const qtyByProduct = new Map<number, number>();
      for (const item of input.items) {
        qtyByProduct.set(item.product_id, (qtyByProduct.get(item.product_id) ?? 0) + item.quantity);
      }

      const errors: Record<string, string[]> = {};
      const prepared = input.items.map((item, index) => {
        const product = productMap.get(item.product_id);
        if (!product || product.deletedAt) {
          errors[`items.${index}.product_id`] = ['Produk tidak ditemukan'];
          return null;
        }
        const totalQty = qtyByProduct.get(item.product_id) ?? item.quantity;
        if (product.stock < totalQty) {
          errors[`items.${index}.quantity`] = [
            `Stok ${product.productName} tersisa ${product.stock}, diminta ${totalQty}`,
          ];
          return null;
        }
        const unitPrice = product.price;
        const subtotal = (Number(unitPrice) * item.quantity).toFixed(2);
        return { item, product, unitPrice, subtotal };
      });

      if (Object.keys(errors).length) {
        throw new UnprocessableEntityException({
          message: 'Stok tidak mencukupi',
          errors,
        });
      }

      // order number
      const today = new Date();
      const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
      const startOfDayUtc = new Date(`${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}T00:00:00.000Z`);
      const nextDayUtc = new Date(startOfDayUtc.getTime() + 24 * 60 * 60 * 1000);
      // Serialize number allocation for this day across concurrent API processes.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`orders:${datePart}`}, 0))`);
      const [countRow] = await tx
        .select({ total: count() })
        .from(orders)
        .where(and(gte(orders.orderDate, startOfDayUtc), lt(orders.orderDate, nextDayUtc)));
      const seq = (countRow?.total ?? 0) + 1;
      const orderNumber = `INV-${datePart}-${String(seq).padStart(4, '0')}`;

      const totalAmount = prepared
        .reduce((sum, p) => sum + Number(p!.subtotal), 0)
        .toFixed(2);

      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          customerId: input.customer_id,
          createdBy: auth.userId,
          totalAmount,
        })
        .returning();

      const itemValues = prepared.map((p) => ({
        orderId: order.id,
        productId: p!.item.product_id,
        quantity: p!.item.quantity,
        unitPrice: p!.unitPrice,
        subtotal: p!.subtotal,
      }));
      const insertedItems = await tx.insert(orderItems).values(itemValues).returning();

      // decrement stock (aggregated per product, atomic expression)
      for (const [productId, qty] of qtyByProduct.entries()) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${qty}`, updatedAt: new Date() })
          .where(eq(products.id, productId));
      }

      return {
        id: order.id,
        order_number: order.orderNumber,
        customer_id: order.customerId,
        total_amount: order.totalAmount,
        order_date: order.orderDate,
        items: insertedItems.map((it) => ({
          id: it.id,
          product_id: it.productId,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          subtotal: it.subtotal,
        })),
      };
    });
  }
}

function startOfDay(value: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    // support date-only
    const dd = new Date(`${value}T00:00:00`);
    return Number.isNaN(dd.getTime()) ? new Date(value) : dd;
  }
  // if date-only string, set midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`);
  }
  return d;
}

function endOfDay(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T23:59:59.999`);
  }
  return new Date(value);
}
