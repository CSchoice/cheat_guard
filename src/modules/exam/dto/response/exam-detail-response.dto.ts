import { ApiProperty } from '@nestjs/swagger';

export class CheatingLogItemDto {
  @ApiProperty({
    example: '2025-06-16T08:00:00.000Z',
    description: '부정행위 발생 시간',
    nullable: false,
  })
  detectedAt: Date;

  @ApiProperty({
    example: '시선 이탈 감지됨',
    description: '부정행위 감지 사유',
    nullable: false,
  })
  reason: string;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: '부정행위 이미지 URL',
    nullable: true,
  })
  imageUrl?: string;
}

export class ExamDetailResponseDto {
  @ApiProperty({ example: 1, description: '시험 ID' })
  id: number;

  @ApiProperty({ example: 'JavaScript 중급', description: '시험 제목' })
  title: string;

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

  @ApiProperty({
    type: [CheatingLogItemDto],
    description: '부정행위 기록 리스트',
  })
  cheatingLogs: CheatingLogItemDto[];
}
