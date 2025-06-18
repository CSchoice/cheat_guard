// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ExamModule } from './modules/exam/exam.module';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './configuration';

// DynamicModule 타입을 명시
import type { DynamicModule } from '@nestjs/common';
import { StreamingModule } from './modules/streaming/streaming.module';
import { AnalyzerModule } from './modules/analyzer/analyzer.module';

const RootScheduleModule: DynamicModule = ScheduleModule.forRoot();

@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration], isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'mariadb',
        host: config.get<string>('db.host'),
        port: config.get<number>('db.port'),
        username: config.get<string>('db.username'),
        password: config.get<string>('db.password'),
        database: config.get<string>('db.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        // dropSchema: true,
        extra: { charset: 'utf8mb4_general_ci' },
      }),
      inject: [ConfigService],
    }),

    UsersModule,
    AuthModule,
    ExamModule,
    StreamingModule,
    AnalyzerModule,

    RootScheduleModule,
  ],
})
export class AppModule {}
