'use client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Subscription = { plan: 'BASIC' | 'PRO' | 'ENTERPRISE'; roomLimit?: number; staffLimit?: number | 'Infinity' }
type HotelSettings = { address?: string; city?: string; state?: string; phone?: string; email?: string; gst?: string; invoiceFooter?: string }
type HotelState = { hotelId: string; hotelName: string; name: string; subscription: Subscription; settings: HotelSettings }

const Ctx = createContext<{
  hotel: HotelState
  setHotel: (h: Partial<HotelState>) => void
  updateHotelName: (name: string) => Promise<void>
} | null>(null)

export function HotelProvider({ children }: { children: React.ReactNode }) {
  const [hotel, setHotelState] = useState<HotelState>({
    hotelId: 'hotel_default',
    hotelName: 'SmartHotel',
    name: 'SmartHotel',
    subscription: { plan: 'BASIC' },
    settings: {},
  })

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch('http://localhost:3000/api/hotels/active')
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
    }
    load()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('hp_hotel', JSON.stringify(hotel))
    } catch {}
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
        await fetch(`http://localhost:3000/api/hotels/${hotel.hotelId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: title }),
        })
      } catch {}
    },
  }), [hotel])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useHotel() {
  const v = useContext(Ctx)
  if (!v) throw new Error('HotelProvider missing')
  return v
}
