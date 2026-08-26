import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { SCENT_PROFILE_SLUGS } from '../scent-profiles';

function toBoolean({ value }: TransformFnParams): unknown {
  const candidate: unknown = value;
  if (candidate === 'true') return true;
  if (candidate === 'false') return false;
  return candidate;
}

export class FindProductsQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(SCENT_PROFILE_SLUGS)
  scentProfile?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 24;
}
