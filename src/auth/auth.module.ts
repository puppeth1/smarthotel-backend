import { Module } from '@nestjs/common'
import { FirebaseAuthGuard } from './firebase.guard'

@Module({
  providers: [FirebaseAuthGuard],
  exports: [FirebaseAuthGuard],
})
export class AuthModule {}
