import { Module } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { HotelSettingsService } from './hotel-settings.service';
import { HotelsController, HotelSettingsController } from './hotels.controller';
import { HotelSettingsController as HotelInfoController } from './hotel-settings.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsersModule, AuthModule],
  providers: [HotelsService, HotelSettingsService],
  controllers: [HotelsController, HotelSettingsController, HotelInfoController],
  exports: [HotelsService, HotelSettingsService],
})
export class HotelsModule {}
