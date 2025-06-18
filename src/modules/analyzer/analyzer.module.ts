import { Module, DynamicModule } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyzerService } from './analyzer.service';
import { AnalyzerController } from './analyzer.controller';
import { CheatingRecordEntity } from './entities/cheating-record.entity';

const AxiosModule: DynamicModule = HttpModule.register({
  baseURL: process.env.AI_SERVER_URL || 'http://localhost:5000',
  timeout: 5000,
});

@Module({
  imports: [AxiosModule, TypeOrmModule.forFeature([CheatingRecordEntity])],
  controllers: [AnalyzerController],
  providers: [AnalyzerService],
  exports: [AnalyzerService],
})
export class AnalyzerModule {}
