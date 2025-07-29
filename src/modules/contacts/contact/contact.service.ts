import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Message, MessageDocument } from './message.schema';
import { Model } from 'mongoose';
import { CreateMessageDto } from 'src/modules/contacts/contact/dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async submitMessage(dto: CreateMessageDto, userId?: string) {
    return this.messageModel.create({ ...dto, userId });
  }

  async getAllMessages(): Promise<Message[]> {
    return this.messageModel.find().sort({ createdAt: -1 }).exec();
  }
}
