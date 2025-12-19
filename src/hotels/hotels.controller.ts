import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { HotelsService } from './hotels.service'
import { FirebaseAuthGuard } from '../auth/firebase.guard'
import { UsersService } from '../users/users.service'

@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotels: HotelsService, private readonly users: UsersService) {}

  @Get('active')
  active(@Req() req: Request) {
    const userId = (req as any).user?.id
    if (userId) {
      const hid = this.users.getHotelForUser(userId)
      if (hid) {
        const h = this.hotels.getById(hid)
        if (h) return { data: h }
      }
    }
    const h = this.hotels.getActive()
    return { data: h }
  }

  @UseGuards(FirebaseAuthGuard)
  @Post()
  addHotel(@Body('name') name: string, @Req() req: Request) {
    const forwarded = req.headers['x-forwarded-for'] as string | undefined
    const ip = forwarded?.split(',')[0]?.trim() || req.socket.remoteAddress || undefined
    const ownerId = (req as any).user?.id || 'u_owner'
    const h = this.hotels.addHotel(ownerId, name, ip)
    if (ownerId) this.users.linkOwner(ownerId, h.id)
    return { data: h }
  }

  @UseGuards(FirebaseAuthGuard)
  @Put(':id')
  updateName(@Param('id') id: string, @Body() body: any) {
    const n = typeof body?.name === 'string' ? body.name : ''
    const h = this.hotels.updateHotelName(id, n)
    return { data: h }
  }
}

@Controller('hotel')
@UseGuards(FirebaseAuthGuard)
export class HotelSettingsController {
  constructor(private readonly hotels: HotelsService, private readonly users: UsersService) {}

  @Get('settings')
  getSettings(@Req() req: Request) {
    const uid = (req as any).user?.id
    const hid = (uid && this.users.getHotelForUser(uid)) || this.hotels.getActive().id
    const s = this.hotels.getSettings(hid)
    return { data: s || {} }
  }

  @Post('settings')
  saveSettings(@Body() body: any, @Req() req: Request) {
    const uid = (req as any).user?.id
    const hid = (uid && this.users.getHotelForUser(uid)) || this.hotels.getActive().id
    const saved = this.hotels.saveSettings(hid, body || {})
    return { data: saved }
  }
}
