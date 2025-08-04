import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './order.schema';
import { OrdersController } from 'src/modules/order/order.controller';
import { OrdersService } from 'src/modules/order/order.service';
import { AddressModule } from 'src/modules/address/address.module';
import { CartModule } from 'src/modules/cart/cart.module';
import { Address, AddressSchema } from 'src/modules/address/address.schema';
import { Cart, CartSchema } from 'src/modules/cart/cart.schema';
import { User, UserSchema } from 'src/modules/users/schema/user.schema';

@Module({
  imports: [
    AddressModule,
    CartModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Address.name, schema: AddressSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrderModule {}
