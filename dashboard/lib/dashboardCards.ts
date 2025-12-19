export type DashboardCardKey =
  | 'TOTAL_ROOMS'
  | 'OCCUPIED_ROOMS'
  | 'VACANT_ROOMS'
  | 'CLEANING_PENDING'
  | 'TODAY_CHECKINS'
  | 'TODAY_CHECKOUTS'
  | 'TODAY_REVENUE'
  | 'MONTHLY_REVENUE'
  | 'PENDING_PAYMENTS'
  | 'FOOD_ORDERS_TODAY'

export const DASHBOARD_CARD_REGISTRY: Array<{
  group: string
  cards: Array<{ key: DashboardCardKey; label: string }>
}> = [
  {
    group: '🏨 ROOMS',
    cards: [
      { key: 'TOTAL_ROOMS', label: 'Total Rooms' },
      { key: 'OCCUPIED_ROOMS', label: 'Occupied Rooms' },
      { key: 'VACANT_ROOMS', label: 'Vacant Rooms' },
      { key: 'CLEANING_PENDING', label: 'Cleaning Pending' },
    ],
  },
  {
    group: '🔄 TODAY FLOW',
    cards: [
      { key: 'TODAY_CHECKINS', label: 'Today Check-ins' },
      { key: 'TODAY_CHECKOUTS', label: 'Today Check-outs' },
    ],
  },
  {
    group: '💰 REVENUE',
    cards: [
      { key: 'TODAY_REVENUE', label: 'Today’s Revenue' },
      { key: 'MONTHLY_REVENUE', label: 'Monthly Revenue' },
      { key: 'PENDING_PAYMENTS', label: 'Pending Payments' },
    ],
  },
  {
    group: '🍽 FOOD',
    cards: [
      { key: 'FOOD_ORDERS_TODAY', label: 'Food Orders Today' },
    ],
  },
]

export function labelForKey(key: DashboardCardKey): string {
  for (const grp of DASHBOARD_CARD_REGISTRY) {
    const found = grp.cards.find((c) => c.key === key)
    if (found) return found.label
  }
  return key
}
