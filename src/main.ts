import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import express from 'express';
import { join } from 'path';
import fs from 'fs';
import { AppModule } from './app.module';
import { validationPipe } from './common/pipes/validation.pipe';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { getCorsConfig } from './config/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Set global prefix to /api
  app.setGlobalPrefix('api');

  // Set cookies parser middleware
  app.use(cookieParser());

  // Servir archivos estáticos de la carpeta uploads
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  const frontendUrl = configService.getOrThrow<string>('app.frontendUrl');
  app.enableCors(getCorsConfig(frontendUrl));

  app.useGlobalPipes(validationPipe);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = configService.getOrThrow<number>('app.port');
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}

bootstrap().catch((error: unknown) => {
  console.error('Application failed to start', error);
  process.exitCode = 1;
});
