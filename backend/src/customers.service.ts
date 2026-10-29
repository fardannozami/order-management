import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { and, asc, count, eq, ilike, isNull, type SQL } from 'drizzle-orm';
import { DatabaseService } from './database.service.js';
import { customers } from './db/schema.js';
import type { CreateCustomerDto, ListCustomersQuery, UpdateCustomerDto } from './customers.dto.js';

@Injectable()
export class CustomersService {
  constructor(private readonly database: DatabaseService) {}

  async list(query: ListCustomersQuery) {
    const { page, per_page, search } = query;
    const conditions: SQL[] = [isNull(customers.deletedAt)];
    if (search?.trim()) conditions.push(ilike(customers.customerName, `%${search.trim()}%`));
    const where = and(...conditions);
    const [data, [totalRow]] = await Promise.all([
      this.database.db.select({
        id: customers.id,
        customer_name: customers.customerName,
        customer_address: customers.customerAddress,
        gender: customers.gender,
        birth_date: customers.birthDate,
        phone: customers.phone,
        created_at: customers.createdAt,
        updated_at: customers.updatedAt,
      })
        .from(customers)
        .where(where)
        .orderBy(asc(customers.customerName), asc(customers.id))
        .limit(per_page)
        .offset((page - 1) * per_page),
      this.database.db.select({ total: count() }).from(customers).where(where),
    ]);
    const total = totalRow?.total ?? 0;
    return { data, meta: { page, per_page, total, total_pages: Math.ceil(total / per_page) } };
  }

  async get(id: string) {
    const [customer] = await this.database.db.select({
      id: customers.id,
      customer_name: customers.customerName,
      customer_address: customers.customerAddress,
      gender: customers.gender,
      birth_date: customers.birthDate,
      phone: customers.phone,
      created_at: customers.createdAt,
      updated_at: customers.updatedAt,
    }).from(customers)
      .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
      .limit(1);
    if (!customer) throw new NotFoundException('Pelanggan tidak ditemukan');
    return customer;
  }

  async create(input: CreateCustomerDto) {
    const [customer] = await this.database.db.insert(customers).values({
      customerName: input.customer_name.trim(),
      customerAddress: input.customer_address.trim(),
      gender: input.gender,
      birthDate: input.birth_date,
      phone: input.phone?.trim() || null,
    }).returning();
    return mapCustomer(customer);
  }

  async update(id: string, input: UpdateCustomerDto) {
    await this.get(id);
    if (Object.keys(input).length === 0) {
      throw new UnprocessableEntityException({
        message: 'Validasi gagal',
        errors: { customer: ['Minimal satu field harus diisi'] },
      });
    }
    const values = {
      ...(input.customer_name !== undefined ? { customerName: input.customer_name.trim() } : {}),
      ...(input.customer_address !== undefined ? { customerAddress: input.customer_address.trim() } : {}),
      ...(input.gender !== undefined ? { gender: input.gender } : {}),
      ...(input.birth_date !== undefined ? { birthDate: input.birth_date } : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
      updatedAt: new Date(),
    };
    const [customer] = await this.database.db.update(customers).set(values)
      .where(and(eq(customers.id, id), isNull(customers.deletedAt))).returning();
    if (!customer) throw new NotFoundException('Pelanggan tidak ditemukan');
    return mapCustomer(customer);
  }

  async remove(id: string): Promise<void> {
    const [customer] = await this.database.db.update(customers)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
      .returning({ id: customers.id });
    if (!customer) throw new NotFoundException('Pelanggan tidak ditemukan');
  }
}

function mapCustomer(customer: typeof customers.$inferSelect) {
  return {
    id: customer.id,
    customer_name: customer.customerName,
    customer_address: customer.customerAddress,
    gender: customer.gender,
    birth_date: customer.birthDate,
    phone: customer.phone,
    created_at: customer.createdAt,
    updated_at: customer.updatedAt,
  };
}
