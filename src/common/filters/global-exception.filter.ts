import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../services/logger.service';

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | object;
  correlationId?: string;
  error?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = request.headers['x-correlation-id'] as string;

    let status: number;
    let message: string | object;
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else {
        message = (exceptionResponse as any).message || exceptionResponse;
        error = (exceptionResponse as any).error || exception.name;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = exception.name;

      // Log the full error for internal server errors
      this.logger.error(
        'Unhandled Exception',
        exception.stack,
        'GlobalExceptionFilter',
        {
          name: exception.name,
          message: exception.message,
          url: request.url,
          method: request.method,
          userAgent: request.headers['user-agent'],
          ip: request.ip,
          correlationId,
        },
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Unknown';

      this.logger.error(
        'Unknown Exception',
        String(exception),
        'GlobalExceptionFilter',
        {
          exception: String(exception),
          url: request.url,
          method: request.method,
          correlationId,
        },
      );
    }

    // Log all errors except 404s and other client errors we don't care about
    if (
      status >= 500 ||
      (status >= 400 && status < 500 && this.shouldLogClientError(status))
    ) {
      this.logger.error(
        `HTTP ${status} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
        'HTTP',
        {
          statusCode: status,
          url: request.url,
          method: request.method,
          userAgent: request.headers['user-agent'],
          ip: request.ip,
          correlationId,
          userId: (request as any).user?.sub,
        },
      );
    }

    // Security logging for suspicious activities
    if (this.isSuspiciousError(status, request)) {
      this.logger.logSecurity('suspicious_activity', {
        statusCode: status,
        url: request.url,
        method: request.method,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        correlationId,
      });
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
    };

    if (correlationId) {
      errorResponse.correlationId = correlationId;
    }

    response.status(status).json(errorResponse);
  }

  private shouldLogClientError(status: number): boolean {
    // Log authentication/authorization errors
    if (status === 401 || status === 403) return true;

    // Log validation errors in development
    if (status === 422 && process.env.NODE_ENV === 'development') return true;

    return false;
  }

  private isSuspiciousError(status: number, request: Request): boolean {
    // Multiple failed authentication attempts
    if (status === 401) return true;

    // Unauthorized access attempts
    if (status === 403) return true;

    // Attempts to access non-existent resources that might be probing
    if (status === 404 && this.isProbeAttempt(request.url)) return true;

    return false;
  }

  private isProbeAttempt(url: string): boolean {
    const suspiciousPatterns = [
      '/admin',
      '/wp-admin',
      '/phpmyadmin',
      '/.env',
      '/config',
      '/api/v1/admin',
    ];

    return suspiciousPatterns.some((pattern) =>
      url.toLowerCase().includes(pattern.toLowerCase()),
    );
  }
}
