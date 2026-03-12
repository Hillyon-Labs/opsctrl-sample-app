import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, headers, body, query, params } = request;

    // Generate correlation ID if not present
    const correlationId = (headers['x-correlation-id'] as string) || uuidv4();

    // Add correlation ID to response headers
    response.setHeader('x-correlation-id', correlationId);

    // Extract user info if available
    const user = (request as any).user;
    const userId = user?.sub || user?.id;
    const organizationId = user?.organizationId;

    // Set logging context
    this.logger.setContext({
      correlationId,
      userId,
      organizationId,
      requestId: uuidv4(),
      userAgent: headers['user-agent'],
      ip: request.ip || request.connection.remoteAddress,
      method,
      url,
    });

    const startTime = Date.now();

    // Log request
    this.logger.debug('Incoming Request', 'HTTP', {
      method,
      url,
      query,
      params,
      body: this.sanitizeRequestBody(body),
      headers: this.sanitizeHeaders(headers),
      userId,
    });

    return next.handle().pipe(
      tap((responseData) => {
        const responseTime = Date.now() - startTime;
        const { statusCode } = response;

        // Log successful response
        this.logger.logRequest(
          method,
          url,
          statusCode,
          responseTime,
          headers['user-agent'] as string,
          request.ip,
          userId,
        );

        // Log response for debugging (be careful with sensitive data)
        this.logger.debug('Outgoing Response', 'HTTP', {
          statusCode,
          responseTime,
          responseSize: JSON.stringify(responseData).length,
        });
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Log error response
        this.logger.logRequest(
          method,
          url,
          statusCode,
          responseTime,
          headers['user-agent'] as string,
          request.ip,
          userId,
        );

        // Log error details
        this.logger.error('Request Error', error.stack, 'HTTP', {
          method,
          url,
          statusCode,
          responseTime,
          errorMessage: error.message,
          userId,
        });

        throw error;
      }),
    );
  }

  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'authorization'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private sanitizeHeaders(headers: any): any {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
