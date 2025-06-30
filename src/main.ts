/* eslint-disable @typescript-eslint/no-unsafe-call */
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  ValidationPipe,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { HttpErrorFilter } from './common/filters/http-exception.filter';
import * as morgan from 'morgan';
import type { RequestHandler } from 'express';

async function bootstrap() {
  // 1) Logger 레벨도 환경변수로 제어
  const loggerLevels = process.env.LOGGER_LEVELS
    ? (process.env.LOGGER_LEVELS.split(',') as any)
    : ['error', 'warn', 'log'];

  const app = await NestFactory.create(AppModule, {
    logger: loggerLevels,
  });

  // 2) Morgan 포맷도 환경변수로
  const morganFormat = process.env.MORGAN_FORMAT || 'dev';
  const morganMiddleware = morgan(morganFormat) as RequestHandler;
  app.use(morganMiddleware);

  // 3) CORS 설정
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : true;
  app.enableCors({
    origin: corsOrigins,
    methods:
      process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: process.env.CORS_CREDENTIALS === 'true',
    allowedHeaders:
      process.env.CORS_ALLOWED_HEADERS || 'Content-Type, Accept, Authorization',
    exposedHeaders: process.env.CORS_EXPOSED_HEADERS || '',
    maxAge: process.env.CORS_MAX_AGE
      ? parseInt(process.env.CORS_MAX_AGE, 10)
      : 600,
  });

  // 4) 글로벌 prefix
  const globalPrefix = process.env.GLOBAL_PREFIX || 'api';
  app.setGlobalPrefix(globalPrefix);

  // 5) ValidationPipe 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors
          .map((err) => Object.values(err.constraints || {}).join(', '))
          .join('; ');
        throw new BadRequestException({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: messages,
          details: errors,
        });
      },
    }),
  );

  // 6) 전역 예외 필터
  app.useGlobalFilters(new HttpErrorFilter());

  // 7) Swagger 설정
  if (process.env.SWAGGER_ENABLED !== 'false') {
    const swaggerPath = process.env.SWAGGER_PATH || `${globalPrefix}/docs`;
    const swaggerTitle = process.env.SWAGGER_TITLE || 'Cheat Guard API';
    const swaggerDesc =
      process.env.SWAGGER_DESCRIPTION ||
      '온라인 시험 부정행위 감지 시스템 API 문서';
    const swaggerVersion = process.env.SWAGGER_VERSION || '1.0';
    const bearerName = process.env.SWAGGER_BEARER_NAME || 'access-token';

    const config = new DocumentBuilder()
      .setTitle(swaggerTitle)
      .setDescription(swaggerDesc)
      .setVersion(swaggerVersion)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        bearerName,
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: process.env.SWAGGER_PERSIST_AUTH === 'true',
      },
    });
  }

  // 8) 포트도 환경변수로
  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port);
  console.log(`🚀 Server running at http://localhost:${port}/${globalPrefix}`);
  if (process.env.SWAGGER_ENABLED !== 'false') {
    console.log(
      `🚀 Swagger available at http://localhost:${port}/${
        process.env.SWAGGER_PATH || `${globalPrefix}/docs`
      }`,
    );
  }
}

void bootstrap();
