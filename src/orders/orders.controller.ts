import { Controller, Get, UseGuards, Req } from '@nestjs/common'
import type { Request } from 'express'
import { OrdersService } from './orders.service'
import { FirebaseAuthGuard } from '../auth/firebase.guard'
import { UsersService } from '../users/users.service'

@UseGuards(FirebaseAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService, private readonly users: UsersService) {}

  @Get()
  listOrders(@Req() req: Request) {
    const uid = (req as any).user?.id
    const hid = (uid ? this.users.getHotelForUser(uid) : undefined) || undefined
    return { status: 'success', data: this.ordersService.listOrders(hid) }
  }
}
