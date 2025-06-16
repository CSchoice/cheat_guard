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

  @EveryMinuteCron
  async handleCron(): Promise<void> {
    this.logger.debug('스케줄 시작');
    try {
      await this.examService.processScheduled();
      this.logger.debug('스케줄 완료');
    } catch (e: unknown) {
      this.logger.error(
        '스케줄 중 오류',
        e instanceof Error ? e.stack : String(e),
      );
    }
  }
}
