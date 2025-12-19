'use client'
import { useEffect, useState } from 'react'
import { useHotel } from '@/components/HotelProvider'

const CURRENCIES = [
  { code: 'INR', symbol: '₹', locale: 'en-IN', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', locale: 'en-US', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', locale: 'de-DE', name: 'Euro' }, // generic EU locale
  { code: 'GBP', symbol: '£', locale: 'en-GB', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', locale: 'ar-AE', name: 'UAE Dirham' },
  { code: 'SGD', symbol: '$', locale: 'en-SG', name: 'Singapore Dollar' },
  { code: 'AUD', symbol: '$', locale: 'en-AU', name: 'Australian Dollar' },
  { code: 'CAD', symbol: '$', locale: 'en-CA', name: 'Canadian Dollar' },
  { code: 'JPY', symbol: '¥', locale: 'ja-JP', name: 'Japanese Yen' },
]

export default function BillingSettingsPage() {
  const { hotel, saveSettings } = useHotel()
  
  // Currency
  const [currencyCode, setCurrencyCode] = useState('INR')
  
  // Tax
  const [taxType, setTaxType] = useState<'NONE' | 'GST' | 'VAT' | 'SALES_TAX'>('GST')
  const [taxName, setTaxName] = useState('GST')
  const [taxPercent, setTaxPercent] = useState<number | ''>(18)
  const [isSplit, setIsSplit] = useState(true) // CGST+SGST
  
  // Payments
  const [cashEnabled, setCashEnabled] = useState(true)
  const [upiEnabled, setUpiEnabled] = useState(false)
  const [bankEnabled, setBankEnabled] = useState(false)
  
  // Payment Details
  const [upiId, setUpiId] = useState('')
  const [showQr, setShowQr] = useState(true)
  
  const [bankName, setBankName] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifsc, setIfsc] = useState('')
  
  const [toast, setToast] = useState<string | null>(null)

  // Load settings
  useEffect(() => {
    const s = hotel.settings || {}
    
    // Currency
    if (s.currency) {
      setCurrencyCode(s.currency.code)
    }
    
    // Tax
    if (s.tax) {
      setTaxType(s.tax.type)
      setTaxName(s.tax.name)
      setTaxPercent(s.tax.percentage)
      setIsSplit(!!s.tax.isSplit)
    } else {
        // Default fallbacks if no settings exist
        setTaxType('GST')
        setTaxName('GST')
        setTaxPercent(18)
        setIsSplit(true)
    }
    
    // Payments
    if (s.payments) {
      setCashEnabled(s.payments.cashEnabled !== false) // Default true
      setUpiEnabled(!!s.payments.upiEnabled)
      setBankEnabled(!!s.payments.bankEnabled)
      
      setUpiId(s.payments.upiId || '')
      setShowQr(s.payments.showQr !== false)
      
      setBankName(s.payments.bankName || '')
      setAccountHolder(s.payments.accountHolder || '')
      setAccountNumber(s.payments.accountNumber || '')
      setIfsc(s.payments.ifsc || '')
    }
  }, [hotel.settings])

  // Handle Currency Change
  const handleCurrencyChange = (code: string) => {
    setCurrencyCode(code)
    // Auto-hide UPI if not INR
    if (code !== 'INR') {
      setUpiEnabled(false)
    }
  }

  const selectedCurrency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0]

  async function handleSave() {
    // Validation
    if (taxType !== 'NONE' && (taxPercent === '' || Number(taxPercent) < 0)) {
      setToast('Please enter a valid tax percentage')
      return
    }

    const newSettings = {
      currency: selectedCurrency ? {
        code: selectedCurrency.code,
        symbol: selectedCurrency.symbol,
        locale: selectedCurrency.locale
      } : undefined,
      tax: {
        enabled: taxType !== 'NONE',
        type: taxType,
        name: taxName,
        percentage: Number(taxPercent || 0),
        isSplit: isSplit
      },
      payments: {
        cashEnabled,
        upiEnabled: currencyCode === 'INR' ? upiEnabled : false, // Force disable if not INR
        upiId,
        showQr,
        bankEnabled,
        bankName,
        accountHolder,
        accountNumber,
        ifsc
      }
    }

    await saveSettings(newSettings)
    setToast('Settings saved successfully')
    setTimeout(() => setToast(null), 3000)
  }

  // Example Invoice Amount
  const exampleAmount = 1200
  const formattedExample = new Intl.NumberFormat(selectedCurrency.locale, {
    style: 'currency',
    currency: selectedCurrency.code
  }).format(exampleAmount)

  return (
    <div className="max-w-4xl pb-20 space-y-8">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* 1. Currency Selector */}
      <section className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Currency Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Currency *</label>
            <select
              value={currencyCode}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code} - {c.name} ({c.symbol})</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Used for all room pricing, food menus, and reports.
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded border border-gray-100 flex items-center justify-center flex-col">
            <span className="text-sm text-gray-500 mb-1">Preview Formatting</span>
            <span className="text-2xl font-bold text-gray-900">{formattedExample}</span>
          </div>
        </div>
      </section>

      {/* 2. Tax System */}
      <section className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tax Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="taxType" 
                  checked={taxType === 'NONE'} 
                  onChange={() => setTaxType('NONE')}
                  className="w-4 h-4 text-blue-600"
                />
                <span>No Tax</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="taxType" 
                  checked={taxType === 'GST'} 
                  onChange={() => { setTaxType('GST'); setTaxName('GST'); setIsSplit(true); }}
                  className="w-4 h-4 text-blue-600"
                />
                <span>GST / VAT</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="taxType" 
                  checked={taxType === 'SALES_TAX'} 
                  onChange={() => { setTaxType('SALES_TAX'); setTaxName('Sales Tax'); setIsSplit(false); }}
                  className="w-4 h-4 text-blue-600"
                />
                <span>Sales Tax</span>
              </label>
            </div>
          </div>

          {taxType !== 'NONE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Name</label>
                <input
                  type="text"
                  value={taxName}
                  onChange={(e) => setTaxName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. GST, VAT"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Percentage (%)</label>
                <input
                  type="number"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="0.00"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSplit}
                    onChange={(e) => setIsSplit(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Split Tax (e.g., CGST + SGST)</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Check this for India (GST) or Canada (HST). Uncheck for US/EU/Middle East.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Payment Methods */}
      <section className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h2>
        
        <div className="space-y-6">
          {/* Cash */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={cashEnabled}
              onChange={(e) => setCashEnabled(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 rounded"
            />
            <div>
              <span className="font-medium text-gray-900">Cash</span>
              <p className="text-sm text-gray-500">Enable cash collection at desk.</p>
            </div>
          </div>

          {/* UPI (India Only) */}
          {currencyCode === 'INR' && (
            <div className="border rounded-md p-4 bg-gray-50">
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={upiEnabled}
                  onChange={(e) => setUpiEnabled(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <span className="font-medium text-gray-900">UPI (India)</span>
                  <p className="text-sm text-gray-500">Show QR code on invoices and checkout.</p>
                </div>
              </div>
              
              {upiEnabled && (
                <div className="ml-7 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID / VPA</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="e.g. business@upi"
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showQr}
                      onChange={(e) => setShowQr(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Auto-generate QR Code</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Bank Transfer */}
          <div className="border rounded-md p-4 bg-gray-50">
            <div className="flex items-start gap-3 mb-4">
              <input
                type="checkbox"
                checked={bankEnabled}
                onChange={(e) => setBankEnabled(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <span className="font-medium text-gray-900">Bank Transfer</span>
                <p className="text-sm text-gray-500">Display bank details on invoices.</p>
              </div>
            </div>

            {bankEnabled && (
              <div className="ml-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder</label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC / SWIFT / IBAN</label>
                  <input
                    type="text"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="pt-6">
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
