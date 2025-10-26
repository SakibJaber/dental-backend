import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;

  // CORS
  const allowlist = new Set([
    'http://localhost:5174',
    'http://10.10.20.60:3001',
    'http://localhost:3000',
    'http://10.10.20.60:3000',
    'http://10.10.20.48:3003',
    'http://10.10.20.60:3005',
  ]);

  app.enableCors({
    origin: (origin, cb) => {
      // allow non-browser tools (e.g., curl/Postman) and exact allowlist matches
      if (!origin || allowlist.has(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked: ${origin}`), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Global API prefix
  app.setGlobalPrefix('api');

  // Validation (ensures 400 instead of 500 on bad inputs)
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  await app.listen(port);
  Logger.log(`🚀 Server running at http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
