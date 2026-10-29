import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
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
import { CreateProductDto, ListProductsQuery, UpdateProductDto } from './products.dto.js';
import { ProductsService } from './products.service.js';

@Controller('products')
@ApiTags('Products')
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List produk dengan pagination, pencarian, dan pengurutan' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'per_page', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Cari nama atau kode produk' })
  @ApiQuery({ name: 'sort', required: false, enum: ['product_name', 'price', 'stock'] })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Daftar produk beserta metadata pagination' })
  list(@Query() query: ListProductsQuery) {
    return this.productsService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail produk' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Detail produk' })
  @ApiResponse({ status: 404, description: 'Produk tidak ditemukan' })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tambah produk' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'Produk berhasil dibuat' })
  @ApiResponse({ status: 409, description: 'Kode produk sudah digunakan' })
  @ApiResponse({ status: 422, description: 'Validasi gagal' })
  create(@Body() input: CreateProductDto) {
    return this.productsService.create(input);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update produk' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Produk berhasil diperbarui' })
  @ApiResponse({ status: 404, description: 'Produk tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'Kode produk sudah digunakan' })
  @ApiResponse({ status: 422, description: 'Validasi gagal' })
  update(@Param('id', ParseIntPipe) id: number, @Body() input: UpdateProductDto) {
    return this.productsService.update(id, input);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete produk' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Produk berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Produk tidak ditemukan' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.productsService.remove(id);
  }
}
