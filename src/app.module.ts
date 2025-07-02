// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import * as path from 'path';

// Modules
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ExamModule } from './modules/exam/exam.module';
import { StreamingModule } from './modules/streaming/streaming.module';
import { AnalyzerModule } from './modules/analyzer/analyzer.module';

// Configurations
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import kafkaConfig from './config/kafka.config';
import { dataSourceOptions } from './config/data-source';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, kafkaConfig],
      cache: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ...dataSourceOptions,
        autoLoadEntities: true,
        // 개발환경일때만 synchronize
        synchronize: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    ScheduleModule.forRoot(),

    UsersModule,
    AuthModule,
    ExamModule,
    StreamingModule,
    AnalyzerModule,
  ],
})
export class AppModule {}
