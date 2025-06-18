// src/modules/exam/exam.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Exam } from './entities/exam.entity';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { ExamScheduler } from './exam.scheduler';
import { UsersModule } from '../users/users.module';
import { ExamParticipant } from './entities/exam-participant.entity';
import { CheatingRecordEntity } from '../analyzer/entities/cheating-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exam, ExamParticipant, CheatingRecordEntity]),
    ScheduleModule,
    UsersModule,
  ],
  providers: [ExamService, ExamScheduler],
  controllers: [ExamController],
})
export class ExamModule {}
