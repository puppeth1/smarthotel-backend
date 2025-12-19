import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { WhatsappService } from './whatsapp.service';
import { FirebaseAuthGuard } from '../auth/firebase.guard';
import { UsersService } from '../users/users.service';

@UseGuards(FirebaseAuthGuard)
@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly users: UsersService
  ) {}

  @Post('send')
  async send(@Body() body: { type: any; payload: any }, @Req() req: Request) {
    const uid = (req as any).user?.id;
    const hid = uid ? this.users.getHotelForUser(uid) : 'hotel_default';
    return this.whatsappService.sendMessage(hid || 'hotel_default', body.type, body.payload);
  }
}
