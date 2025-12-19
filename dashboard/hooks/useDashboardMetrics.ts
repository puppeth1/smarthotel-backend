import { useEffect, useState, useCallback, useMemo } from 'react'
import { useHotel } from '@/components/HotelProvider'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://smarthotel-backend-984031420056.asia-south1.run.app'

export function useDashboardMetrics() {
  const { hotel } = useHotel()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    setLoading(true)
    fetch(`${API_URL}/api/dashboard/summary`)
      .then((res) => res.json())
      .then((json) => {
        // Flatten the summary structure for easier consumption by cards
        const flat = {
          totalRooms: json.rooms?.total,
          occupiedRooms: json.rooms?.occupied,
          vacantRooms: json.rooms?.vacant,
          cleaningPending: json.rooms?.cleaning_pending,
          todayCheckins: json.today?.checkins,
          todayCheckouts: json.today?.checkouts,
          todayRevenue: json.revenue?.today,
          monthlyRevenue: json.revenue?.monthly,
          pendingPayments: json.revenue?.pending,
          foodOrdersToday: json.today?.food_orders,
        }
        setData(flat)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    refetch()
    
    function onRefresh() {
      refetch()
    }
    window.addEventListener('hp_refresh_stats', onRefresh)
    return () => window.removeEventListener('hp_refresh_stats', onRefresh)
  }, [refetch])

  const mergedData = useMemo(() => {
    // If data is null (not loaded yet), we might still want to show local config if available?
    // But we need occupied/cleaning from API.
    // Let's assume 0 for API values if data is null but we have local config.
    const apiData = data || {}
    
    // Sync with local settings for immediate updates
    const settings = hotel.settings || {}
    const roomTypes = settings.roomTypes || []
    
    // Check if we have local config
    const hasLocalConfig = Array.isArray(settings.roomTypes) && settings.roomTypes.length > 0
    
    const localTotal = roomTypes.reduce((acc: number, r: any) => acc + (Number(r.count) || 0), 0)
    const maintenance = Number(settings.maintenanceBuffer) || 0
    
    // Use API values as base
    const occupied = Number(apiData.occupiedRooms) || 0
    const cleaning = Number(apiData.cleaningPending) || 0
    
    // Override total if we have local settings
    const total = hasLocalConfig ? localTotal : (Number(apiData.totalRooms) || 0)
    
    // Recalculate vacant based on new total
    // Vacant = Total - Occupied - Cleaning - Maintenance
    const vacant = Math.max(0, total - occupied - cleaning - maintenance)
    
    if (!data && !hasLocalConfig) return null

    return {
      ...apiData,
      totalRooms: total,
      vacantRooms: vacant,
      occupiedRooms: occupied,
      cleaningPending: cleaning
    }
  }, [data, hotel.settings])

  return { data: mergedData, loading, refetch }
}
