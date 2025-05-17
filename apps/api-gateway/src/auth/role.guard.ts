import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Role } from '@event-reward-platform/protocol';
import { AccessTokenPayload } from '@event-reward-platform/core';
import { Request } from 'express';

@Injectable()
export class RoleGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role>(
      'roles',
      context.getHandler(),
    );

    if (requiredRoles == null || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const { role: userRole } = request.user as AccessTokenPayload;

    return requiredRoles.includes(userRole);
  }
}
