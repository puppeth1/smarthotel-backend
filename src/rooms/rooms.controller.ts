import { Controller, Get, Delete, Put, Post, Param, Body, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common'
import type { Request } from 'express'
import { RoomsService } from './rooms.service'
import { FirebaseAuthGuard } from '../auth/firebase.guard'
import { UsersService } from '../users/users.service'

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService, private readonly users: UsersService) {}

  @Get()
  listRooms(@Req() req: Request) {
    const uid = (req as any).user?.id
    const hid = uid ? this.users.getHotelForUser(uid) || undefined : undefined
    return { status: 'success', data: this.roomsService.listRooms(hid) }
  }

  @Post()
  addRoom(@Body() body: any, @Req() req: Request) {
    const uid = (req as any).user?.id
    const hid = uid ? this.users.getHotelForUser(uid) || undefined : undefined
    try {
      const room = this.roomsService.addRoom(body, hid)
      return { status: 'success', data: room }
    } catch (e: any) {
      return { status: 'error', message: e.message }
    }
  }

  @Delete(':id')
  deleteRoom(@Param('id') id: string, @Req() req: Request) {
    const uid = (req as any).user?.id
    const hid = uid ? this.users.getHotelForUser(uid) || undefined : undefined
    const success = this.roomsService.deleteRoom(id, hid)
    if (!success) {
      throw new HttpException('Room not found or could not be deleted', HttpStatus.BAD_REQUEST)
    }
    return { status: 'success' }
  }

  @Put(':id')
  updateRoom(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    const uid = (req as any).user?.id
    const hid = uid ? this.users.getHotelForUser(uid) || undefined : undefined
    const room = this.roomsService.updateRoom(id, body, hid)
    if (!room) return { status: 'error', message: 'Room not found' }
    return { status: 'success', data: room }
  }
}
