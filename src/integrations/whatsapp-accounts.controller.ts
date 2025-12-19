import { Controller, Get, Post, Query, Body, UseGuards, Req } from '@nestjs/common'
import type { Request } from 'express'
import { WhatsappAccountsService } from './whatsapp-accounts.service'
import { FirebaseAuthGuard } from '../auth/firebase.guard'
import { UsersService } from '../users/users.service'

@UseGuards(FirebaseAuthGuard)
@Controller('integrations/whatsapp')
export class WhatsappAccountsController {
  constructor(
    private readonly accounts: WhatsappAccountsService,
    private readonly users: UsersService
  ) {}

  @Get('account')
  getAccount(@Req() req: Request) {
    const uid = (req as any).user?.id
    const hid = uid ? this.users.getHotelForUser(uid) : null
    const acc = this.accounts.get(hid || 'hotel_default')
    return { status: 'success', data: acc }
  }

  @Post('connect')
  connect(@Body() body: { phone_number: string }, @Req() req: Request) {
    const uid = (req as any).user?.id
    const hid = uid ? this.users.getHotelForUser(uid) : 'hotel_default'
    const acc = this.accounts.connect(hid || 'hotel_default', body.phone_number)
    return { status: 'success', data: acc }
  }

  @Post('disconnect')
  disconnect(@Req() req: Request) {
    const uid = (req as any).user?.id
    const hid = uid ? this.users.getHotelForUser(uid) : 'hotel_default'
    const acc = this.accounts.disconnect(hid || 'hotel_default')
    return { status: acc ? 'success' : 'error', data: acc }
  }
}

