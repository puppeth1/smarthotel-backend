import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    const roles = req.user?.roles || []
    return Array.isArray(roles)
  }
}
