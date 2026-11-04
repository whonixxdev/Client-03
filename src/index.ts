import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/setup.js';

type RequestHandler = (req: IncomingMessage, res: ServerResponse) => void;

let cachedHandler: RequestHandler | undefined;

async function getHandler(): Promise<RequestHandler> {
  if (!cachedHandler) {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    configureApp(app);
    await app.init();
    cachedHandler = app.getHttpAdapter().getInstance() as RequestHandler;
  }
  return cachedHandler;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const instance = await getHandler();
  instance(req, res);
}