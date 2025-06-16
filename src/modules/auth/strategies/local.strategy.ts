import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserResponseDto } from '../../users/dto/response/user-response.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    // usernameField: 'nickname', passwordField: 'password' 로 바꿔줍니다
    super({ usernameField: 'nickname', passwordField: 'password' });
  }

  async validate(nickname: string, password: string): Promise<UserResponseDto> {
    const user = await this.authService.validateUser(nickname, password);
    if (!user) {
      throw new UnauthorizedException('잘못된 로그인 정보입니다.');
    }
    return user; // request.user 에 할당됩니다
  }
}
