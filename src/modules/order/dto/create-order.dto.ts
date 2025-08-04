import {
  IsMongoId,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderProductDto {
  @IsMongoId()
  product: string;

  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;

  @IsString()
  image: string;
}

export class CreateOrderDto {
  @IsMongoId()
  addressId: string;

  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  @IsArray()
  products: OrderProductDto[];

  @IsString()
  paymentMethod: string;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  shippingFee: number;

  @IsNumber()
  total: number;
}
