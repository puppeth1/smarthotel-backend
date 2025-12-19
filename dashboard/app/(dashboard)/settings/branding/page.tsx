'use client'
import { useState, useEffect } from 'react'
import { useHotel } from '@/components/HotelProvider'

const PRESETS = [
  { name: 'Neo Mint', primary: '#E7F78F', secondary: '#D6F6E5' },
  { name: 'Ocean Blue', primary: '#3B82F6', secondary: '#DBEAFE' },
  { name: 'Sunset Orange', primary: '#F97316', secondary: '#FFEDD5' },
  { name: 'Royal Purple', primary: '#A855F7', secondary: '#F3E8FF' },
  { name: 'Classic B&W', primary: '#000000', secondary: '#F3F4F6' },
]

export default function BrandingSettingsPage() {
  const { hotel, saveSettings } = useHotel()
  
  // State
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#E7F78F')
  const [secondaryColor, setSecondaryColor] = useState('#D6F6E5')
  const [invoiceUseBrandColor, setInvoiceUseBrandColor] = useState(true)
  const [invoiceShowLogo, setInvoiceShowLogo] = useState(true)

  // Sync with hotel settings
  useEffect(() => {
    const b = hotel.settings?.branding || {}
    if (b.logoUrl !== undefined) setLogoUrl(b.logoUrl)
    if (b.primaryColor !== undefined) setPrimaryColor(b.primaryColor)
    else setPrimaryColor('#E7F78F') // Default
    if (b.secondaryColor !== undefined) setSecondaryColor(b.secondaryColor)
    else setSecondaryColor('#D6F6E5') // Default
    if (b.invoiceUseBrandColor !== undefined) setInvoiceUseBrandColor(b.invoiceUseBrandColor)
    if (b.invoiceShowLogo !== undefined) setInvoiceShowLogo(b.invoiceShowLogo)
  }, [hotel.settings])

  async function handleSave() {
    await saveSettings({
      branding: {
        logoUrl,
        primaryColor,
        secondaryColor,
        invoiceUseBrandColor,
        invoiceShowLogo,
      }
    })
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="max-w-4xl pb-20">
      <h2 className="text-2xl font-bold text-textPrimary mb-8">Branding & Theme</h2>

      {/* A. Brand Identity */}
      <section className="mb-10">
        <h3 className="text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
          A. Brand Identity
        </h3>
        <div className="bg-white p-6 rounded-lg border border-borderLight shadow-sm space-y-6">
          
          {/* Hotel Logo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-textSecondary mb-1">Hotel Logo</label>
              <p className="text-xs text-textMuted mb-3">
                Used in Dashboard, Invoices, PDF exports, and WhatsApp messages.
              </p>
              
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="relative border border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/svg+xml"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-1">
                      <span className="text-sm text-accentPrimary font-semibold">Upload a file</span>
                      <span className="text-sm text-textMuted"> or drag and drop</span>
                    </div>
                    <p className="text-xs text-textMuted mt-1">PNG, JPG, SVG up to 2MB</p>
                  </div>
                  
                  {/* URL Input Fallback */}
                  <div className="mt-3">
                    <label className="text-xs text-textMuted block mb-1">Or enter image URL directly</label>
                    <input 
                      type="url" 
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full p-2 text-sm border border-borderLight rounded bg-gray-50 text-textMuted"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="w-32 h-32 bg-gray-100 rounded-lg border border-borderLight flex items-center justify-center overflow-hidden relative group">
                  {logoUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                      <button 
                        onClick={() => setLogoUrl('')}
                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-medium"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-textMuted">No Logo</span>
                  )}
                </div>
              </div>
            </div>

            {/* Brand Name (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">Brand Name Display</label>
              <div className="p-2 bg-gray-50 border border-borderLight rounded text-textPrimary font-medium">
                {hotel.hotelName}
              </div>
              <p className="text-xs text-textMuted mt-1">Auto-updated from Hotel Info</p>
            </div>
          </div>

        </div>
      </section>

      {/* B. Color Theme */}
      <section className="mb-10">
        <h3 className="text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
          B. Color Theme
        </h3>
        <div className="bg-white p-6 rounded-lg border border-borderLight shadow-sm">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">Primary Brand Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-12 w-12 p-1 rounded border border-borderLight cursor-pointer"
                />
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full p-2 border border-borderLight rounded font-mono text-sm uppercase"
                  />
                </div>
              </div>
              <p className="text-xs text-textMuted mt-2">Used for buttons, active menu, highlights.</p>
            </div>

            {/* Secondary Color */}
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">Secondary Accent Color</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-12 w-12 p-1 rounded border border-borderLight cursor-pointer"
                />
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full p-2 border border-borderLight rounded font-mono text-sm uppercase"
                  />
                </div>
              </div>
              <p className="text-xs text-textMuted mt-2">Used for backgrounds, badges, soft UI.</p>
            </div>
          </div>

          {/* C. Theme Presets */}
          <div className="border-t border-borderLight pt-6">
            <label className="block text-sm font-medium text-textSecondary mb-4">Theme Presets</label>
            <div className="flex flex-wrap gap-3">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    setPrimaryColor(p.primary)
                    setSecondaryColor(p.secondary)
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded border border-borderLight hover:border-accentPrimary transition-colors bg-gray-50"
                >
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: p.primary }} />
                    <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: p.secondary }} />
                  </div>
                  <span className="text-sm text-textPrimary">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* D. Invoice Branding */}
      <section className="mb-10">
        <h3 className="text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
          D. Invoice Branding
        </h3>
        <div className="bg-white p-6 rounded-lg border border-borderLight shadow-sm space-y-4">
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-textPrimary">Use brand colors on invoice</h4>
              <p className="text-sm text-textMuted">Applies primary color to headers and totals</p>
            </div>
            <button 
              onClick={() => setInvoiceUseBrandColor(!invoiceUseBrandColor)}
              className={`w-12 h-6 rounded-full relative transition-colors ${invoiceUseBrandColor ? 'bg-accentPrimary' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${invoiceUseBrandColor ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="border-t border-borderLight my-4" />

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-textPrimary">Show Logo on Invoice</h4>
              <p className="text-sm text-textMuted">Include your hotel logo in the invoice header</p>
            </div>
            <button 
              onClick={() => setInvoiceShowLogo(!invoiceShowLogo)}
              className={`w-12 h-6 rounded-full relative transition-colors ${invoiceShowLogo ? 'bg-accentPrimary' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${invoiceShowLogo ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

        </div>
      </section>

      {/* Save Button */}
      <div className="pt-6">
        <button 
          onClick={handleSave}
          className="bg-accentPrimary text-textPrimary px-6 py-2 rounded-lg font-medium shadow-sm transition-colors hover:opacity-90"
        >
          Save Branding
        </button>
      </div>

    </div>
  )
}
