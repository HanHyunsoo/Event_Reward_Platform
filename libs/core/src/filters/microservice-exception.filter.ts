import {
  Catch,
  HttpException,
  InternalServerErrorException,
  Logger,
  RpcExceptionFilter,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class MicroServiceExceptionFilter implements RpcExceptionFilter<any> {
  catch(exception: any): Observable<any> {
    let error: any;

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
      message: (error as Error).message || 'Unknown error',
      statusCode: error instanceof HttpException ? error.getStatus() : 500,
      stack: (error as Error).stack,
    });

    return throwError(() => error as HttpException);
  }
}
