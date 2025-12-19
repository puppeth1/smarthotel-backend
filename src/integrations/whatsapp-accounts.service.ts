import { Injectable } from '@nestjs/common'

export interface WhatsappAccount {
  hotel_id: string
  phone_number: string
  status: 'CONNECTED' | 'DISCONNECTED'
  connected_at?: Date
}

@Injectable()
export class WhatsappAccountsService {
  private accounts: Record<string, WhatsappAccount> = {}

  get(hotelId: string): WhatsappAccount | null {
    return this.accounts[hotelId] || null
  }

  connect(hotelId: string, phoneNumber: string): WhatsappAccount {
    const acc: WhatsappAccount = {
      hotel_id: hotelId,
      phone_number: phoneNumber,
      status: 'CONNECTED',
      connected_at: new Date(),
    }
    this.accounts[hotelId] = acc
    return acc
  }

  disconnect(hotelId: string): WhatsappAccount | null {
    const acc = this.accounts[hotelId]
    if (!acc) return null
    acc.status = 'DISCONNECTED'
    return acc
  }
}

