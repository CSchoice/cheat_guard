import { Module } from '@nestjs/common';
import { StreamingGateway } from './streaming.gateway';
import { AnalyzerModule } from '../analyzer/analyzer.module';

@Module({
  imports: [AnalyzerModule], // AnalyzerService를 주입받기 위해 모듈 포함
  providers: [StreamingGateway, AnalyzerModule],
})
export class StreamingModule {}
