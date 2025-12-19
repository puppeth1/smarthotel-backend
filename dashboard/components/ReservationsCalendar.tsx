import { useState, useMemo } from 'react'

interface ReservationsCalendarProps {
  reservations: any[]
  onSelectDate: (date: Date) => void
  onSelectReservation: (res: any) => void
}

export default function ReservationsCalendar({ reservations, onSelectDate, onSelectReservation }: ReservationsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Helper to get days in month
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const date = new Date(year, month, 1)
    const days: (Date | null)[] = []
    
    // Add padding for start of week
    for (let i = 0; i < date.getDay(); i++) {
      days.push(null)
    }
    
    while (date.getMonth() === month) {
      days.push(new Date(date))
      date.setDate(date.getDate() + 1)
    }
    return days
  }, [currentDate])

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const getReservationsForDate = (date: Date) => {
    return reservations.filter(r => {
       const start = new Date(r.check_in).setHours(0,0,0,0)
       const end = new Date(r.check_out).setHours(0,0,0,0)
       const d = new Date(date).setHours(0,0,0,0)
       // Show on days: check_in <= date < check_out
       return d >= start && d < end
    })
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-bold text-gray-800">
           {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
           <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded text-gray-600">◀</button>
           <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm border rounded hover:bg-gray-50 text-gray-700">Today</button>
           <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded text-gray-600">▶</button>
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-7 border-b bg-gray-50 text-xs font-semibold text-gray-500 text-center py-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
      </div>

      {/* Grid Body */}
      <div className="grid grid-cols-7 auto-rows-fr">
         {daysInMonth.map((date, i) => {
             if (!date) return <div key={`empty-${i}`} className="border-b border-r bg-gray-50/30 min-h-[100px]" />
             
             const dayRes = getReservationsForDate(date)
             const isToday = new Date().toDateString() === date.toDateString()

             return (
                 <div 
                    key={date.toISOString()} 
                    className={`border-b border-r p-1 min-h-[100px] cursor-pointer hover:bg-gray-50 transition-colors ${isToday ? 'bg-blue-50/50' : ''}`}
                    onClick={() => onSelectDate(date)}
                 >
                    <div className={`text-right text-xs mb-1 font-medium ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                        {date.getDate()}
                    </div>
                    <div className="space-y-1">
                        {dayRes.slice(0, 3).map(r => (
                            <div 
                                key={r.id}
                                onClick={(e) => { e.stopPropagation(); onSelectReservation(r); }}
                                className={`text-[10px] px-1.5 py-0.5 rounded truncate border shadow-sm ${
                                    r.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 border-green-200' :
                                    r.status === 'TENTATIVE' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                    r.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                    'bg-red-100 text-red-800 border-red-200'
                                }`}
                                title={`${r.room_number || 'Unassigned'} - ${r.guest_name}`}
                            >
                                <span className="font-bold">{r.room_number || '?'}</span> {r.guest_name}
                            </div>
                        ))}
                         {dayRes.length > 3 && (
                            <div className="text-[10px] text-gray-400 text-center">+{dayRes.length - 3} more</div>
                        )}
                    </div>
                 </div>
             )
         })}
      </div>
    </div>
  )
}
