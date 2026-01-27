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

  // Auto-update checkout when checkin changes
  useEffect(() => {
    if (checkIn) {
      const inDate = new Date(checkIn)
      const outDate = new Date(checkOut)
      
      // If checkout is not after checkin, force it to be checkin + 1 day
      if (outDate <= inDate) {
        const nextDay = new Date(inDate)
        nextDay.setDate(inDate.getDate() + 1)
        
        const offset = nextDay.getTimezoneOffset()
        const local = new Date(nextDay.getTime() - (offset * 60 * 1000))
        setCheckOut(local.toISOString().split('T')[0])
      }
    }
  }, [checkIn])

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
  
  // Financial State
  const [taxRate, setTaxRate] = useState(12)
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('amount')
  const [discountValue, setDiscountValue] = useState(0)

  // Payment State (Must be declared before usage in useMemo)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false) // Track if payment was confirmed
  const [payMethod, setPayMethod] = useState<'UPI' | 'CASH' | 'CARD'>('UPI')
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Partial' | 'Pending'>('Paid')
  const [payAmount, setPayAmount] = useState('5000')

  // Derived Financials
  const financials = useMemo(() => {
    const baseTotal = Number(price) * nights
    const discountAmt = discountType === 'amount' ? discountValue : (baseTotal * (discountValue / 100))
    const taxableAmt = Math.max(0, baseTotal - discountAmt)
    const taxAmt = taxableAmt * (taxRate / 100)
    const total = taxableAmt + taxAmt
    
    // Payment Logic Sync
    const paid = (showPayment || paymentConfirmed) ? Number(payAmount) : 0
    const pending = Math.max(0, total - paid)
    
    return {
      subtotal: baseTotal,
      discount: discountAmt,
      tax: taxAmt,
      total: total,
      paid: paid,
      pending: pending
    }
  }, [price, nights, taxRate, discountType, discountValue, payAmount, showPayment, paymentConfirmed])

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
  
  useEffect(() => {
    if (financials.total) {
      setPayAmount(String(financials.total.toFixed(2)))
    }
  }, [financials.total])

  // Update amount based on status
  useEffect(() => {
    if (paymentStatus === 'Pending') {
      setPayAmount('0')
    } else if (paymentStatus === 'Paid') {
      setPayAmount(String(financials.total.toFixed(2)))
    }
  }, [paymentStatus, financials.total])

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
  const canSave = useMemo(() => {
    const isNameValid = primaryGuestName.trim().length > 0
    const isRoomValid = roomNumber.trim().length > 0
    const isPhoneValid = /^\d{10}$/.test(primaryGuestPhone.trim())
    return isNameValid && isRoomValid && isPhoneValid
  }, [primaryGuestName, roomNumber, primaryGuestPhone])

  useEffect(() => {
    if (!open) {
      setShowPayment(false)
      setPaymentConfirmed(false) // Reset on close
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
        const createRes = await fetch(`/api/rooms`, {
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
      // alert(e.message || 'Error preparing room') // Let handleSave decide whether to alert
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
      const idSummary = guestIds.length > 0 
        ? guestIds.map(g => `${g.id_type}${g.label ? ` (${g.label})` : ''}`).join(', ')
        : (showIdPanel && idLabel ? `${idType}: ${idLabel}` : '')

      const notes = [
        'Created via Quick Check-in',
        idSummary ? `ID: ${idSummary}` : null,
        additionalGuests.length > 0 ? `Additional Guests: ${additionalGuests.map(g => g.name).join(', ')}` : null
      ].filter(Boolean).join('. ')

      let apiPaymentStatus = 'not_paid'
      const isPaymentActive = showPayment || paymentConfirmed

      if (isPaymentActive) {
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
        paymentAmount: isPaymentActive ? Number(payAmount) : 0,
        paymentMethod: isPaymentActive ? payMethod : undefined,
        
        // Additional fields to preserve data
        nights: nights,
        guestCount: 1 + additionalGuests.length,
        notes: notes,
        idProof: idSummary,
        source: 'WALK_IN',
        status: 'CHECKED_IN',
        totalPrice: Number(price) * nights
      }

      console.log('--- DEBUG CHECKIN PAYLOAD ---')
      console.log('Payment Confirmed:', paymentConfirmed)
      console.log('Show Payment:', showPayment)
      console.log('Payment Status State:', paymentStatus)
      console.log('Calculated API Payment Status:', apiPaymentStatus)
      console.log('Final Payload:', payload)
      console.log('-----------------------------')

      const token = await user?.getIdToken()
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`/api/bookings`, {
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
        payment_method: (showPayment || paymentConfirmed) ? payMethod : undefined,
        payment_amount: (showPayment || paymentConfirmed) ? Number(payAmount || (Number(price) * nights)) : undefined,
        guest_ids: guestIds,
        invoice_id,
      }
      const ciSaved = localStorage.getItem('hp_checkins')
      const ciArr = ciSaved ? JSON.parse(ciSaved) : []
      localStorage.setItem('hp_checkins', JSON.stringify([checkin, ...ciArr]))

      if (showPayment || paymentConfirmed) await savePayment()
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
            
            <div className="flex gap-4">
              <div className="flex-[1.5]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Guest <span className="text-red-500">*</span></label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                  placeholder="e.g. John Doe" 
                  value={primaryGuestName} 
                  onChange={(e) => setPrimaryGuestName(e.target.value)} 
                />
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                  placeholder="e.g. 9876543210" 
                  value={primaryGuestPhone} 
                  maxLength={10}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setPrimaryGuestPhone(val)
                  }} 
                />
              </div>
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
                  min={new Date(new Date(checkIn).getTime() + 86400000).toISOString().split('T')[0]}
                  onChange={(e) => setCheckOut(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 3: Room Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider">Room Details</h4>
            
            <div className="flex gap-3">
              <div className="flex-[2]">
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

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">No.</label>
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
                          <option value="">-</option>
                        )}
                      </select>
                    )
                  }
                  return (
                    <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                      placeholder="No." 
                      value={roomNumber} 
                      onChange={(e) => setRoomNumber(e.target.value)} 
                    />
                  )
                })()}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
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
            
            {/* Payment Summary Feedback */}
            {paymentConfirmed && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                    <div>
                        <div className="text-xs font-bold text-green-800 uppercase tracking-wide">Payment Recorded</div>
                        <div className="text-sm text-green-700 font-medium">
                            {paymentStatus.toUpperCase()} • {payMethod}
                        </div>
                    </div>
                    <div className="text-lg font-bold text-green-800">
                        ₹{payAmount}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button 
                className={`flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-colors text-sm font-medium ${
                    paymentConfirmed 
                        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setShowPayment(true)}
              >
                <span>{paymentConfirmed ? '✏️' : '💳'}</span> 
                {paymentConfirmed ? 'Edit Payment' : 'Take Payment'}
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
              <label className={`flex flex-col items-center justify-center px-3 py-4 rounded-lg bg-white border ${idFront ? 'border-green-500 bg-green-50' : 'border-gray-200 border-dashed'} hover:border-gray-400 cursor-pointer transition-colors relative`}>
                {idFront ? (
                  <img src={idFront} alt="ID Front" className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-50" />
                ) : null}
                <span className="text-xl mb-1 z-10">{idFront ? '✅' : '📷'}</span>
                <span className="text-xs font-medium text-gray-600 z-10">{idFront ? 'Front Uploaded' : 'Capture Front'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setIdFront(String(r.result)); r.readAsDataURL(f) } }} />
              </label>
              <label className={`flex flex-col items-center justify-center px-3 py-4 rounded-lg bg-white border ${idBack ? 'border-green-500 bg-green-50' : 'border-gray-200 border-dashed'} hover:border-gray-400 cursor-pointer transition-colors relative`}>
                {idBack ? (
                  <img src={idBack} alt="ID Back" className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-50" />
                ) : null}
                <span className="text-xl mb-1 z-10">{idBack ? '✅' : '📷'}</span>
                <span className="text-xs font-medium text-gray-600 z-10">{idBack ? 'Back Uploaded' : 'Capture Back'}</span>
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
      <div className="p-6 border-t border-gray-100 bg-gray-50 z-20">
        {/* Receipt Style Summary */}
        <div className="mb-4 space-y-1">
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Room Charges ({nights} nights)</span>
                <span className="font-medium text-gray-900">{currency?.symbol}{financials.subtotal.toFixed(2)}</span>
            </div>

            {/* Discount */}
            <div className="flex justify-between items-center text-sm group">
                <div className="flex items-center gap-2">
                    <span className="text-gray-500">Discount</span>
                    <div className="flex bg-gray-200 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => setDiscountType('amount')}
                            className={`px-1.5 py-0.5 text-[10px] rounded ${discountType === 'amount' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
                        >{currency?.symbol}</button>
                        <button 
                            onClick={() => setDiscountType('percent')}
                            className={`px-1.5 py-0.5 text-[10px] rounded ${discountType === 'percent' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
                        >%</button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input 
                        type="number"
                        min="0"
                        value={discountValue === 0 ? '' : discountValue}
                        onChange={e => setDiscountValue(Number(e.target.value))}
                        placeholder="0"
                        className="w-16 text-right bg-transparent border-b border-transparent hover:border-gray-300 focus:border-black focus:outline-none text-sm font-medium placeholder-gray-400 py-0.5"
                    />
                    {discountType === 'percent' && discountValue > 0 && (
                        <span className="text-xs text-red-500 w-16 text-right font-medium">-{currency?.symbol}{financials.discount.toFixed(2)}</span>
                    )}
                </div>
            </div>

            {/* Tax */}
            <div className="flex justify-between items-center text-sm group">
                <div className="flex items-center gap-2">
                    <span className="text-gray-500">Tax</span>
                    <div className="flex items-center opacity-50 hover:opacity-100 transition-opacity">
                        <input 
                            type="number"
                            min="0"
                            value={taxRate}
                            onChange={e => setTaxRate(Number(e.target.value))}
                            className="w-8 text-center bg-gray-200 rounded text-xs font-medium text-gray-500 focus:text-black focus:bg-white focus:ring-1 focus:ring-black focus:outline-none py-0.5"
                        />
                        <span className="text-xs text-gray-400 ml-0.5">%</span>
                    </div>
                </div>
                <span className="font-medium text-gray-900">{currency?.symbol}{financials.tax.toFixed(2)}</span>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-300 mt-2">
                <span className="font-bold text-gray-900 text-sm">Total Amount</span>
                <span className="font-bold text-gray-900 text-sm">{currency?.symbol}{financials.total.toFixed(2)}</span>
            </div>

            {/* Pending Amount */}
            {financials.pending > 0 && (
              <div className="flex justify-between items-center text-sm pt-1 text-red-600 font-medium">
                  <span>Pending</span>
                  <span>{currency?.symbol}{financials.pending.toFixed(2)}</span>
              </div>
            )}
        </div>

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
                onClick={async () => { await savePayment(); setPaymentConfirmed(true); setShowPayment(false) }}
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
