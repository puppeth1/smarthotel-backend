import { Module, forwardRef } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { RoomsModule } from '../rooms/rooms.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [RoomsModule, forwardRef(() => BillingModule)],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
