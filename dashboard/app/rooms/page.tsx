'use client'
import { useEffect, useState } from 'react'

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3000/api/rooms')
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
            </tr>
          </thead>
          <tbody>
            {rooms.map((room, i) => (
              <tr key={i}>
                <td>{room.room_number}</td>
                <td>{room.type}</td>
                <td>{room.status}</td>
                <td>₹{room.price_per_night}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
