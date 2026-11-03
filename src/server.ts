
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

let cachedApp: Promise<Express> | null = null;

async function bootstrap(): Promise<Express> {
  const expressApp = express();

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  app.set('trust proxy', 1);
  app.use(helmet());

  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  return expressApp;
}

export default async function handler(req: any, res: any) {
  cachedApp ??= bootstrap();

  const expressApp = await cachedApp;
  expressApp(req, res);
}
