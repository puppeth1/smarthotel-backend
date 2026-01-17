import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import * as admin from 'firebase-admin'

function initAdmin() {
  try {
    if (!admin.apps.length) {
      admin.initializeApp()
    }
  } catch {}
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor() {
    initAdmin()
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest()
    const auth = req.headers?.authorization as string | undefined
    if (!auth || !auth.startsWith('Bearer ')) throw new UnauthorizedException()
    const token = auth.slice('Bearer '.length)
    try {
      const decoded = await admin.auth().verifyIdToken(token)
      req.user = { id: decoded.uid, email: decoded.email }
      return true
    } catch (error) {
      console.error('Firebase Auth Verification Error:', error)
      throw new UnauthorizedException()
    }
  }
}

