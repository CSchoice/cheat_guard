import { ApiProperty } from '@nestjs/swagger';
import { ExamStatus } from '../../entities/exam.entity';

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
    description: '시험 마감 시간',
  })
  deadlineAt: Date | null;

  @ApiProperty({
    example: true,
    description: '내가 참여중인지 여부',
    nullable: false,
  })
  isParticipating: boolean;

  @ApiProperty({
    example: false,
    description: '내가 종료했는지 여부',
    nullable: false,
  })
  isCompleted: boolean;
}
