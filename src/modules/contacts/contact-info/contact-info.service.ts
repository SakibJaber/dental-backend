import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ContactInfo, ContactInfoDocument } from './contact-info.schema';
import { Model } from 'mongoose';

@Injectable()
export class ContactInfoService {
  constructor(
    @InjectModel(ContactInfo.name)
    private contactModel: Model<ContactInfoDocument>,
  ) {}

  private async getOrCreate(): Promise<ContactInfoDocument> {
    let contact = await this.contactModel.findOne();
    if (!contact) {
      contact = new this.contactModel();
      await contact.save();
    }
    return contact;
  }

  async getContactInfo() {
    return this.getOrCreate();
  }

  async updateContactInfo(data: Partial<ContactInfo>) {
    const contact = await this.getOrCreate();
    Object.assign(contact, data);
    return contact.save();
  }

  async addEmail(email: string) {
    const contact = await this.getOrCreate();
    if (!contact.emails.includes(email)) {
      contact.emails.push(email);
    }
    return contact.save();
  }

  async removeEmail(email: string) {
    const contact = await this.getOrCreate();
    contact.emails = contact.emails.filter((e) => e !== email);
    await contact.save();
  }

  async addPhone(phone: string) {
    const contact = await this.getOrCreate();
    if (!contact.phone) contact.phone = [];
    if (!contact.phone.includes(phone)) {
      contact.phone.push(phone);
    }
    return contact.save();
  }

  async removePhone(phone: string) {
    const contact = await this.getOrCreate();
    if (contact.phone) {
      contact.phone = contact.phone.filter((p) => p !== phone);
      await contact.save();
    }
  }
}
