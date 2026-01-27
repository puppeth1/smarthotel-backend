import { useMemo } from 'react'
import { formatMoney } from '@/lib/formatMoney'
import { useHotel } from '@/components/HotelProvider'

interface BookingsListProps {
  reservations: any[]
  onEdit: (res: any) => void
}

export default function BookingsList({ reservations, onEdit }: BookingsListProps) {
  const { hotel } = useHotel()
  const currency = hotel?.settings?.currency

  const formatDate = (d?: string) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const sortedReservations = useMemo(() => {
    return [...reservations].sort((a, b) => new Date(b.created_at || b.check_in).getTime() - new Date(a.created_at || a.check_in).getTime())
  }, [reservations])

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
        <div className="text-gray-400 mb-2">No bookings found</div>
        <div className="text-sm text-gray-500">Try adjusting your filters</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedReservations.map((res) => (
            <tr key={res.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onEdit(res)}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{res.guest_name}</div>
                <div className="text-xs text-gray-500">{res.phone || res.email || '—'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{res.room_number || 'Unassigned'}</div>
                <div className="text-xs text-gray-500">{res.room_type}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(res.check_in)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(res.check_out)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  res.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                  res.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-800' :
                  res.status === 'CHECKED_OUT' ? 'bg-gray-100 text-gray-800' :
                  res.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {res.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatMoney(res.total_price || (res.price_per_night * (res.nights || 1)), currency?.code || 'INR')}
                </div>
                <span className={`text-xs font-medium ${
                  res.payment_status === 'PAID' ? 'text-green-600' :
                  res.payment_status === 'PARTIAL' ? 'text-yellow-600' :
                  'text-red-500'
                }`}>
                  {res.payment_status || 'PENDING'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(res); }}
                  className="text-black hover:text-gray-700 font-medium"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
