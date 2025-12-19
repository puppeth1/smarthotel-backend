import { Module } from '@nestjs/common'
import { AgentController } from './agent.controller'
import { AgentService } from './agent.service'
import { RoomsModule } from '../rooms/rooms.module'
import { BillingModule } from '../billing/billing.module'
import { InventoryModule } from '../inventory/inventory.module'
import { MenuModule } from '../menu/menu.module'
import { OrdersModule } from '../orders/orders.module'
import { TeamModule } from '../team/team.module'
import { HotelsModule } from '../hotels/hotels.module'
import { DashboardModule } from '../dashboard/dashboard.module'

@Module({
  imports: [RoomsModule, BillingModule, InventoryModule, MenuModule, OrdersModule, TeamModule, HotelsModule, DashboardModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentsModule {}
