import {
  Injectable,
  Logger,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { CheatingRecordEntity } from './entities/cheating-record.entity';

@Injectable()
export class AnalyzerService {
  private readonly logger = new Logger(AnalyzerService.name);

  constructor(
    private readonly http: HttpService,
    @InjectRepository(CheatingRecordEntity)
    private readonly cheatingRepo: Repository<CheatingRecordEntity>,
  ) {}

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
  ): Promise<any> {
    const imageBase64 = frame.toString('base64');
    const payload = {
      image_base64: imageBase64,
      session_id: sessionId,
      exam_id: examId,
      user_id: userId,
      timestamp: Date.now(),
    };

    let result: any;
    try {
      const resp$ = this.http.post<any>('http://localhost:8000/infer', payload);
      const resp = await lastValueFrom(resp$);
      result = resp.data;
    } catch (error) {
      this.logger.error('AI 서버 프레임 분석 실패', error);
      throw new InternalServerErrorException('AI 서버 프레임 분석 실패');
    }

    if (result?.status === 'cheating') {
      // 엔티티 필드에 맞춰 직접 값만 할당
      const record = this.cheatingRepo.create({
        sessionId,
        examId,
        userId,
        detectedAt: new Date(result.timestamp || Date.now()),
        reason: result.message,
        rawData: result,
      });
      try {
        await this.cheatingRepo.save(record);
        this.logger.log(
          `부정행위 기록 저장: exam=${examId} user=${userId} session=${sessionId}`,
        );
      } catch (error) {
        if (error instanceof QueryFailedError) {
          this.logger.error('DB 제약조건 오류로 기록 저장 실패', error);
          throw new ConflictException(
            '부정행위 기록이 중복되었거나 유효하지 않습니다.',
          );
        }
        this.logger.error('부정행위 기록 저장 실패', error);
        throw new InternalServerErrorException('부정행위 기록 저장 실패');
      }
    }

    return result;
  }
}
