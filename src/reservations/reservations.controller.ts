import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { Tenant } from '../common/decorators/tenant.decorator';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  findAll(@Tenant() tenantId: string) {
    return this.reservationsService.findAll(tenantId || 'hotel_default');
  }

  @Post()
  create(@Body() body: any, @Tenant() tenantId: string) {
    return this.reservationsService.create(body, tenantId || 'hotel_default');
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Tenant() tenantId: string) {
    return this.reservationsService.update(id, body, tenantId || 'hotel_default');
  }

  @Post(':id/checkin')
  checkIn(@Param('id') id: string, @Tenant() tenantId: string) {
    return this.reservationsService.checkIn(id, tenantId || 'hotel_default');
  }
}
