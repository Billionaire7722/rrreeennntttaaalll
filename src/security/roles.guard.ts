import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import { Role } from './roles.enum';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true; // No roles required
        }

        const { user } = context.switchToHttp().getRequest();
        console.log('[RolesGuard] Request User:', user);
        console.log('[RolesGuard] Required Roles:', requiredRoles);

        if (!user) {
            console.log('[RolesGuard] Forbidden: No user object attached');
            throw new ForbiddenException('User is not authenticated');
        }

        if (!user.role) {
            console.log('[RolesGuard] Forbidden: User object missing role property');
            throw new ForbiddenException('User role is not defined');
        }

        // SUPER_ADMIN has access to everything
        if (user.role === Role.SUPER_ADMIN) {
            return true;
        }

        const hasRole = requiredRoles.includes(user.role);
        if (!hasRole) {
            console.log(`[RolesGuard] Forbidden: Expected [${requiredRoles.join(', ')}], got [${user.role}]`);
            throw new ForbiddenException(`Require one of these roles: ${requiredRoles.join(', ')}`);
        }

        return true;
    }
}
