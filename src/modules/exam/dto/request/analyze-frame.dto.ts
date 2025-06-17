import { IsString, IsNotEmpty } from 'class-validator';

export class AnalyzeFrameDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  imageBase64: string;
}
