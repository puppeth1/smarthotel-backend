import { Injectable, Logger } from '@nestjs/common';
import { HotelsService } from '../hotels/hotels.service';
import { WhatsappAccountsService } from './whatsapp-accounts.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private readonly hotelsService: HotelsService, private readonly accounts: WhatsappAccountsService) {}

  async sendMessage(hotelId: string, type: 'invoice' | 'payment_reminder' | 'booking_confirmation' | 'checkout_thanks', payload: any) {
    const settings = this.hotelsService.getSettings(hotelId);
    const wa = settings?.whatsapp;

    // Connection state check
    const acc = this.accounts.get(hotelId || 'hotel_default');
    if (!acc || acc.status !== 'CONNECTED') {
      this.logger.warn(`WhatsApp not connected for hotel ${hotelId}`);
      return { sent: false, reason: 'not_connected' };
    }

    if (!wa || !wa.enabled) {
      this.logger.log(`WhatsApp disabled for hotel ${hotelId}`);
      return { sent: false, reason: 'disabled' };
    }

    if (!wa.message_types?.[type]) {
      this.logger.log(`WhatsApp message type ${type} disabled for hotel ${hotelId}`);
      return { sent: false, reason: 'type_disabled' };
    }

    const quota = wa.monthly_quota || 300;
    const used = wa.used_this_month || 0;

    // Simulate sending (replace with actual provider later)
    // Construct message from template
    let message = wa.default_template || "Thank you for staying at {{hotel_name}}.\nYour invoice {{invoice_no}} of ₹{{amount}}\nis attached.";
    
    // Simple variable substitution
    if (payload) {
      Object.keys(payload).forEach(key => {
        message = message.replace(new RegExp(`{{${key}}}`, 'g'), payload[key]);
      });
    }

    this.logger.log(`[WhatsApp] Sending to ${wa.display_number}: ${message}`);
    
    // Increment usage
    const newUsed = used + 1;
    const overLimit = newUsed > quota;
    
    // Update settings
    // We need to be careful to preserve other whatsapp settings
    const newWa = {
        ...wa,
        used_this_month: newUsed,
    };
    
    this.hotelsService.saveSettings(hotelId, { whatsapp: newWa });
    
    return { sent: true, used: newUsed, overLimit };
  }
}
