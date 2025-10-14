import {
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsMongoId,
  Min,
  IsNotEmpty,
  IsUrl,
} from 'class-validator';
import { ProductAvailability } from 'src/common/enum/product-availability.enum';

export class CreateProductDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsMongoId()
  @IsNotEmpty()
  category: string;

  @IsMongoId()
  @IsNotEmpty()
  brand: string;

  @IsMongoId()
  @IsNotEmpty()
  procedure: string;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsEnum(ProductAvailability)
  @IsOptional()
  availability?: ProductAvailability;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salesCount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  views?: number;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsString()
  @IsOptional()
  productUrl?: string;
}
