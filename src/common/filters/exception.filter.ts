import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { _500 } from '../constants/error.constant';

/**
 * This class will handle all exceptions thrown within the application — both Http and unexpected ones.
 */
@Catch()
export class AppExceptionFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {
    const isHttpException = exception instanceof HttpException;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // If headers have already been sent (e.g., after a redirect), don't try to send another response
    if (response.headersSent) {
      return;
    }

    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = !isHttpException
      ? _500.DEFAULT_500
      : exception.getResponse();

    return response.status(status).json(responseBody);
  }
}
