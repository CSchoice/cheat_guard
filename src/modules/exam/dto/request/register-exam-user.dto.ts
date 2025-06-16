import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class RegisterExamUserDto {
  @ApiProperty({ description: '등록할 사용자 ID', example: 42 })
  @IsInt()
  userId: number;
}
