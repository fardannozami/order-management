import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST ?? '127.0.0.1',
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER ?? 'order_management',
  password: process.env.PGPASSWORD ?? 'change-me',
  database: process.env.PGDATABASE ?? 'order_management',
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
