import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { HotelSettingsService } from './hotel-settings.service';
import { FirebaseAuthGuard } from '../auth/firebase.guard';
import { UsersService } from '../users/users.service';

@UseGuards(FirebaseAuthGuard)
@Controller('settings/hotel-info')
export class HotelSettingsController {
  constructor(private readonly service: HotelSettingsService, private readonly users: UsersService) {}

  @Get()
  getSettings(@Req() req: Request) {
    const uid = (req as any).user?.id as string | undefined;
    const hid = uid ? this.users.getHotelForUser(uid) || 'hotel_default' : 'hotel_default';
    return {
      status: 'success',
      data: this.service.get(hid),
    };
  }

  @Post()
  saveSettings(@Body() body: any, @Req() req: Request) {
    const uid = (req as any).user?.id as string | undefined;
    const hid = uid ? this.users.getHotelForUser(uid) || 'hotel_default' : 'hotel_default';
    const saved = this.service.save(hid, body);
    return {
      status: 'success',
      data: saved,
    };
  }
}
