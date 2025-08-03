import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from 'src/modules/order/order.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { UpdateOrderStatusDto } from 'src/modules/order/dto/update-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async placeOrder(@Req() req, @Body() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.create(
      req.user.userId,
      createOrderDto,
    );
    return {
      statusCode: 201,
      message: 'Order placed successfully',
      data: order,
    };
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.ordersService.findAll(
      page,
      limit,
      search,
      status,
    );
    return {
      statusCode: 200,
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const order = await this.ordersService.findOne(id);
    return {
      statusCode: 200,
      data: order,
    };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.updateStatus(
      id,
      updateOrderStatusDto.status,
    );
    return {
      statusCode: 200,
      message: 'Order status updated',
      data: order,
    };
  }
}
