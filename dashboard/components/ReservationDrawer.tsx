import { useState, useEffect, useMemo } from 'react'
import { useHotel } from './HotelProvider'
import { formatMoney } from '@/lib/formatMoney'

interface ReservationDrawerProps {
  open: boolean
  onClose: () => void
  reservation?: any
  onSave?: (data: any) => void
  selectedDate?: Date | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smarthotel-backend-984031420056.asia-south1.run.app'

export default function ReservationDrawer({ open, onClose, reservation, onSave, selectedDate }: ReservationDrawerProps) {
  const { hotel } = useHotel()
  const [formData, setFormData] = useState<any>({
    guest_name: '',
    phone: '',
    email: '',
    check_in: '',
    check_out: '',
    room_type: '',
    room_number: '',
    source: 'WALK_IN',
    price_per_night: 0,
    status: 'CONFIRMED',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [rooms, setRooms] = useState<any[]>([])
  
  // Load rooms to populate room number dropdown
  useEffect(() => {
    if (open) {
      fetch(`${API_URL}/api/rooms`)
        .then(res => res.json())
        .then(data => setRooms(data.data || []))
        .catch(console.error)
    }
  }, [open])

  // Initialize form
  useEffect(() => {
    if (open) {
      if (reservation) {
        setFormData({
            ...reservation,
            // Ensure dates are YYYY-MM-DD
            check_in: reservation.check_in ? new Date(reservation.check_in).toISOString().split('T')[0] : '',
            check_out: reservation.check_out ? new Date(reservation.check_out).toISOString().split('T')[0] : ''
        })
      } else {
        const today = new Date().toISOString().split('T')[0]
        const checkIn = selectedDate ? selectedDate.toISOString().split('T')[0] : today
        
        // Default checkout next day
        const nextDay = new Date(checkIn)
        nextDay.setDate(nextDay.getDate() + 1)
        const checkOut = nextDay.toISOString().split('T')[0]

        setFormData({
          guest_name: '',
          phone: '',
          email: '',
          check_in: checkIn,
          check_out: checkOut,
          room_type: hotel?.settings?.roomTypes?.[0]?.type || '',
          room_number: '',
          source: 'WALK_IN',
          price_per_night: hotel?.settings?.roomTypes?.[0]?.basePrice || 0,
          status: 'CONFIRMED',
          notes: ''
        })
      }
    }
  }, [open, reservation, selectedDate, hotel])

  // Auto-update price when room type changes
  const handleRoomTypeChange = (type: string) => {
    const config = hotel?.settings?.roomTypes?.find((rt: any) => rt.type === type)
    setFormData((prev: any) => ({
      ...prev,
      room_type: type,
      price_per_night: config?.price || prev.price_per_night,
      room_number: '' // Reset room number as type changed
    }))
  }

  // Filter available rooms by type
  const availableRooms = useMemo(() => {
    if (!formData.room_type) return []
    return rooms.filter(r => r.type === formData.room_type)
  }, [rooms, formData.room_type])

  const nights = useMemo(() => {
    if (!formData.check_in || !formData.check_out) return 0
    const start = new Date(formData.check_in)
    const end = new Date(formData.check_out)
    const diff = end.getTime() - start.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [formData.check_in, formData.check_out])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const payload = {
        ...formData,
        nights,
        price_per_night: Number(formData.price_per_night),
      }

      const url = reservation 
        ? `${API_URL}/api/reservations/${reservation.id}`
        : `${API_URL}/api/reservations`
      
      const method = reservation ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to save')
      }

      const saved = await res.json()
      if (onSave) onSave(saved)
      onClose()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckInNow = async () => {
    if (!reservation?.id) return
    if (!confirm('This will mark the room as OCCUPIED and guest as checked-in. Continue?')) return

    setLoading(true)
    try {
        const res = await fetch(`${API_URL}/api/reservations/${reservation.id}/checkin`, {
            method: 'POST'
        })
        if (!res.ok) throw new Error('Check-in failed')
        const updated = await res.json()
        if (onSave) onSave(updated)
        onClose()
        window.location.reload() // Simple reload to refresh all states
    } catch (err: any) {
        alert(err.message)
    } finally {
        setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div className="w-[500px] bg-white h-full shadow-2xl overflow-y-auto flex flex-col">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold">
            {reservation ? 'Edit Reservation' : 'New Reservation'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* 1. Guest Details */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-1">1. Guest Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Guest Name *</label>
                <input 
                  className="w-full border rounded p-2 text-sm"
                  value={formData.guest_name}
                  onChange={e => setFormData({...formData, guest_name: e.target.value})}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    className="w-full border rounded p-2 text-sm"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="+91..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    className="w-full border rounded p-2 text-sm"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 2. Stay Details */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-1">2. Stay Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Check-in *</label>
                <input 
                  type="date"
                  className="w-full border rounded p-2 text-sm"
                  value={formData.check_in}
                  onChange={e => setFormData({...formData, check_in: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Check-out *</label>
                <input 
                  type="date"
                  className="w-full border rounded p-2 text-sm"
                  value={formData.check_out}
                  onChange={e => setFormData({...formData, check_out: e.target.value})}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-right">Duration: {nights} nights</p>
          </section>

          {/* 3. Room Details */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-1">3. Room Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Room Type *</label>
                <select 
                  className="w-full border rounded p-2 text-sm"
                  value={formData.room_type}
                  onChange={e => handleRoomTypeChange(e.target.value)}
                >
                  <option value="">Select Type</option>
                  {hotel?.settings?.roomTypes?.map((rt: any) => (
                    <option key={rt.type} value={rt.type}>{rt.type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Room Number</label>
                <select 
                  className="w-full border rounded p-2 text-sm"
                  value={formData.room_number}
                  onChange={e => setFormData({...formData, room_number: e.target.value})}
                >
                  <option value="">Auto-assign / Select later</option>
                  {availableRooms.map(r => (
                    <option key={r.room_number} value={r.room_number}>
                       {r.room_number} {r.status !== 'AVAILABLE' ? `(${r.status})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                   Only showing rooms matching selected type.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Source & Status */}
          <section>
             <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-1">4. Details</h3>
             <div className="space-y-3">
               <div>
                 <label className="block text-xs font-medium text-gray-700 mb-1">Source</label>
                 <select 
                   className="w-full border rounded p-2 text-sm"
                   value={formData.source}
                   onChange={e => setFormData({...formData, source: e.target.value})}
                 >
                   <option value="WALK_IN">Walk-in</option>
                   <option value="WEBSITE">Website</option>
                   <option value="BOOKING_COM">Booking.com</option>
                   <option value="AIRBNB">Airbnb</option>
                   <option value="MMT">MakeMyTrip</option>
                   <option value="AGODA">Agoda</option>
                   <option value="OTHER">Other</option>
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                 <div className="flex gap-2">
                    {['CONFIRMED', 'TENTATIVE', 'CANCELLED'].map(s => (
                        <label key={s} className="flex items-center gap-1 cursor-pointer">
                            <input 
                                type="radio" 
                                name="status" 
                                value={s} 
                                checked={formData.status === s}
                                onChange={e => setFormData({...formData, status: e.target.value})}
                            />
                            <span className="text-xs capitalize">{s.toLowerCase()}</span>
                        </label>
                    ))}
                 </div>
               </div>
             </div>
          </section>
          
           {/* 5. Pricing */}
           <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-1">5. Pricing</h3>
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price per Night</label>
                <input 
                  type="number"
                  className="w-full border rounded p-2 text-sm"
                  value={formData.price_per_night}
                  onChange={e => setFormData({...formData, price_per_night: e.target.value})}
                />
            </div>
           </section>

           {/* 6. Notes */}
           <section>
             <label className="block text-sm font-semibold text-gray-900 mb-1">Notes</label>
             <textarea 
               className="w-full border rounded p-2 text-sm h-20"
               value={formData.notes}
               onChange={e => setFormData({...formData, notes: e.target.value})}
               placeholder="Special requests..."
             />
           </section>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          {reservation?.id && reservation.status !== 'CHECKED_IN' && reservation.status !== 'CANCELLED' && 
           reservation.check_in === new Date().toISOString().split('T')[0] && (
             <button 
                onClick={handleCheckInNow}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
             >
                Check-in Now
             </button>
          )}
          
          <div className="flex gap-2 ml-auto">
            <button 
                onClick={onClose}
                className="px-4 py-2 rounded text-sm font-medium border bg-white hover:bg-gray-50"
            >
                Cancel
            </button>
            <button 
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 rounded text-sm font-medium bg-black text-white hover:bg-gray-800 disabled:opacity-50"
            >
                {loading ? 'Saving...' : 'Save Reservation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
