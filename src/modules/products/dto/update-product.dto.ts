import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { ProductAvailability } from 'src/common/enum/product-availability.enum';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsMongoId()
  @IsOptional()
  category?: string;

  @IsMongoId()
  @IsOptional()
  brand?: string;

  @IsMongoId()
  @IsOptional()
  procedure?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  imageUrl?: string[];

  @IsEnum(ProductAvailability)
  @IsOptional()
  availability?: ProductAvailability;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsString()
  @IsOptional()
  slug?: string;
}
