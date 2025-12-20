'use client'

import { useState, useEffect, useMemo } from 'react'
import { Room, Booking } from '@/lib/rooms-engine'
import { useHotel } from '@/components/HotelProvider'

interface EditRoomDrawerProps {
  open: boolean
  onClose: () => void
  room: Room | null
  onSave: (room: Room, updates: Partial<Room>) => Promise<void>
  onCreate?: (room: Partial<Room>) => Promise<void>
  onSaveBooking: (booking: Booking, updates: Partial<Booking>) => Promise<void>
}

export default function EditRoomDrawer({ open, onClose, room, onSave, onCreate, onSaveBooking }: EditRoomDrawerProps) {
  const { hotel } = useHotel()
  const activeRoomTypes = useMemo(() => {
    return (hotel?.settings?.roomTypes || []).filter((rt: any) => rt.active !== false)
  }, [hotel?.settings?.roomTypes])

  // Room State
  const [roomNumber, setRoomNumber] = useState('')
  const [type, setType] = useState('')
  const [floor, setFloor] = useState('')
  const [capacity, setCapacity] = useState('')
  const [roomPrice, setRoomPrice] = useState('')

  // Booking State
  const [guestName, setGuestName] = useState('')
  const [phone, setPhone] = useState('')
  const [idDetails, setIdDetails] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [bookingPrice, setBookingPrice] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('PENDING')

  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'room' | 'booking'>('room')

  useEffect(() => {
    if (open) {
      if (room) {
        // Edit Mode
        setRoomNumber(room.room_number || '')
        setType(room.type || '')
        setFloor(room.floor || '')
        setRoomPrice(room.price_per_night ? String(room.price_per_night) : '')

        // Booking Data
        if (room.active_booking) {
          const b = room.active_booking
          setGuestName(b.guest_name || '')
          setPhone(b.phone || '')
          setIdDetails(b.id_proof || '')
          setCheckIn(b.check_in ? b.check_in.split('T')[0] : '')
          setCheckOut(b.check_out ? b.check_out.split('T')[0] : '')
          setBookingPrice(b.price_per_night ? String(b.price_per_night) : '')
          setPaymentStatus(b.payment_status || 'PENDING')
          setActiveTab('booking') 
        } else {
          // Clear booking data
          setGuestName('')
          setPhone('')
          setIdDetails('')
          setCheckIn('')
          setCheckOut('')
          setBookingPrice('')
          setPaymentStatus('PENDING')
          setActiveTab('room')
        }
      } else {
        // Create Mode
        setRoomNumber('')
        setType('')
        setFloor('')
        setRoomPrice('')
        setCapacity('')
        setGuestName('')
        setPhone('')
        setIdDetails('')
        setCheckIn('')
        setCheckOut('')
        setBookingPrice('')
        setPaymentStatus('PENDING')
        setActiveTab('room')
      }
    }
  }, [room, open])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (room) {
        // Edit Mode
        await onSave(room, {
          room_number: roomNumber,
          type: type,
          floor: floor,
          price_per_night: Number(roomPrice)
        })

        if (room.active_booking) {
          await onSaveBooking(room.active_booking, {
              guest_name: guestName,
              phone: phone,
              id_proof: idDetails,
              check_in: checkIn,
              check_out: checkOut,
              price_per_night: Number(bookingPrice),
              payment_status: paymentStatus as any
          })
        }
      } else if (onCreate) {
        // Create Mode
        await onCreate({
          room_number: roomNumber,
          type: type,
          floor: floor,
          price_per_night: Number(roomPrice),
          // Default status for new room
          status: 'VACANT', 
          is_active: true
        })
      }

      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) return null

  const isOccupied = !!room?.active_booking

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[400px] bg-white border-l border-gray-200 shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
             <h3 className="text-lg font-semibold text-gray-900">{room ? 'Edit Details' : 'Add Room'}</h3>
             <p className="text-sm text-gray-500">{room ? (isOccupied ? 'Room & Booking' : 'Room Configuration') : 'Create a new room'}</p>
          </div>
          <button 
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-sm transition-colors" 
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Section: Room Details */}
            <section className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Room Configuration</h4>
                
                {/* Room Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                    <input 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    />
                </div>

                {/* Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                    <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    >
                    <option value="" disabled>Select Type</option>
                    {activeRoomTypes.map((rt: any) => (
                        <option key={rt.type} value={rt.type}>{rt.type}</option>
                    ))}
                    {!activeRoomTypes.find((rt: any) => rt.type === type) && type && (
                        <option value={type}>{type}</option>
                    )}
                    </select>
                </div>

                {/* Floor */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                    <input 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="e.g. 1"
                    />
                </div>

                {/* Capacity */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                    <input 
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="e.g. 2"
                    />
                </div>

                {/* Room Price */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Price per Night</label>
                    <input 
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                    value={roomPrice}
                    onChange={(e) => setRoomPrice(e.target.value)}
                    />
                </div>
            </section>

            {/* Section: Booking Details (Only if Occupied) */}
            {isOccupied && (
                <section className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Guest & Booking (Live)</h4>

                    {/* Guest Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
                        <input 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    {/* ID Details */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID Details</label>
                        <input 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                        value={idDetails}
                        onChange={(e) => setIdDetails(e.target.value)}
                        placeholder="e.g. Aadhaar 1234..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Check In */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Check In</label>
                            <input 
                            type="date"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            />
                        </div>

                        {/* Check Out */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Check Out</label>
                            <input 
                            type="date"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Booking Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Booking Price (Nightly)</label>
                        <input 
                        type="number"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                        value={bookingPrice}
                        onChange={(e) => setBookingPrice(e.target.value)}
                        />
                    </div>

                    {/* Payment Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                        <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white"
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        >
                            <option value="PENDING">Pending</option>
                            <option value="PAID">Paid</option>
                            <option value="PARTIAL">Partial</option>
                        </select>
                    </div>
                </section>
            )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
