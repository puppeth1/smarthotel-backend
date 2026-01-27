"use client"
import { useState, useEffect, useCallback, useMemo } from 'react'
import ReservationsCalendar from '@/components/ReservationsCalendar'
import ReservationDrawer from '@/components/ReservationDrawer'
import BookingsList from '@/components/BookingsList'
import { useHotel } from '@/components/HotelProvider'
import { MagnifyingGlassIcon, FunnelIcon, CalendarDaysIcon, ListBulletIcon } from '@heroicons/react/24/outline'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smarthotel-backend-984031420056.asia-south1.run.app'

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const { hotel } = useHotel()

  // View State
  const [viewMode, setViewMode] = useState<'CALENDAR' | 'LIST'>('CALENDAR')
  
  // Filters
  const [searchName, setSearchName] = useState('')
  const [filterDate, setFilterDate] = useState<string>('') // YYYY-MM-DD
  const [filterRoomType, setFilterRoomType] = useState('')

  const fetchReservations = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings`)
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
  }

  // Derived Data
  const roomTypes = useMemo(() => {
    return (hotel?.settings?.roomTypes || []).map((rt: any) => rt.type)
  }, [hotel?.settings?.roomTypes])

  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      // 1. Name Search
      if (searchName && !(r.guest_name || '').toLowerCase().includes(searchName.toLowerCase())) {
        return false
      }

      // 2. Room Type Filter
      if (filterRoomType && r.room_type !== filterRoomType) {
        return false
      }

      // 3. Date Filter (Active on Date)
      if (filterDate) {
        const target = new Date(filterDate).setHours(0,0,0,0)
        const start = new Date(r.check_in).setHours(0,0,0,0)
        const end = new Date(r.check_out).setHours(0,0,0,0)
        // Active if: start <= target < end
        if (!(target >= start && target < end)) {
          return false
        }
      }

      return true
    })
  }, [reservations, searchName, filterRoomType, filterDate])

  return (
    <div className="flex flex-col h-full p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reservations</h1>
          <p className="text-sm text-gray-500">Manage bookings, check-ins, and occupancy.</p>
        </div>
        <div className="flex gap-2">
           <div className="flex bg-gray-100 rounded-lg p-1 text-sm font-medium">
              <button 
                onClick={() => setViewMode('CALENDAR')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${viewMode === 'CALENDAR' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
              >
                <CalendarDaysIcon className="w-4 h-4" />
                Calendar
              </button>
              <button 
                onClick={() => setViewMode('LIST')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${viewMode === 'LIST' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
              >
                <ListBulletIcon className="w-4 h-4" />
                All Bookings
              </button>
           </div>
           <button 
             onClick={() => handleAdd()}
             className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition shadow-sm"
           >
             <span>＋</span> New Booking
           </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
                type="text" 
                placeholder="Search by guest name..." 
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
            />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative">
                <input 
                    type="date" 
                    className="pl-3 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 text-gray-600"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                />
            </div>

            <select 
                className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 bg-white text-gray-600"
                value={filterRoomType}
                onChange={(e) => setFilterRoomType(e.target.value)}
            >
                <option value="">All Room Types</option>
                {roomTypes.map((t: string) => (
                    <option key={t} value={t}>{t}</option>
                ))}
            </select>

            {(searchName || filterDate || filterRoomType) && (
                <button 
                    onClick={() => { setSearchName(''); setFilterDate(''); setFilterRoomType('') }}
                    className="text-sm text-red-500 hover:text-red-700 font-medium px-2"
                >
                    Clear
                </button>
            )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex h-full items-center justify-center text-gray-400">Loading...</div>
        ) : (
          <>
            {viewMode === 'CALENDAR' ? (
                <ReservationsCalendar 
                    reservations={filteredReservations}
                    onSelectDate={handleAdd}
                    onSelectReservation={handleEdit}
                />
            ) : (
                <BookingsList 
                    reservations={filteredReservations}
                    onEdit={handleEdit}
                />
            )}
          </>
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
