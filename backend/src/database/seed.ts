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
  { productCode: 'P0006', productName: 'Susu UHT 250ml', stock: 24, price: '6500.00' },
  { productCode: 'P0007', productName: 'Biskuit Cokelat', stock: 32, price: '9000.00' },
  { productCode: 'P0008', productName: 'Keripik Kentang', stock: 16, price: '11000.00' },
  { productCode: 'P0009', productName: 'Mi Instan Goreng', stock: 50, price: '3500.00' },
  { productCode: 'P0010', productName: 'Jus Jeruk 300ml', stock: 21, price: '8000.00' },
  { productCode: 'P0011', productName: 'Cokelat Batang', stock: 14, price: '12500.00' },
  { productCode: 'P0012', productName: 'Wafer Vanila', stock: 28, price: '6000.00' },
  { productCode: 'P0013', productName: 'Teh Hijau 350ml', stock: 19, price: '7500.00' },
  { productCode: 'P0014', productName: 'Roti Keju', stock: 17, price: '9500.00' },
  { productCode: 'P0015', productName: 'Air Kelapa 250ml', stock: 23, price: '10000.00' },
  { productCode: 'P0016', productName: 'Kacang Panggang', stock: 26, price: '8500.00' },
  { productCode: 'P0017', productName: 'Sereal Bar', stock: 13, price: '13000.00' },
  { productCode: 'P0018', productName: 'Soda Lemon 330ml', stock: 31, price: '7000.00' },
  { productCode: 'P0019', productName: 'Kerupuk Udang', stock: 22, price: '5500.00' },
  { productCode: 'P0020', productName: 'Kopi Hitam 200ml', stock: 20, price: '9000.00' },
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
  { id: '10000000-0000-4000-8000-000000000004', customerName: 'Rina Permata', customerAddress: 'Depok', gender: 'Wanita' as const, birthDate: '1997-03-14', phone: '081298765401' },
  { id: '10000000-0000-4000-8000-000000000005', customerName: 'Dedi Kurniawan', customerAddress: 'Tangerang', gender: 'Pria' as const, birthDate: '1989-08-25', phone: '081298765402' },
  { id: '10000000-0000-4000-8000-000000000006', customerName: 'Maya Putri', customerAddress: 'Bogor', gender: 'Wanita' as const, birthDate: '2000-01-09', phone: '081298765403' },
  { id: '10000000-0000-4000-8000-000000000007', customerName: 'Agus Setiawan', customerAddress: 'Bekasi', gender: 'Pria' as const, birthDate: '1991-05-19', phone: '081298765404' },
  { id: '10000000-0000-4000-8000-000000000008', customerName: 'Dewi Lestari', customerAddress: 'Semarang', gender: 'Wanita' as const, birthDate: '1996-12-02', phone: '081298765405' },
  { id: '10000000-0000-4000-8000-000000000009', customerName: 'Rudi Hartono', customerAddress: 'Yogyakarta', gender: 'Pria' as const, birthDate: '1987-04-30', phone: '081298765406' },
  { id: '10000000-0000-4000-8000-000000000010', customerName: 'Lina Marlina', customerAddress: 'Malang', gender: 'Wanita' as const, birthDate: '1999-09-17', phone: '081298765407' },
  { id: '10000000-0000-4000-8000-000000000011', customerName: 'Fajar Nugraha', customerAddress: 'Bandung', gender: 'Pria' as const, birthDate: '1993-06-11', phone: '081298765408' },
  { id: '10000000-0000-4000-8000-000000000012', customerName: 'Nadia Safitri', customerAddress: 'Jakarta', gender: 'Wanita' as const, birthDate: '2001-02-23', phone: '081298765409' },
  { id: '10000000-0000-4000-8000-000000000013', customerName: 'Eko Prasetyo', customerAddress: 'Surakarta', gender: 'Pria' as const, birthDate: '1988-10-06', phone: '081298765410' },
  { id: '10000000-0000-4000-8000-000000000014', customerName: 'Putri Amelia', customerAddress: 'Cirebon', gender: 'Wanita' as const, birthDate: '1998-07-12', phone: '081298765411' },
  { id: '10000000-0000-4000-8000-000000000015', customerName: 'Bayu Ramadhan', customerAddress: 'Denpasar', gender: 'Pria' as const, birthDate: '1994-11-28', phone: '081298765412' },
];

if (process.env.NODE_ENV === 'production') {
  throw new Error('Demo seeder tidak boleh dijalankan di production');
}

const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? '127.0.0.1',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER ?? 'order_management',
  password: process.env.POSTGRES_PASSWORD ?? 'change-me',
  database: process.env.POSTGRES_DB ?? 'order_management',
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
      stock: products.stock,
    }).from(products).where(inArray(products.productCode, productSeeds.map((p) => p.productCode)))
      .orderBy(asc(products.id)).for('update');
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

      const quantitiesByProduct = new Map<number, number>();
      for (const item of itemRows) {
        quantitiesByProduct.set(item.productId, (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity);
      }
      const productById = new Map(seededProducts.map((product) => [product.id, product]));
      for (const [productId, quantitySold] of [...quantitiesByProduct].sort(([left], [right]) => left - right)) {
        const product = productById.get(productId);
        if (!product || product.stock < quantitySold) {
          throw new Error(
            `Stok seed ${product?.productCode ?? productId} tidak cukup: tersedia ${product?.stock ?? 0}, dibutuhkan ${quantitySold}.`,
          );
        }
        await tx.update(products)
          .set({ stock: product.stock - quantitySold, updatedAt: new Date() })
          .where(eq(products.id, productId));
      }
    }
    return createdOrders.length;
  });
  console.log(`Seeded ${seededOrderCount} new demo orders (30 order dates; existing order numbers were left unchanged). Stock was reduced once for the new orders.`);
} catch (error) {
  console.error('Database seeding failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
