import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    return !!req.headers['x-tenant-id']
  }
}
