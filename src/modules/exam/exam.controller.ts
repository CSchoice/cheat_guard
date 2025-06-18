// src/modules/exam/exam.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ExamService } from './exam.service';
import { CreateExamRequestDto } from './dto/request/create-exam.dto';
import { RegisterExamUserDto } from './dto/request/register-exam-user.dto';
import { ExamResponseDto } from './dto/response/exam-response.dto';
import { UserResponseDto } from '../users/dto/response/user-response.dto';
import { ExamDetailResponseDto } from './dto/response/exam-detail-response.dto';

@ApiTags('exams')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exams')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @ApiOperation({ summary: '시험 생성' })
  @ApiResponse({
    status: 201,
    description: '생성된 시험 반환',
    type: ExamResponseDto,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateExamRequestDto,
    @Req() req: any,
  ): Promise<ExamResponseDto> {
    const userId = req.user.id;
    return this.examService.create(dto, userId);
  }

  @ApiOperation({ summary: '시험 전체 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '시험 목록 반환 (내 참여 여부 포함)',
    type: ExamResponseDto,
    isArray: true,
  })
  @Roles('student')
  @Get()
  findAll(@Req() req: any): Promise<ExamResponseDto[]> {
    const userId = req.user.id;
    return this.examService.findAll(userId);
  }

  @ApiOperation({ summary: '내가 참여중인 시험 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '내가 등록한 시험 목록 반환',
    type: ExamResponseDto,
    isArray: true,
  })
  @Roles('student')
  @Get('my')
  @HttpCode(HttpStatus.OK)
  findMyExams(@Req() req: any): Promise<ExamResponseDto[]> {
    const userId = req.user.id;
    return this.examService.findMyExams(userId);
  }

  @ApiOperation({ summary: '단일 시험 조회' })
  @ApiResponse({
    status: 200,
    description: '시험 정보 반환 (내 참여 여부 포함)',
    type: ExamDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @Roles('student')
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<ExamDetailResponseDto> {
    const userId = req.user.id;
    return this.examService.findOne(id, userId);
  }

  @ApiOperation({ summary: '참가자 등록 (본인만)' })
  @ApiResponse({
    status: 200,
    description: '참가자 등록 후 시험 반환',
    type: ExamResponseDto,
  })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 등록된 사용자' })
  @Roles('student')
  @Post(':id/register')
  register(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<ExamResponseDto> {
    const userId = req.user.id;
    // dto.userId 대신 본인 userId 로만 등록
    return this.examService.registerUser(id, { userId });
  }

  @ApiOperation({ summary: '시험 등록 취소' })
  @ApiResponse({
    status: 200,
    description: '시험 등록 취소 후 시험 반환',
    type: ExamResponseDto,
  })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @Roles('student')
  @Put(':id/register')
  unregister(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<ExamResponseDto> {
    const userId = req.user.id;
    return this.examService.unregisterUser(id, userId);
  }

  @ApiOperation({ summary: '참가자 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '참가자 목록 반환',
    type: UserResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @Get(':id/participants')
  getParticipants(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto[]> {
    return this.examService.getParticipants(id);
  }

  @ApiOperation({ summary: '시험 시작 및 세션 생성' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: '시험 ID',
    example: 8,
  })
  @ApiResponse({
    status: 201,
    description: '시험 세션 생성 성공',
    schema: {
      example: {
        sessionId: 'session_1234567890_1_1',
        fastApiUrl: 'http://localhost:8000',
      },
    },
  })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @ApiResponse({
    status: 409,
    description: '이미 시험이 시작되었거나 권한 없음',
  })
  @Roles('student')
  @Post(':id/start')
  @HttpCode(HttpStatus.CREATED)
  startExam(
    @Param('id', ParseIntPipe) examId: number,
    @Req() req: any,
  ): Promise<{ sessionId: string; fastApiUrl: string }> {
    const userId = req.user.id;
    return this.examService.startExam(examId, userId);
  }

  @ApiOperation({ summary: '시험 종료' })
  @ApiResponse({
    status: 200,
    description: '시험 종료 성공',
    type: ExamResponseDto,
  })
  @Roles('student')
  @Put(':id/stop')
  stopExam(
    @Param('id', ParseIntPipe) examId: number,
    @Req() req: any,
  ): Promise<ExamResponseDto> {
    const userId = req.user.id;
    return this.examService.endExam(examId, userId);
  }
}
