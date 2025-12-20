'use client'
import { useEffect, useState } from 'react'
import { useHotel } from '@/components/HotelProvider'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://smarthotel-backend-984031420056.asia-south1.run.app'

export default function HotelSettingsPage() {
  const { hotel, saveHotelInfo } = useHotel()
  const [name, setName] = useState(hotel.hotelName)
  const [displayName, setDisplayName] = useState(hotel.hotelName)
  const [logoUrl, setLogoUrl] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [gstPercent, setGstPercent] = useState<number | ''>(0)
  const [invoicePrefix, setInvoicePrefix] = useState('SH-INV-')
  const [invoiceFooter, setInvoiceFooter] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch(`${API_URL}/settings/hotel-info`)
        const json = await res.json()
        const info = json?.data || {}
        if (!mounted) return
        setName(info.name || hotel.hotelName)
        setDisplayName(info.displayName || info.name || hotel.hotelName)
        setLogoUrl(info.logoUrl || '')
        const addr = info.address || {}
        setAddressLine(addr.line || '')
        setCity(addr.city || '')
        setState(addr.state || '')
        setPincode(addr.pincode || '')
        const contact = info.contact || {}
        setPhone(contact.phone || '')
        setEmail(contact.email || '')
        const tax = info.tax || {}
        setGstNumber(tax.gstNumber || '')
        setGstPercent(typeof tax.gstPercent === 'number' ? tax.gstPercent : 0)
        const inv = info.invoice || {}
        setInvoicePrefix(inv.prefix || 'SH-INV-')
        setInvoiceFooter(inv.footerText || '')
      } catch {}
    }
    load()
    return () => { mounted = false }
  }, [hotel.hotelName])

  function toTitleCase(v: string) {
    return v
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }

  async function handleSave() {
    const finalName = toTitleCase(name.trim() || hotel.hotelName)
    const payload = {
      name: finalName,
      displayName: displayName.trim() || finalName,
      logoUrl,
      address: { line: addressLine, city, state, pincode },
      contact: { phone, email },
      tax: { gstNumber, gstPercent: Number(gstPercent || 0) },
      invoice: { prefix: invoicePrefix || 'INV-', footerText: invoiceFooter || '' },
    }
    await saveHotelInfo(payload)
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-textPrimary mb-4">Hotel Info</h3>
      <div className="grid grid-cols-2 gap-4 max-w-3xl">
        <div className="col-span-2">
          <label className="block text-sm text-textMuted mb-1">Hotel Name *</label>
          <input className="w-full border border-borderLight rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setName(toTitleCase(name))} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-textMuted mb-1">Display Name</label>
          <input className="w-full border border-borderLight rounded px-3 py-2" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-textMuted mb-1">Hotel Logo</label>
          <input
            className="w-full border border-borderLight rounded px-3 py-2"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              const reader = new FileReader()
              reader.onload = () => setLogoUrl(String(reader.result || ''))
              reader.readAsDataURL(f)
            }}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-textMuted mb-1">Address Line *</label>
          <input className="w-full border border-borderLight rounded px-3 py-2" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-textMuted mb-1">City *</label>
          <input className="w-full border border-borderLight rounded px-3 py-2" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-textMuted mb-1">State *</label>
          <input className="w-full border border-borderLight rounded px-3 py-2" value={state} onChange={(e) => setState(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-textMuted mb-1">Pincode *</label>
          <input className="w-full border border-borderLight rounded px-3 py-2" value={pincode} onChange={(e) => setPincode(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-textMuted mb-1">Phone *</label>
          <input className="w-full border border-borderLight rounded px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-textMuted mb-1">Email *</label>
          <input className="w-full border border-borderLight rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-textMuted mb-1">GST Number (optional)</label>
          <input className="w-full border border-borderLight rounded px-3 py-2" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-textMuted mb-1">GST Percentage</label>
          <input className="w-full border border-borderLight rounded px-3 py-2" type="number" min={0} value={gstPercent} onChange={(e) => setGstPercent(e.target.value ? Number(e.target.value) : 0)} />
        </div>
        <div>
          <label className="block text-sm text-textMuted mb-1">Invoice Prefix *</label>
          <input className="w-full border border-borderLight rounded px-3 py-2" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm text-textMuted mb-1">Invoice Footer Text</label>
          <input className="w-full border border-borderLight rounded px-3 py-2" value={invoiceFooter} onChange={(e) => setInvoiceFooter(e.target.value)} />
        </div>
      </div>

      <div className="mt-6">
        <button 
          onClick={handleSave}
          className="bg-accentPrimary text-textPrimary px-6 py-2 rounded-lg font-medium shadow-sm transition-colors hover:opacity-90"
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}
