'use client'
import { useState } from 'react'
import { useHotel } from '@/components/HotelProvider'

export default function SettingsPage() {
  const { hotel, updateHotelName } = useHotel()
  const [name, setName] = useState(hotel.hotelName)
  const [toast, setToast] = useState<string | null>(null)
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [gst, setGst] = useState('')
  const [footer, setFooter] = useState('')

  function toTitleCase(v: string) {
    return v
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }

  async function handleSave() {
    const final = toTitleCase(name.trim() || hotel.hotelName)
    await updateHotelName(final)
    try {
      const settings = { address, city, state, phone, email, gst, invoiceFooter: footer }
      localStorage.setItem('hp_hotel_settings', JSON.stringify(settings))
    } catch {}
    setToast('Hotel details updated')
    setTimeout(() => setToast(null), 2000)
  }

  return (
    <div className="h-full flex">
      <aside className="w-64 border-r border-borderLight bg-bgSoft p-4">
        <h2 className="text-lg font-bold text-textPrimary mb-4">Settings</h2>
        <ul className="space-y-2 text-sm">
          <li className="font-semibold text-textPrimary">Hotel Info</li>
          <li className="text-textMuted">Subscription</li>
          <li className="text-textMuted">Billing</li>
          <li className="text-textMuted">Integrations</li>
          <li className="text-textMuted">Team</li>
        </ul>
      </aside>
      <main className="flex-1 p-6">
        {toast && (
          <div className="mb-3 px-3 py-2 rounded bg-accentSecondary text-textPrimary border border-borderLight">{toast}</div>
        )}
        <h3 className="text-xl font-semibold text-textPrimary mb-4">Hotel Info</h3>
        <div className="grid grid-cols-2 gap-4 max-w-3xl">
          <div className="col-span-2">
            <label className="block text-sm text-textMuted mb-1">Hotel Name</label>
            <input
              className="w-full border border-borderLight rounded px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setName(toTitleCase(name))}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-textMuted mb-1">Address</label>
            <input className="w-full border border-borderLight rounded px-3 py-2" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-textMuted mb-1">City</label>
            <input className="w-full border border-borderLight rounded px-3 py-2" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-textMuted mb-1">State</label>
            <input className="w-full border border-borderLight rounded px-3 py-2" value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-textMuted mb-1">Phone</label>
            <input className="w-full border border-borderLight rounded px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-textMuted mb-1">Email</label>
            <input className="w-full border border-borderLight rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-textMuted mb-1">GST (optional)</label>
            <input className="w-full border border-borderLight rounded px-3 py-2" value={gst} onChange={(e) => setGst(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-textMuted mb-1">Invoice Footer</label>
            <input className="w-full border border-borderLight rounded px-3 py-2" value={footer} onChange={(e) => setFooter(e.target.value)} />
          </div>
        </div>

        <div className="mt-6">
          <button
            className={`px-4 py-2 rounded bg-accentPrimary text-textPrimary font-medium ${name.trim() === hotel.hotelName ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={name.trim() === hotel.hotelName}
            onClick={handleSave}
          >
            Save
          </button>
        </div>

        <div className="mt-10">
          <h3 className="text-xl font-semibold text-textPrimary mb-2">Subscription</h3>
          <div className="text-sm text-textMuted">Plan: {hotel.subscription.plan}</div>
        </div>

        <div className="mt-10">
          <h3 className="text-xl font-semibold text-textPrimary mb-2">Billing</h3>
          <div className="text-sm text-textMuted">Configure invoice prefix, GST, UPI (later)</div>
        </div>
      </main>
    </div>
  )
}
