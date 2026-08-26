import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDecimal,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import { OlfactoryFamily } from '../../../generated/prisma/enums';

export class ProductVariantInputDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  format!: string;

  @IsDecimal({ decimal_digits: '0,2', force_decimal: false })
  price!: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2', force_decimal: false })
  priceEntrepreneur?: string | null;

  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2', force_decimal: false })
  priceWholesale?: string | null;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsOptional()
  @IsString()
  sku?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ProductImageInputDto {
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url!: string;

  @IsOptional()
  @IsString()
  alt?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  usageInstructions?: string | null;

  @IsOptional()
  @IsString()
  ritual?: string | null;

  @IsOptional()
  @IsString()
  topNotes?: string | null;

  @IsOptional()
  @IsString()
  heartNotes?: string | null;

  @IsOptional()
  @IsString()
  baseNotes?: string | null;

  @IsOptional()
  @IsEnum(OlfactoryFamily)
  olfactoryFamily?: OlfactoryFamily | null;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isBestSeller?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInputDto)
  variants!: ProductVariantInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  images?: ProductImageInputDto[];
}
