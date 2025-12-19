'use client'
import { DashboardCardKey, labelForKey } from '@/lib/dashboardCards'
import { useHotel } from '@/components/HotelProvider'
import { formatMoney } from '@/lib/formatMoney'

type BasicProps = {
  title: string
  value: string | number
  subtitle?: string
  accent?: 'primary' | 'secondary'
}

type MetricProps = {
  cardKey: DashboardCardKey
  metrics: any
  accent?: 'primary' | 'secondary'
}

export default function DashboardCard(props: BasicProps | MetricProps) {
  const { hotel } = useHotel()
  const currency = hotel?.settings?.currency
  
  const accent = 'accent' in props ? props.accent : ('accent' in props ? props.accent : 'secondary')
  const bg = (accent || 'secondary') === 'primary' ? 'bg-accentPrimary' : 'bg-accentSecondary'

  let title: string
  let value: string | number
  let subtitle: string | undefined

  if ('cardKey' in props) {
    title = labelForKey(props.cardKey)
    const m = props.metrics || {}
    const map: Record<DashboardCardKey, any> = {
      TOTAL_ROOMS: m.totalRooms,
      OCCUPIED_ROOMS: m.occupiedRooms,
      VACANT_ROOMS: m.vacantRooms,
      CLEANING_PENDING: m.cleaningPending,
      TODAY_CHECKINS: m.todayCheckins,
      TODAY_CHECKOUTS: m.todayCheckouts,
      TODAY_REVENUE: typeof m.todayRevenue === 'number' ? formatMoney(m.todayRevenue, currency?.code || 'INR', currency?.locale || 'en-IN') : m.todayRevenue,
      MONTHLY_REVENUE: typeof m.monthlyRevenue === 'number' ? formatMoney(m.monthlyRevenue, currency?.code || 'INR', currency?.locale || 'en-IN') : m.monthlyRevenue,
      PENDING_PAYMENTS: typeof m.pendingPayments === 'number' ? formatMoney(m.pendingPayments, currency?.code || 'INR', currency?.locale || 'en-IN') : m.pendingPayments,
      FOOD_ORDERS_TODAY: m.foodOrdersToday,
    }
    value = map[props.cardKey] ?? '-'
  } else {
    title = props.title
    value = props.value
    subtitle = props.subtitle
  }

  return (
    <div className={`rounded-xl p-4 ${bg}`}>
      <p className="text-xs text-black/60">{title}</p>
      <p className="text-2xl font-semibold text-black">{value}</p>
      {subtitle && <p className="text-xs text-black/60 mt-1">{subtitle}</p>}
    </div>
  )
}
