import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('MAIL_HOST'),
      port: +(config.get<number>('MAIL_PORT') ?? 465), // Match your Express port
      secure: true, // Add this line - crucial!
      auth: {
        user: config.get('MAIL_USER'),
        pass: config.get('MAIL_PASS'),
      },
    });

    // Add verification to check connection on startup
    this.verifyTransporter();
  }

  private async verifyTransporter() {
    try {
      await this.transporter.verify();
      console.log('Mail transporter verified successfully');
    } catch (error) {
      console.error('Mail transporter verification failed:', error);
    }
  }

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    try {
      const result = await this.transporter.sendMail({
        from: this.config.get('MAIL_FROM'),
        to,
        subject,
        text,
        html,
      });
      console.log('Email sent successfully:', result.messageId);
      return result;
    } catch (err) {
      console.error('Email sending failed:', err);
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  async sendResetPasswordOtp(email: string, code: string) {
    try {
      await this.transporter.sendMail({
        from: this.config.get('MAIL_FROM'),
        to: email,
        subject: 'Your Password Reset Otp',
        text: `Your password reset otp is: ${code}\n\nIt expires in ${this.config.get('OTP_TTL_MINUTES')} minutes.`,
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  async sendEmailVerificationOtp(email: string, code: string) {
    try {
      const minutes = this.config.get<string>('OTP_EXPIRATION_MINUTES') ?? '15';
      await this.transporter.sendMail({
        from: this.config.get('MAIL_FROM'),
        to: email,
        subject: 'Verify your email',
        text: `Your verification code is: ${code}\n\nIt expires in ${minutes} minutes.`,
      });
    } catch (err) {
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
