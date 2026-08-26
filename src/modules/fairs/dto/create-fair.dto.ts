import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFairDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsString()
  @IsNotEmpty()
  hours!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  tag!: string;

  @IsString()
  @IsOptional()
  imageUrl?: string | null;
}
