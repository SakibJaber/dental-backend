import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ProductAvailability } from 'src/common/enum/product-availability.enum';
import slugify from 'slugify';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
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

  @Prop({ required: true, unique: true })
  slug: string; // Slug field to store the full URL
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.pre<ProductDocument>('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    const baseSlug = slugify(this.name, { lower: true, strict: true });
    // Ensure base URL is either from environment or fallback to a default URL
    const baseUrl = process.env.BASE_URL || 'https://example.com';
    this.slug = `${baseUrl}/products/${baseSlug}`;
  }
  next();
});
