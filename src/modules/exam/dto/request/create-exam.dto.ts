// src/modules/exam/dto/request/create-exam.dto.ts
import { IsString, Length, IsISO8601, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExamRequestDto {
  @ApiProperty({ example: 'JavaScript 중급', description: '시험 제목' })
  @IsString()
  @Length(1, 100)
  title: string;

  @ApiProperty({
    example: '2025-06-17T12:00:00.000Z',
    description: '시험 마감 시간 (ISO8601)',
  })
  @IsISO8601()
  @IsNotEmpty({ message: '시험 마감 시간은 필수입니다.' })
  deadlineAt: string;
}
