import { Module, DynamicModule } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnalyzerService } from './analyzer.service';
import { AnalyzerController } from './analyzer.controller';

const AxiosModule: DynamicModule = HttpModule.register({
  baseURL: process.env.AI_SERVER_URL || 'http://localhost:5000',
  timeout: 5000,
});

@Module({
  imports: [AxiosModule],
  controllers: [AnalyzerController],
  providers: [AnalyzerService],
  exports: [AnalyzerService],
})
export class AnalyzerModule {}
