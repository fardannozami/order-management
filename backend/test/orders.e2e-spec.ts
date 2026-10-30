import {
  INestApplication,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AccessTokenGuard } from '../src/auth/auth.guard.js';
import { AuthService } from '../src/auth/auth.service.js';
import { ApiExceptionFilter } from '../src/common/api-exception.filter.js';
import { ApiResponseInterceptor } from '../src/common/api-response.interceptor.js';
import { OrdersController } from '../src/orders/orders.controller.js';
import { OrdersService } from '../src/orders/orders.service.js';

describe('Orders API (feature)', () => {
  let app: INestApplication<App>;

  const authService = {
    verifyAccessToken: vi.fn(),
    isSessionActive: vi.fn(),
  };
  const ordersService = {
    create: vi.fn(),
    list: vi.fn(),
    get: vi.fn(),
  };
  const claims = {
    sub: '1', sid: 'demo-session', email: 'admin@azatech.id',
    iat: 1, exp: 9999999999, typ: 'access' as const,
  };
  const validOrder = {
    customer_id: '10000000-0000-4000-8000-000000000001',
    items: [{ product_id: 1, quantity: 2 }],
  };
  const createdOrder = {
    id: 15,
    order_number: 'INV-20261030-0001',
    customer_id: validOrder.customer_id,
    total_amount: '24000.00',
    items: [{ product_id: 1, quantity: 2, unit_price: '12000.00', subtotal: '24000.00' }],
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    authService.verifyAccessToken.mockReturnValue(claims);
    authService.isSessionActive.mockResolvedValue(true);
    ordersService.create.mockResolvedValue(createdOrder);
    ordersService.list.mockImplementation(async (query) => ({
      data: [{ id: 15, order_number: 'INV-20261030-0001' }],
      meta: { page: query.page, per_page: query.per_page, total: 1, total_pages: 1 },
    }));

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: ordersService },
        { provide: AuthService, useValue: authService },
        { provide: APP_GUARD, useClass: AccessTokenGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: 422,
      exceptionFactory: (validationErrors) => {
        const errors: Record<string, string[]> = {};
        const flatten = (nodes: typeof validationErrors, prefix = '') => {
          for (const node of nodes) {
            const path = prefix ? `${prefix}.${node.property}` : node.property;
            const messages = Object.values(node.constraints ?? {});
            if (messages.length) errors[path] = messages;
            if (node.children?.length) flatten(node.children, path);
          }
        };
        flatten(validationErrors);
        return new UnprocessableEntityException({ message: 'Validasi gagal', errors });
      },
    }));
    app.useGlobalInterceptors(new ApiResponseInterceptor());
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates an order and wraps the successful response', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-access-token')
      .send(validOrder)
      .expect(201);

    expect(response.body).toEqual({ success: true, message: 'Created', data: createdOrder });
    expect(ordersService.create).toHaveBeenCalledWith(validOrder, {
      userId: 1, sessionId: 'demo-session', email: 'admin@azatech.id',
    });
  });

  it('returns the standard 422 response when requested stock is insufficient', async () => {
    ordersService.create.mockRejectedValueOnce(new UnprocessableEntityException({
      message: 'Stok tidak mencukupi',
      errors: { 'items.0.quantity': ['Stok Hydrococo 150ml tersisa 3, diminta 5'] },
    }));

    const response = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-access-token')
      .send({ ...validOrder, items: [{ product_id: 1, quantity: 5 }] })
      .expect(422);

    expect(response.body).toEqual({
      success: false,
      message: 'Stok tidak mencukupi',
      errors: { 'items.0.quantity': ['Stok Hydrococo 150ml tersisa 3, diminta 5'] },
    });
  });

  it('rejects invalid item quantity before calling the service', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-access-token')
      .send({ ...validOrder, items: [{ product_id: 1, quantity: 0 }] })
      .expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.errors['items.0.quantity']).toBeDefined();
    expect(ordersService.create).not.toHaveBeenCalled();
  });

  it('rejects client-supplied price so totals remain server-calculated', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', 'Bearer demo-access-token')
      .send({ ...validOrder, items: [{ product_id: 1, quantity: 2, unit_price: 1 }] })
      .expect(422);

    expect(response.body.errors['items.0.unit_price']).toBeDefined();
    expect(ordersService.create).not.toHaveBeenCalled();
  });

  it('rejects API access without a bearer token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/orders')
      .send(validOrder)
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Bearer access token wajib disertakan',
    });
    expect(ordersService.create).not.toHaveBeenCalled();
  });

  it('returns paginated order list with date and customer filters', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/orders?page=2&per_page=5&from=2026-10-01&to=2026-10-30&customer_id=10000000-0000-4000-8000-000000000001')
      .set('Authorization', 'Bearer demo-access-token')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: 'OK',
      data: [{ id: 15, order_number: 'INV-20261030-0001' }],
      meta: { page: 2, per_page: 5, total: 1, total_pages: 1 },
    });
    expect(ordersService.list).toHaveBeenCalledWith({
      page: 2,
      per_page: 5,
      from: '2026-10-01',
      to: '2026-10-30',
      customer_id: '10000000-0000-4000-8000-000000000001',
    });
  });
});
