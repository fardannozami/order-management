import { hash } from 'bcryptjs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { products, users } from './schema.js';

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
} catch (error) {
  console.error('Database seeding failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
