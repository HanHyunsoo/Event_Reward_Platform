import {
  Catch,
  HttpException,
  InternalServerErrorException,
  Logger,
  RpcExceptionFilter,
  ArgumentsHost,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException, TcpContext } from '@nestjs/microservices';

@Catch()
export class MicroServiceExceptionFilter implements RpcExceptionFilter<any> {
  catch(exception: any, host: ArgumentsHost): Observable<any> {
    let error: any;

    const ctx = host.switchToRpc();
    const msgPattern = ctx.getContext<TcpContext>().getPattern();

    if (!(exception instanceof RpcException)) {
      if (exception instanceof HttpException) {
        error = exception;
      } else {
        error = new InternalServerErrorException(
          (exception as Error).message || 'Internal server error',
        );
      }
    } else {
      error = exception.getError() as HttpException;
    }

    Logger.error({
      timestamp: Date.now(),
      statusCode: error instanceof HttpException ? error.getStatus() : 500,
      msgPattern,
      message: (error as Error).message || 'Unknown error',
      stack: (error as Error).stack,
    });

    return throwError(() => error as HttpException);
  }
}
