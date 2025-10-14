import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    //   , {
    //   rawBody: true,
    // }
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;

  // Enable CORS if frontend connects
  app.enableCors({
    origin: [
      'http://localhost:5174',
      'http://10.10.20.60:3001',
      'http://localhost:3000',
      'http://10.10.20.60:3000',
      'http://10.10.20.48:3000',
    ], // Explicitly specify your frontend's exact origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Set to 'true' to allow cookies/auth headers
    allowedHeaders: 'Content-Type, Accept, Authorization', // Explicitly list allowed headers
  });

  // Set global API prefix
  app.setGlobalPrefix('api');

  await app.listen(port);
  Logger.log(`🚀 Server running at http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
