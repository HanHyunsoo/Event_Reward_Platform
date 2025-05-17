import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

interface IRpcException {
  message: string;
  name: string;
  response: {
    error: string;
    message: string | string[];
    statusCode: number;
  };
  status: number;
}

@Catch()
export class GatewayExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: IRpcException, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus = exception.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception?.response?.message ?? 'Unknown error';

    const responseBody = {
      timestamp: Date.now(),
      statusCode: httpStatus,
      message,
      path: httpAdapter.getRequestUrl(ctx.getRequest()) as string,
    };

    Logger.error(responseBody);

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
