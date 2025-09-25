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
  UseGuards,
} from '@nestjs/common';
import { ContactInfoService } from './contact-info.service';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/user_role.enum';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';

@Controller('contact-info')
export class ContactInfoController {
  constructor(private readonly contactInfoService: ContactInfoService) {}

  @Get()
  get() {
    return this.contactInfoService.getContactInfo();
  }

  @Put('update')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Body() body: any) {
    return this.contactInfoService.updateContactInfo(body);
  }

  // EMAILS
  @Post('email')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  addEmail(@Body('email') email: string) {
    return this.contactInfoService.addEmail(email);
  }

  @Delete('email/:email')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeEmail(@Param('email') email: string) {
    return this.contactInfoService.removeEmail(email);
  }

  // PHONES
  @Post('phone')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  addPhone(@Body('phone') phone: string) {
    return this.contactInfoService.addPhone(phone);
  }

  @Delete('phone/:phone')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  removePhone(@Param('phone') phone: string) {
    return this.contactInfoService.removePhone(phone);
  }
}
