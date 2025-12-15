import { Controller, Get } from '@nestjs/common'
import { OrdersService } from './orders.service'

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  listOrders() {
    return { status: 'success', data: this.ordersService.listOrders() }
  }
}
