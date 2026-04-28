import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class HttpExceptionFilter implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((err) => {
        if (err instanceof HttpException) {
          const response = err.getResponse();
          if (typeof response === 'object' && 'code' in response) {
            return throwError(() => err);
          }
        }
        return throwError(() => err);
      }),
    );
  }
}
