// contact-info.controller.ts
import {
  Controller,
  Get,
  Put,
  Body,
  Post,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ContactInfoService } from './contact-info.service';

@Controller('contact-info')
export class ContactInfoController {
  constructor(private readonly contactInfoService: ContactInfoService) {}

  @Get()
  get() {
    return this.contactInfoService.getContactInfo();
  }

  @Put('update')
  update(@Body() body: any) {
    return this.contactInfoService.updateContactInfo(body);
  }

  // EMAILS
  @Post('email')
  addEmail(@Body('email') email: string) {
    return this.contactInfoService.addEmail(email);
  }

  @Delete('email/:email')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeEmail(@Param('email') email: string) {
    return this.contactInfoService.removeEmail(email);
  }

  // PHONES
  @Post('phone')
  addPhone(@Body('phone') phone: string) {
    return this.contactInfoService.addPhone(phone);
  }

  @Delete('phone/:phone')
  @HttpCode(HttpStatus.NO_CONTENT)
  removePhone(@Param('phone') phone: string) {
    return this.contactInfoService.removePhone(phone);
  }
}
