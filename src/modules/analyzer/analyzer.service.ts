import { Injectable, Logger } from '@nestjs/common';
import {
  InternalServerErrorException,
  ConflictException,
} from '../../common/exceptions/business.exception';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { CheatingRecordEntity } from './entities/cheating-record.entity';

export interface AIResponse {
  status: string;
  message: string;
  confidence?: number;
  timestamp?: number;
  [key: string]: unknown;
}

interface LogContext {
  sessionId: string;
  examId: number;
  userId: number;
  frameSize: number;
  [key: string]: unknown;
}

type DriverError = {
  code?: string;
  constraint?: string;
  detail?: string;
  message?: string;
};

type QueryFailedErrorWithDriver = Error & {
  driverError?: DriverError;
};

@Injectable()
export class AnalyzerService {
  private readonly logger = new Logger(AnalyzerService.name);

  private readonly aiServerUrl: string;

  constructor(
    private readonly http: HttpService,
    @InjectRepository(CheatingRecordEntity)
    private readonly cheatingRepo: Repository<CheatingRecordEntity>,
    private readonly configService: ConfigService,
  ) {
    this.aiServerUrl = this.configService.get(
      'aiServerUrl',
      'http://localhost:5000',
    );
    this.logger.log('AnalyzerService 초기화 완료');
    this.logger.log(`AI 서버 URL: ${this.aiServerUrl}`);
  }

  /**
   * 외부 AI 서버에 프레임 전송 후, 부정행위 감지 시 DB에 저장
   * @param frame - 영상 프레임 버퍼
   * @param sessionId - 시험 세션 ID
   * @param examId - 시험 ID
   * @param userId - 사용자 ID
   */
  async analyzeFrame(
    frame: Buffer,
    sessionId: string,
    examId: number,
    userId: number,
  ): Promise<AIResponse> {
    if (!frame || !Buffer.isBuffer(frame)) {
      throw new ConflictException('유효하지 않은 프레임 데이터입니다.');
    }
    const startTime = Date.now();
    const logContext: LogContext = {
      sessionId,
      examId,
      userId,
      frameSize: frame.length,
    };

    this.logger.debug('프레임 분석 시작', logContext);

    try {
      const imageBase64 = frame.toString('base64');
      const payload = {
        image_base64: imageBase64,
        session_id: sessionId,
        exam_id: examId,
        user_id: userId,
        timestamp: startTime,
      };

      this.logger.debug('AI 서버로 분석 요청 전송', {
        ...logContext,
        payloadSize: JSON.stringify(payload).length,
      });

      const response = await lastValueFrom(
        this.http.post<AIResponse>(`${this.aiServerUrl}/infer`, payload, {
          headers: {
            'Content-Type': 'application/json',
            exam_id: examId.toString(),
          },
        }),
      );

      if (!response?.data) {
        throw new Error('AI 서버로부터 유효한 응답을 받지 못했습니다.');
      }

      const result = response.data;
      const processingTime = Date.now() - startTime;

      this.logger.log('AI 분석 완료', {
        ...logContext,
        processingTime: `${processingTime}ms`,
        resultStatus: result.status,
      });

      if (result.status === 'cheating') {
        await this.handleCheatingDetection({
          result,
          sessionId,
          examId,
          userId,
          logContext,
        });
      }

      return result;
    } catch (error) {
      const errorContext = {
        ...logContext,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      };

      this.logger.error('프레임 분석 중 오류 발생', errorContext);
      throw new InternalServerErrorException('AI 서버 프레임 분석 실패');
    }
  }

  /**
   * 부정행위 감지 시 처리
   */
  private async handleCheatingDetection({
    result,
    sessionId,
    examId,
    userId,
    logContext,
  }: {
    result: AIResponse;
    sessionId: string;
    examId: number;
    userId: number;
    logContext: LogContext;
  }): Promise<void> {
    if (!result || typeof result !== 'object' || !('status' in result)) {
      this.logger.error('유효하지 않은 AI 응답 형식', {
        result,
        ...logContext,
      });
      return;
    }

    const { message = 'No message', confidence, timestamp } = result;
    const detectionTime = timestamp ? new Date(timestamp) : new Date();

    const cheatingContext = {
      ...logContext,
      detectionTime: detectionTime.toISOString(),
      reason: message,
      confidence,
    };

    const cheatingData = {
      sessionId,
      examId,
      userId,
      detectedAt: detectionTime,
      reason: message,
      confidence,
      rawData: result,
    };

    this.logger.warn('부정행위 감지됨', cheatingContext);

    try {
      const record = this.cheatingRepo.create(
        cheatingData as unknown as CheatingRecordEntity,
      );
      await this.cheatingRepo.save(record);

      this.logger.log('부정행위 기록 저장 성공', {
        ...cheatingContext,
        recordId: record.id,
      });
    } catch (error) {
      const typedError = error as unknown as QueryFailedErrorWithDriver;
      const errorDetails = typedError.driverError
        ? {
            code: typedError.driverError.code,
            constraint: typedError.driverError.constraint,
            detail: typedError.driverError.detail,
            message: typedError.driverError.message,
          }
        : { message: error instanceof Error ? error.message : 'Unknown error' };

      this.logger.error('부정행위 기록 저장 실패', {
        ...cheatingContext,
        ...errorDetails,
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof QueryFailedError) {
        throw new ConflictException(
          '부정행위 기록이 중복되었거나 유효하지 않습니다.',
        );
      }
      throw new InternalServerErrorException('부정행위 기록 저장 실패');
    }
  }
}
