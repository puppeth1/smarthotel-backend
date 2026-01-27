import { useState, useEffect, useCallback, useMemo, useContext } from 'react'
import { useHotel } from '@/components/HotelProvider'
import { AuthContext } from '@/components/AuthProvider'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smarthotel-backend-984031420056.asia-south1.run.app'

// --- Types ---

export type RoomStatus = 'VACANT' | 'OCCUPIED' | 'MAINTENANCE'

export interface Room {
  id: string
  room_number: string
  type: string // "Deluxe", "Standard", etc.
  type_id?: string
  base_price: number // mapped from price_per_night or basePrice
  price_per_night: number // API often returns this
  status: RoomStatus // Database status (persisted overrides like Maintenance)
  floor?: string
  is_active: boolean
  created_at?: string
  // Derived fields (computed on frontend)
  computed_status?: RoomStatus
  active_booking?: Booking | null
  capacity?: number
  display_price?: number
}

export interface Booking {
  id: string
  room_number: string // Linking via room_number mostly in this app
  room_id?: string
  guest_name: string
  check_in: string // ISO Date string
  check_out: string // ISO Date string
  status: 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'
  price_per_night?: number
  total_price?: number
  payment_status?: 'PAID' | 'PENDING' | 'PARTIAL'
  guest_count?: number
  phone?: string
  email?: string
  id_proof?: string // e.g. "Aadhaar: 1234..."
  notes?: string
}

// --- Helper: Date Check ---
const isDateOverlap = (date: Date, start: Date, end: Date) => {
  // Normalize to YYYY-MM-DD to avoid time issues
  const d = date.toISOString().split('T')[0]
  const s = start.toISOString().split('T')[0]
  const e = end.toISOString().split('T')[0]
  return d >= s && d < e // Standard hotel logic: check-in day counts, check-out day doesn't (usually)
  // But wait, if check-in is today, it's occupied.
  // If check-out is today, it becomes vacant AFTER checkout time.
  // For simplicity: [start, end)
}

// --- Hook ---

export function useRoomsEngine() {
  const { hotel } = useHotel()
  const { user } = useContext(AuthContext)
  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState(Date.now())
  const [initialized, setInitialized] = useState(false)

  // 1. Fetch Master Data
  const fetchData = useCallback(async () => {
    // Only show full loading state on first load
    if (!initialized) setLoading(true)
    
    setError(null)
    try {
      const headers: any = {}
      
      const t = Date.now()
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch(`/api/rooms?_t=${t}&limit=1000`, { headers }),
        fetch(`/api/bookings?_t=${t}&limit=1000`, { headers }) // Fetching large page to ensure we catch recent bookings
      ])

      const roomsData = await roomsRes.json()
      const bookingsData = await bookingsRes.json()

      console.log('Rooms Engine Refreshed:', { rooms: roomsData.data?.length, bookings: Array.isArray(bookingsData) ? bookingsData.length : bookingsData.data?.length })

      const rawRooms: Room[] = Array.isArray(roomsData.data) ? roomsData.data : []
      const rawBookings: Booking[] = Array.isArray(bookingsData) ? bookingsData : (bookingsData.data || [])

      setRooms(rawRooms)
      setBookings(rawBookings)
      setInitialized(true)
    } catch (err: any) {
      console.error("Rooms Engine Fetch Error:", err)
      setError(err.message || 'Failed to sync data')
    } finally {
      setLoading(false)
    }
  }, [initialized])

  // Initial Fetch & Event Listener
  useEffect(() => {
    // Only fetch if we haven't loaded yet
    if (!initialized) {
        fetchData()
    }

    // Listen for global refresh events (e.g. from CheckInDrawer)
    const onRefresh = () => {
        fetchData()
    }
    window.addEventListener('hp_refresh_stats', onRefresh)
    
    return () => {
        window.removeEventListener('hp_refresh_stats', onRefresh)
    }
  }, [fetchData, initialized])

  // 2. Compute Smart Status (The Core Logic)
  const smartRooms = useMemo(() => {
    const today = new Date()
    // Use local date instead of UTC to match user's wall clock
    const offset = today.getTimezoneOffset()
    const localToday = new Date(today.getTime() - (offset * 60 * 1000))
    const todayStr = localToday.toISOString().split('T')[0]

    return rooms.map(room => {
      // A. Find active booking for this room today
      // Filter candidates
      const activeBooking = bookings.find(b => {
        if (b.status === 'CANCELLED' || b.status === 'CHECKED_OUT') return false
        // Loose comparison for room numbers to handle string/number mismatches
        // console.log(`Comparing Room: "${room.room_number}" with Booking Room: "${b.room_number}"`)
        if (String(b.room_number).trim() !== String(room.room_number).trim()) return false

        const start = new Date(b.check_in)
        const end = new Date(b.check_out)
        
        // Check if today is within [check_in, check_out)
        // Or if status is specifically CHECKED_IN (active stay)
        if (b.status === 'CHECKED_IN') return true

        // If CONFIRMED, is it for today?
        const t = new Date(todayStr)
        const s = new Date(start.toISOString().split('T')[0])
        const e = new Date(end.toISOString().split('T')[0])
        
        const isOverlap = t >= s && t < e
        if (isOverlap) console.log(`Found Active Booking for Room ${room.room_number}:`, b)
        return isOverlap
      })

      // B. Determine Computed Status
      let computedStatus: RoomStatus = 'VACANT'

      if (activeBooking) {
        computedStatus = 'OCCUPIED'
      } else if (room.status === 'MAINTENANCE') {
        // Database override for maintenance
        computedStatus = 'MAINTENANCE'
      } else {
        computedStatus = 'VACANT'
      }

      // C. Smart Price & Capacity Sync (Synced with Settings)
      const settingsType = hotel?.settings?.roomTypes?.find(rt => rt.type === room.type)
      
      // Prefer room's specific price, fallback to settings price, fallback to base
      const displayPrice = room.price_per_night || room.base_price || settingsType?.basePrice || 0
      
      // Capacity from settings
      const capacity = settingsType?.maxGuests || 2

      return {
        ...room,
        computed_status: computedStatus,
        active_booking: activeBooking || null,
        display_price: displayPrice,
        capacity: capacity
      }
    })
  }, [rooms, bookings, lastRefreshed, hotel.settings])

  // 3. Actions
  const refresh = useCallback(() => {
    setLastRefreshed(Date.now()) // Trigger re-calc
    // We call fetchData but we rely on its internal logic to not flash loading state
    return fetchData()
  }, [fetchData])

  const toggleMaintenance = async (room: Room) => {
    // If currently MAINTENANCE, switch to VACANT (unless occupied, but logic handles that)
    // If currently VACANT/OCCUPIED, switch to MAINTENANCE
    
    // Note: We are updating the DB "status" field which acts as the override/flag
    const newStatus = room.status === 'MAINTENANCE' ? 'VACANT' : 'MAINTENANCE'
    
    try {
      const token = await user?.getIdToken()
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      // Assuming generic update endpoint
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: 'PUT', // or PATCH
        headers,
        body: JSON.stringify({ status: newStatus })
      })
      
      if (res.ok) {
        refresh()
      } else {
        alert('Failed to update maintenance status')
      }
    } catch (e) {
      console.error(e)
      alert('Error updating status')
    }
  }

  const deleteRoom = async (room: Room) => {
    try {
        const token = await user?.getIdToken()
        const headers: any = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`${API_URL}$_URL}/rooms/${room.id}`, {
            method: 'DELETE',
            headers
        })

        if (res.ok) {
            refresh()
        } else {
            const err = await res.json().catch(() => ({}))
            console.error('Delete room failed:', err)
            alert(err.message || 'Failed to delete room')
        }
    } catch (e: any) {
        console.error(e)
        alert(e.message || 'Error deleting room')
    }
  }

  const updateRoom = async (room: Room, updates: Partial<Room>) => {
    try {
        const token = await user?.getIdToken()
        const headers: any = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`/api/rooms/${room.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updates)
        })

        if (res.ok) {
            refresh()
            return true
        } else {
            alert('Failed to update room')
            return false
        }
    } catch (e) {
        console.error(e)
        alert('Error updating room')
        return false
    }
  }

  const createRoom = async (room: Partial<Room>) => {
    try {
        const token = await user?.getIdToken()
        const headers: any = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`/api/rooms`, {
            method: 'POST',
            headers,
            body: JSON.stringify(room)
        })

        if (res.ok) {
            refresh()
            return true
        } else {
            const err = await res.json().catch(() => ({}))
            alert(err.message || 'Failed to create room')
            return false
        }
    } catch (e) {
        console.error(e)
        alert('Error creating room')
        return false
    }
  }

  const updateBooking = async (booking: Booking, updates: Partial<Booking>) => {
    try {
        const token = await user?.getIdToken()
        const headers: any = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`/api/bookings/${booking.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updates)
        })

        if (res.ok) {
            refresh()
            return true
        } else {
            alert('Failed to update booking')
            return false
        }
    } catch (e) {
        console.error(e)
        alert('Error updating booking')
        return false
    }
  }

  const createBooking = async (booking: Partial<Booking>) => {
    try {
        const token = await user?.getIdToken()
        const headers: any = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`/api/bookings`, {
            method: 'POST',
            headers,
            body: JSON.stringify(booking)
        })

        if (res.ok) {
            refresh()
            return true
        } else {
            const err = await res.text()
            console.error('Create booking failed:', err)
            alert('Failed to create booking: ' + err)
            return false
        }
    } catch (e) {
        console.error(e)
        alert('Error creating booking')
        return false
    }
  }

  return {
    rooms: smartRooms,
    loading,
    error,
    refresh,
    toggleMaintenance,
    deleteRoom,
    updateRoom,
    createRoom,
    updateBooking,
    createBooking,
    rawBookings: bookings
  }
}
