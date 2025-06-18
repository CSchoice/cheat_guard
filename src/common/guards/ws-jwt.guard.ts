// src/common/guards/ws-jwt.guard.ts

import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class WsJwtAuthGuard extends AuthGuard('jwt') {
  /**
   * socket.io 연결 시 호출됩니다.
   * handshake.auth.token 에서 토큰을 꺼내
   * Authorization 헤더로 주입한 뒤 Passport 검증을 수행합니다.
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient<any>();
    const token = client.handshake.auth?.token as string | undefined;

    if (!token) {
      throw new UnauthorizedException('토큰이 없습니다.');
    }

    // passport-jwt 가 Authorization 헤더에서 토큰을 뽑아 검증하므로 강제로 설정
    client.handshake.headers = {
      ...(client.handshake.headers || {}),
      authorization: `Bearer ${token}`,
    };

    // 이후 JwtStrategy.validate() 가 호출됩니다
    return super.canActivate(context);
  }

  /**
   * JwtStrategy.validate() 가 리턴한 user 객체를
   * client.data.user 에 저장하고, 이 user 를 리턴합니다.
   */
  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    info: any,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
    const client = context.switchToWs().getClient<any>();
    client.data = client.data || {};
    client.data.user = user; // 이제 client.data.user 에 user 정보가 담깁니다.
    return user;
  }
}
