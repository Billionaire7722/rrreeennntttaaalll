import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private readonly auditService: AuditService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const { method, url, body, user, ip } = req;

        // We mainly care about mutative operations for general audit
        if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
            const userAgent = req.headers['user-agent'] || 'Unknown';
            const actorId = user?.userId || user?.id; // Depends on JWT payload
            const actorRole = user?.role;

            // We extract entity type and ID roughly from the URL (e.g., /houses/123)
            // This is a generic approach; specific actions can be logged in services for precise before/after data.
            const urlParts = url.split('?')[0].split('/').filter(Boolean);
            const entityType = urlParts[0] || 'Unknown';

            let entityId = 'N/A';
            if (urlParts.length > 1 && urlParts[1] !== 'status' && urlParts[1] !== 'role' && urlParts[1] !== 'toggle') {
                entityId = urlParts[1];
            } else if (body && body.id) {
                entityId = body.id;
            } else if (body && body.houseId) {
                entityId = body.houseId;
            }

            let actionType = `${method}_${entityType.toUpperCase()}`;
            if (urlParts.includes('status')) actionType += '_STATUS';
            if (urlParts.includes('role')) actionType += '_ROLE';
            if (urlParts.includes('restore')) actionType = `RESTORE_${entityType.toUpperCase()}`;

            // the action executes
            return next.handle().pipe(
                tap((afterData) => {
                    // Log success
                    this.auditService.logAction({
                        actorId,
                        actorRole,
                        actionType,
                        entityType,
                        entityId,
                        afterData: method !== 'DELETE' ? body : null, // Record what was sent
                        ipAddress: ip,
                        userAgent
                    });
                })
            );
        }

        return next.handle();
    }
}
