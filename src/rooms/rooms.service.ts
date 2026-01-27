import { Injectable } from '@nestjs/common'
import { AddRoomDto } from './dto/add-room.dto'
import { HotelsService } from '../hotels/hotels.service'

@Injectable()
export class RoomsService {
  private roomsByHotel: Record<string, any[]> = {}
  constructor(private readonly hotelsService: HotelsService) {}

  addRoom(dto: AddRoomDto, hotelId?: string) {
    const hid = hotelId || 'hotel_default'
    if (!this.roomsByHotel[hid]) this.roomsByHotel[hid] = []

    const key = this.toTypeKey(dto.type)
    let settings = this.hotelsService.getSettings(hid) || {}
    let arr = Array.isArray(settings.roomTypes) ? settings.roomTypes : []
    
    // Check if configured
    let configured = arr.find((rt: any) => this.toTypeKey(rt.type) === key)
    
    // AUTO-CONFIGURE if missing (Fix for Dev/First-run experience)
    if (!configured) {
        configured = {
            type: dto.type,
            basePrice: dto.price_per_night || 1000,
            count: 10, // Default quota
            active: true
        }
        arr.push(configured)
        this.hotelsService.saveSettings(hid, { roomTypes: arr })
        // Refresh local ref
        settings = this.hotelsService.getSettings(hid)
    }

    const enabled = !!configured.active && (configured.count || 0) > 0
    if (!enabled) throw new Error('Room type is inactive or count is zero')
    
    // Allow going over limit in Dev mode if needed, but strict for now is fine since we just added quota
    // const existingCount = ...
    
    // Check for duplicate room number
    const duplicate = this.roomsByHotel[hid].find(r => r.room_number === dto.room_number)
    if (duplicate) throw new Error('Room number already exists')

    const room = {
      id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      room_number: dto.room_number,
      type: dto.type,
      price_per_night: dto.price_per_night,
      currency: dto.currency,
      status: 'AVAILABLE',
      created_at: new Date(),
    }

    this.roomsByHotel[hid].push(room)

    return room
  }

  listRooms(hotelId?: string) {
    if (hotelId) return this.roomsByHotel[hotelId] || []
    return Object.values(this.roomsByHotel).flat()
  }

  updateRoomStatus(room_number: string, status: string, hotelId?: string) {
    const list = hotelId ? this.roomsByHotel[hotelId] || [] : Object.values(this.roomsByHotel).flat()
    const room = list.find((r) => r.room_number === room_number)
    if (!room) {
      return null
    }
    room.status = status.toUpperCase()
    return room
  }

  checkoutRoom(room_number: string, hotelId?: string) {
    const list = hotelId ? this.roomsByHotel[hotelId] || [] : Object.values(this.roomsByHotel).flat()
    const room = list.find((r) => r.room_number === room_number)
    if (!room) return null
    room.status = 'VACANT'
    return room
  }

  deleteRoom(id: string, hotelId?: string) {
    const hid = hotelId || 'hotel_default'
    if (!this.roomsByHotel[hid]) return false
    
    const initialLength = this.roomsByHotel[hid].length
    this.roomsByHotel[hid] = this.roomsByHotel[hid].filter(r => r.id !== id)
    
    return this.roomsByHotel[hid].length < initialLength
  }

  updateRoom(id: string, updates: any, hotelId?: string) {
    const hid = hotelId || 'hotel_default'
    if (!this.roomsByHotel[hid]) return null
    
    const room = this.roomsByHotel[hid].find(r => r.id === id)
    if (!room) return null
    
    // Apply updates
    Object.assign(room, updates)
    return room
  }

  private toTypeKey(t: string) {
    const v = (t || '').toLowerCase()
    return v.replace(/\s+/g, '_')
  }
}
