'use client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '@/components/AuthProvider'
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://smarthotel-backend-984031420056.asia-south1.run.app'

type Subscription = { plan: 'BASIC' | 'PRO' | 'ENTERPRISE'; roomLimit?: number; staffLimit?: number | 'Infinity' }
type HotelSettings = {
  name?: string
  legalBusinessName?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  phone?: string
  email?: string
  gst?: string
  totalRooms?: number
  totalTables?: number
  maxGuestsPerRoom?: number
  checkinTime?: string
  checkoutTime?: string
  roomTypes?: { type: string; count: number; maxGuests: number; basePrice: number; active: boolean; roomNumberStart?: number; roomNumberEnd?: number }[]
  allowOverbooking?: boolean
  maintenanceBuffer?: number
  autoPriceOverride?: boolean
  invoicePrefix?: string
  nextInvoiceNumber?: number
  invoiceStartNumber?: number
  invoiceFooter?: string
  invoiceTemplate?: string
  roundOffRule?: string
  currency?: {
    code: string
    symbol: string
    locale: string
  }
  tax?: { 
    enabled: boolean
    type: 'NONE' | 'GST' | 'VAT' | 'SALES_TAX'
    name: string
    percentage: number
    isSplit?: boolean // For CGST+SGST
  }
  payments?: { 
    cashEnabled?: boolean
    upiEnabled?: boolean
    upiId: string
    upiName?: string
    showQr?: boolean
    bankEnabled?: boolean
    bankName?: string
    accountHolder?: string
    accountNumber?: string
    ifsc?: string 
  }
  whatsapp?: { 
    enabled: boolean
    display_number: string
    monthly_quota: number
    used_this_month: number
    charge_per_message: number
    message_types: { 
      invoice: boolean
      payment_reminder: boolean
      booking_confirmation: boolean
      checkout_thanks: boolean
    }
    default_template: string
  }
  branding?: { 
    primaryColor?: string
    secondaryColor?: string
    logoUrl?: string
    invoiceUseBrandColor?: boolean
    invoiceShowLogo?: boolean
  }
  hotelInfo?: any
}
type HotelState = { hotelId: string; hotelName: string; name: string; subscription: Subscription; settings: HotelSettings }

export const HotelContext = createContext<{
  hotel: HotelState
  setHotel: (h: Partial<HotelState>) => void
  updateHotelName: (name: string) => Promise<void>
  saveSettings: (s: Partial<HotelSettings>) => Promise<void>
  saveHotelInfo: (info: any) => Promise<void>
} | null>(null)

export function HotelProvider({ children }: { children: React.ReactNode }) {
  const [hotel, setHotelState] = useState<HotelState>({
    hotelId: 'hotel_default',
    hotelName: 'SmartHotel',
    name: 'SmartHotel',
    subscription: { plan: 'BASIC' },
    settings: {},
  })
  const { user } = useContext(AuthContext)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const token = user ? await user.getIdToken() : ''
        const res = await fetch(`${API_URL}/api/hotels/active`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        })
        if (res.ok) {
          const data = await res.json()
          const h = data?.data || {}
          if (mounted) setHotelState((prev) => ({
            ...prev,
            hotelId: h.id || prev.hotelId,
            hotelName: h.name || prev.hotelName,
            name: h.name || prev.name,
          }))
        } else {
          const saved = localStorage.getItem('hp_hotel')
          if (saved) {
            const parsed = JSON.parse(saved)
            if (mounted) setHotelState((p) => ({ ...p, ...parsed }))
          }
        }
      } catch {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('hp_hotel') : null
        if (saved) {
          const parsed = JSON.parse(saved)
          if (mounted) setHotelState((p) => ({ ...p, ...parsed }))
        }
      }
      try {
        const token = user ? await user.getIdToken() : ''
        const ires = await fetch(`${API_URL}/api/settings/hotel-info`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        })
        if (ires.ok) {
          const ij = await ires.json()
          const info = ij?.data || {}
          if (mounted) setHotelState((p) => {
            const nm = typeof info?.name === 'string' ? info.name : p.hotelName
            const title = nm
              .split(' ')
              .filter(Boolean)
              .map((w: string) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
              .join(' ')
            return { ...p, hotelName: title, name: title, settings: { ...p.settings, hotelInfo: info } }
          })
        }
      } catch {}
      try {
        const token = user ? await user.getIdToken() : ''
        const sres = await fetch(`${API_URL}/api/hotel/settings`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        })
        if (sres.ok) {
          const sj = await sres.json()
          const settings = sj?.data || {}
          if (mounted) setHotelState((p) => ({ ...p, settings: { ...p.settings, ...settings } }))
        } else {
          const saved = localStorage.getItem('hp_hotel_settings')
          if (saved && mounted) setHotelState((p) => ({ ...p, settings: { ...p.settings, ...JSON.parse(saved) } }))
        }
      } catch {
        const saved = localStorage.getItem('hp_hotel_settings')
        if (saved) setHotelState((p) => ({ ...p, settings: { ...p.settings, ...JSON.parse(saved) } }))
      }
    }
    load()
    return () => { mounted = false }
  }, [user])

  useEffect(() => {
    try {
      localStorage.setItem('hp_hotel', JSON.stringify(hotel))
    } catch {}
    
    // Apply branding colors
    if (typeof document !== 'undefined') {
      const b = hotel.settings?.branding
      if (b?.primaryColor) {
        document.documentElement.style.setProperty('--brand-primary', b.primaryColor)
      } else {
        document.documentElement.style.removeProperty('--brand-primary')
      }
      if (b?.secondaryColor) {
        document.documentElement.style.setProperty('--brand-secondary', b.secondaryColor)
      } else {
        document.documentElement.style.removeProperty('--brand-secondary')
      }
    }
  }, [hotel])

  const api = useMemo(() => ({
    hotel,
    setHotel: (h: Partial<HotelState>) => setHotelState((prev) => {
      const nm = h.hotelName ?? h.name
      const next = { ...prev, ...h }
      if (typeof nm === 'string') {
        next.hotelName = nm
        next.name = nm
      }
      return next
    }),
    updateHotelName: async (name: string) => {
      const title = name
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
      setHotelState((prev) => ({ ...prev, hotelName: title, name: title }))
      try {
        const token = user ? await user.getIdToken() : ''
        await fetch(`${API_URL}/api/hotels/${hotel.hotelId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ name: title }),
        })
      } catch {}
    },
    saveSettings: async (s: Partial<HotelSettings>) => {
      const payload = { ...hotel.settings, ...s }
      setHotelState((p) => ({ ...p, settings: payload }))
      try {
        const token = user ? await user.getIdToken() : ''
        await fetch(`${API_URL}/api/hotel/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload),
        })
      } catch {}
      try {
        localStorage.setItem('hp_hotel_settings', JSON.stringify(payload))
      } catch {}
      // Notify listeners to refresh dependent data (like dashboard stats)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hp_refresh_stats'))
      }
    },
    saveHotelInfo: async (info: any) => {
      const nm = typeof info?.name === 'string' ? info.name : hotel.hotelName
      const title = nm
        .split(' ')
        .filter(Boolean)
        .map((w: string) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
      setHotelState((prev) => ({ ...prev, hotelName: title, name: title, settings: { ...prev.settings, hotelInfo: info } }))
      try {
        const token = user ? await user.getIdToken() : ''
        await fetch(`${API_URL}/api/settings/hotel-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(info),
        })
      } catch {}
      try {
        localStorage.setItem('hp_hotel_info', JSON.stringify(info))
      } catch {}
    },
  }), [hotel, user])

  return (
    <HotelContext.Provider value={api}>
      {children}
    </HotelContext.Provider>
  )
}

export function useHotel() {
  const context = useContext(HotelContext)
  if (!context) throw new Error('useHotel must be used within HotelProvider')
  return context
}
