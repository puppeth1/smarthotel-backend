import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { Reservation } from './reservations.types';
import { RoomsService } from '../rooms/rooms.service';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class ReservationsService {
  private reservations: Reservation[] = [];

  constructor(
    private readonly roomsService: RoomsService,
    @Inject(forwardRef(() => BillingService))
    private readonly billingService: BillingService
  ) {}

  findAll(hotelId: string) {
    return this.reservations.filter(r => r.hotel_id === hotelId);
  }

  findActive(hotelId: string, roomNumber?: string) {
    return this.reservations.filter(r => {
      if (r.hotel_id !== hotelId) return false;
      if (!['CHECKED_IN', 'CONFIRMED'].includes(r.status)) return false;
      if (roomNumber && r.room_number !== roomNumber) return false;
      return true;
    });
  }

  create(data: any, hotelId: string) {
    console.log('--- DEBUG RESERVATION CREATE ---')
    console.log('Received Data:', data)
    
    // Map camelCase payload (from Save Check-In) to snake_case (internal model)
    const mappedData: Partial<Reservation> = {
      guest_name: data.guestName || data.guest_name,
      room_number: data.roomId || data.room_number,
      room_type: data.roomType || data.room_type,
      phone: data.phone,
      email: data.email,
      check_in: data.checkIn || data.check_in,
      check_out: data.checkOut || data.check_out,
      nights: data.nights || 1, // Default to 1 if missing,
      price_per_night: data.pricePerNight || data.price_per_night,
      source: data.source || 'WALK_IN',
      status: data.status || 'CHECKED_IN', // Default to CHECKED_IN for this flow if not specified
      notes: data.notes,
      guest_count: data.guestCount || data.guest_count || 1,
      total_price: data.totalPrice || data.total_price || ((data.pricePerNight || 0) * (data.nights || 1)),
      id_proof: data.idProof || data.id_proof,
      payment_status: (data.paymentStatus || data.payment_status || 'NOT_PAID').toUpperCase(),
      payment_amount: data.paymentAmount || data.payment_amount,
      payment_method: data.paymentMethod || data.payment_method,
    };

    console.log('Mapped Payment Status:', mappedData.payment_status)
    console.log('Mapped Payment Amount:', mappedData.payment_amount)
    console.log('------------------------------')

    // Basic validation
    if (mappedData.room_number) {
      const hasOverlap = this.checkOverlap(mappedData.room_number, mappedData.check_in!, mappedData.check_out!, hotelId);
      if (hasOverlap) {
        throw new BadRequestException('Room is already booked for these dates');
      }
    }

    const reservation: Reservation = {
      ...(mappedData as Reservation), // Type assertion since we mapped fields
      id: `res_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      hotel_id: hotelId,
      created_at: Date.now(),
    };
    this.reservations.push(reservation);

    // Sync Booking → Room Management (REQUIRED)
    // If status is CHECKED_IN, update room status to OCCUPIED
    if (reservation.status === 'CHECKED_IN' && reservation.room_number) {
      this.roomsService.updateRoomStatus(reservation.room_number, 'OCCUPIED', hotelId);

      // --- CREATE INVOICE FOR BOOKING ---
      // This ensures Dashboard Revenue/Stats are updated immediately
      // ALWAYS create an invoice, even if not paid yet.
      const amountToPay = mappedData.total_price || 0;
      let amountPaid = 0;
      let method = 'CASH';

      if (mappedData.payment_status && mappedData.payment_status !== 'NOT_PAID') {
          // Determine amount paid
          if (mappedData.payment_status === 'PAID') {
              amountPaid = amountToPay;
          } else if (mappedData.payment_status === 'PARTIAL') {
              amountPaid = Number(mappedData.payment_amount) || 0;
          }
          
          // If explicitly provided (overrides above logic if valid)
          if (typeof mappedData.payment_amount === 'number' && mappedData.payment_amount > 0) {
              amountPaid = mappedData.payment_amount;
          }

          method = (mappedData.payment_method as any) || 'CASH';
      }

      this.billingService.createInvoiceForBooking({
          roomNumber: reservation.room_number,
          amount: amountToPay,
          payment: amountPaid > 0 ? {
              method: method as any,
              amount: amountPaid
          } : undefined,
          hotelId,
          guestName: reservation.guest_name
      }).catch(err => console.error('Failed to auto-create invoice', err));

    }

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

  findById(id: string, hotelId: string) {
    return this.reservations.find(r => r.id === id && r.hotel_id === hotelId);
  }

  complete(id: string, hotelId: string) {
    const res = this.reservations.find(r => r.id === id && r.hotel_id === hotelId);
    if (!res) throw new BadRequestException('Reservation not found');
    
    res.status = 'COMPLETED';
    
    // Mark room as VACANT
    if (res.room_number) {
        this.roomsService.updateRoomStatus(res.room_number, 'VACANT', hotelId);
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
