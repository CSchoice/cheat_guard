// src/modules/streaming/streaming.service.ts
import { Injectable } from '@nestjs/common';
import { AnalyzerService } from '../analyzer/analyzer.service';

@Injectable()
export class StreamingService {
  constructor(private readonly analyzer: AnalyzerService) {}

  async analyzeFrame(frame: Buffer): Promise<any> {
    return await this.analyzer.analyzeFrame(frame);
  }
}
