import {
  IsString,
  IsNumber,
  IsOptional,
  IsMongoId,
} from 'class-validator';
import { CreateProductDto } from './create-product.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsMongoId()
  @IsOptional()
  category?: string;
}
