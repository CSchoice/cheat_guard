import { Module } from '@nestjs/common';
import { StreamingController } from './streaming.controller';
import { StreamingService } from './streaming.service';
import { StreamingGateway } from './streaming.gateway';
import { AnalyzerModule } from '../analyzer/analyzer.module';

@Module({
  imports: [AnalyzerModule], // AnalyzerService를 주입받기 위해 모듈 포함
  controllers: [StreamingController],
  providers: [StreamingService, StreamingGateway],
  exports: [StreamingService],
})
export class StreamingModule {}
