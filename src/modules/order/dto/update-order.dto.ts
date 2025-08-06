import { IsString } from 'class-validator';
import { OrderStatus } from 'src/common/enum/order_status.enum';

export class UpdateOrderStatusDto {
  @IsString()
  status: OrderStatus;

  @IsString()
  trackingNumber?: string;
}
