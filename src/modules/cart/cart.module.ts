import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Cart, CartSchema } from 'src/modules/cart/cart.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/modules/users/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
