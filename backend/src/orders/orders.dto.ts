import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ListOrdersQuery {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  per_page = 10;

  @ApiPropertyOptional({ example: '2026-10-01', description: 'Tanggal mulai (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  @IsDateString({ strict: true })
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-31', description: 'Tanggal akhir (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  @IsDateString({ strict: true })
  to?: string;

  @ApiPropertyOptional({ example: '9d2f6c1e-....', description: 'Filter berdasarkan customer' })
  @IsOptional()
  @IsUUID('all')
  customer_id?: string;
}

export class OrderItemDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  product_id!: number;

  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: '9d2f6c1e-....' })
  @IsUUID('all')
  customer_id!: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}