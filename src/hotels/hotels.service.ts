import { Injectable } from '@nestjs/common'

@Injectable()
export class HotelsService {
  private hotels: any[] = []

  addHotel(owner_actor_id: string, name: string) {
    const hotel = { id: `hotel_${this.hotels.length + 1}`, name, owner_actor_id, created_at: new Date() }
    this.hotels.push(hotel)
    return hotel
  }

  listHotelsByOwner(owner_actor_id: string) {
    return this.hotels.filter((h) => h.owner_actor_id === owner_actor_id)
  }

  getById(hotel_id: string) {
    return this.hotels.find((h) => h.id === hotel_id) || null
  }
}
