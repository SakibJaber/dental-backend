import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ProductAvailability } from 'src/common/enum/product-availability.enum';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 0 })
  stock: number;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Brand', required: true })
  brand: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Procedure', required: true })
  procedure: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  imageUrl: string[];

  @Prop({
    required: true,
    enum: Object.values(ProductAvailability),
    default: ProductAvailability.IN_STOCK,
  })
  availability: ProductAvailability;

  @Prop({ default: 0 })
  salesCount: number;

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: false })
  isFeatured: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
