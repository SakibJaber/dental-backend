import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Newsletter } from './newsletter.schema';
import { Subscriber } from './subscriber.schema';
import { MailService } from 'src/modules/mail/mail.service';


@Injectable()
export class NewsletterService {
  constructor(
    @InjectModel(Subscriber.name) private subscriberModel: Model<Subscriber>,
    @InjectModel(Newsletter.name) private newsletterModel: Model<Newsletter>,
    private readonly mailService: MailService,
  ) {}

  async subscribe(email: string) {
    const existing = await this.subscriberModel.findOne({ email });
    if (existing) throw new BadRequestException('Already subscribed');
    const subscriber = new this.subscriberModel({ email });
    return subscriber.save();
  }

  async sendNewsletter(content: string) {
    // Save newsletter to DB
    await new this.newsletterModel({ content }).save();

    // Find all subscribers
    const subscribers = await this.subscriberModel.find();
    let sent = 0;
    for (const subscriber of subscribers) {
      try {
        await this.mailService.sendEmail(
          subscriber.email,
          'RNA Supplies Newsletter',
          content,
        );
        sent++;
      } catch (err) {
        // Optionally log failed email
      }
    }
    if (!sent) throw new InternalServerErrorException('No emails sent');
    return { success: true, sentTo: sent };
  }
}
