import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DomainModule } from 'src/modules/domain.module';
import { MongooseDatabaseModule } from 'src/common/database/mongoose.module';
import { ConfigModule } from '@nestjs/config';
import { FileUploadModule } from 'src/modules/file-upload/file-upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseDatabaseModule,
    FileUploadModule,
    DomainModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
