import { Injectable, Logger } from '@nestjs/common';
import {
  ValidationException,
  InternalServerErrorException,
  ConflictException,
} from '../../common/exceptions/business.exception';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { CheatingRecordEntity } from './entities/cheating-record.entity';
import { S3Service } from './s3.service';

export interface AIResponse {
  status: string;
  message?: string;
  confidence?: number;
  timestamp?: number;
  image_base64?: string;
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
    @InjectRepository(CheatingRecordEntity)
    private readonly cheatingRepo: Repository<CheatingRecordEntity>,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {
    this.aiServerUrl = this.configService.get(
      'aiServerUrl',
      'http://localhost:8000',
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
      throw new ValidationException({
        field: 'frame',
        message: '프레임 데이터가 유효하지 않습니다.',
      });
    }

    if (!sessionId || typeof sessionId !== 'string') {
      throw new ValidationException({
        field: 'sessionId',
        message: '세션 ID가 유효하지 않습니다.',
      });
    }

    if (!examId || typeof examId !== 'number') {
      throw new ValidationException({
        field: 'examId',
        message: '시험 ID가 유효하지 않습니다.',
      });
    }

    if (!userId || typeof userId !== 'number') {
      throw new ValidationException({
        field: 'userId',
        message: '사용자 ID가 유효하지 않습니다.',
      });
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

      const response = await fetch(`${this.aiServerUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new InternalServerErrorException({
          message: `AI 서버 응답 실패: ${response.status} ${response.statusText}`,
        });
      }

      const aiResponse = await response.json();

      if (!aiResponse || typeof aiResponse !== 'object') {
        throw new InternalServerErrorException({
          message: 'AI 서버 응답이 유효하지 않습니다.',
        });
      }

      if (aiResponse.status === 'error') {
        throw new InternalServerErrorException({
          message: aiResponse.message || 'AI 서버에서 에러가 발생했습니다.',
        });
      }

      if (aiResponse.status === 'cheating_detected') {
        const cheatingRecord = this.cheatingRepo.create({
          sessionId,
          examId,
          userId,
          detectedAt: new Date(startTime),
          reason: `부정행위 감지 (신뢰도: ${aiResponse.confidence || 'N/A'})`,
          imageUrl: await this.s3Service.uploadBase64Image(
            aiResponse.image_base64,
            `cheating/${examId}/${userId}`,
          ),
        });

        try {
          await this.cheatingRepo.save(cheatingRecord);
          this.logger.debug('부정행위 기록 저장 완료', logContext);
        } catch (error) {
          const queryError = error as QueryFailedErrorWithDriver;
          this.logger.error('부정행위 기록 저장 중 오류 발생', {
            ...logContext,
            error: queryError.driverError,
          });
          throw new InternalServerErrorException({
            message: '부정행위 기록 저장 중 오류가 발생했습니다.',
          });
        }
      }

      this.logger.debug('프레임 분석 완료', {
        ...logContext,
        processingTime: Date.now() - startTime,
      });
      return aiResponse;
    } catch (error) {
      this.logger.error('프레임 분석 중 오류 발생', {
        ...logContext,
        error: error.message,
      });

      if (error instanceof Error) {
        throw new InternalServerErrorException({
          message: error.message,
        });
      }

      throw new InternalServerErrorException({
        message: '프레임 분석 중 오류가 발생했습니다.',
      });
    }
  }

  /**
   * 부정행위 감지 시 처리
   */
  private async handleCheatinngDetection({
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

    this.logger.debug('AI 응답 확인', {
      ...logContext,
      result,
    });

    const base64 = result.image_base64;
    if (typeof base64 !== 'string') {
      this.logger.error('image_base64 누락 또는 잘못된 형식', logContext);
      throw new InternalServerErrorException({
        message: 'AI 응답에 image_base64가 없거나 잘못된 형식입니다.',
        context: logContext
      });
    }

    const s3Key = `cheating/${examId}/${userId}/${Date.now()}.jpg`;
    this.logger.debug('S3 이미지 업로드 시작', {
      ...logContext,
      key: s3Key,
      base64Length: base64.length,
    });

    let imageUrl: string;
    try {
      imageUrl = await this.s3Service.uploadBase64Image(
        base64,
        `cheating/${examId}/${userId}`,
      );
      this.logger.log('부정행위 이미지 업로드 성공', {
        ...logContext,
        imageUrl,
      });
    } catch (uploadError) {
      this.logger.error('S3 이미지 업로드 실패', {
        ...logContext,
        error: uploadError instanceof Error ? uploadError.message : String(uploadError),
        stack: uploadError instanceof Error ? uploadError.stack : undefined,
      });
      throw new InternalServerErrorException({
        message: 'S3 이미지 업로드에 실패했습니다.',
        error: uploadError instanceof Error ? uploadError.message : 'Unknown error',
        context: logContext
      });
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
      imageUrl: imageUrl,
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
        context: logContext
      });

      if (error instanceof QueryFailedError) {
        throw new ConflictException(
          '부정행위 기록이 중복되었거나 유효하지 않습니다.',
        );
      }
      throw new InternalServerErrorException({
        message: 'AI 분석 요청에 실패했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
        context: logContext
      });
    }
  }
}
