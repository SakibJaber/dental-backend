import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DomainModule } from 'src/modules/domain.module';
import { MongooseDatabaseModule } from 'src/common/database/mongoose.module';



@Module({
  imports: [MongooseDatabaseModule, DomainModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
