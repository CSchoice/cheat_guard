import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ description: '발급된 JWT 액세스 토큰' })
  accessToken: string;
}
