import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  type NestExpressApplication,
} from '@nestjs/platform-express';
import express, { type Express } from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from './app.module';
import { configureApp } from './setup';

let cachedApp: Promise<Express> | null = null;

async function bootstrap(): Promise<Express> {
  const expressApp = express();

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  configureApp(app);

  await app.init();

  return expressApp;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  cachedApp ??= bootstrap().catch((error: unknown) => {
    cachedApp = null;
    throw error;
  });

  const expressApp = await cachedApp;
  expressApp(req, res);
}