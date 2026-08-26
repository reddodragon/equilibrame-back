import { IsOptional, IsString } from 'class-validator';

export class UpdateFairDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  hours?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  tag?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string | null;
}
