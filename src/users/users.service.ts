import { Injectable } from '@nestjs/common'

type UserHotel = { user_id: string; hotel_id: string; role: 'OWNER' | 'MANAGER' | 'KITCHEN' }

@Injectable()
export class UsersService {
  private byUser: Record<string, UserHotel> = {}

  linkOwner(user_id: string, hotel_id: string) {
    this.byUser[user_id] = { user_id, hotel_id, role: 'OWNER' }
    return this.byUser[user_id]
  }

  getHotelForUser(user_id: string): string | null {
    return this.byUser[user_id]?.hotel_id || null
  }
}

