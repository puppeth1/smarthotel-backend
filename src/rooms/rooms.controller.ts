import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { RoomsService } from './rooms.service'
import { FirebaseAuthGuard } from '../auth/firebase.guard'
import { UsersService } from '../users/users.service'

@UseGuards(FirebaseAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService, private readonly users: UsersService) {}

  @Get()
  listRooms(@Req() req: Request) {
    const uid = (req as any).user?.id
    const hid = uid ? this.users.getHotelForUser(uid) || undefined : undefined
    return { status: 'success', data: this.roomsService.listRooms(hid) }
  }
}
