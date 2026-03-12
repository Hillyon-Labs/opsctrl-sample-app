import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get or generate correlation ID
    const correlationId = request.headers['x-correlation-id'] || uuidv4();

    // Add correlation ID to request and response
    request.correlationId = correlationId;
    response.setHeader('x-correlation-id', correlationId);

    // Set correlation context for this request
    return this.logger.withContext({ correlationId }, () => next.handle());
  }
}
