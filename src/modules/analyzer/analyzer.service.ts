import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AnalyzerService {
  constructor(private readonly http: HttpService) {}

  async analyzeFrame(frame: Buffer): Promise<any> {
    const imageBase64 = frame.toString('base64');

    const resp$ = this.http.post<any>('http://localhost:8000/infer', {
      image_base64: imageBase64,
    });

    try {
      const resp = await lastValueFrom(resp$);
      return resp.data;
    } catch (error) {
      throw new InternalServerErrorException('AI 서버 프레임 분석 실패');
    }
  }
}
