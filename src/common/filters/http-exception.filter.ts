import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    // 예외 스택을 항상 로그에 남깁니다
    if (exception instanceof Error) {
      this.logger.error(exception.stack);
    } else {
      this.logger.error(JSON.stringify(exception));
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res    = exception.getResponse();
      let message: string;

      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object' && 'message' in res) {
        message = (res as { message: string }).message;
      } else {
        message = 'An error occurred';
      }

      return response.status(status).json({
        success:    false,
        statusCode: status,
        message,
        timestamp:  new Date().toISOString(),
        path:       request.url,
      });
    }

    // 그 외
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success:    false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message:    'Internal server error',
      timestamp:  new Date().toISOString(),
      path:       request.url,
    });
  }
}
