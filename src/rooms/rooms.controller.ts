import { Controller, Get } from '@nestjs/common'
import { RoomsService } from './rooms.service'

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  listRooms() {
    return { status: 'success', data: this.roomsService.listRooms() }
  }
}
