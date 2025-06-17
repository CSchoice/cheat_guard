import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { LoginUserPayloadClass } from 'src/common/guards/login-user-payload';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'nickname', passwordField: 'password' });
  }

  async validate(
    nickname: string,
    password: string,
  ): Promise<LoginUserPayloadClass> {
    const user = await this.authService.validateUser(nickname, password);

    if (!user) {
      throw new UnauthorizedException('잘못된 로그인 정보입니다.');
    }

    return new LoginUserPayloadClass(user.id, user.nickname, user.role);
  }
}
