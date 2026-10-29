import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export const customerGenderValues = ['Pria', 'Wanita'] as const;
export type CustomerGenderValue = (typeof customerGenderValues)[number];

export class ListCustomersQuery {
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

  @ApiPropertyOptional({ example: 'Budi', description: 'Cari berdasarkan nama pelanggan' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;
}

export class CreateCustomerDto {
  @ApiProperty({ example: 'Budi Santoso', maxLength: 150 })
  @IsString()
  @Length(1, 150)
  @Matches(/\S/)
  customer_name!: string;

  @ApiProperty({ example: 'Jakarta', maxLength: 255 })
  @IsString()
  @Length(1, 255)
  @Matches(/\S/)
  customer_address!: string;

  @ApiProperty({ enum: customerGenderValues, example: 'Pria' })
  @IsIn(customerGenderValues)
  gender!: CustomerGenderValue;

  @ApiProperty({ example: '1995-02-10', format: 'date' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  birth_date!: string;

  @ApiPropertyOptional({ example: '081234567890', maxLength: 20, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'Budi Santoso', maxLength: 150 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Length(1, 150)
  @Matches(/\S/)
  customer_name?: string;

  @ApiPropertyOptional({ example: 'Jakarta', maxLength: 255 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Length(1, 255)
  @Matches(/\S/)
  customer_address?: string;

  @ApiPropertyOptional({ enum: customerGenderValues, example: 'Wanita' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsIn(customerGenderValues)
  gender?: CustomerGenderValue;

  @ApiPropertyOptional({ example: '1995-02-10', format: 'date' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  birth_date?: string;

  @ApiPropertyOptional({ example: '081234567890', maxLength: 20, nullable: true })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(20)
  phone?: string | null;
}
