import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnalyzerService } from './analyzer.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import type { Express } from 'express';

@ApiTags('analyzer')
@Controller('analyzer')
export class AnalyzerController {
  constructor(private readonly analyzerService: AnalyzerService) {}

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '이미지 프레임 분석 (부정행위 감지)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        frame: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'YOLO 분석 결과 반환',
    schema: {
      example: {
        status: 'success',
        data: { persons: 1, cellphones: 0 },
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 – 파일 누락' })
  @ApiResponse({ status: 500, description: 'YOLO 분석 실패' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'student')
  @Post('frame')
  @UseInterceptors(FileInterceptor('frame'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,                     // ← 추가
  ) {
    // ★ 디버깅: 여기에 찍어보세요
    console.log('>>> controller req.user =', req.user);

    if (!file) {
      throw new HttpException('이미지를 업로드하세요.', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.analyzerService.analyzeFrame(file.buffer);
      return { status: 'success', data: result };
    } catch (error) {
      throw new HttpException(
        'YOLO 분석 중 오류 발생',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
