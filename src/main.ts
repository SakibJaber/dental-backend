import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  // 👇 Important: disable Nest's built-in bodyParser completely first
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, //  this stops Nest from automatically parsing bodies
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;

  //  Apply raw body for Stripe webhook before any other parser
  app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));

  //  Then apply normal JSON parser for all other routes
  app.use(express.json({ limit: '10mb' }));

  //   Global prefix
  app.setGlobalPrefix('api');

  //   Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  //  CORS
  const allowlist = new Set([
    'http://localhost:5174',
    'http://localhost:3000',
    'http://10.10.20.48:3004',
    'http://10.10.20.48:3005',
    'http://10.10.20.60:3005',
    'https://dental-project-yctd.vercel.app',
  ]);

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || allowlist.has(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked: ${origin}`), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  await app.listen(port);
  Logger.log(`🚀 Server running at http://localhost:${port}`, 'Bootstrap');
}

console.log('=================================');
console.log('Environment Variables Check:');
console.log('FILE_STORAGE:', process.env.FILE_STORAGE);
console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET);
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '***SET***' : 'NOT SET');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '***SET***' : 'NOT SET');
console.log('=================================');

bootstrap();
