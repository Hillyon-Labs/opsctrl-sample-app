import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';
import {
  LOG_PERFORMANCE_KEY,
  PerformanceMetadata,
} from '../decorators/log-performance.decorator';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggerService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const performanceMetadata = this.reflector.get<PerformanceMetadata>(
      LOG_PERFORMANCE_KEY,
      context.getHandler(),
    );

    if (!performanceMetadata) {
      return next.handle();
    }

    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const shouldLog =
          performanceMetadata.alwaysLog ||
          (performanceMetadata.threshold &&
            duration > performanceMetadata.threshold);

        if (shouldLog) {
          this.logger.logPerformance({
            operation: performanceMetadata.operation,
            duration,
            success: true,
            metadata: {
              method: request.method,
              url: request.url,
              threshold: performanceMetadata.threshold,
            },
          });
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        this.logger.logPerformance({
          operation: performanceMetadata.operation,
          duration,
          success: false,
          metadata: {
            method: request.method,
            url: request.url,
            error: error.message,
            threshold: performanceMetadata.threshold,
          },
        });

        throw error;
      }),
    );
  }
}
