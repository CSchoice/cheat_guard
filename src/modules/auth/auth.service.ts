// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dto/response/user-response.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    nickname: string,
    plainPassword: string,
  ): Promise<UserResponseDto> {
    let userEntity: User;
    try {
      userEntity = await this.usersService.findOneByNickname(nickname);
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

    return { id: userEntity.id, nickname: userEntity.nickname };
  }

  login(user: UserResponseDto): Promise<{ accessToken: string }> {
    const payload = { sub: user.id, nickname: user.nickname };
    return Promise.resolve({
      accessToken: this.jwtService.sign(payload),
    });
  }
}
