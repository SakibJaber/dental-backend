import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

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
  category: string; // Will be converted to ObjectId

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  imageUrl?: string[];

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean = true;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean = false;
}
