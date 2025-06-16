import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as FormData from 'form-data';

@Injectable()
export class AnalyzerService {
  constructor(private readonly http: HttpService) {}

  async analyzeFrame(frame: Buffer): Promise<any> {
    // FormData 타입을 명확히 지정
    const form = new FormData();
    form.append('frame', frame, 'frame.jpg');

    // HTTP 요청은 Observable<any>이므로 타입 좁힘
    const resp$ = this.http.post<any>('/analyze-frame', form, {
      headers: form.getHeaders(),
    });
    try {
      const resp = await lastValueFrom(resp$);
      return resp.data;
    } catch (error: unknown) {
      throw new InternalServerErrorException('AI 서버 프레임 분석 실패');
    }
  }
}
