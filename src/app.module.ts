import { Module } from '@nestjs/common'

import { AgentsModule } from './agents/agents.module'
import { RoomsModule } from './rooms/rooms.module'
import { InventoryModule } from './inventory/inventory.module'
import { MenuModule } from './menu/menu.module'
import { OrdersModule } from './orders/orders.module'
import { BillingModule } from './billing/billing.module'
import { TeamModule } from './team/team.module'

@Module({
  imports: [
    AgentsModule,
    RoomsModule,
    InventoryModule,
    MenuModule,
    OrdersModule,
    BillingModule,
    TeamModule,
  ],
})
export class AppModule {}

