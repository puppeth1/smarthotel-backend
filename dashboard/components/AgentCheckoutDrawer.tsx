'use client'
import { useState, useEffect } from 'react'
import { useHotel } from './HotelProvider'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://smarthotel-backend-984031420056.asia-south1.run.app'

export default function AgentCheckoutDrawer({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (cmd: string) => void }) {
  const { hotel } = useHotel()
  const [roomNumber, setRoomNumber] = useState('')
  const [occupiedRooms, setOccupiedRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setLoading(true)
      fetch(`${API_URL}/rooms`)
        .then((res) => res.json())
        .then((data) => {
          const rooms = (data.data || []).filter((r: any) => r.status === 'OCCUPIED')
          setOccupiedRooms(rooms)
          if (rooms.length > 0 && !roomNumber) {
            setRoomNumber(rooms[0].room_number)
          }
        })
        .finally(() => setLoading(false))
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[400px] bg-white border-l border-borderLight shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Checkout / Invoice</h3>
          <button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-sm transition-colors" onClick={onClose}>Close</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Room to Checkout</label>
            {loading ? (
              <div className="text-sm text-gray-500">Loading rooms...</div>
            ) : occupiedRooms.length > 0 ? (
              <select 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                value={roomNumber} 
                onChange={(e) => setRoomNumber(e.target.value)}
              >
                {occupiedRooms.map((r) => (
                  <option key={r.room_number} value={r.room_number}>
                    Room {r.room_number}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-red-500">No occupied rooms to checkout.</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-3">
            <button 
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className={`flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors ${!roomNumber || occupiedRooms.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!roomNumber || occupiedRooms.length === 0}
              onClick={() => {
                if (roomNumber) {
                  onSave(`Checkout room ${roomNumber}`)
                  onClose()
                }
              }}
            >
              Process Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
