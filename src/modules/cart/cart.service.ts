import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart } from './cart.schema';
import { AddToCartDto } from 'src/modules/cart/dto/create-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
  ) {}

  async addToCart(userId: string, dto: AddToCartDto) {
    console.log('Looking for cart with user:', userId);
    let cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) });
    if (!cart) {
      cart = new this.cartModel({
        user: new Types.ObjectId(userId),
        items: [],
      });
    }
    const idx = cart.items.findIndex(
      (i) => i.product.toString() === dto.productId,
    );
    if (idx > -1) {
      cart.items[idx].quantity += dto.quantity;
    } else {
      cart.items.push({
        product: new Types.ObjectId(dto.productId),
        quantity: dto.quantity,
      });
    }
    return cart.save();
  }

  async getCart(userId: string) {
    const cart = await this.cartModel
      .findOne({ user: new Types.ObjectId(userId) })
      .populate('items.product');
    return cart || { items: [] };
  }

  async updateCartItem(userId: string, productId: string, quantity: number) {
    const cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) });
    if (!cart) throw new NotFoundException('Cart not found');
    const idx = cart.items.findIndex((i) => i.product.toString() === productId);
    if (idx > -1) {
      cart.items[idx].quantity = quantity;
      await cart.save();
    }
    return cart;
  }

  async removeCartItem(userId: string, productId: string) {
    const cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) });
    if (!cart) throw new NotFoundException('Cart not found');
    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    await cart.save();
    return cart;
  }

  async clearCart(userId: string) {
    await this.cartModel.deleteOne({ user: new Types.ObjectId(userId) });
  }
}
