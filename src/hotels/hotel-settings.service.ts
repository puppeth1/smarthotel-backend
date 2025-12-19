import { Injectable } from '@nestjs/common';
import { HotelSettings } from './hotel-settings.types';

@Injectable()
export class HotelSettingsService {
  private settings = new Map<string, HotelSettings>();

  get(hotelId: string): HotelSettings | null {
    return this.settings.get(hotelId) || null;
  }

  save(hotelId: string, data: Omit<HotelSettings, 'hotelId' | 'updatedAt'>) {
    const payload: HotelSettings = {
      hotelId,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.settings.set(hotelId, payload);
    return payload;
  }
}
