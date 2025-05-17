import {
  Catch,
  HttpException,
  Logger,
  RpcExceptionFilter,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class MicroServiceExceptionFilter
  implements RpcExceptionFilter<RpcException>
{
  catch(exception: RpcException): Observable<any> {
    const error = exception.getError() as HttpException;

    Logger.error({
      timestamp: Date.now(),
      message: error.message,
      statusCode: error.getStatus(),
      stack: error.stack,
    });

    return throwError(() => error);
  }
}
