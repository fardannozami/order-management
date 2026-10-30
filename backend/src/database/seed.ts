import { hash } from 'bcryptjs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { asc, eq, inArray } from 'drizzle-orm';
import { Pool } from 'pg';
import { customers, orderItems, orders, products, users } from './schema.js';

const demoPassword = 'ChangeMe123!';
const demoUsers = [
  { name: 'Admin AZA', email: 'admin@azatech.id' },
  { name: 'Supervisor AZA', email: 'supervisor@azatech.id' },
  { name: 'Kasir AZA', email: 'kasir@azatech.id' },
];
const productSeeds = [
  { productCode: 'P0001', productName: 'Hydrococo 150ml', stock: 25, price: '12000.00' },
  { productCode: 'P0002', productName: 'Air Mineral 600ml', stock: 40, price: '5000.00' },
  { productCode: 'P0003', productName: 'Teh Botol 350ml', stock: 30, price: '7000.00' },
  { productCode: 'P0004', productName: 'Roti Cokelat', stock: 20, price: '8500.00' },
  { productCode: 'P0005', productName: 'Kopi Susu 250ml', stock: 18, price: '15000.00' },
];
const customerSeeds = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    customerName: 'Budi Santoso',
    customerAddress: 'Jakarta',
    gender: 'Pria' as const,
    birthDate: '1995-02-10',
    phone: '081234567890',
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    customerName: 'Siti Aminah',
    customerAddress: 'Bandung',
    gender: 'Wanita' as const,
    birthDate: '1998-07-21',
    phone: '082112345678',
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    customerName: 'Andi Wijaya',
    customerAddress: 'Surabaya',
    gender: 'Pria' as const,
    birthDate: '1992-11-03',
    phone: null,
  },
];

if (process.env.NODE_ENV === 'production') {
  throw new Error('Demo seeder tidak boleh dijalankan di production');
}

const pool = new Pool({
  host: process.env.PGHOST ?? '127.0.0.1',
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER ?? 'order_management',
  password: process.env.PGPASSWORD ?? 'change-me',
  database: process.env.PGDATABASE ?? 'order_management',
});

try {
  const db = drizzle(pool);
  const demoPasswordHash = await hash(demoPassword, 12);
  const createdUsers = await db
    .insert(users)
    .values(demoUsers.map((user) => ({ ...user, password: demoPasswordHash })))
    .onConflictDoNothing({ target: users.email })
    .returning({ email: users.email });
  console.log(`Seeded ${createdUsers.length} demo users; existing emails were left unchanged.`);

  const seededProducts = await db.insert(products).values(productSeeds)
    .onConflictDoNothing({ target: products.productCode })
    .returning({ product_code: products.productCode });
  console.log(`Seeded ${seededProducts.length} new products; existing product codes were left unchanged.`);

  const seededCustomers = await db.insert(customers).values(customerSeeds)
    .onConflictDoNothing({ target: customers.id })
    .returning({ id: customers.id });
  console.log(`Seeded ${seededCustomers.length} demo customers; existing customer IDs were left unchanged.`);

  const seededOrderCount = await db.transaction(async (tx) => {
    const [admin] = await tx.select({ id: users.id }).from(users)
      .where(eq(users.email, 'admin@azatech.id')).limit(1);
    const seededProducts = await tx.select({
      id: products.id,
      price: products.price,
      productCode: products.productCode,
    }).from(products).where(inArray(products.productCode, productSeeds.map((p) => p.productCode)))
      .orderBy(asc(products.productCode));
    const seededCustomers = await tx.select({ id: customers.id })
      .from(customers).where(inArray(customers.id, customerSeeds.map((c) => c.id)));

    if (!admin || seededProducts.length === 0 || seededCustomers.length === 0) {
      throw new Error('Admin, produk, atau pelanggan seed tidak ditemukan; order seed dibatalkan.');
    }

    const now = new Date();
    const plannedLines = (index: number) => {
      const first = seededProducts[index % seededProducts.length];
      const second = seededProducts[(index + 1) % seededProducts.length];
      const quantity = (index % 3) + 1;
      const chosen = [first, ...(index % 2 === 0 && second.id !== first.id ? [second] : [])];
      return chosen.map((product, itemIndex) => {
        const itemQuantity = itemIndex === 0 ? quantity : 1;
        const unitPrice = product.price;
        const [whole, fraction = '00'] = unitPrice.split('.');
        const unitCents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2));
        const subtotalCents = unitCents * BigInt(itemQuantity);
        return {
          productId: product.id,
          quantity: itemQuantity,
          unitPrice,
          subtotal: `${subtotalCents / 100n}.${String(subtotalCents % 100n).padStart(2, '0')}`,
          subtotalCents,
        };
      });
    };

    const orderSeeds = Array.from({ length: 30 }, (_, index) => {
      const orderDate = new Date(now.getTime() - index * 24 * 60 * 60 * 1000);
      const datePart = orderDate.toISOString().slice(0, 10).replace(/-/g, '');
      const totalCents = plannedLines(index).reduce((sum, item) => sum + item.subtotalCents, 0n);
      return {
        orderNumber: `INV-${datePart}-0001`,
        customerId: seededCustomers[index % seededCustomers.length].id,
        createdBy: admin.id,
        orderDate,
        totalAmount: `${totalCents / 100n}.${String(totalCents % 100n).padStart(2, '0')}`,
        seedIndex: index,
      };
    });

    const createdOrders = await tx.insert(orders).values(orderSeeds.map(({ seedIndex: _seedIndex, ...order }) => order))
      .onConflictDoNothing({ target: orders.orderNumber })
      .returning({ id: orders.id, orderNumber: orders.orderNumber });

    if (createdOrders.length > 0) {
      const seedIndexByOrderNumber = new Map(orderSeeds.map((order) => [order.orderNumber, order.seedIndex]));
      const itemRows = createdOrders.flatMap((order) => {
        const seedIndex = seedIndexByOrderNumber.get(order.orderNumber) ?? 0;
        return plannedLines(seedIndex).map((item) => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        }));
      });

      await tx.insert(orderItems).values(itemRows);
    }
    return createdOrders.length;
  });
  console.log(`Seeded ${seededOrderCount} demo orders (30 order dates; existing order numbers were left unchanged).`);
} catch (error) {
  console.error('Database seeding failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
