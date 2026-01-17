import { Module } from '@nestjs/common'

import { AgentsModule } from './agents/agents.module'
import { RoomsModule } from './rooms/rooms.module'
import { InventoryModule } from './inventory/inventory.module'
import { MenuModule } from './menu/menu.module'
import { OrdersModule } from './orders/orders.module'
import { BillingModule } from './billing/billing.module'
import { TeamModule } from './team/team.module'
import { HotelsModule } from './hotels/hotels.module'
import { DashboardModule } from './dashboard/dashboard.module'
import { IntegrationsModule } from './integrations/integrations.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { ReservationsModule } from './reservations/reservations.module'
import { SubscriptionsModule } from './subscriptions/subscriptions.module'

@Module({
  imports: [
    AgentsModule,
    RoomsModule,
    InventoryModule,
    MenuModule,
    OrdersModule,
    BillingModule,
    TeamModule,
    HotelsModule,
    DashboardModule,
    IntegrationsModule,
    AuthModule,
    UsersModule,
    ReservationsModule,
    SubscriptionsModule,
      ],
})
export class AppModule {}
