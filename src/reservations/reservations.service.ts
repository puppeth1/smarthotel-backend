import { Injectable, BadRequestException } from '@nestjs/common';
import { Reservation } from './reservations.types';
import { RoomsService } from '../rooms/rooms.service';

@Injectable()
export class ReservationsService {
  private reservations: Reservation[] = [];

  constructor(private readonly roomsService: RoomsService) {}

  findAll(hotelId: string) {
    return this.reservations.filter(r => r.hotel_id === hotelId);
  }

  create(data: Omit<Reservation, 'id' | 'created_at' | 'hotel_id'>, hotelId: string) {
    // Basic validation
    if (data.room_number) {
      const hasOverlap = this.checkOverlap(data.room_number, data.check_in, data.check_out, hotelId);
      if (hasOverlap) {
        throw new BadRequestException('Room is already booked for these dates');
      }
    }

    const reservation: Reservation = {
      ...data,
      id: `res_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      hotel_id: hotelId,
      created_at: Date.now(),
    };
    this.reservations.push(reservation);
    return reservation;
  }

  update(id: string, data: Partial<Reservation>, hotelId: string) {
    const idx = this.reservations.findIndex(r => r.id === id && r.hotel_id === hotelId);
    if (idx === -1) throw new BadRequestException('Reservation not found');

    const existing = this.reservations[idx];
    
    // If room or dates changed, check overlap
    if ((data.room_number && data.room_number !== existing.room_number) || 
        (data.check_in && data.check_in !== existing.check_in) || 
        (data.check_out && data.check_out !== existing.check_out)) {
      
      const room = data.room_number || existing.room_number;
      const start = data.check_in || existing.check_in;
      const end = data.check_out || existing.check_out;
      
      if (room) {
         const hasOverlap = this.checkOverlap(room, start, end, hotelId, id);
         if (hasOverlap) throw new BadRequestException('Room overlap detected');
      }
    }

    this.reservations[idx] = { ...existing, ...data };
    return this.reservations[idx];
  }

  checkIn(id: string, hotelId: string) {
    const res = this.reservations.find(r => r.id === id && r.hotel_id === hotelId);
    if (!res) throw new BadRequestException('Reservation not found');
    if (res.status === 'CHECKED_IN') throw new BadRequestException('Already checked in');
    if (!res.room_number) throw new BadRequestException('Assign a room before checking in');

    // Update reservation status
    res.status = 'CHECKED_IN';
    
    const room = this.roomsService.updateRoomStatus(res.room_number, 'OCCUPIED', hotelId);
    if (room) {
        // Mocking guest info attachment
        (room as any).guest_name = res.guest_name;
        (room as any).current_reservation_id = res.id;
    }

    return res;
  }

  private checkOverlap(roomNumber: string, start: string, end: string, hotelId: string, excludeId?: string) {
    const s1 = new Date(start).getTime();
    const e1 = new Date(end).getTime();

    return this.reservations.some(r => {
      if (r.hotel_id !== hotelId) return false;
      if (r.id === excludeId) return false;
      if (r.room_number !== roomNumber) return false;
      if (r.status === 'CANCELLED') return false;

      const s2 = new Date(r.check_in).getTime();
      const e2 = new Date(r.check_out).getTime();

      return s1 < e2 && e1 > s2;
    });
  }
}
