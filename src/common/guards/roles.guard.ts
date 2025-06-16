import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!requiredRoles) return true;

    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as { id: number; role: string };

    if (requiredRoles.includes('self')) {
      const paramId = Number(request.params.id);
      if (paramId === user.id) {
        return true;
      }
    }

    // role 체크
    if (requiredRoles.includes(user.role)) {
      return true;
    }

    throw new ForbiddenException('권한이 없습니다.');
  }
}
