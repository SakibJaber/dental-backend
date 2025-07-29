import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LegalPageService } from './legal-page.service';
import { CreateLegalPageDto } from './dto/create-legal-page.dto';
import { UpdateLegalPageDto } from './dto/update-legal-page.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/user_role.enum';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';

@Controller('pages')
export class LegalPageController {
  constructor(private readonly legalPageService: LegalPageService) {}

  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() dto: CreateLegalPageDto) {
    return this.legalPageService.create(dto);
  }

  @Get()
  findAll() {
    return this.legalPageService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: 'about' | 'terms' | 'privacy') {
    return this.legalPageService.findBySlug(slug);
  }

  @Patch(':slug')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(
    @Param('slug') slug: 'about' | 'terms' | 'privacy',
    @Body() dto: UpdateLegalPageDto,
  ) {
    return this.legalPageService.update(slug, dto);
  }
}
