'use client'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useHotel } from '@/components/HotelProvider'
import PaymentSelector, { PaymentMethod } from './PaymentSelector'
import { formatMoney } from '@/lib/formatMoney'
import { AuthContext } from '@/components/AuthProvider'
import { XMarkIcon } from '@heroicons/react/24/outline'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smarthotel-backend-984031420056.asia-south1.run.app'

export default function CheckoutDrawer({
  open,
  onClose,
  room: initialRoom,
  bookingId,
  roomsData,
}: {
  open: boolean
  onClose: () => void
  room: any | null
  bookingId?: string
  roomsData?: any[]
}) {
  const { hotel } = useHotel()
  const { user } = useContext(AuthContext)
  const currency = hotel?.settings?.currency
  const taxPercent = hotel?.settings?.tax?.percentage || 0

  // State
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState<any>(null)
  const [pay, setPay] = useState<{ method: PaymentMethod; amount: string }>({ method: 'CASH', amount: '' })

  // Derived Values
  const pricePerNight = booking ? (Number(booking.price_per_night) || 0) : 0
  const checkIn = booking?.check_in ? new Date(booking.check_in) : null
  const checkOut = booking?.check_out ? new Date(booking.check_out) : null
  
  // Calculate nights
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1
    const diff = Math.round((checkOut.getTime() - checkIn.getTime()) / (24 * 60 * 60 * 1000))
    return Math.max(1, diff)
  }, [checkIn, checkOut])

  const subtotal = pricePerNight * nights
  const taxAmount = Math.round(subtotal * (taxPercent / 100))
  const totalAmount = subtotal + taxAmount
  
  const paidAmount = parseFloat(pay.amount || '0')
  const balance = Math.max(0, totalAmount - paidAmount)
  const status = balance <= 0 ? 'PAID' : (paidAmount > 0 ? 'PARTIALLY PAID' : 'UNPAID')

  // Fetch Booking
  useEffect(() => {
    if (open) {
      setLoading(true)
      user?.getIdToken().then((token: string) => {
          const headers: any = token ? { Authorization: `Bearer ${token}` } : {}
          
          if (bookingId) {
             // 1. Fetch by Booking ID (Primary)
             fetch(`${API_URL}/bookings/${bookingId}`, { headers })
                .then(r => {
                    if (!r.ok) throw new Error('Failed to fetch booking')
                    return r.json()
                })
                .then(data => {
                    setBooking(data)
                    setPay(p => ({ ...p, amount: '' }))
                })
                .catch(err => {
                    console.error("Error fetching booking by ID:", err)
                    setBooking(null)
                })
                .finally(() => setLoading(false))

          } else if (initialRoom) {
              // 2. Fallback: Fetch active booking for this room (Legacy/Safety)
              fetch(`${API_URL}/bookings/active?roomId=${initialRoom.room_number}`, { headers })
                .then(r => r.json())
                .then(data => {
                    const activeBooking = Array.isArray(data) ? data[0] : null
                    if (activeBooking) {
                        setBooking(activeBooking)
                        setPay(p => ({ ...p, amount: '' }))
                    } else {
                        console.error("No active booking found for occupied room")
                        setBooking(null)
                    }
                })
                .catch(console.error)
                .finally(() => setLoading(false))
          } else {
              setLoading(false)
              setBooking(null)
          }
      })
    } else {
        setBooking(null)
        setPay({ method: 'CASH', amount: '' })
    }
  }, [open, initialRoom, bookingId, user])

  const handleCompleteCheckout = async () => {
    if (!booking) return
    if (!confirm('Are you sure you want to complete checkout? This will mark the room as VACANT.')) return

    try {
        const token = await user?.getIdToken()
        const res = await fetch(`${API_URL}/bookings/${booking.id}/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                paymentMethod: pay.method,
                amountReceived: Number(pay.amount) || 0
            })
        })
        const data = await res.json()
        // BillingService returns { invoiceId, pdfUrl, invoice } directly or inside data?
        // BillingController wraps it in { status: 'success', data: result } IF called via controller.
        // But ReservationsController calls BillingService.checkout and returns result directly?
        // Let's check ReservationsController implementation I wrote.
        // I returned `this.billingService.checkout(...)`.
        // NestJS controllers return the value directly as JSON by default.
        // So data will be the Invoice object (or whatever checkout returns).
        
        if (data && (data.invoiceId || data.invoice_id)) {
             alert('Checkout Completed Successfully!')
             onClose()
             window.location.reload()
        } else {
             alert('Checkout Failed')
        }
    } catch (e) {
        console.error(e)
        alert('Error completing checkout')
    }
  }

  const handleGeneratePdf = async () => {
       if (!booking) return
       try {
           const token = await user?.getIdToken()
           const res = await fetch(`${API_URL}/billing/invoices/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                     Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    roomNumber: booking.room_number,
                    hotelId: booking.hotel_id
                })
           })
           const data = await res.json()
           if (data.status === 'success' && data.data?.pdfUrl) {
               window.open(API_URL + data.data.pdfUrl, '_blank')
           } else {
               alert('Failed to generate PDF')
           }
       } catch (e) {
           console.error(e)
           alert('Error generating PDF')
       }
  }

  const handleWhatsApp = async () => {
      // Implement if needed, or placeholder
      alert('WhatsApp integration requires setup.')
  }

  const fmt = (v: number) => formatMoney(v, currency?.code || 'INR', currency?.locale || 'en-IN')

  return (
    <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 z-50 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Checkout</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
            <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        ) : !booking ? (
            <div className="text-center text-gray-500 py-10">
                <p>No active booking found for this room.</p>
                <p className="text-sm mt-2">The room might be marked occupied manually or data is inconsistent.</p>
            </div>
        ) : (
            <>
                {/* 1. Read-Only Booking Details */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Booking Details</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <label className="block text-xs text-gray-500 mb-1">Room</label>
                            <div className="font-medium">{booking.room_number}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <label className="block text-xs text-gray-500 mb-1">Type</label>
                            <div className="font-medium capitalize">{booking.room_type || '-'}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">Guest</label>
                            <div className="font-medium">{booking.guest_name}</div>
                            <div className="text-sm text-gray-500">{booking.phone}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <label className="block text-xs text-gray-500 mb-1">Check In</label>
                            <div className="font-medium">{checkIn?.toLocaleDateString()}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <label className="block text-xs text-gray-500 mb-1">Check Out</label>
                            <div className="font-medium">{checkOut?.toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* 2. Bill Summary */}
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Price per night</span>
                        <span className="font-medium">{fmt(pricePerNight)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Nights</span>
                        <span className="font-medium">{nights}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                        <span>Subtotal</span>
                        <span>{fmt(subtotal)}</span>
                    </div>
                    {taxPercent > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Tax ({taxPercent}%)</span>
                            <span>{fmt(taxAmount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
                        <span>Total Amount</span>
                        <span>{fmt(totalAmount)}</span>
                    </div>
                </div>

                {/* 3. Payment (Editable) */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Payment</h3>
                    
                    <PaymentSelector 
                        value={pay.method} 
                        onChange={(m) => setPay({ ...pay, method: m })} 
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">{currency?.symbol || '₹'}</span>
                            <input 
                                type="number" 
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
                                value={pay.amount}
                                onChange={(e) => setPay({ ...pay, amount: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Status Preview */}
                    <div className={`p-3 rounded-lg text-center font-medium text-sm ${
                        status === 'PAID' ? 'bg-green-100 text-green-700' :
                        status === 'PARTIALLY PAID' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                    }`}>
                        Balance: {fmt(balance)} ({status})
                    </div>
                </div>
            </>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3">
        <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={onClose}
                className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
            >
                Cancel
            </button>
            <button 
                onClick={handleGeneratePdf}
                disabled={!booking || loading}
                className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
                Generate Invoice
            </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={handleWhatsApp}
                disabled={!booking || loading}
                className="w-full py-2.5 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
                Send WhatsApp
            </button>
            <button 
                onClick={handleCompleteCheckout}
                disabled={!booking || loading}
                className="w-full py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
                Complete Checkout
            </button>
        </div>
      </div>
    </div>
  )
}