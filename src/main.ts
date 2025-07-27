import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  // set global prefix
  app.setGlobalPrefix('api');

  // Serve static files for local uploads
  if (configService.get<string>('FILE_STORAGE', 'local') === 'local') {
    const uploadPath = configService.get<string>(
      'LOCAL_UPLOAD_PATH',
      './public/uploads',
    );
    app.useStaticAssets(join(process.cwd(), uploadPath), {
      prefix: '/uploads/',
    });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}`);
}
bootstrap();
