import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LegalPageDocument = LegalPage & Document;

@Schema({ timestamps: true })
export class LegalPage {
  @Prop({ required: true, unique: true, enum: ['about', 'terms', 'privacy'] })
  slug: 'about' | 'terms' | 'privacy';

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;
}

export const LegalPageSchema = SchemaFactory.createForClass(LegalPage);
