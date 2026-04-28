/**
 * Handler Vercel Serverless pour NestJS
 * Ce fichier permet de déployer l'API NestJS sur Vercel
 * comme fonction serverless sans modifier l'architecture.
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

const server = express();

let isInitialized = false;

async function bootstrap(): Promise<void> {
  if (isInitialized) return;

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Access-Code'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();
  isInitialized = true;
}

export default async function handler(req: Request, res: Response) {
  await bootstrap();
  server(req, res);
}
