import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ExamService } from './exam.service';
import { CreateExamRequestDto } from './dto/request/create-exam.dto';
import { RegisterExamUserDto } from './dto/request/register-exam-user.dto';
import { ExamResponseDto } from './dto/response/exam-response.dto';
import { UserResponseDto } from '../users/dto/response/user-response.dto';

@ApiTags('exams')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
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
  create(@Body() dto: CreateExamRequestDto): Promise<ExamResponseDto> {
    return this.examService.create(dto);
  }

  @ApiOperation({ summary: '시험 전체 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '시험 목록 반환',
    type: ExamResponseDto,
    isArray: true,
  })
  @Get()
  findAll(): Promise<ExamResponseDto[]> {
    return this.examService.findAll();
  }

  @ApiOperation({ summary: '단일 시험 조회' })
  @ApiResponse({
    status: 200,
    description: '시험 정보 반환',
    type: ExamResponseDto,
  })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ExamResponseDto> {
    return this.examService.findOne(id);
  }

  @ApiOperation({ summary: '참가자 등록' })
  @ApiBody({ type: RegisterExamUserDto })
  @ApiResponse({
    status: 200,
    description: '참가자 등록 후 시험 반환',
    type: ExamResponseDto,
  })
  @ApiResponse({ status: 404, description: '시험 또는 사용자 없음' })
  @ApiResponse({ status: 409, description: '이미 등록된 사용자' })
  @Post(':id/register')
  register(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegisterExamUserDto,
  ): Promise<ExamResponseDto> {
    return this.examService.registerUser(id, dto);
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
}
