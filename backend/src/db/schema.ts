import {
  bigint,
  bigserial,
  integer,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }).notNull().unique('users_email_unique'),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const refreshSessions = pgTable('refresh_sessions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  sessionId: uuid('session_id').notNull(),
  userId: bigint('user_id', { mode: 'number' })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const products = pgTable('products', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  productCode: varchar('product_code', { length: 20 }).notNull().unique('products_product_code_unique'),
  productName: varchar('product_name', { length: 150 }).notNull(),
  stock: integer('stock').notNull().default(0),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
