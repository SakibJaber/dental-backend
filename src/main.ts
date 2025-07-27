import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  const fileStorage = configService.get<string>('FILE_STORAGE') ?? 'local';
  const uploadPath = configService.get<string>('LOCAL_UPLOAD_PATH') ?? './public/uploads';

  // Enable CORS if frontend connects
  app.enableCors();

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Serve static files if using local storage
  if (fileStorage === 'local') {
    const resolvedUploadPath = join(process.cwd(), uploadPath);
    app.useStaticAssets(resolvedUploadPath, {
      prefix: '/uploads/',
    });
  }

  await app.listen(port);
  Logger.log(`🚀 Server running at http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
