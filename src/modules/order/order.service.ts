import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './order.schema';
import { OrderStatus } from 'src/common/enum/order_status.enum';
import { Address } from 'src/modules/address/address.schema';
import { Cart } from 'src/modules/cart/cart.schema';
import { NotificationService } from 'src/modules/notification/notification.service';
import { User } from 'src/modules/users/schema/user.schema';
import { PaymentMethod, PaymentStatus } from 'src/common/enum/payment.enum';
import { v4 as uuidv4 } from 'uuid';
import { UpdateOrderStatusDto } from 'src/modules/order/dto/update-order.dto';
import { Product } from 'src/modules/products/schema/product.schema';
import { ProductAvailability } from 'src/common/enum/product-availability.enum';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Address.name) private readonly addressModel: Model<Address>,
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    // Idempotency check
    const existingOrder = await this.orderModel.findOne({
      idempotencyKey: dto.idempotencyKey,
    });
    if (existingOrder) return existingOrder;

    // Validate address
    const address = await this.addressModel.findOne({
      _id: dto.addressId,
      userId,
    });
    if (!address) throw new BadRequestException('Invalid address');

    // Validate products and stock
    await this.validateProducts(dto.products ?? []);

    // Create order
    const order = new this.orderModel({
      user: new Types.ObjectId(userId),
      products: dto.products,
      address: new Types.ObjectId(dto.addressId),
      paymentMethod: dto.paymentMethod,
      paymentStatus:
        dto.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
          ? PaymentStatus.SUCCEEDED
          : PaymentStatus.PENDING,
      subtotal: dto.subtotal,
      total: dto.total,
      status: OrderStatus.PENDING,
      idempotencyKey: dto.idempotencyKey,
    });

    const savedOrder = await order.save();

    // Update product stock
    await this.updateProductStock(dto.products ?? [], 'decrement');

    // Clear cart
    await this.clearUserCart(userId);

    // Send notifications
    await this.notifyOrderCreation(savedOrder, userId);

    return savedOrder;
  }

  private async validateProducts(products: any[]) {
    for (const item of products) {
      const product = await this.productModel.findById(item.product);
      if (!product || product.availability !== ProductAvailability.IN_STOCK) {
        throw new ConflictException(`Product ${item.name} is out of stock`);
      }
      if (product.stock < item.quantity) {
        throw new ConflictException(
          `Insufficient stock for ${item.name}. Available: ${product.stock}`,
        );
      }
    }
  }

  private async updateProductStock(
    products: any[],
    operation: 'decrement' | 'increment',
  ) {
    for (const item of products) {
      const update =
        operation === 'decrement'
          ? { $inc: { stock: -item.quantity } }
          : { $inc: { stock: item.quantity } };

      await this.productModel.findByIdAndUpdate(item.product, update);
    }
  }

  private async clearUserCart(userId: string) {
    try {
      await this.cartModel.deleteOne({ user: new Types.ObjectId(userId) });
    } catch (error) {
      console.error(`Failed to clear cart for user ${userId}:`, error.message);
    }
  }

  private async notifyOrderCreation(order: Order, userId: string) {
    // Notify user
    await this.notificationService.createNotification({
      title: 'Order Placed',
      body: `Your order #${order._id} has been placed successfully`,
      user: userId,
      metadata: { orderId: order._id, status: OrderStatus.PENDING },
    });

    // Notify admins
    const admins = await this.userModel.find({ role: 'admin' }).exec();
    await Promise.all(
      admins.map((admin) =>
        this.notificationService.createNotification({
          title: 'New Order Placed',
          body: `Order #${order._id} placed by user ${userId}`,
          user: admin.id.toString(),
          metadata: { orderId: order._id, userId },
        }),
      ),
    );
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    status?: OrderStatus,
    userId?: string,
  ) {
    const query: any = {};
    if (status) query.status = status;
    if (userId) query.user = new Types.ObjectId(userId);
    if (search) {
      // Basic search implementation (e.g., by order ID or user name; expand as needed)
      query.$or = [
        { _id: search },
        { 'user.name': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.orderModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .populate('products.product', 'name')
        .populate('address')
        .sort({ createdAt: -1 })
        .exec(),
      this.orderModel.countDocuments(query),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel
      .findById(id)
      .populate('user', 'name email')
      .populate('products.product', 'name price imageUrl')
      .populate('address');
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.orderModel
      .findByIdAndUpdate(
        id,
        {
          status: updateOrderStatusDto.status,
          trackingNumber: updateOrderStatusDto.trackingNumber,
        },
        { new: true },
      )
      .populate('user', 'name');

    if (!order) throw new NotFoundException('Order not found');
    const userIdStr =
      (order.user as any)?._id?.toString?.() ?? order.user.toString();

    // Notify user of status update
    await this.notificationService.createNotification({
      title: 'Order Status Updated',
      body: `Your order #${order._id} is now "${updateOrderStatusDto.status}"`,
      user: userIdStr,
      metadata: {
        orderId: order._id,
        newStatus: updateOrderStatusDto.status,
        trackingNumber: updateOrderStatusDto.trackingNumber,
      },
    });

    return order;
  }

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    stripePaymentIntentId?: string,
  ) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    order.paymentStatus = paymentStatus;
    if (stripePaymentIntentId) {
      order.stripePaymentIntentId = stripePaymentIntentId;
    }

    // Update order status based on payment status
    if (paymentStatus === PaymentStatus.SUCCEEDED) {
      order.status = OrderStatus.CONFIRMED;
    } else if (paymentStatus === PaymentStatus.FAILED) {
      order.status = OrderStatus.CANCELLED;
      // Restore product stock
      await this.updateProductStock(order.products, 'increment');
    }

    await order.save();

    // Notify user
    await this.notificationService.createNotification({
      title: 'Payment Status Update',
      body: `Payment for order #${order._id} is ${paymentStatus}`,
      user: order.user.toString(),
      metadata: { orderId: order._id, paymentStatus },
    });

    return order;
  }

  async getOrdersByUser(userId: string, page = 1, limit = 10) {
    return this.findAll(page, limit, undefined, undefined, userId);
  }
}
