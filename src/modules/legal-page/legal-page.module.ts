import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LegalPageService } from './legal-page.service';
import { LegalPageController } from './legal-page.controller';
import {
  LegalPage,
  LegalPageSchema,
} from 'src/modules/legal-page/legal-page.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LegalPage.name, schema: LegalPageSchema },
    ]),
  ],
  controllers: [LegalPageController],
  providers: [LegalPageService],
})
export class LegalPageModule {}
