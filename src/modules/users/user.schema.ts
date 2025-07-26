import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from 'src/common/enum/user_role.enum';


export type UserDocument = User & Document;
@Schema({ timestamps: true })
export class User  {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ enum: UserRole, default: UserRole.DENTIST })
  role: UserRole;

  @Prop()
  phone?: string;

  @Prop()
  imageUrl?: string;

  @Prop()
  gdcNumber?: string;

  @Prop()
  clinicName?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: String, default: null })
  refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
