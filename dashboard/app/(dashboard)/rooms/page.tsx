"use client"
import { useEffect, useState } from 'react'
import { useHotel } from '@/components/HotelProvider'
import { formatMoney } from '@/lib/formatMoney'
import CheckoutDrawer from '@/components/CheckoutDrawer'
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://smarthotel-backend-984031420056.asia-south1.run.app'

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null)
  const { hotel } = useHotel()
  const currency = hotel?.settings?.currency

  useEffect(() => {
    fetch(`${API_URL}/api/rooms`)
      .then((res) => res.json())
      .then((data) => setRooms(data.data || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h1>Rooms</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table border={1} cellPadding={10}>
          <thead>
            <tr>
              <th>Room</th>
              <th>Type</th>
              <th>Status</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, i) => (
              <tr key={i}>
                <td>{room.room_number}</td>
                <td>{room.type}</td>
                <td>{room.status}</td>
                <td>{formatMoney(Number(room.price_per_night) || 0, currency?.code || 'INR', currency?.locale || 'en-IN')}</td>
                <td>
                  <button
                    disabled={room.status !== 'OCCUPIED'}
                    onClick={() => { setSelectedRoom(room); setCheckoutOpen(true); }}
                  >
                    Checkout
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <CheckoutDrawer open={checkoutOpen} onClose={() => setCheckoutOpen(false)} room={selectedRoom} />
    </div>
  )
}
