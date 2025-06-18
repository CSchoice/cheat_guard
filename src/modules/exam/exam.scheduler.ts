// src/modules/exam/exam.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExamService } from './exam.service';

// MethodDecorator 타입을 명시
const EveryMinuteCron = Cron(CronExpression.EVERY_MINUTE);

@Injectable()
export class ExamScheduler {
  private readonly logger = new Logger(ExamScheduler.name);

  constructor(private readonly examService: ExamService) {}
}
