'use client'
import { useEffect, useState } from 'react'
import { useHotel } from '@/components/HotelProvider'
import { PencilSquareIcon } from '@heroicons/react/24/outline'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://smarthotel-backend-984031420056.asia-south1.run.app'

export default function HotelSettingsPage() {
  const { hotel, saveHotelInfo } = useHotel()
  const [isEditing, setIsEditing] = useState(false)
  
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

  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

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
    setIsEditing(false)
  }

  const InfoRow = ({ label, value }: { label: string, value: string | number }) => (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
      <dd className="text-base text-gray-900">{value || '-'}</dd>
    </div>
  )

  if (!isEditing) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-textPrimary">Hotel Info</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <PencilSquareIcon className="w-4 h-4" />
            Edit Details
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 border-b pb-2">Basic Details</h4>
              <InfoRow label="Hotel Name" value={name} />
              <InfoRow label="Display Name" value={displayName} />
              <div className="py-3 border-b border-gray-100 last:border-0">
                <dt className="text-sm font-medium text-gray-500 mb-2">Hotel Logo</dt>
                <dd>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Hotel Logo" className="h-16 w-auto object-contain border rounded p-1" />
                  ) : (
                    <span className="text-gray-400 italic">No logo uploaded</span>
                  )}
                </dd>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 border-b pb-2">Address & Contact</h4>
              <InfoRow label="Address" value={addressLine} />
              <InfoRow label="City" value={city} />
              <InfoRow label="State" value={state} />
              <InfoRow label="Pincode" value={pincode} />
              <InfoRow label="Phone" value={phone} />
              <InfoRow label="Email" value={email} />
            </div>

            <div className="space-y-1 md:col-span-2 mt-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 border-b pb-2">Tax & Invoice Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                <div>
                  <InfoRow label="GST Number" value={gstNumber} />
                  <InfoRow label="GST Percentage" value={gstPercent + '%'} />
                </div>
                <div>
                  <InfoRow label="Invoice Prefix" value={invoicePrefix} />
                  <InfoRow label="Invoice Footer Text" value={invoiceFooter} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-textPrimary">Edit Hotel Info</h3>
      </div>

      {saveStatus === 'success' && (
        <div className="mb-4 p-3 bg-[#E7F78F]/20 border border-[#E7F78F] text-black text-sm rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Saved successfully!
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-2 gap-6 max-w-4xl">
          {/* Basic Details */}
          <div className="col-span-2 space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b pb-2">Basic Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-black focus:border-black outline-none transition-all" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setName(toTitleCase(name))} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-black focus:border-black outline-none transition-all" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Logo</label>
                <div className="flex items-center gap-4">
                  {logoUrl && <img src={logoUrl} alt="Preview" className="h-12 w-12 object-contain border rounded" />}
                  <input
                    className="flex-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
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
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="col-span-2 space-y-4 mt-2">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b pb-2">Address & Contact</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-black focus:border-black outline-none transition-all" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-black focus:border-black outline-none transition-all" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-black focus:border-black outline-none transition-all" value={state} onChange={(e) => setState(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-black focus:border-black outline-none transition-all" value={pincode} onChange={(e) => setPincode(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-black focus:border-black outline-none transition-all" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-black focus:border-black outline-none transition-all" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Tax & Invoice */}
          <div className="col-span-2 space-y-4 mt-2">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b pb-2">Tax & Invoice</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-black focus:border-black outline-none transition-all" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Percentage</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-black focus:border-black outline-none transition-all" type="number" min={0} value={gstPercent} onChange={(e) => setGstPercent(e.target.value ? Number(e.target.value) : 0)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-black focus:border-black outline-none transition-all" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Footer Text</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-black focus:border-black outline-none transition-all" value={invoiceFooter} onChange={(e) => setInvoiceFooter(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-start gap-3 pb-8">
        <button
          onClick={() => setIsEditing(false)}
          className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 text-sm font-medium text-black bg-[#E7F78F] rounded-lg hover:opacity-90 transition-colors shadow-sm"
        >
          {saveStatus === 'success' ? 'Saved Successfully!' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
