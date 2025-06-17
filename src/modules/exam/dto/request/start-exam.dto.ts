import { IsNumber, IsString, IsOptional, IsUrl } from 'class-validator';

export class StartExamDto {
  @IsNumber()
  examId: number;

  @IsString()
  @IsOptional()
  sessionId?: string; // 프론트엔드에서 생성한 세션 ID (선택사항)

  @IsString()
  @IsUrl()
  @IsOptional()
  fastApiUrl?: string; // FastAPI 서버 URL (선택사항, 기본값은 환경변수에서 가져옴)
}
