"use client"
import { useState, useEffect, useCallback } from 'react'
import ReservationsCalendar from '@/components/ReservationsCalendar'
import ReservationDrawer from '@/components/ReservationDrawer'
import { useHotel } from '@/components/HotelProvider'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smarthotel-backend-984031420056.asia-south1.run.app'

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const { hotel } = useHotel()

  const fetchReservations = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/bookings`)
      const data = await res.json()
      setReservations(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const handleAdd = (date?: Date) => {
    setSelectedReservation(null)
    setSelectedDate(date || new Date())
    setDrawerOpen(true)
  }

  const handleEdit = (res: any) => {
    setSelectedReservation(res)
    setDrawerOpen(true)
  }

  const handleSave = (data: any) => {
    fetchReservations()
    // Could also optimistic update, but fetch is safer
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reservations</h1>
        <div className="flex gap-2">
           <div className="flex bg-gray-100 rounded p-1 text-sm font-medium">
              <button className="px-3 py-1 bg-white shadow rounded">Month</button>
              <button className="px-3 py-1 text-gray-500 hover:text-black">Week</button>
              <button className="px-3 py-1 text-gray-500 hover:text-black">Day</button>
           </div>
           <button 
             onClick={() => handleAdd()}
             className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800 transition"
           >
             <span>＋</span> Add Reservation
           </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex h-full items-center justify-center text-gray-400">Loading...</div>
        ) : (
          <ReservationsCalendar 
            reservations={reservations}
            onSelectDate={handleAdd}
            onSelectReservation={handleEdit}
          />
        )}
      </div>

      <ReservationDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        reservation={selectedReservation}
        onSave={handleSave}
        selectedDate={selectedDate}
      />
    </div>
  )
}
