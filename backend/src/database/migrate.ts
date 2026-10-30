import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? '127.0.0.1',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER ?? 'order_management',
  password: process.env.POSTGRES_PASSWORD ?? 'change-me',
  database: process.env.POSTGRES_DB ?? 'order_management',
});

try {
  await migrate(drizzle(pool), {
    migrationsFolder: './drizzle',
    migrationsSchema: 'public',
    migrationsTable: '__drizzle_migrations',
  });
  console.log('Migrations applied successfully.');
} catch (error) {
  console.error('Database migration failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
