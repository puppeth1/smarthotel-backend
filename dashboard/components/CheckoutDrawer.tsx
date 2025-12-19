'use client'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useHotel } from '@/components/HotelProvider'
import PaymentSelector, { PaymentMethod } from './PaymentSelector'
import InvoicePreview from './InvoicePreview'
import { formatMoney } from '@/lib/formatMoney'
import { AuthContext } from '@/components/AuthProvider'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

type InvoiceType = 'ROOM' | 'FOOD' | 'MANUAL'

export default function CheckoutDrawer({
  open,
  onClose,
  room: initialRoom,
}: {
  open: boolean
  onClose: () => void
  room: any | null
}) {
  const { hotel } = useHotel()
  const { user } = useContext(AuthContext)
  const currency = hotel?.settings?.currency
  const taxPercent = hotel?.settings?.tax?.percentage || 0

  // 1. Invoice Context
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('ROOM')
  
  // 2. Selection Data (Fetched)
  const [occupiedRooms, setOccupiedRooms] = useState<any[]>([])
  const [unbilledOrders, setUnbilledOrders] = useState<any[]>([])
  
  // 3. Selected Values
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [guestName, setGuestName] = useState('')
  
  // 4. Room Specifics
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  
  // 5. Line Items
  const [foodOrders, setFoodOrders] = useState<any[]>([])
  const [manualItems, setManualItems] = useState<Array<{ description: string; amount: number }>>([])
  
  // 6. Payment
  const [pay, setPay] = useState<{ method: PaymentMethod; amount: string }>({ method: 'CASH', amount: '' })

  // Derived State
  const selectedRoom = useMemo(() => occupiedRooms.find(r => r.room_number === selectedRoomNumber), [occupiedRooms, selectedRoomNumber])
  const selectedOrder = useMemo(() => unbilledOrders.find(o => o.id === selectedOrderId), [unbilledOrders, selectedOrderId])

  // 7. WhatsApp Status
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false)

  // Initialize
  useEffect(() => {
    if (open) {
      // Check WhatsApp Status
      if (user) {
        user.getIdToken().then((token: string) => {
           fetch(`${API_URL}/api/integrations/whatsapp/account`, {
              headers: { Authorization: `Bearer ${token}` }
           })
           .then(res => res.json())
           .then(data => setIsWhatsAppConnected(data?.data?.status === 'CONNECTED'))
           .catch(() => setIsWhatsAppConnected(false))
        })
      }

      // Reset State
      setInvoiceType(initialRoom ? 'ROOM' : 'ROOM')
      setSelectedRoomNumber(initialRoom?.room_number || '')
      setSelectedOrderId('')
      setGuestName('')
      setCheckIn('')
      setCheckOut('')
      setManualItems([])
      setPay({ method: 'CASH', amount: '' })
      
      // Fetch Context Data
      fetch(`${API_URL}/api/rooms`)
        .then(r => r.json())
        .then(data => {
          setOccupiedRooms(data.data?.filter((r: any) => r.status === 'OCCUPIED') || [])
        })
        .catch(console.error)
        
      fetch(`${API_URL}/api/orders`)
        .then(r => r.json())
        .then(data => {
           // Show confirmed/delivered orders that are NOT paid
          setUnbilledOrders(data.data?.filter((o: any) => o.status !== 'PAID' && o.status !== 'CANCELLED') || [])
        })
        .catch(console.error)
    }
  }, [open, initialRoom])

  // Effect: When Room Selected (or Initial Room), Fetch details
  useEffect(() => {
    if (invoiceType === 'ROOM' && selectedRoomNumber) {
        // If it's the initial room, we might not have it in occupiedRooms list immediately if list loads slow
        // But we can use initialRoom if matches
        const room = occupiedRooms.find(r => r.room_number === selectedRoomNumber) || (initialRoom?.room_number === selectedRoomNumber ? initialRoom : null)
        
        if (room) {
           setGuestName(room.guest_name || '')
           if (room.check_in) setCheckIn(room.check_in.split('T')[0])
           // Default checkout to today
           setCheckOut(new Date().toISOString().split('T')[0])
        }

        // Fetch orders for this room
        fetch(`${API_URL}/api/orders`)
            .then(res => res.json())
            .then(data => {
                const orders = (data.data || []).filter((o: any) => o.room_number === selectedRoomNumber && o.status !== 'CANCELLED')
                setFoodOrders(orders)
            })
            .catch(() => setFoodOrders([]))
    } else if (invoiceType === 'FOOD' && selectedOrderId) {
        // Set food orders to just this one
        const order = unbilledOrders.find(o => o.id === selectedOrderId)
        if (order) {
            setFoodOrders([order])
        } else {
            setFoodOrders([])
        }
    } else {
        setFoodOrders([])
    }
  }, [invoiceType, selectedRoomNumber, selectedOrderId, occupiedRooms, initialRoom, unbilledOrders])

  // Calculations
  const nights = useMemo(() => {
    if (invoiceType !== 'ROOM') return 0
    if (!checkIn || !checkOut) return 1
    const ci = new Date(checkIn)
    const co = new Date(checkOut)
    const diff = Math.round((co.getTime() - ci.getTime()) / (24 * 60 * 60 * 1000))
    return Math.max(1, diff)
  }, [checkIn, checkOut, invoiceType])

  const roomRate = invoiceType === 'ROOM' && selectedRoom ? (Number(selectedRoom.price_per_night) || 0) : 0
  
  const foodTotal = foodOrders.reduce((sum, order) => {
    return sum + order.items.reduce((s: number, i: any) => s + ((Number(i.price)||0) * (Number(i.quantity)||1)), 0)
  }, 0)
  
  const manualTotal = manualItems.reduce((sum, ex) => sum + (Number(ex.amount)||0), 0)
  
  const fmt = (v: number) => formatMoney(v, currency?.code || 'INR', currency?.locale || 'en-IN')

  const subtotal = (roomRate * nights) + foodTotal + manualTotal
  const taxAmount = Math.round(subtotal * (taxPercent / 100))
  const totalAmount = subtotal + taxAmount
  
  const paidAmount = parseFloat(pay.amount || '0')
  const balance = Math.max(0, totalAmount - paidAmount)
  const status = balance <= 0 ? 'PAID' : (paidAmount > 0 ? 'PARTIALLY PAID' : 'UNPAID')

  const addManualItem = () => setManualItems([...manualItems, { description: '', amount: 0 }])
  const updateManualItem = (i: number, item: { description: string; amount: number }) => setManualItems(arr => arr.map((x, idx) => idx === i ? item : x))
  const removeManualItem = (i: number) => setManualItems(arr => arr.filter((_, idx) => idx !== i))

  const doCheckout = async (action: 'print' | 'whatsapp' | 'generate') => {
    try {
      if (action === 'whatsapp') {
        const token = user ? await user.getIdToken() : ''
        const resConn = await fetch(`${API_URL}/api/integrations/whatsapp/account`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        })
        const dataConn = await resConn.json()
        if (dataConn?.data?.status !== 'CONNECTED') {
          alert('Connect WhatsApp in Settings to send invoices')
          return
        }
      }

      const token = user ? await user.getIdToken() : ''
      const payload: any = {
        type: invoiceType,
        payment: { method: pay.method, amount: parseFloat(pay.amount || '0') },
        extras: manualItems, // Manual items passed as extras
        hotelId: hotel?.hotelId,
        guest: { name: guestName },
      }

      if (invoiceType === 'ROOM') {
          if (!selectedRoomNumber) return alert('Please select a room')
          payload.roomNumber = selectedRoomNumber
          payload.checkIn = checkIn
          payload.checkOut = checkOut
      } else if (invoiceType === 'FOOD') {
          if (!selectedOrderId) return alert('Please select an order')
          payload.orderIds = [selectedOrderId]
      }
      
      const res = await fetch(`${API_URL}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      
      if (data.status === 'success') {
        if (action === 'print') {
          window.open(`${API_URL}${data.data.pdfUrl}`, '_blank')
        } else if (action === 'whatsapp') {
          await fetch(`${API_URL}/api/whatsapp/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({
              hotelId: hotel?.hotelId || 'hotel_default',
              type: 'invoice',
              payload: {
                hotel_name: hotel?.name || 'SmartHotel',
                invoice_no: data.data.invoiceId,
                amount: data.data.invoice.totalAmount,
              }
            })
          })
          alert('WhatsApp sent')
        } else {
          alert('Invoice generated')
        }
        onClose()
      } else {
        alert('Checkout failed: ' + (data.message || 'Unknown error'))
      }
    } catch (e) {
      console.error(e)
      alert('Checkout error')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[600px] bg-white border-l border-gray-200 shadow-xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Create Invoice</h3>
          <button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-sm transition-colors" onClick={onClose}>Close</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">

            {/* Step 1: Invoice Type */}
            <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Select Invoice Type</h4>
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => setInvoiceType('ROOM')}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${invoiceType === 'ROOM' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                    >
                        🏨 Room Checkout
                    </button>
                    <button 
                        onClick={() => setInvoiceType('FOOD')}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${invoiceType === 'FOOD' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                    >
                        🍽️ Restaurant
                    </button>
                    <button 
                        onClick={() => setInvoiceType('MANUAL')}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${invoiceType === 'MANUAL' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                    >
                        🚶 Walk-in / Manual
                    </button>
                </div>
            </div>

            {/* Step 2: Context Specifics */}
            <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Invoice Details</h4>
                
                {invoiceType === 'ROOM' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Select Occupied Room</label>
                            <select 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                value={selectedRoomNumber}
                                onChange={(e) => setSelectedRoomNumber(e.target.value)}
                            >
                                <option value="">-- Select Room --</option>
                                {occupiedRooms.map(r => (
                                    <option key={r.room_number} value={r.room_number}>
                                        Room {r.room_number} {r.guest_name ? `– ${r.guest_name}` : ''} ({r.type})
                                    </option>
                                ))}
                            </select>
                            {occupiedRooms.length === 0 && (
                                <div className="mt-2 p-2 bg-orange-50 text-orange-700 text-xs rounded border border-orange-200">
                                    ⚠️ No active check-ins found.<br/>
                                    You can still create a Food or Walk-in invoice.
                                </div>
                            )}
                        </div>
                        
                        {selectedRoomNumber && (
                            <>
                                <input 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                                    placeholder="Guest Name" 
                                    value={guestName} 
                                    onChange={(e) => setGuestName(e.target.value)} 
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Check In</label>
                                        <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="YYYY-MM-DD" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Check Out</label>
                                        <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="YYYY-MM-DD" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {invoiceType === 'FOOD' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Select Unbilled Order</label>
                            <select 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                value={selectedOrderId}
                                onChange={(e) => setSelectedOrderId(e.target.value)}
                            >
                                <option value="">-- Select Order --</option>
                                {unbilledOrders.map(o => (
                                    <option key={o.id} value={o.id}>
                                        Order #{o.id} – {o.room_number ? `Room ${o.room_number}` : (o.table_number ? `Table ${o.table_number}` : 'Walk-in')} – {fmt(o.items.reduce((s:number, i:any)=>s+((Number(i.price)||0)*(Number(i.quantity)||1)),0))}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedOrderId && selectedOrder && (
                             <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
                                <div className="font-medium text-gray-900 mb-2">Order Items:</div>
                                {selectedOrder.items.map((i: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-gray-600">
                                        <span>{i.quantity}x {i.name}</span>
                                        <span>{fmt((i.price||0) * (i.quantity||1))}</span>
                                    </div>
                                ))}
                             </div>
                        )}
                    </div>
                )}

                {invoiceType === 'MANUAL' && (
                    <div className="space-y-4">
                        <input 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                            placeholder="Customer Name" 
                            value={guestName} 
                            onChange={(e) => setGuestName(e.target.value)} 
                        />
                        
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
                            <label className="block text-xs font-medium text-gray-500">Invoice Items</label>
                            {manualItems.map((item, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input 
                                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm" 
                                        placeholder="Description (e.g. Laundry)"
                                        value={item.description}
                                        onChange={(e) => updateManualItem(idx, { ...item, description: e.target.value })}
                                    />
                                    <input 
                                        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm" 
                                        placeholder="Amount"
                                        type="number"
                                        value={item.amount}
                                        onChange={(e) => updateManualItem(idx, { ...item, amount: parseFloat(e.target.value) || 0 })}
                                    />
                                    <button className="text-red-500 hover:text-red-700 px-1" onClick={() => removeManualItem(idx)}>×</button>
                                </div>
                            ))}
                            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium" onClick={addManualItem}>+ Add Item</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Step 3: Preview */}
            <div className="space-y-4">
                 <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Preview</h4>
                 <InvoicePreview 
                    currency={currency} 
                    nights={nights} 
                    roomRate={roomRate} 
                    foodTotal={foodTotal} 
                    extrasTotal={manualTotal} // For Manual items or Extras
                    taxPercent={taxPercent} 
                 />
            </div>

            {/* Step 4: Payment */}
            <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Payment</h4>
                <PaymentSelector value={pay.method} amount={pay.amount} onChange={(u) => setPay(u)} />
                
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mt-3 space-y-1 text-sm">
                    <div className="flex justify-between text-gray-600">
                        <span>Amount Received</span>
                        <span>{fmt(paidAmount)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-gray-900">
                        <span>Balance</span>
                        <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>{fmt(balance)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
                        <span className="font-medium text-gray-900">Status</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                            status === 'PAID' ? 'bg-green-100 text-green-700' : 
                            status === 'PARTIALLY PAID' ? 'bg-orange-100 text-orange-700' : 
                            'bg-red-100 text-red-700'
                        }`}>
                            {status}
                        </span>
                    </div>
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
            <div className="grid grid-cols-2 gap-3">
                 <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" onClick={onClose}>
                    Cancel
                 </button>
                 <button 
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    onClick={() => doCheckout('generate')}
                 >
                    Generate Invoice
                 </button>
                 <button 
                    className="col-span-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    onClick={() => doCheckout('print')}
                 >
                    Generate & Print
                 </button>
                 <button 
                    className="col-span-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => doCheckout('whatsapp')}
                    disabled={!isWhatsAppConnected}
                    title={!isWhatsAppConnected ? 'Connect WhatsApp in Settings' : ''}
                 >
                    Generate & Send WA
                 </button>
            </div>
        </div>
      </div>
    </div>
  )
}
