import { hash } from 'bcryptjs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { products, users } from './schema.js';

const name = process.env.SEED_USER_NAME ?? 'Admin';
const email = process.env.SEED_USER_EMAIL ?? 'admin@example.com';
const password = process.env.SEED_USER_PASSWORD;
const productSeeds = [
  { productCode: 'P0001', productName: 'Hydrococo 150ml', stock: 25, price: '12000.00' },
  { productCode: 'P0002', productName: 'Air Mineral 600ml', stock: 40, price: '5000.00' },
  { productCode: 'P0003', productName: 'Teh Botol 350ml', stock: 30, price: '7000.00' },
  { productCode: 'P0004', productName: 'Roti Cokelat', stock: 20, price: '8500.00' },
  { productCode: 'P0005', productName: 'Kopi Susu 250ml', stock: 18, price: '15000.00' },
];

if (!password) {
  throw new Error('Set SEED_USER_PASSWORD in backend/.env before running db:seed');
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
  const [user] = await db
    .insert(users)
    .values({ name, email, password: await hash(password, 12) })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id, email: users.email });

  if (user) {
    console.log(`Seed user created: ${user.email}`);
  } else {
    console.log(`Seed user already exists; unchanged: ${email}`);
  }

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
