import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { CreateCustomerDto, ListCustomersQuery, UpdateCustomerDto } from './customers.dto.js';
import { CustomersService } from './customers.service.js';

@Controller('customers')
@ApiTags('Customers')
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List pelanggan dengan pagination dan pencarian nama' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'per_page', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Cari berdasarkan nama pelanggan' })
  @ApiResponse({ status: 200, description: 'Daftar pelanggan beserta metadata pagination' })
  list(@Query() query: ListCustomersQuery) {
    return this.customersService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail pelanggan' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Detail pelanggan' })
  @ApiResponse({ status: 404, description: 'Pelanggan tidak ditemukan' })
  get(@Param('id', new ParseUUIDPipe({ version: 'all' })) id: string) {
    return this.customersService.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tambah pelanggan' })
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({ status: 201, description: 'Pelanggan berhasil dibuat' })
  @ApiResponse({ status: 422, description: 'Validasi gagal' })
  create(@Body() input: CreateCustomerDto) {
    return this.customersService.create(input);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update pelanggan' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateCustomerDto })
  @ApiResponse({ status: 200, description: 'Pelanggan berhasil diperbarui' })
  @ApiResponse({ status: 404, description: 'Pelanggan tidak ditemukan' })
  @ApiResponse({ status: 422, description: 'Validasi gagal' })
  update(
    @Param('id', new ParseUUIDPipe({ version: 'all' })) id: string,
    @Body() input: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, input);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete pelanggan' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Pelanggan berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Pelanggan tidak ditemukan' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', new ParseUUIDPipe({ version: 'all' })) id: string): Promise<void> {
    await this.customersService.remove(id);
  }
}
