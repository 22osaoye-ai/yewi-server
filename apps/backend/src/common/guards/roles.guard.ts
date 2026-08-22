import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = req.user;

    if (!user || !user.roles) {
      throw new ForbiddenException(
        'No tienes permisos suficientes para acceder a este recurso',
      );
    }

    const hasRole = () =>
      requiredRoles.some(
        (role) =>
          user.roles.includes(role) || user.roles.includes(UserRole.ADMIN),
      );

    if (!hasRole()) {
      throw new ForbiddenException(
        `Se requiere uno de los siguientes roles: [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
