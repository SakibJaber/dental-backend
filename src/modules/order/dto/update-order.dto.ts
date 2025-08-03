import { OrderStatus } from "src/common/enum/order_status.enum";

export class UpdateOrderStatusDto {
  status: OrderStatus;
}
