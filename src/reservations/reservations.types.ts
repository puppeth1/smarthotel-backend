export interface Reservation {
  id: string;
  hotel_id: string;
  guest_name: string;
  phone?: string;
  email?: string;
  room_type: string;
  room_number?: string;
  check_in: string; // ISO date string YYYY-MM-DD
  check_out: string; // ISO date string YYYY-MM-DD
  nights: number;
  price_per_night: number;
  source: string;
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED' | 'CHECKED_IN' | 'COMPLETED';
  payment_status?: 'PAID' | 'PARTIAL' | 'NOT_PAID';
  notes?: string;
  created_at: number;
}
