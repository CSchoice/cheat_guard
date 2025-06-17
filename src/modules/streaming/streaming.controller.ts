import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StreamingService } from './streaming.service';
import type { Express } from 'express'; // ✅ 정확한 위치에서 타입 import

@Controller('streaming')
export class StreamingController {
  constructor(private readonly streamingService: StreamingService) {}

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideo(@UploadedFile() file: Express.Multer.File): Promise<any> {
    return this.streamingService.analyzeFrame(file.buffer);
  }
}
