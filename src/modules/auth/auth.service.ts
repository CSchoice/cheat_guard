// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
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
    if (!nickname || !plainPassword) {
      throw new BadRequestException({
        message: '닉네임과 비밀번호는 필수입니다.',
      });
    }

    if (nickname.length < 2 || nickname.length > 50) {
      throw new BadRequestException({
        message: '닉네임은 2자 이상 50자 이하이어야 합니다.',
      });
    }

    if (plainPassword.length < 6) {
      throw new BadRequestException({
        message: '비밀번호는 최소 6자 이상이어야 합니다.',
      });
    }

    let userEntity: User;
    try {
      userEntity = await this.usersService.findOneByNickname(nickname);
      console.log('Found user entity:', userEntity); // 디버깅용 로그 추가
    } catch (err: unknown) {
      if (err instanceof NotFoundException) {
        throw new NotFoundException({
          message: '해당 닉네임의 사용자를 찾을 수 없습니다.',
        });
      }
      throw new InternalServerErrorException({
        message: '사용자 조회 중 오류가 발생했습니다.',
      });
    }

    try {
      const isMatch = await this.usersService.comparePassword(
        userEntity.id,
        plainPassword,
      );
      if (!isMatch) {
        throw new UnauthorizedException({
          message: '비밀번호가 올바르지 않습니다.',
        });
      }
    } catch (err: unknown) {
      throw new UnauthorizedException({
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
    if (!user.id || !user.nickname || !user.role) {
      throw new BadRequestException({
        message: '로그인 정보가 부족합니다.',
      });
    }

    const payload = { sub: user.id, nickname: user.nickname, role: user.role };
    try {
      return {
        accessToken: this.jwtService.sign(payload),
      };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'JWT 토큰 생성 중 오류가 발생했습니다.',
      });
    }
  }
}
