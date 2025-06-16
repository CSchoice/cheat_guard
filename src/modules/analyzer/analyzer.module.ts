import { Module, DynamicModule } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnalyzerService } from './analyzer.service';

const AxiosModule: DynamicModule = HttpModule.register({
  baseURL: process.env.AI_SERVER_URL || 'http://localhost:5000',
  timeout: 5000,
});

@Module({
  imports: [AxiosModule],
  providers: [AnalyzerService],
  exports: [AnalyzerService],
})
export class AnalyzerModule {}
