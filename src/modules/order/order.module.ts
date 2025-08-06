import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './order.schema';
import { OrdersController } from 'src/modules/order/order.controller';
import { OrderService } from 'src/modules/order/order.service';
import { AddressModule } from 'src/modules/address/address.module';
import { CartModule } from 'src/modules/cart/cart.module';
import * as express from 'express';
import { StripeService } from 'src/modules/order/stripe.service';
import { StripeWebhookController } from 'src/modules/order/stripe.controller';
import { CheckoutController } from 'src/modules/order/checkout.controller';
import { ProductsModule } from 'src/modules/products/products.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    AddressModule,
    CartModule,
    ProductsModule,
  ],
  controllers: [OrdersController, StripeWebhookController, CheckoutController],
  providers: [OrderService, StripeService],
  exports: [OrderService, StripeService, ],
})
export class OrderModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(express.raw()).forRoutes('webhook/stripe'); // This applies the raw body middleware to the /stripe route
  }
}

