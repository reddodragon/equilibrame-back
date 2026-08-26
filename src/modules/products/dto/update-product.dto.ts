import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OlfactoryFamily } from '../../../generated/prisma/enums';
import {
  ProductImageInputDto,
  ProductVariantInputDto,
} from './create-product.dto';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  slug?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryId?: string;

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

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInputDto)
  variants?: ProductVariantInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  images?: ProductImageInputDto[];
}
