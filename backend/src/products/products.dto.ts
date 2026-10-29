import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';

export class ListProductsQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  per_page = 10;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @IsOptional()
  @IsIn(['product_name', 'price', 'stock'])
  sort: 'product_name' | 'price' | 'stock' = 'product_name';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'asc';
}

export class CreateProductDto {
  @ApiProperty({ example: 'P0001', maxLength: 20 })
  @IsString()
  @Length(1, 20)
  @Matches(/\S/)
  product_code!: string;

  @ApiProperty({ example: 'Hydrococo 150ml', maxLength: 150 })
  @IsString()
  @Length(1, 150)
  @Matches(/\S/)
  product_name!: string;

  @ApiProperty({ example: 10, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  stock!: number;

  @ApiProperty({ example: 12000, minimum: 0.01, maximum: 9999999999.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(9999999999.99)
  price!: number;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'P0001', maxLength: 20 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Length(1, 20)
  @Matches(/\S/)
  product_code?: string;

  @ApiPropertyOptional({ example: 'Hydrococo 150ml', maxLength: 150 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Length(1, 150)
  @Matches(/\S/)
  product_name?: string;

  @ApiPropertyOptional({ example: 10, minimum: 0 })
  @ValidateIf((_object, value) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  stock?: number;

  @ApiPropertyOptional({ example: 12000, minimum: 0.01, maximum: 9999999999.99 })
  @ValidateIf((_object, value) => value !== undefined)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(9999999999.99)
  price?: number;
}
