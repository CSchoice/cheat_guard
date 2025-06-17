import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Request } from 'express';
import { LoginUserPayloadClass } from './login-user-payload';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    // 필요한 역할이 없으면 통과
    if (!requiredRoles) return true;

    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as LoginUserPayloadClass;

    // 디버깅 로그 추가
    console.log('=== Roles Guard Debug ===');
    console.log('Request User:', user.role);
    console.log('Required Roles:', requiredRoles.join(', '));

    if (!user || !user.role) {
      console.error('User or user.role is undefined in request');
      throw new ForbiddenException('사용자 역할 정보를 찾을 수 없습니다.');
    }

    // self 체크
    if (requiredRoles.includes('self')) {
      const paramId = Number(request.params.id);
      if (paramId === user.id) {
        return true;
      }
    }

    // role 체크
    const hasRole = requiredRoles.includes(user.role);
    console.log(
      `User role '${user.role}' ${hasRole ? 'matches' : 'does not match'} required roles`,
    );

    if (hasRole) {
      return true;
    }

    console.error(
      `Access denied. User role: ${user.role}, Required roles: ${requiredRoles.join(', ')}`,
    );
    throw new ForbiddenException('권한이 없습니다.');
  }
}
