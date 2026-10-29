import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, isNull, or, type SQL } from 'drizzle-orm';
import { DatabaseService } from './database.service.js';
import { products } from './db/schema.js';
import type { CreateProductDto, ListProductsQuery, UpdateProductDto } from './products.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly database: DatabaseService) {}

  async list(query: ListProductsQuery) {
    const { page, per_page, search, sort, order } = query;
    const conditions: SQL[] = [isNull(products.deletedAt)];
    if (search?.trim()) {
      conditions.push(or(
        ilike(products.productName, `%${search.trim()}%`),
        ilike(products.productCode, `%${search.trim()}%`),
      )!);
    }
    const where = and(...conditions);
    const sortColumn = sort === 'product_name' ? products.productName : products[sort];
    const orderBy = order === 'desc' ? desc(sortColumn) : asc(sortColumn);
    const [data, [totalRow]] = await Promise.all([
      this.database.db.select({
        id: products.id,
        product_code: products.productCode,
        product_name: products.productName,
        stock: products.stock,
        price: products.price,
        created_at: products.createdAt,
        updated_at: products.updatedAt,
      })
        .from(products)
        .where(where)
        .orderBy(orderBy, asc(products.id))
        .limit(per_page)
        .offset((page - 1) * per_page),
      this.database.db.select({ total: count() }).from(products).where(where),
    ]);
    const total = totalRow?.total ?? 0;
    return {
      data,
      meta: { page, per_page, total, total_pages: Math.ceil(total / per_page) },
    };
  }

  async get(id: number) {
    const [product] = await this.database.db.select({
      id: products.id,
      product_code: products.productCode,
      product_name: products.productName,
      stock: products.stock,
      price: products.price,
      created_at: products.createdAt,
      updated_at: products.updatedAt,
    }).from(products)
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .limit(1);
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return product;
  }

  async create(input: CreateProductDto) {
    try {
      const [product] = await this.database.db.insert(products).values({
        productCode: input.product_code.trim(),
        productName: input.product_name.trim(),
        stock: input.stock,
        price: input.price.toFixed(2),
      }).returning();
      return mapProduct(product);
    } catch (error) {
      if (isUniqueViolation(error)) throw duplicateProductCodeException();
      throw error;
    }
  }

  async update(id: number, input: UpdateProductDto) {
    await this.get(id);
    if (Object.keys(input).length === 0) {
      throw new UnprocessableEntityException({
        message: 'Validasi gagal',
        errors: { product: ['Minimal satu field harus diisi'] },
      });
    }
    const values = {
      ...(input.product_code !== undefined ? { productCode: input.product_code.trim() } : {}),
      ...(input.product_name !== undefined ? { productName: input.product_name.trim() } : {}),
      ...(input.stock !== undefined ? { stock: input.stock } : {}),
      ...(input.price !== undefined ? { price: input.price.toFixed(2) } : {}),
      updatedAt: new Date(),
    };
    try {
      const [product] = await this.database.db.update(products).set(values)
        .where(and(eq(products.id, id), isNull(products.deletedAt))).returning();
      if (!product) throw new NotFoundException('Produk tidak ditemukan');
      return mapProduct(product);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (isUniqueViolation(error)) throw duplicateProductCodeException();
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const [product] = await this.database.db.update(products)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .returning({ id: products.id });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
  }
}

function duplicateProductCodeException(): ConflictException {
  return new ConflictException({
    message: 'Kode produk sudah digunakan',
    errors: { product_code: ['Kode produk sudah digunakan'] },
  });
}

function isUniqueViolation(error: unknown, seen = new Set<object>()): boolean {
  if (typeof error !== 'object' || error === null || seen.has(error)) return false;
  seen.add(error);
  const value = error as { code?: unknown; cause?: unknown; constraint?: unknown };
  if (
    value.code === '23505' ||
    value.constraint === 'products_product_code_unique'
  ) return true;
  return isUniqueViolation(value.cause, seen);
}
function mapProduct(product: typeof products.$inferSelect) {
  return {
    id: product.id,
    product_code: product.productCode,
    product_name: product.productName,
    stock: product.stock,
    price: product.price,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  };
}
