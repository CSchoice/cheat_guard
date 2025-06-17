// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import {
  LoginUserPayload,
  LoginUserPayloadClass,
} from 'src/common/guards/login-user-payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    nickname: string,
    plainPassword: string,
  ): Promise<LoginUserPayload> {
    let userEntity: User;
    try {
      userEntity = await this.usersService.findOneByNickname(nickname);
      console.log('Found user entity:', userEntity); // 디버깅용 로그 추가
    } catch (err: unknown) {
      if (err instanceof NotFoundException) {
        throw new NotFoundException({
          code: 'USER_NOT_FOUND',
          message: '해당 닉네임의 사용자를 찾을 수 없습니다.',
        });
      }
      throw err;
    }

    const isMatch = await this.usersService.comparePassword(
      userEntity.id,
      plainPassword,
    );
    if (!isMatch) {
      throw new UnauthorizedException({
        code: 'INVALID_PASSWORD',
        message: '비밀번호가 올바르지 않습니다.',
      });
    }

    const loginUser = new LoginUserPayloadClass(
      userEntity.id,
      userEntity.nickname,
      userEntity.role || 'student', // 기본값 설정
    );
    console.log('Returning login user:', loginUser); // 디버깅용 로그 추가
    return loginUser;
  }

  login(user: LoginUserPayloadClass): { accessToken: string } {
    const payload = { sub: user.id, nickname: user.nickname, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
