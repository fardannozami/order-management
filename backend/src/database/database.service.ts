import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import * as schema from './schema.js';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly pool = new Pool({
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    database: process.env.POSTGRES_DB ?? 'order_management',
    user: process.env.POSTGRES_USER ?? 'order_management',
    password: process.env.POSTGRES_PASSWORD ?? 'change-me',
  });

  readonly db = drizzle(this.pool, { schema });

  async onModuleInit(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, values);
  }
}
