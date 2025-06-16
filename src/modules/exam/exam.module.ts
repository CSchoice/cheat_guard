// src/modules/exam/exam.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Exam } from './entities/exam.entity';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { ExamScheduler } from './exam.scheduler';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Exam]), ScheduleModule, UsersModule],
  providers: [ExamService, ExamScheduler],
  controllers: [ExamController],
})
export class ExamModule {}
