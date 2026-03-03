import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any[] | undefined;

    let extra: Record<string, any> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object') {
        const resp = exResponse as any;
        message = resp.message || message;
        errors = Array.isArray(resp.message) ? resp.message : undefined;
        if (errors) {
          message = 'Validation failed';
        }
        // Forward additional fields (e.g. attemptsRemaining, minutesLeft)
        const { message: _m, statusCode: _s, error: _e, ...rest } = resp;
        extra = rest;
      }
    } else {
      this.logger.error('Unhandled exception', exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(errors && { errors }),
      ...extra,
      timestamp: new Date().toISOString(),
    });
  }
}
