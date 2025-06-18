// src/modules/streaming/streaming.module.ts
import { Module } from '@nestjs/common';
import { StreamingGateway } from './streaming.gateway';
import { AnalyzerModule } from '../analyzer/analyzer.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AnalyzerModule,  // AnalyzerService 제공
    AuthModule,      // JwtService 와 JwtStrategy 제공
  ],
  providers: [StreamingGateway],
})
export class StreamingModule {}
