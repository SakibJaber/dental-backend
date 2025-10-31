import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  /** URLs of images to append (in addition to uploaded files) */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  addImageUrls?: string[];

  /** URLs of images to remove from the existing array */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeImageUrls?: string[];

  /**
   * Optional: allow the client to remove by index as well.
   * If both removeImageUrls and removeImageIndexes are provided,
   * the union is removed.
   */
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  removeImageIndexes?: number[];
}
