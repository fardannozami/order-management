import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Req } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { CreateOrderDto, ListOrdersQuery } from './orders.dto.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
@ApiTags('Orders')
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List order dengan filter tanggal dan customer' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'per_page', required: false, example: 10 })
  @ApiQuery({ name: 'from', type: String, format: 'date', required: false, example: '2026-10-01' })
  @ApiQuery({ name: 'to', type: String, format: 'date', required: false, example: '2026-10-31' })
  @ApiQuery({ name: 'customer_id', required: false })
  @ApiResponse({ status: 200, description: 'Daftar order beserta metadata pagination' })
  list(@Query() query: ListOrdersQuery) {
    return this.ordersService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail order beserta item' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Detail order' })
  @ApiResponse({ status: 404, description: 'Order tidak ditemukan' })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Buat transaksi penjualan' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Order berhasil dibuat' })
  @ApiResponse({ status: 422, description: 'Validasi gagal / stok tidak cukup' })
  create(@Body() input: CreateOrderDto, @Req() request: AuthenticatedRequest) {
    return this.ordersService.create(input, request.auth);
  }
}