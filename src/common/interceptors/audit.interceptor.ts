import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, tap } from 'rxjs'

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()
    return next.handle().pipe(
      tap(() => {
        void req
      }),
    )
  }
}
