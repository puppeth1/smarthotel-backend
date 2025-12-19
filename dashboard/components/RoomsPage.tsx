import { useHotel } from '@/components/HotelProvider'
import { formatMoney } from '@/lib/formatMoney'

export default function RoomsPage({ rooms }: { rooms: any[] }) {
  const { hotel } = useHotel()
  const currency = hotel?.settings?.currency
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-textPrimary">Rooms</h2>

      <div className="grid grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-bg border border-borderLight rounded-xl p-5 hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-textPrimary">{room.room_number}</h3>
            <p className="text-sm text-textMuted">{room.type}</p>

            <div className="mt-3 flex justify-between items-center">
              <span className="font-medium">{formatMoney(Number(room.price_per_night) || 0, currency?.code || 'INR', currency?.locale || 'en-IN')}</span>
              <span className="text-xs px-2 py-1 rounded bg-accentSecondary">{room.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
