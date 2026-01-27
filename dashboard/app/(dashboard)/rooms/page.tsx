"use client"

import { useState, useMemo } from 'react'
import { useRoomsEngine, Room } from '@/lib/rooms-engine'
import { useHotel } from '@/components/HotelProvider'
import { formatMoney } from '@/lib/formatMoney'
import CheckInDrawer from '@/components/CheckInDrawer'
import CheckoutDrawer from '@/components/CheckoutDrawer'
import ReservationDrawer from '@/components/ReservationDrawer'
import EditRoomDrawer from '@/components/EditRoomDrawer'
import { clsx } from 'clsx'
import { 
  PencilIcon, 
  WrenchScrewdriverIcon, 
  CalendarDaysIcon, 
  ArrowRightOnRectangleIcon, 
  EyeIcon,
  CheckCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smarthotel-backend-984031420056.asia-south1.run.app'

export default function RoomsPage() {
  const { rooms, loading, refresh, toggleMaintenance, deleteRoom, updateRoom, createRoom, updateBooking } = useRoomsEngine()
  const { hotel } = useHotel()
  const currency = hotel?.settings?.currency

  // Drawer States
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [checkoutRoom, setCheckoutRoom] = useState<Room | null>(null)
  const [bookingDrawerOpen, setBookingDrawerOpen] = useState(false)
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<Room | null>(null)
  const [selectedBookingToView, setSelectedBookingToView] = useState<any | null>(null)
  
  // Edit Room State
  const [editRoomDrawerOpen, setEditRoomDrawerOpen] = useState(false)
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null)

  // Computed Metrics
  const metrics = useMemo(() => {
    const occupied = rooms.filter(r => r.computed_status === 'OCCUPIED').length
    const maintenance = rooms.filter(r => r.computed_status === 'MAINTENANCE').length
    
    // Settings-Based Total (Sync with Dashboard)
    const settingsTotal = (hotel?.settings?.roomTypes || []).reduce((acc: number, rt: any) => {
        return acc + (Number(rt.count) || 0)
    }, 0)

    // Use settings total if available, otherwise reality
    const total = settingsTotal > 0 ? Math.max(settingsTotal, rooms.length) : rooms.length

    // Vacant = Total - Occupied - Maintenance
    const vacant = Math.max(0, total - occupied - maintenance)

    return { total, vacant, occupied, maintenance }
  }, [rooms, hotel?.settings?.roomTypes])

  // Handlers
  const handleBook = (room: Room) => {
    setSelectedRoomForBooking(room)
    setBookingDrawerOpen(true)
  }

  const handleCheckout = (room: Room) => {
    setCheckoutRoom(room)
  }

  const handleViewBooking = (room: Room) => {
    if (room.active_booking) {
      setSelectedBookingToView(room.active_booking)
      setBookingDrawerOpen(true)
    }
  }

  const handleBookingSaved = () => {
    refresh()
    setBookingDrawerOpen(false)
    setSelectedBookingToView(null)
    setSelectedRoomForBooking(null)
  }

  const handleCheckoutClose = () => {
    setCheckoutRoom(null)
    refresh()
  }

  const handleEdit = (room: Room) => {
    setRoomToEdit(room)
    setEditRoomDrawerOpen(true)
  }

  const handleSaveRoom = async (room: Room, updates: Partial<Room>) => {
    await updateRoom(room, updates)
  }

  const handleCreateRoom = async (room: Partial<Room>) => {
    await createRoom(room)
  }

  const handleSaveBooking = async (booking: any, updates: any) => {
    await updateBooking(booking, updates)
  }

  const formatDate = (d?: string) => {
      if (!d) return '—'
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Rooms Management</h1>
          <p className="text-sm text-gray-500 mt-1">Master view of all rooms, status, and live occupancy.</p>
        </div>
        <div className="flex gap-2">
            <button 
              onClick={() => setCheckInOpen(true)}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 shadow-sm flex items-center gap-2"
            >
              <span>+</span> Book Room
            </button>
            <button 
              onClick={refresh} 
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              Refresh Data
            </button>
        </div>
      </div>

      {/* Metrics Row (Settings + Reality Mixed) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          label="Available" 
          value={metrics.vacant} 
          color="text-green-600"
        />
        <MetricCard 
          label="Occupied" 
          value={metrics.occupied} 
          color="text-blue-600"
        />
        <MetricCard 
          label="Maintenance" 
          value={metrics.maintenance} 
          color="text-orange-600"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest (Live)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Details</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rooms.map((room) => {
              const isOccupied = room.computed_status === 'OCCUPIED'
              const booking = room.active_booking
              const displayPrice = isOccupied && booking?.price_per_night 
                ? booking.price_per_night 
                : (room.display_price || room.price_per_night || 0)

              return (
                <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                  {/* Room */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{room.room_number}</div>
                    {room.floor && <div className="text-xs text-gray-500">Floor {room.floor}</div>}
                  </td>
                  
                  {/* Type + Capacity */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-900">{room.type}</span>
                        <span className="text-xs text-gray-500">{room.capacity || 2} Guests</span>
                    </div>
                  </td>

                  {/* Guest (Live) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isOccupied && booking ? (
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{booking.guest_name}</span>
                            <span className="text-xs text-gray-500">{booking.guest_count ? `${booking.guest_count} Guests` : ''}</span>
                        </div>
                    ) : (
                        <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isOccupied && booking?.phone ? (
                        <span className="text-sm text-gray-900">{booking.phone}</span>
                    ) : (
                        <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>

                  {/* ID Details */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isOccupied && booking ? (
                        <span className="text-sm text-gray-500 truncate max-w-[150px] block" title={booking.id_proof || (booking.notes?.match(/ID: ([^.]+)/)?.[1])}>
                            {booking.id_proof || (booking.notes?.match(/ID: ([^.]+)/)?.[1]) || '—'}
                        </span>
                    ) : (
                        <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>

                  {/* Check In */}
                  <td className="px-6 py-4 whitespace-nowrap">
                     {isOccupied && booking ? (
                        <div className="text-sm text-gray-900">
                            {formatDate(booking.check_in)}
                        </div>
                     ) : (
                        <span className="text-gray-400 text-sm">—</span>
                     )}
                  </td>

                  {/* Check Out */}
                  <td className="px-6 py-4 whitespace-nowrap">
                     {isOccupied && booking ? (
                        <div className="text-sm text-gray-900">
                            {formatDate(booking.check_out)}
                        </div>
                     ) : (
                        <span className="text-gray-400 text-sm">—</span>
                     )}
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatMoney(Number(displayPrice), currency?.code, currency?.locale).replace(/[^\d.]/g, '')}
                    {/* Only show 'per night' if vacant, otherwise it implies booked price */}
                    {!isOccupied && <span className="text-xs text-gray-400 block">per night</span>}
                  </td>

                  {/* Payment */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isOccupied ? (
                        <div className="flex flex-col items-start gap-1">
                            <span className={clsx(
                                "text-xs font-medium px-2 py-0.5 rounded",
                                booking?.payment_status === 'PAID' ? "bg-green-100 text-green-800" :
                                booking?.payment_status === 'PARTIAL' ? "bg-yellow-100 text-yellow-800" :
                                "bg-gray-100 text-gray-600"
                            )}>
                                {booking?.payment_status || 'Pending'}
                            </span>
                            {booking?.total_price && (
                                <span className="text-xs text-gray-500 font-medium">
                                    {formatMoney(booking.total_price, currency?.code, currency?.locale).replace(/[^\d.]/g, '')}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <ActionButton 
                        onClick={() => handleEdit(room)} 
                        icon={<PencilIcon className="w-4 h-4" />}
                        label="Edit"
                        hideLabel
                        className="text-gray-500 hover:text-black hover:bg-gray-100 border-transparent w-8 h-8 justify-center !p-0"
                      />

                      {room.computed_status === 'VACANT' && (
                        <>
                        </>
                      )}

                      {room.computed_status === 'OCCUPIED' && (
                        <>
                          <ActionButton 
                            onClick={() => handleViewBooking(room)} 
                            icon={<EyeIcon className="w-4 h-4" />}
                            label="View"
                            hideLabel
                            className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 border-transparent w-8 h-8 justify-center !p-0"
                          />
                          <ActionButton 
                            onClick={() => handleCheckout(room)} 
                            icon={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
                            label="Checkout"
                            hideLabel
                            className="text-gray-500 hover:text-orange-600 hover:bg-orange-50 border-transparent w-8 h-8 justify-center !p-0"
                          />
                        </>
                      )}

                      {room.computed_status === 'MAINTENANCE' && (
                        <ActionButton 
                          onClick={() => toggleMaintenance(room)} 
                          icon={<CheckCircleIcon className="w-4 h-4" />}
                          label="Activate"
                          hideLabel
                          className="text-gray-500 hover:text-green-600 hover:bg-green-50 border-transparent w-8 h-8 justify-center !p-0"
                        />
                      )}

                      <ActionButton 
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this room? This cannot be undone.')) {
                                deleteRoom(room)
                            }
                        }} 
                        icon={<TrashIcon className="w-4 h-4" />}
                        label="Delete"
                        hideLabel
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50 border-transparent w-8 h-8 justify-center !p-0"
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Drawers */}
      <CheckInDrawer 
        open={checkInOpen} 
        onClose={() => {
          setCheckInOpen(false)
          refresh()
        }}
        rooms={rooms}
      />

      {/* Edit Room Drawer */}
      <EditRoomDrawer 
        open={editRoomDrawerOpen}
        onClose={() => {
            setEditRoomDrawerOpen(false)
            setRoomToEdit(null)
        }}
        room={roomToEdit}
        onSave={handleSaveRoom}
        onCreate={handleCreateRoom}
        onSaveBooking={handleSaveBooking}
      />

      <CheckoutDrawer 
        open={!!checkoutRoom} 
        onClose={handleCheckoutClose} 
        room={checkoutRoom} 
        bookingId={checkoutRoom?.active_booking?.id}
        roomsData={rooms}
      />
      
      <ReservationDrawer
        open={bookingDrawerOpen}
        onClose={() => {
          setBookingDrawerOpen(false)
          setSelectedBookingToView(null)
          setSelectedRoomForBooking(null)
        }}
        reservation={selectedBookingToView}
        initialRoom={selectedRoomForBooking}
        onSave={handleBookingSaved}
      />
    </div>
  )
}

// --- Subcomponents ---

function MetricCard({ label, value, color = "text-gray-900" }: { label: string, value: number, color?: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const styles = {
    VACANT: "bg-green-100 text-green-800 border-green-200",
    OCCUPIED: "bg-blue-100 text-blue-800 border-blue-200",
    MAINTENANCE: "bg-gray-100 text-gray-800 border-gray-200", // "Orange/Gray" for maintenance
  }
  const label = status || 'UNKNOWN'
  const style = styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {label}
    </span>
  )
}

function ActionButton({ onClick, icon, label, primary, className, hideLabel }: any) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors border",
        primary 
          ? "bg-black text-white border-black hover:bg-gray-800" 
          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
        className
      )}
      title={label}
    >
      {icon}
      {!hideLabel && <span className="hidden sm:inline">{label}</span>}
    </button>
  )
}