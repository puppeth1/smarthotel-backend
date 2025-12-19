import { Module } from '@nestjs/common'
import { RoomsService } from './rooms.service'
import { RoomsController } from './rooms.controller'
import { HotelsModule } from '../hotels/hotels.module'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [HotelsModule, UsersModule],
  providers: [RoomsService],
  controllers: [RoomsController],
  exports: [RoomsService],
})
export class RoomsModule {}
