import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DomainModule } from 'src/modules/domain.module';
import { MongooseDatabaseModule } from 'src/common/database/mongoose.module';
import { ConfigModule } from '@nestjs/config';
import { FileUploadModule } from 'src/modules/file-upload/file-upload.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from 'src/common/filters/all-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseDatabaseModule,
    FileUploadModule,
    DomainModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
