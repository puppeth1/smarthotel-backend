'use client'
import { useEffect, useState } from 'react'
import { useHotel } from '@/components/HotelProvider'
import { formatMoney } from '@/lib/formatMoney'
import { format } from 'date-fns'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smarthotel-backend-984031420056.asia-south1.run.app'

enum InvoiceStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  SENT = 'SENT',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  CANCELLED = 'CANCELLED',
}

interface Payment {
  id: string
  amount: number
  method: string
  date: string
  referenceId?: string
  collectedBy?: string
}

interface Invoice {
  invoice_id: string
  room_number: string
  amount: number
  currency: string
  status: InvoiceStatus
  created_at: string
  paidAmount: number
  balance: number
  payments: Payment[]
}

export default function BillingPage() {
  const { hotel } = useHotel()
  const currency = hotel?.settings?.currency

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [paymentRef, setPaymentRef] = useState('')
  const [collectedBy, setCollectedBy] = useState('')

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [])

  function fetchInvoices() {
    fetch(`${API_URL}/billing/invoices`)
      .then((res) => res.json())
      .then((data) => {
        setInvoices(data.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const handleRecordPaymentClick = (inv: Invoice) => {
    setSelectedInvoice(inv)
    setPaymentAmount(inv.balance.toString())
    setPaymentMethod('UPI')
    setPaymentRef('')
    setCollectedBy('')
    setIsPaymentModalOpen(true)
  }

  const handleHistoryClick = (inv: Invoice) => {
    setSelectedInvoice(inv)
    setIsHistoryModalOpen(true)
  }

  const submitPayment = async () => {
    if (!selectedInvoice) return

    try {
      const res = await fetch(`${API_URL}/billing/invoices/${selectedInvoice.invoice_id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          referenceId: paymentRef,
          collectedBy: collectedBy,
          date: new Date().toISOString()
        })
      })

      if (res.ok) {
        setIsPaymentModalOpen(false)
        fetchInvoices() // Refresh list
      } else {
        alert('Failed to record payment')
      }
    } catch (error) {
      console.error(error)
      alert('Error recording payment')
    }
  }

  const handleResendWhatsapp = async (inv: Invoice) => {
      // Logic to resend whatsapp
      const confirm = window.confirm(`Resend invoice ${inv.invoice_id} via WhatsApp?`);
      if(!confirm) return;

      try {
                const res = await fetch(`${API_URL}/whatsapp/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                  hotelId: 'hotel_default', // Hardcoded for now, should come from context
                  type: 'invoice',
                  payload: {
                      hotel_name: 'SmartHotel', // Should be dynamic
                      invoice_no: inv.invoice_id,
                      amount: inv.amount
                  }
              })
          });
          if(res.ok) {
              alert('WhatsApp sent!');
          } else {
              alert('Failed to send WhatsApp');
          }
      } catch(e) {
          console.error(e);
          alert('Error sending WhatsApp');
      }
  }

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID: return 'bg-green-100 text-green-800'
      case InvoiceStatus.PARTIALLY_PAID: return 'bg-yellow-100 text-yellow-800'
      case InvoiceStatus.GENERATED: return 'bg-blue-100 text-blue-800'
      case InvoiceStatus.SENT: return 'bg-indigo-100 text-indigo-800'
      case InvoiceStatus.CANCELLED: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="p-6">Loading billing data...</div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Billing & Invoices</h1>
      
      {invoices.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-500">
            No invoices found. Check in a guest to generate an invoice.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Invoice #</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Room</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-right">Paid</th>
                  <th className="px-6 py-3 text-right">Balance</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.invoice_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-gray-900">{inv.invoice_id}</td>
                    <td className="px-6 py-4 text-gray-500">
                        {format(new Date(inv.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{inv.room_number}</td>
                    <td className="px-6 py-4 text-right font-medium">{formatMoney(inv.amount, currency?.code || 'INR', currency?.locale || 'en-IN')}</td>
                    <td className="px-6 py-4 text-right text-green-600">{formatMoney(inv.paidAmount || 0, currency?.code || 'INR', currency?.locale || 'en-IN')}</td>
                    <td className="px-6 py-4 text-right text-red-600 font-medium">{formatMoney(inv.balance ?? inv.amount, currency?.code || 'INR', currency?.locale || 'en-IN')}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                        {/* Record Payment Button */}
                        {(inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.CANCELLED) && (
                            <button 
                                onClick={() => handleRecordPaymentClick(inv)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 bg-blue-50 px-3 py-1 rounded transition-colors"
                            >
                                Pay
                            </button>
                        )}
                        
                        {/* WhatsApp Button */}
                        <button 
                            onClick={() => handleResendWhatsapp(inv)}
                            className="text-green-600 hover:text-green-800 font-medium text-xs border border-green-200 bg-green-50 px-3 py-1 rounded transition-colors"
                        >
                            WA
                        </button>
                        
                        {/* Email Button */}
                        <button 
                            onClick={() => alert('Email sent (mock)')}
                            className="text-indigo-600 hover:text-indigo-800 font-medium text-xs border border-indigo-200 bg-indigo-50 px-3 py-1 rounded transition-colors"
                        >
                            Email
                        </button>

                        {/* History Button */}
                        <button 
                            onClick={() => handleHistoryClick(inv)}
                            className="text-gray-600 hover:text-gray-800 font-medium text-xs border border-gray-200 bg-gray-50 px-3 py-1 rounded transition-colors"
                        >
                            History
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {isHistoryModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-lg text-gray-800">Payment History</h3>
                <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="p-6">
                <div className="mb-4">
                     <h4 className="text-sm font-medium text-gray-500">Invoice #{selectedInvoice.invoice_id}</h4>
                     <div className="flex justify-between items-baseline mt-1">
                        <span className="text-2xl font-bold text-gray-900">{formatMoney(selectedInvoice.amount, currency?.code || 'INR', currency?.locale || 'en-IN')}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.status)}`}>
                            {selectedInvoice.status}
                        </span>
                     </div>
                </div>

                {!selectedInvoice.payments || selectedInvoice.payments.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No payments recorded yet.</p>
                ) : (
                    <div className="space-y-3">
                        {selectedInvoice.payments.map((pay, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100">
                                <div>
                                    <div className="font-medium text-gray-900">{formatMoney(pay.amount, currency?.code || 'INR', currency?.locale || 'en-IN')}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {formatDateTime(pay.date)} • {pay.method}
                                    </div>
                                    {pay.referenceId && (
                                        <div className="text-xs text-gray-400 mt-0.5">Ref: {pay.referenceId}</div>
                                    )}
                                </div>
                                <div className="text-right">
                                    {pay.collectedBy && (
                                        <div className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                                            {pay.collectedBy}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
                <button 
                    onClick={() => setIsHistoryModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                    Close
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-lg text-gray-800">Record Payment</h3>
                <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
                <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-4">
                    Invoice: <span className="font-mono font-bold">{selectedInvoice.invoice_id}</span><br/>
                    Balance Due: <span className="font-bold">{formatMoney(selectedInvoice.balance, currency?.code || 'INR', currency?.locale || 'en-IN')}</span>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <input 
                        type="number" 
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select 
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="UPI">UPI</option>
                        <option value="CASH">Cash</option>
                        <option value="CARD">Card</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference ID (Optional)</label>
                    <input 
                        type="text" 
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="e.g. UPI Transaction ID"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Collected By</label>
                    <input 
                        type="text" 
                        value={collectedBy}
                        onChange={(e) => setCollectedBy(e.target.value)}
                        placeholder="Staff Name"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button 
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={submitPayment}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm transition-colors"
                >
                    Record Payment
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
