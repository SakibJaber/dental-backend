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
  HttpStatus,
  Headers,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/user_role.enum';
import { PaymentMethod, PaymentStatus } from 'src/common/enum/payment.enum';
import { CartService } from 'src/modules/cart/cart.service';
import { v4 as uuidv4 } from 'uuid';
import { OrderStatus } from 'src/common/enum/order_status.enum';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrderService,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    private readonly cartService: CartService,
  ) {}

  @Post()
  async placeOrder(
    @Req() req,
    @Body() createOrderDto: CreateOrderDto,
    @Headers('Idempotency-Key') idempotencyKey: string,
  ) {
    const userId = req.user.userId;

    // Generate idempotency key if not provided
    if (!idempotencyKey) {
      idempotencyKey = uuidv4();
    }
    createOrderDto.idempotencyKey = idempotencyKey;

    // Validate cart contents
    const cart = await this.cartService.validateCartForCheckout(userId);

    // Create order
    const order = await this.ordersService.create(userId, createOrderDto);

    // Handle Stripe payment
    if (createOrderDto.paymentMethod === PaymentMethod.STRIPE) {
      const frontendUrl = this.configService.get<string>('BASE_URL');
      const successUrl = `${frontendUrl}/checkout/success?orderId=${order._id}`;
      const cancelUrl = `${frontendUrl}/checkout/cancel?orderId=${order._id}`;

      const session = await this.stripeService.createCheckoutSession({
        orderId: (order._id as string).toString(),
        products: createOrderDto.products.map((p) => ({
          name: p.name,
          price: p.price,
          quantity: p.quantity,
        })),
        customerEmail: req.user.email,
        successUrl,
        cancelUrl,
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Order placed successfully. Payment required.',
        data: {
          order,
          payment: {
            type: 'stripe',
            sessionId: session.id,
            url: session.url,
          },
        },
      };
    }

    return {
      statusCode: 201,
      message: 'Order placed successfully',
      data: order,
    };
  }

  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string, // Keep as string for validation
  ) {
    // Validate and convert status parameter
    let orderStatus: OrderStatus | undefined;
    if (status) {
      if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
        throw new BadRequestException(`Invalid status value: ${status}`);
      }
      orderStatus = status as OrderStatus;
    }

    const result = await this.ordersService.findAll(
      page,
      limit,
      search,
      orderStatus,
    );
    return {
      statusCode: 200,
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('my-orders')
  async getUserOrders(
    @Req() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const userId = req.user.userId;
    const result = await this.ordersService.getOrdersByUser(
      userId,
      page,
      limit,
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
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.updateStatus(
      id,
      updateOrderStatusDto,
    );
    return {
      statusCode: 200,
      message: 'Order status updated',
      data: order,
    };
  }

  @Post(':id/retry-payment')
  async retryPayment(@Req() req, @Param('id') orderId: string) {
    const userId = req.user.userId;
    const order = await this.ordersService.findOne(orderId);

    if (order.user.toString() !== userId) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentMethod !== PaymentMethod.STRIPE) {
      throw new BadRequestException('Invalid payment method for retry');
    }

    if (order.paymentStatus === PaymentStatus.SUCCEEDED) {
      throw new ConflictException('Payment already succeeded');
    }

    const frontendUrl = this.configService.get<string>('BASE_URL');
    const successUrl = `${frontendUrl}/checkout/success?orderId=${order._id}`;
    const cancelUrl = `${frontendUrl}/checkout/cancel?orderId=${order._id}`;

    const session = await this.stripeService.createCheckoutSession({
      orderId: String(order._id),
      products: order.products.map((p) => ({
        name: p.name,
        price: p.price,
        quantity: p.quantity,
      })),
      customerEmail: req.user.email,
      successUrl,
      cancelUrl,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Payment session created',
      data: {
        sessionId: session.id,
        url: session.url,
      },
    };
  }
}
