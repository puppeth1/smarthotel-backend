import { Module } from '@nestjs/common'
import { DashboardService } from './dashboard.service'
import { DashboardController } from './dashboard.controller'
import { RoomsModule } from '../rooms/rooms.module'
import { BillingModule } from '../billing/billing.module'
import { OrdersModule } from '../orders/orders.module'
import { HotelsModule } from '../hotels/hotels.module'

@Module({
  imports: [RoomsModule, BillingModule, OrdersModule, HotelsModule],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
