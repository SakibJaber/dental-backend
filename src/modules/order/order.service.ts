import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from 'src/modules/order/order.schema';
import { OrderStatus } from 'src/common/enum/order_status.enum';
import { Address } from 'src/modules/address/address.schema';
import { Cart } from 'src/modules/cart/cart.schema';
import { NotificationService } from 'src/modules/notification/notification.service';
import { User } from 'src/modules/users/schema/user.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Address.name) private readonly addressModel: Model<Address>,
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    @InjectModel(User.name) private readonly userModel: Model<User>, // for admin lookup
    private readonly notificationService: NotificationService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    // Validate address belongs to user
    const address = await this.addressModel.findOne({
      _id: dto.addressId,
      userId,
    });
    if (!address) throw new BadRequestException('Invalid address.');

    const order = new this.orderModel({
      user: new Types.ObjectId(userId),
      products: dto.products,
      address: new Types.ObjectId(dto.addressId),
      paymentMethod: dto.paymentMethod,
      subtotal: dto.subtotal,
      shippingFee: dto.shippingFee,
      total: dto.total,
      status: OrderStatus.Pending,
    });
    await this.cartModel.deleteOne({ user: userId }); // clear cart after order
    const savedOrder = await order.save();

    // Notify user
    await this.notificationService.createNotification({
      title: 'Order Placed',
      body: `Your order has been placed successfully. Order ID: ${savedOrder._id}`,
      user: userId,
      metadata: { orderId: savedOrder._id, status: OrderStatus.Pending },
    });

    // Notify all admins
    const admins = await this.userModel.find({ role: 'admin' }).exec();
    await Promise.all(
      admins.map((admin) =>
        this.notificationService.createNotification({
          title: 'New Order Placed',
          body: `A new order (${savedOrder._id}) was placed by user (${userId}).`,
          user: admin.id.toString(),
          metadata: { orderId: savedOrder._id, userId },
        }),
      ),
    );

    return savedOrder;
  }

  async findAll(page = 1, limit = 10, search?: string, status?: string) {
    const query: any = {};
    if (status) query.status = status;
    // Filtering by search is only possible on populated fields, handled after population.

    const skip = (page - 1) * limit;
    let orders = await this.orderModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .populate('user', 'name')
      .populate('products.product', 'name')
      .populate('address')
      .exec();

    let total = await this.orderModel.countDocuments(query);

    // If search is provided, filter results in-memory (not optimal for large datasets!)
    if (search) {
      orders = orders.filter((order) => {
        const address: any = order.address;
        // Ensure address is a populated object, not just an ObjectId
        if (address && typeof address === 'object' && !('equals' in address)) {
          return (
            (address.recipientFirstName &&
              address.recipientFirstName
                .toLowerCase()
                .includes(search.toLowerCase())) ||
            (address.recipientLastName &&
              address.recipientLastName
                .toLowerCase()
                .includes(search.toLowerCase())) ||
            (address.streetNo &&
              address.streetNo.toLowerCase().includes(search.toLowerCase()))
          );
        }
        return false;
      });
      total = orders.length;
    }

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
      .populate('user', 'name')
      .populate('products.product', 'name')
      .populate('address')
      .exec();
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .populate('user', 'name')
      .populate('products.product', 'name')
      .populate('address');
    if (!order) throw new NotFoundException('Order not found');

    // Notify user of status update
    await this.notificationService.createNotification({
      title: 'Order Status Updated',
      body: `Your order (${order._id}) status is now "${status}".`,
      user: order.user.toString(),
      metadata: { orderId: order._id, newStatus: status },
    });
    return order;
  }
}
