import { ApiProperty } from '@nestjs/swagger';
import { ExamStatus } from '../../entities/exam.entity';
import { UserResponseDto } from '../../../users/dto/response/user-response.dto';

export class ExamResponseDto {
  @ApiProperty({ example: 1, description: '시험 ID' })
  id: number;

  @ApiProperty({ example: 'JavaScript 중급', description: '시험 제목' })
  title: string;

  @ApiProperty({
    example: ExamStatus.CREATED,
    enum: ExamStatus,
    description: '시험 상태',
  })
  status: ExamStatus;

  @ApiProperty({
    example: '2025-06-16T08:00:00.000Z',
    nullable: true,
    description: '시험 시작 시간',
  })
  startedAt: Date | null;

  @ApiProperty({
    example: '2025-06-16T10:00:00.000Z',
    nullable: true,
    description: '시험 종료 시간',
  })
  endedAt: Date | null;

  @ApiProperty({
    type: [UserResponseDto],
    description: '참가자 목록',
  })
  participants: UserResponseDto[];
}
