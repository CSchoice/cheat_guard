// src/modules/exam/dto/request/create-exam.dto.ts
import { IsString, Length, IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExamRequestDto {
  @ApiProperty({ example: 'JavaScript 중급', description: '시험 제목' })
  @IsString()
  @Length(1, 100)
  title: string;

  @ApiProperty({
    example: '2025-06-17T10:00:00.000Z',
    description: '시험 시작 시간 (ISO8601)',
  })
  @IsISO8601()
  startAt: string;

  @ApiProperty({
    example: '2025-06-17T12:00:00.000Z',
    description: '시험 종료 시간 (ISO8601)',
  })
  @IsISO8601()
  endAt: string;
}
