import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';
import {
  LOG_AUDIT_KEY,
  AuditMetadata,
} from '../decorators/log-audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggerService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get<AuditMetadata>(
      LOG_AUDIT_KEY,
      context.getHandler(),
    );

    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;
    const body = request.body;

    return next.handle().pipe(
      tap((result) => {
        this.logger.logAudit({
          action: auditMetadata.action,
          resource: auditMetadata.resource,
          resourceId: params?.id || result?.id,
          userId: user?.sub,
          organizationId: user?.organizationId,
          changes: this.extractChanges(body, result),
          metadata: {
            description: auditMetadata.description,
            userAgent: request.headers['user-agent'],
            ip: request.ip,
            method: request.method,
            url: request.url,
          },
        });
      }),
    );
  }

  private extractChanges(
    requestBody: any,
    response: any,
  ): Record<string, any> | undefined {
    if (!requestBody || typeof requestBody !== 'object') {
      return undefined;
    }

    // For create operations, log the created data
    if (response && typeof response === 'object') {
      return {
        before: null,
        after: this.sanitizeChanges(response),
      };
    }

    // For update operations, log the changes
    return {
      changes: this.sanitizeChanges(requestBody),
    };
  }

  private sanitizeChanges(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
