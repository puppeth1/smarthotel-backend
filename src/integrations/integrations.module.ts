import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappAccountsService } from './whatsapp-accounts.service';
import { WhatsappAccountsController } from './whatsapp-accounts.controller';
import { HotelsModule } from '../hotels/hotels.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [HotelsModule, AuthModule, UsersModule],
  providers: [WhatsappService, WhatsappAccountsService],
  controllers: [WhatsappController, WhatsappAccountsController],
  exports: [WhatsappService, WhatsappAccountsService],
})
export class IntegrationsModule {}
