import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ description: '사용자 닉네임', example: 'choi123' })
  @IsString()
  nickname: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'Abcd1234!',
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  password: string;
}
