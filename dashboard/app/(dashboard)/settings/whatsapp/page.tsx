'use client'
import { useState, useEffect, useContext } from 'react'
import { useHotel } from '@/components/HotelProvider'
import { AuthContext } from '@/components/AuthProvider'

export default function WhatsAppSettingsPage() {
  const { hotel, saveSettings } = useHotel()
  const { user } = useContext(AuthContext)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  
  // State
  const [enabled, setEnabled] = useState(false)
  const [displayNumber, setDisplayNumber] = useState('')
  const [messageTypes, setMessageTypes] = useState({
    invoice: true,
    payment_reminder: true,
    booking_confirmation: true,
    checkout_thanks: false,
  })
  const [defaultTemplate, setDefaultTemplate] = useState('')
  
  // Read-only metrics (default to 300/1 if not set)
  const monthlyQuota = hotel.settings?.whatsapp?.monthly_quota ?? 300
  const usedThisMonth = hotel.settings?.whatsapp?.used_this_month ?? 0
  const chargePerMessage = hotel.settings?.whatsapp?.charge_per_message ?? 1

  const [connection, setConnection] = useState<{ status: 'CONNECTED' | 'DISCONNECTED' | 'UNKNOWN'; phone_number?: string } | null>(null)

  // Sync with hotel settings
  useEffect(() => {
    const w = (hotel.settings?.whatsapp || {}) as any
    if (w.enabled !== undefined) setEnabled(w.enabled)
    if (w.display_number !== undefined) setDisplayNumber(w.display_number)
    if (w.message_types) setMessageTypes(prev => ({ ...prev, ...w.message_types }))
    if (w.default_template !== undefined) setDefaultTemplate(w.default_template)
    else setDefaultTemplate(`Thank you for staying at {{hotel_name}}.\nYour invoice {{invoice_no}} of ₹{{amount}}\nis attached.`)
  }, [hotel.settings])

  useEffect(() => {
    // Load connection state
    if (!user) return
    user.getIdToken().then((token: string) => {
      fetch(`${API_URL}/api/integrations/whatsapp/account`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        const acc = data.data
        if (!acc) setConnection({ status: 'UNKNOWN' })
        else setConnection({ status: acc.status, phone_number: acc.phone_number })
      })
      .catch(() => setConnection({ status: 'UNKNOWN' }))
    })
  }, [hotel.hotelId, user])

  async function handleSave() {
    await saveSettings({
      whatsapp: {
        enabled,
        display_number: displayNumber,
        monthly_quota: monthlyQuota,
        used_this_month: usedThisMonth,
        charge_per_message: chargePerMessage,
        message_types: messageTypes,
        default_template: defaultTemplate,
      }
    })
  }

  async function connectWhatsapp() {
    if (!displayNumber) {
      return
    }
    const token = user ? await user.getIdToken() : ''
    const res = await fetch(`${API_URL}/api/integrations/whatsapp/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ phone_number: displayNumber })
    })
    const data = await res.json()
    if (data.status === 'success') {
      setConnection({ status: 'CONNECTED', phone_number: displayNumber })
    } else {
    }
  }

  const handleToggleMessageType = (key: keyof typeof messageTypes) => {
    setMessageTypes(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="max-w-4xl pb-20">
      <h2 className="text-2xl font-bold text-textPrimary mb-8">WhatsApp Integration</h2>

      {/* A. Connection Status */}
      <div className="mb-6 flex items-center justify-between bg-white p-6 rounded-lg border border-borderLight shadow-sm">
        <div>
          <div className="font-semibold text-lg">WhatsApp Business Connection</div>
          <div className={`text-sm mt-1 ${connection?.status === 'CONNECTED' ? 'text-green-600' : 'text-red-600'}`}>
            {connection?.status === 'CONNECTED' ? `Connected (${connection?.phone_number})` : 'Not Connected'}
          </div>
        </div>
        <button onClick={connectWhatsapp} className="px-4 py-2 rounded bg-green-600 text-white shadow-sm">
          Connect WhatsApp Business
        </button>
      </div>

      {/* Main Toggle */}
      <div className="mb-8 flex items-center justify-between bg-white p-6 rounded-lg border border-borderLight shadow-sm">
         <span className="font-semibold text-lg">Enable WhatsApp Notifications</span>
         <button 
           onClick={() => setEnabled(!enabled)}
           className={`w-14 h-8 rounded-full relative transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
         >
           <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm ${enabled ? 'left-7' : 'left-1'}`} />
         </button>
      </div>

      <div className={`space-y-10 ${!enabled || connection?.status !== 'CONNECTED' ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* Business Display Number */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-textPrimary">Business Display Number <span className="text-red-500">*</span></h3>
          </div>
          <div className="bg-white p-6 rounded-lg border border-borderLight shadow-sm">
             <p className="text-sm text-textMuted mb-3">This is shown to guests on invoices & messages</p>
             <input 
               type="text" 
               value={displayNumber} 
               onChange={(e) => setDisplayNumber(e.target.value)}
               placeholder="+91 9XXXXXXXXX"
               className="w-full max-w-md p-3 border border-borderLight rounded font-mono text-lg"
             />
          </div>
        </section>

        {/* Monthly Usage */}
        <section>
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Monthly Usage</h3>
          <div className="bg-white p-6 rounded-lg border border-borderLight shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div>
              <p className="text-sm text-textSecondary font-medium mb-1">Included Messages</p>
              <p className="text-2xl font-bold text-textPrimary">{monthlyQuota}</p>
              <p className="text-xs text-textMuted">read-only</p>
            </div>

            <div>
              <p className="text-sm text-textSecondary font-medium mb-1">Used This Month</p>
              <p className={`text-2xl font-bold ${usedThisMonth > monthlyQuota ? 'text-red-500' : 'text-textPrimary'}`}>
                {usedThisMonth} <span className="text-gray-400 text-lg">/ {monthlyQuota}</span>
              </p>
            </div>

            <div>
              <p className="text-sm text-textSecondary font-medium mb-1">Over-usage Charge</p>
              <p className="text-2xl font-bold text-textPrimary">₹{chargePerMessage}</p>
              <p className="text-xs text-textMuted">per message (auto-billed)</p>
            </div>

          </div>
        </section>

        {/* Message Types */}
        <section>
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Message Types</h3>
          <div className="bg-white p-6 rounded-lg border border-borderLight shadow-sm space-y-4">
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={messageTypes.invoice} 
                onChange={() => handleToggleMessageType('invoice')}
                className="w-5 h-5 text-accentPrimary rounded border-gray-300 focus:ring-accentPrimary" 
              />
              <span className="text-textPrimary font-medium">Invoice Sent</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={messageTypes.payment_reminder} 
                onChange={() => handleToggleMessageType('payment_reminder')}
                className="w-5 h-5 text-accentPrimary rounded border-gray-300 focus:ring-accentPrimary" 
              />
              <span className="text-textPrimary font-medium">Payment Reminder</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={messageTypes.booking_confirmation} 
                onChange={() => handleToggleMessageType('booking_confirmation')}
                className="w-5 h-5 text-accentPrimary rounded border-gray-300 focus:ring-accentPrimary" 
              />
              <span className="text-textPrimary font-medium">Booking Confirmation</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={messageTypes.checkout_thanks} 
                onChange={() => handleToggleMessageType('checkout_thanks')}
                className="w-5 h-5 text-accentPrimary rounded border-gray-300 focus:ring-accentPrimary" 
              />
              <span className="text-textPrimary font-medium">Checkout Thank You</span>
            </label>

          </div>
        </section>

        {/* Default Message Template */}
        <section>
          <h3 className="text-lg font-semibold text-textPrimary mb-4">Default Message Template (Invoice)</h3>
          <div className="bg-white p-6 rounded-lg border border-borderLight shadow-sm">
            <textarea 
              value={defaultTemplate}
              onChange={(e) => setDefaultTemplate(e.target.value)}
              rows={4}
              className="w-full p-3 border border-borderLight rounded font-mono text-sm"
            />
            <p className="text-xs text-textMuted mt-2">
              Available variables: <code>{'{{hotel_name}}'}</code>, <code>{'{{invoice_no}}'}</code>, <code>{'{{amount}}'}</code>
            </p>
          </div>
        </section>

      </div>

      {/* Save Button */}
      <div className="mt-10">
        <button 
          onClick={handleSave}
          className="bg-accentPrimary text-textPrimary px-6 py-2 rounded-lg font-medium shadow-sm transition-colors hover:opacity-90"
        >
          Save Settings
        </button>
      </div>

    </div>
  )
}
