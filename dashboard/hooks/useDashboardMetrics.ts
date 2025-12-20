import { useEffect, useState, useCallback, useMemo } from 'react'
import { useHotel } from '@/components/HotelProvider'
import { useRoomsEngine } from '@/lib/rooms-engine'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://smarthotel-backend-984031420056.asia-south1.run.app'

export function useDashboardMetrics() {
  const { hotel } = useHotel()
  const { rooms, loading: roomsLoading, refresh: refreshRooms } = useRoomsEngine()
  const [summaryData, setSummaryData] = useState<any>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)

  const fetchSummary = useCallback(() => {
    // Only show loading if we have no data yet
    if (!summaryData) {
        setLoadingSummary(true)
    }
    fetch(`${API_URL}/dashboard/summary`)
      .then((res) => res.json())
      .then((json) => {
        const flat = {
          // We will override room counts with our Smart Engine data
          // but keep revenue and other stats from backend
          todayCheckins: json.today?.checkins,
          todayCheckouts: json.today?.checkouts,
          todayRevenue: json.revenue?.today,
          monthlyRevenue: json.revenue?.monthly,
          pendingPayments: json.revenue?.pending,
          foodOrdersToday: json.today?.food_orders,
        }
        setSummaryData(flat)
        setLoadingSummary(false)
      })
      .catch(() => setLoadingSummary(false))
  }, [])

  useEffect(() => {
    fetchSummary()
    
    function onRefresh() {
      fetchSummary()
      refreshRooms()
    }
    window.addEventListener('hp_refresh_stats', onRefresh)
    return () => window.removeEventListener('hp_refresh_stats', onRefresh)
  }, [fetchSummary, refreshRooms])

  const mergedData = useMemo(() => {
    // If we have no summary data and no room data, return null (loading state)
    // But if we have ONE of them (e.g. rooms loaded but summary updating), try to show partial?
    // Actually safer to wait for initial load of both.
    // BUT during refresh, we keep the old data.
    
    // We need both sources to be ready-ish, but rooms is critical for the counts
    if (!summaryData && loadingSummary) return null
    
    const apiData = summaryData || {}
    
    // Smart Engine Counts
    const occupied = rooms.filter(r => r.computed_status === 'OCCUPIED').length
    const maintenance = rooms.filter(r => r.computed_status === 'MAINTENANCE').length
    
    // Settings-Based Total (Per user request: sync with settings capacity)
    const settingsTotal = (hotel?.settings?.roomTypes || []).reduce((acc: number, rt: any) => {
        return acc + (Number(rt.count) || 0)
    }, 0)

    // Use settings total if available, otherwise reality, but reality wins if it's larger (extra rooms added)
    const total = settingsTotal > 0 ? Math.max(settingsTotal, rooms.length) : rooms.length

    // Vacant = Total - Occupied - Maintenance
    const vacant = Math.max(0, total - occupied - maintenance)
    
    // Calculate cleaning pending? 
    // Our engine doesn't track 'cleaning' status explicitly yet (it's VACANT/OCCUPIED/MAINTENANCE)
    // Assuming 'cleaning' is a backend state we might miss, 
    // or we can map specific logic if we had 'DIRTY' status.
    // For now, let's assume VACANT includes clean+dirty unless specified.
    const cleaning = 0 

    return {
      ...apiData,
      totalRooms: total,
      vacantRooms: vacant,
      occupiedRooms: occupied,
      cleaningPending: cleaning,
      maintenanceRooms: maintenance
    }
  }, [rooms, summaryData, loadingSummary, hotel?.settings])

  return { data: mergedData, loading: roomsLoading || loadingSummary, refetch: () => { fetchSummary(); refreshRooms(); } }
}
