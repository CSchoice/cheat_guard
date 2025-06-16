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
  const app = await NestFactory.create(AppModule);

  // 요청 로깅(morgan)
  const morganMiddleware = morgan('dev') as RequestHandler;
  app.use(morganMiddleware);

  // 1) CORS 활성화 및 글로벌 프리픽스 설정
  app.enableCors();
  app.setGlobalPrefix('api');

  // 2) ValidationPipe & ExceptionFactory 설정
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

  // 3) 전역 예외 필터 등록
  app.useGlobalFilters(new HttpErrorFilter());

  // 4) Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Cheat Guard API')
    .setDescription('온라인 시험 부정행위 감지 시스템 API 문서')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // 5) 애플리케이션 실행
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Server running at http://localhost:${port}/api`);
  console.log(`🚀 Swagger available at http://localhost:${port}/api/docs`);
}

void bootstrap();
