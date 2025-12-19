import { Injectable } from '@nestjs/common'
import geoip from 'geoip-lite'
import { COUNTRY_CURRENCY_MAP, DEFAULT_CURRENCY } from '../common/currency.map'

@Injectable()
export class HotelsService {
  private hotels: any[] = []
  private activeHotelId: string = 'hotel_default'
  private settingsByHotelId: Record<string, any> = {}

  addHotel(owner_actor_id: string, name: string, ip?: string) {
    const geo = ip ? (geoip.lookup(ip) as any) : null
    const country = (geo?.country as string) || 'US'
    const currency = COUNTRY_CURRENCY_MAP[country] || DEFAULT_CURRENCY
    const timezone = (geo?.timezone as string) || 'UTC'

    const hotel = {
      id: `hotel_${Date.now()}`,
      name,
      owner_actor_id,
      country,
      currency,
      timezone,
      created_at: new Date(),
    }
    this.hotels.push(hotel)
    return hotel
  }

  listHotelsByOwner(owner_actor_id: string) {
    return this.hotels.filter((h) => h.owner_actor_id === owner_actor_id)
  }

  getById(hotel_id: string) {
    return this.hotels.find((h) => h.id === hotel_id) || null
  }

  getActive() {
    const existing = this.hotels.find((h) => h.id === this.activeHotelId)
    if (existing) return existing
    const def = { id: this.activeHotelId, name: 'SmartHotel', country: 'US', currency: DEFAULT_CURRENCY, timezone: 'UTC' }
    return def
  }

  updateHotelName(hotel_id: string, name: string) {
    const h = this.hotels.find((x) => x.id === hotel_id)
    if (h) h.name = name
    return this.getById(hotel_id) || { id: hotel_id, name }
  }

  getSettings(hotel_id: string) {
    const s = this.settingsByHotelId[hotel_id]
    return s || null
  }

  saveSettings(hotel_id: string, payload: any) {
    const prev = this.settingsByHotelId[hotel_id] || {}
    const next = { ...prev, ...payload }
    if (typeof next.nextInvoiceNumber !== 'number') next.nextInvoiceNumber = prev.nextInvoiceNumber ?? 1
    this.settingsByHotelId[hotel_id] = next
    return next
  }
}
