import { Controller, Get, NotFoundException, Query, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { UseGuards } from '@nestjs/common/decorators';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly ordersService: OrderService) {}

  @Get('success')
  @UseGuards(JwtAuthGuard)
  async success(@Req() req, @Query('orderId') orderId: string) {
    const userId = req.user.userId;
    const order = await this.ordersService.findOne(orderId);
    
    if (order.user.toString() !== userId) {
      throw new NotFoundException('Order not found');
    }

    return { 
      statusCode: 200, 
      message: 'Payment succeeded!',
      data: order 
    };
  }

  @Get('cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(@Req() req, @Query('orderId') orderId: string) {
    const userId = req.user.userId;
    const order = await this.ordersService.findOne(orderId);
    
    if (order.user.toString() !== userId) {
      throw new NotFoundException('Order not found');
    }

    return { 
      statusCode: 200, 
      message: 'Payment was canceled.',
      data: order 
    };
  }
}