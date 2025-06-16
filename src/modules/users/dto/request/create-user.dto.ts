// src/modules/users/dto/create-user.dto.ts
import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserRequestDto {
  @ApiProperty({
    description: '사용자 닉네임',
    example: 'choi123',
  })
  @IsString()
  @MinLength(3, { message: '닉네임은 최소 3자 이상이어야 합니다.' })
  nickname: string;

  @ApiProperty({
    description: '비밀번호 (영문, 숫자, 특수문자 포함, 최소 8자)',
    example: 'Abcd1234!',
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).+$/, {
    message: '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.',
  })
  password: string;
}
