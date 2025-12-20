'use client'
import { useEffect, useMemo, useState, useContext } from 'react'
import { useHotel } from '@/components/HotelProvider'
import { AuthContext } from '@/components/AuthProvider'
import { Room } from '@/lib/rooms-engine'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://smarthotel-backend-984031420056.asia-south1.run.app'

export default function CheckInDrawer({ open, onClose, rooms }: { open: boolean; onClose: () => void; rooms: Room[] }) {
  const { hotel } = useHotel()
  const { user } = useContext(AuthContext)
  const currency = hotel?.settings?.currency
  const activeRoomTypes = useMemo(() => {
    return (hotel?.settings?.roomTypes || []).filter((rt: any) => rt.active !== false)
  }, [hotel?.settings?.roomTypes])
  
  const [primaryGuestName, setPrimaryGuestName] = useState('')
  const [primaryGuestPhone, setPrimaryGuestPhone] = useState('')
  const [additionalGuests, setAdditionalGuests] = useState<Array<{ id: string; name: string; relation?: 'Friend' | 'Family' | 'Colleague' }>>([])
  const [roomNumber, setRoomNumber] = useState('101')
  const [roomType, setRoomType] = useState(activeRoomTypes[0]?.type || '')
  const [existingRooms, setExistingRooms] = useState<any[]>([])

  const [checkIn, setCheckIn] = useState(() => {
    const d = new Date()
    const offset = d.getTimezoneOffset()
    const local = new Date(d.getTime() - (offset * 60 * 1000))
    return local.toISOString().split('T')[0]
  })
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date(Date.now() + 86400000)
    const offset = d.getTimezoneOffset()
    const local = new Date(d.getTime() - (offset * 60 * 1000))
    return local.toISOString().split('T')[0]
  })

  const nights = useMemo(() => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diff = end.getTime() - start.getTime()
    return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)))
  }, [checkIn, checkOut])

  const availableRoomNumbers = useMemo(() => {
    const selected = activeRoomTypes.find((rt: any) => rt.type === roomType)
    if (!selected || !selected.roomNumberStart || !selected.roomNumberEnd) return []

    const start = Number(selected.roomNumberStart)
    const end = Number(selected.roomNumberEnd)
    const allNumbers = []
    for (let i = start; i <= end; i++) {
      allNumbers.push(String(i))
    }

    return allNumbers.filter((num) => {
      const room = rooms.find((r) => String(r.room_number).trim() === String(num).trim())
      // STRICT RULE: Available ONLY if room doesn't exist (will be created) OR exists and is VACANT/AVAILABLE
      // If room is OCCUPIED, MAINTENANCE, or anything else, it is NOT available.
      if (!room) return true
      
      const status = (room.computed_status || room.status || 'AVAILABLE').toUpperCase()
      return status === 'VACANT' || status === 'AVAILABLE'
    })
  }, [roomType, activeRoomTypes, rooms])

  // Reset roomNumber when availableRoomNumbers changes
  useEffect(() => {
    const selected = activeRoomTypes.find((rt: any) => rt.type === roomType)
    const hasRange = selected?.roomNumberStart && selected?.roomNumberEnd

    if (hasRange) {
      if (availableRoomNumbers.length > 0) {
        if (!availableRoomNumbers.includes(roomNumber)) {
          setRoomNumber(availableRoomNumbers[0])
        }
      } else {
        setRoomNumber('')
      }
    }
  }, [availableRoomNumbers, roomNumber, roomType, activeRoomTypes])


  const [price, setPrice] = useState('5000')

  // Update roomType when activeRoomTypes changes if current is invalid
  useEffect(() => {
    if (activeRoomTypes.length > 0 && !activeRoomTypes.find((rt: any) => rt.type === roomType)) {
      setRoomType(activeRoomTypes[0].type)
    }
  }, [activeRoomTypes, roomType])

  // Update price when roomType changes
  useEffect(() => {
    const selected = activeRoomTypes.find((rt: any) => rt.type === roomType)
    if (selected?.basePrice) {
      setPrice(String(selected.basePrice))
    }
  }, [roomType, activeRoomTypes])
  const [showPayment, setShowPayment] = useState(false)
  const [payMethod, setPayMethod] = useState<'UPI' | 'CASH' | 'CARD'>('UPI')
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Partial' | 'Pending'>('Paid')
  const [payAmount, setPayAmount] = useState('5000')
  
  useEffect(() => {
    if (price && nights) {
      const total = String(Number(price) * nights)
      setPayAmount(total)
    }
  }, [price, nights])

  // Update amount based on status
  useEffect(() => {
    if (paymentStatus === 'Pending') {
      setPayAmount('0')
    } else if (paymentStatus === 'Paid') {
      setPayAmount(String(Number(price) * nights))
    }
  }, [paymentStatus, price, nights])

  const [showInvoiceOptions, setShowInvoiceOptions] = useState(false)

  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return alert('Please allow popups to print invoice')
    
    const html = `
      <html>
        <head>
          <title>Invoice - ${roomNumber}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
            .h-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .total { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 20px; }
            .status { text-align: right; font-weight: bold; color: green; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="h-name">${hotel?.name || 'Smart Hotel'}</div>
            <div>Invoice #${Date.now().toString().slice(-6)}</div>
          </div>
          <div class="row"><strong>Guest:</strong> <span>${primaryGuestName}</span></div>
          <div class="row"><strong>Room:</strong> <span>${roomNumber} (${roomType})</span></div>
          <div class="row"><strong>Check In:</strong> <span>${checkIn}</span></div>
          <div class="row"><strong>Check Out:</strong> <span>${checkOut}</span></div>
          <div class="row"><strong>Nights:</strong> <span>${nights}</span></div>
          <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;" />
          <div class="row"><span>Room Charges</span> <span>₹${Number(price) * nights}</span></div>
          <div class="row total"><span>Total Amount</span> <span>₹${payAmount}</span></div>
          <div class="status">PAID via ${payMethod}</div>
          
          <script>window.print();</script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const handleWhatsAppShare = () => {
    if (!primaryGuestPhone) return alert('Please enter guest phone number')
    const text = `Dear ${primaryGuestName}, here is your invoice for Room ${roomNumber}. Total Paid: ₹${payAmount}. Thank you for staying with us!`
    window.open(`https://wa.me/${primaryGuestPhone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  const [generateInvoice, setGenerateInvoice] = useState(true)
  const [showIdPanel, setShowIdPanel] = useState(false)
  const [idGuest, setIdGuest] = useState<'Primary Guest' | string>('Primary Guest')
  const [idType, setIdType] = useState<'Aadhaar' | 'Passport' | 'Driving License' | 'Voter ID' | 'Other'>('Aadhaar')
  const [idLabel, setIdLabel] = useState('')
  const [idFront, setIdFront] = useState<string | null>(null)
  const [idBack, setIdBack] = useState<string | null>(null)
  const [guestIds, setGuestIds] = useState<Array<{ guest_name: string; id_type: string; label?: string; front_url?: string | null; back_url?: string | null }>>([])
  const canSave = useMemo(() => primaryGuestName.trim().length > 0 && roomNumber.trim().length > 0, [primaryGuestName, roomNumber])

  useEffect(() => {
    if (!open) {
      setShowPayment(false)
    }
  }, [open])

  async function ensureRoom() {
    try {
      const token = await user?.getIdToken()
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const selected = activeRoomTypes.find((rt: any) => rt.type === roomType)
      
      const res = await fetch(`${API_URL}/rooms?_t=${Date.now()}`, { headers })
      const json = await res.json()
      const rooms = json?.data || []
      const exists = rooms.some((r: any) => String(r.room_number) === String(roomNumber).trim())
      if (!exists) {
        console.log('Room does not exist, creating via API:', roomNumber)
        // Direct API call instead of agent message
        const createRes = await fetch(`${API_URL}/rooms`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            room_number: roomNumber.trim(),
            type: roomType,
            price_per_night: Number(price),
            capacity: Number(selected?.maxGuests || 2),
            currency: currency?.code || 'INR'
          })
        })
        
        if (!createRes.ok) {
           const err = await createRes.json()
           throw new Error(err.message || 'Failed to create room')
        }
      } else {
        // Double check availability (redundant but safe)
        const room = rooms.find((r: any) => String(r.room_number) === String(roomNumber).trim())
        if (room && (room.status === 'OCCUPIED' || room.computed_status === 'OCCUPIED')) {
             throw new Error('Room is already occupied')
        }
      }
    } catch (e: any) {
      console.error('Error ensuring room:', e)
      alert(e.message || 'Error preparing room')
      throw e // Propagate error to stop check-in
    }
  }

  async function markOccupied() {
    // Deprecated: Reservation creation automatically handles occupancy status logic in backend/frontend
  }

  async function savePayment() {
    try {
      const totalToPay = Number(price) * nights
      const paidAmt = Number(payAmount)

      if (paidAmt > 0) {
        const payment = { amount: paidAmt, method: payMethod, created_at: Date.now(), room_number: roomNumber }
        const saved = localStorage.getItem('hp_payments')
        const arr = saved ? JSON.parse(saved) : []
        localStorage.setItem('hp_payments', JSON.stringify([payment, ...arr]))
      }

      if (generateInvoice) {
        const invSaved = localStorage.getItem('hp_invoices')
        const invArr = invSaved ? JSON.parse(invSaved) : []
        const nextId = `inv_${(invArr?.length || 0) + 1}`
        
        let status = 'PAID'
        if (paymentStatus === 'Pending') status = 'PENDING'
        else if (paymentStatus === 'Partial') status = 'PARTIAL'

        const invoice = { 
            invoice_id: nextId, 
            room_number: roomNumber, 
            amount: totalToPay, 
            currency: currency?.code || 'INR', 
            status: status, 
            payment_method: payMethod, 
            paid_at: paidAmt > 0 ? Date.now() : undefined, 
            created_at: Date.now() 
        }
        localStorage.setItem('hp_invoices', JSON.stringify([invoice, ...invArr]))
      }
    } catch {}
  }

  function toTitleCase(v: string) {
    return v
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }

  async function createReservation() {
    try {
      const idDetails = showIdPanel && idLabel ? `${idType}: ${idLabel}` : ''
      const notes = [
        'Created via Quick Check-in',
        idDetails ? `ID: ${idDetails}` : null,
        additionalGuests.length > 0 ? `Additional Guests: ${additionalGuests.map(g => g.name).join(', ')}` : null
      ].filter(Boolean).join('. ')

      let apiPaymentStatus = 'not_paid'
      if (showPayment) {
        if (paymentStatus === 'Paid') apiPaymentStatus = 'paid'
        else if (paymentStatus === 'Partial') apiPaymentStatus = 'partial'
        else if (paymentStatus === 'Pending') apiPaymentStatus = 'not_paid'
      }

      const payload = {
        roomId: roomNumber.trim(),
        roomType: roomType,
        guestName: toTitleCase(primaryGuestName.trim()),
        phone: primaryGuestPhone.trim(),
        checkIn: checkIn,
        checkOut: checkOut,
        pricePerNight: Number(price),
        paymentStatus: apiPaymentStatus,
        
        // Additional fields to preserve data
        nights: nights,
        guestCount: 1 + additionalGuests.length,
        notes: notes,
        source: 'WALK_IN',
        status: 'CHECKED_IN',
        totalPrice: Number(price) * nights
      }

      console.log('Creating reservation with payload:', payload)

      const token = await user?.getIdToken()
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('Failed to create reservation via API:', res.status, errText)
        throw new Error('Failed to create reservation: ' + errText)
      } else {
         console.log('Reservation created successfully. Dispatching refresh...')
         // Dispatch event to refresh dashboard/rooms
         window.dispatchEvent(new Event('hp_refresh_stats'))
      }
    } catch (e: any) {
      console.error('Error creating reservation:', e)
      throw e
    }
  }

  async function handleSave() {
    try {
      await ensureRoom()
      // Create actual reservation in backend to sync with Rooms/Dashboard
      await createReservation()
      
      // await markOccupied() // No longer needed
      try {
      const guestsSaved = localStorage.getItem('hp_guests')
      const guestArr = guestsSaved ? JSON.parse(guestsSaved) : []
      const primaryGuest = { id: crypto.randomUUID(), name: toTitleCase(primaryGuestName.trim()), phone: primaryGuestPhone.trim(), role: 'PRIMARY' }
      const others = additionalGuests.map((g) => ({ id: crypto.randomUUID(), name: toTitleCase((g.name || '').trim()), relation: g.relation, role: 'ADDITIONAL' }))
      const allGuests = [primaryGuest, ...others.filter((g) => g.name.trim().length > 0)]
      localStorage.setItem('hp_guests', JSON.stringify([...allGuests, ...guestArr]))

      const invSaved = localStorage.getItem('hp_invoices')
      const invArr = invSaved ? JSON.parse(invSaved) : []
      let invoice_id: string | undefined
      if (generateInvoice && !showPayment) {
        const nextId = `inv_${(invArr?.length || 0) + 1}`
        const total = Number(price || 0) * nights
        const invoice = { invoice_id: nextId, room_number: roomNumber, amount: total, currency: currency?.code || 'INR', status: 'UNPAID', created_at: Date.now() }
        localStorage.setItem('hp_invoices', JSON.stringify([invoice, ...invArr]))
        invoice_id = nextId
      }

      const checkin = {
        id: crypto.randomUUID(),
        room_number: roomNumber,
        room_type: roomType,
        primary_guest_id: primaryGuest.id,
        additional_guest_ids: others.map((g) => g.id),
        checkin_time: Date.now(),
        payment_method: showPayment ? payMethod : undefined,
        payment_amount: showPayment ? Number(payAmount || (Number(price) * nights)) : undefined,
        guest_ids: guestIds,
        invoice_id,
      }
      const ciSaved = localStorage.getItem('hp_checkins')
      const ciArr = ciSaved ? JSON.parse(ciSaved) : []
      localStorage.setItem('hp_checkins', JSON.stringify([checkin, ...ciArr]))

      if (showPayment) await savePayment()
    } catch {}
    
    // Trigger global refresh for RoomsPage / Dashboard
    window.dispatchEvent(new Event('hp_refresh_stats'))
    
    onClose()
    } catch (e: any) {
      console.error(e)
      alert(e.message || 'Check-in failed')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[480px] bg-white border-l border-borderLight shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Add Room / Check-In</h3>
          <button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-sm transition-colors" onClick={onClose}>Close</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Guest Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider">Guest Details</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Guest <span className="text-red-500">*</span></label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                  placeholder="e.g. John Doe" 
                  value={primaryGuestName} 
                  onChange={(e) => setPrimaryGuestName(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                  placeholder="e.g. 9876543210" 
                  value={primaryGuestPhone} 
                  onChange={(e) => setPrimaryGuestPhone(e.target.value)} 
                />
              </div>

              {/* Additional Guests */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Additional Guests ({additionalGuests.length} / 5)</label>
                  <button
                    className="text-sm text-black hover:text-gray-700 font-medium disabled:opacity-50"
                    disabled={additionalGuests.length >= 5}
                    onClick={() => {
                      if (additionalGuests.length >= 5) return
                      setAdditionalGuests((g) => [...g, { id: crypto.randomUUID(), name: '', relation: undefined }])
                    }}
                  >
                    + Add Guest
                  </button>
                </div>
                
                {additionalGuests.map((g, idx) => (
                  <div key={g.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">Guest {idx + 1}</span>
                      <button 
                        className="text-xs text-red-500 hover:text-red-700" 
                        onClick={() => setAdditionalGuests((arr) => arr.filter((x) => x.id !== g.id))}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                        placeholder="Name" 
                        value={g.name} 
                        onChange={(e) => setAdditionalGuests((arr) => arr.map((x) => x.id === g.id ? { ...x, name: e.target.value } : x))} 
                      />
                      <select 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                        value={g.relation || ''} 
                        onChange={(e) => setAdditionalGuests((arr) => arr.map((x) => x.id === g.id ? { ...x, relation: (e.target.value || undefined) as any } : x))}
                      >
                        <option value="">Relation (Opt)</option>
                        <option>Friend</option>
                        <option>Family</option>
                        <option>Colleague</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 2: Stay Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider">Stay Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check In</label>
                <input 
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                  value={checkIn} 
                  onChange={(e) => setCheckIn(e.target.value)} 
                />
              </div>
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
          </div>

          <hr className="border-gray-100" />

          {/* Section 3: Room Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider">Room Details</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                  value={roomType} 
                  onChange={(e) => setRoomType(e.target.value)}
                >
                  {activeRoomTypes.length > 0 ? (
                    activeRoomTypes.map((rt: any) => (
                      <option key={rt.type} value={rt.type}>
                        {rt.type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </option>
                    ))
                  ) : (
                    <option value="">No types configured</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                {(() => {
                  const selectedType = activeRoomTypes.find((rt: any) => rt.type === roomType)
                  const hasRange = selectedType?.roomNumberStart && selectedType?.roomNumberEnd
                  
                  if (hasRange) {
                    return (
                      <select 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                        value={roomNumber} 
                        onChange={(e) => setRoomNumber(e.target.value)}
                        disabled={availableRoomNumbers.length === 0}
                      >
                        {availableRoomNumbers.length > 0 ? (
                          availableRoomNumbers.map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))
                        ) : (
                          <option value="">No rooms</option>
                        )}
                      </select>
                    )
                  }
                  return (
                    <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                      placeholder="e.g. 101" 
                      value={roomNumber} 
                      onChange={(e) => setRoomNumber(e.target.value)} 
                    />
                  )
                })()}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Night (₹)</label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                  placeholder="0" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 3: Actions */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider">Additional Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <button 
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                onClick={() => setShowPayment(true)}
              >
                <span>💳</span> Take Payment
              </button>
              <button 
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                onClick={() => setShowIdPanel(true)}
              >
                <span>📷</span> Record ID
              </button>
            </div>
          </div>

        {showIdPanel && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 mb-6">
            <h5 className="text-sm font-semibold text-gray-900 mb-3">Record ID Document</h5>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <select 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white" 
                value={idGuest} 
                onChange={(e) => setIdGuest(e.target.value as any)}
              >
                <option>Primary Guest</option>
                {additionalGuests.map((g) => (
                  <option key={g.id} value={g.name || g.id}>{g.name || `Guest (${g.id.slice(0, 6)})`}</option>
                ))}
              </select>
              <select 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white" 
                value={idType} 
                onChange={(e) => setIdType(e.target.value as any)}
              >
                <option>Aadhaar</option>
                <option>Passport</option>
                <option>Driving License</option>
                <option>Voter ID</option>
                <option>Other</option>
              </select>
            </div>
            {idType === 'Other' && (
              <input 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all bg-white mb-3" 
                placeholder="Specify ID Type" 
                value={idLabel} 
                onChange={(e) => setIdLabel(e.target.value)} 
              />
            )}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <label className="flex flex-col items-center justify-center px-3 py-4 rounded-lg bg-white border border-gray-200 border-dashed hover:border-gray-400 cursor-pointer transition-colors">
                <span className="text-xl mb-1">📷</span>
                <span className="text-xs font-medium text-gray-600">Capture Front</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setIdFront(String(r.result)); r.readAsDataURL(f) } }} />
              </label>
              <label className="flex flex-col items-center justify-center px-3 py-4 rounded-lg bg-white border border-gray-200 border-dashed hover:border-gray-400 cursor-pointer transition-colors">
                <span className="text-xl mb-1">📷</span>
                <span className="text-xs font-medium text-gray-600">Capture Back</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setIdBack(String(r.result)); r.readAsDataURL(f) } }} />
              </label>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 px-3 py-2 rounded-lg text-white text-sm hover:brightness-90 transition-all"
                style={{ backgroundColor: hotel?.settings?.branding?.primaryColor || 'black' }}
                onClick={() => {
                  const gname = idGuest === 'Primary Guest' ? primaryGuestName.trim() : (additionalGuests.find((g) => g.name === idGuest)?.name || primaryGuestName.trim())
                  if (!gname) return
                  const entry = { guest_name: toTitleCase(gname), id_type: idType, label: idType === 'Other' ? idLabel.trim() || undefined : undefined, front_url: idFront, back_url: idBack }
                  setGuestIds((arr) => [entry, ...arr])
                  setIdFront(null)
                  setIdBack(null)
                  setIdLabel('')
                }}
              >
                Save ID
              </button>
              <button 
                className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-colors" 
                onClick={() => { setIdFront(null); setIdBack(null); setIdLabel('') }}
              >
                Clear
              </button>
              <button 
                className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-colors" 
                onClick={() => setShowIdPanel(false)}
              >
                Close
              </button>
            </div>
            {guestIds.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recorded IDs ({guestIds.length})</div>
                <div className="space-y-2">
                  {guestIds.map((id, i) => (
                    <div key={i} className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 flex justify-between items-center">
                      <span>{id.guest_name} — {id.id_type}{id.label ? ` (${id.label})` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
            className={`flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium ${!canSave ? 'opacity-50 cursor-not-allowed' : ''}`} 
            disabled={!canSave} 
            onClick={handleSave}
          >
            Save Check-In
          </button>
        </div>
      </div>

        {showPayment && (
          <div className="fixed right-[480px] top-0 h-full w-[360px] bg-white border-l border-gray-200 shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h4 className="text-lg font-semibold text-gray-900">Payment</h4>
              <button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-sm transition-colors" onClick={() => setShowPayment(false)}>Close</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <div className="flex gap-2">
                  {['Paid', 'Partial', 'Pending'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setPaymentStatus(status as any)}
                      className={`flex-1 py-2 text-sm rounded-lg border transition-all ${
                        paymentStatus === status
                          ? 'bg-black text-white border-black shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                  value={payMethod} 
                  onChange={(e) => setPayMethod(e.target.value as any)}
                >
                  <option>UPI</option>
                  <option>CASH</option>
                  <option>CARD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                  placeholder="Amount" 
                  value={payAmount} 
                  onChange={(e) => setPayAmount(e.target.value)} 
                />
              </div>

              <div className="space-y-3">
                <button
                  disabled={paymentStatus !== 'Paid'}
                  onClick={() => setShowInvoiceOptions(true)}
                  className={`w-full py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    paymentStatus === 'Paid'
                      ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm'
                      : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span className="text-lg">📄</span> Generate Invoice
                </button>

                {showInvoiceOptions && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                     <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Invoice Options</div>
                     <div className="grid grid-cols-2 gap-2">
                       <button 
                         onClick={handlePrintInvoice}
                         className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                       >
                         <span>🖨️</span> Print / PDF
                       </button>
                       <button 
                         onClick={handleWhatsAppShare}
                         className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#25D366] text-white rounded-md text-sm hover:brightness-95 transition-all shadow-sm"
                       >
                         <span>💬</span> WhatsApp
                       </button>
                     </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <button 
                className="w-full px-4 py-2 rounded-lg text-white font-medium hover:brightness-90 transition-all" 
                style={{ backgroundColor: hotel?.settings?.branding?.primaryColor || 'black' }}
                onClick={async () => { await savePayment(); setShowPayment(false) }}
              >
                Confirm Payment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
