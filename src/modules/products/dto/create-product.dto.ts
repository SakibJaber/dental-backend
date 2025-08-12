import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ProductAvailability } from 'src/common/enum/product-availability.enum';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

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
  @IsString({ each: true })
  imageUrl?: string[];

  @IsEnum(ProductAvailability)
  @IsNotEmpty()
  availability: ProductAvailability;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean = false;

  @IsString()
  @IsOptional()
  slug?: string;
}
