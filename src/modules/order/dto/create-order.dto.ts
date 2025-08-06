import {
  IsMongoId,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from 'src/common/enum/payment.enum';

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

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  shippingFee: number;

  @IsNumber()
  total: number;

  @IsString()
  idempotencyKey: string;
}
