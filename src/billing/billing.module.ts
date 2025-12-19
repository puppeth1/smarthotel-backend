
import { Module } from '@nestjs/common'
import { BillingService } from './billing.service'
import { BillingController } from './billing.controller'
import { CheckoutController } from './checkout.controller'
import { HotelsModule } from '../hotels/hotels.module'
import { OrdersModule } from '../orders/orders.module'
import { RoomsModule } from '../rooms/rooms.module'
import { UsersModule } from '../users/users.module'
import { PdfService } from './pdf.service'
import { StorageService } from './storage.service'

@Module({
  imports: [HotelsModule, OrdersModule, RoomsModule, UsersModule],
  providers: [BillingService, PdfService, StorageService],
  controllers: [BillingController, CheckoutController],
  exports: [BillingService],
})
export class BillingModule {}
