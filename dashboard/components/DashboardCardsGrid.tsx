'use client'
import DashboardCard from '@/components/DashboardCard'
import { DashboardCardKey } from '@/lib/dashboardCards'

export default function DashboardCardsGrid({
  cards,
  metrics,
}: {
  cards: DashboardCardKey[]
  metrics: any
}) {
  if (!cards.length) {
    return <div className="text-[#6B7280] text-sm mt-6">No cards selected. Click “Customize”.</div>
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      {cards.map((k) => (
        <DashboardCard key={k} cardKey={k} metrics={metrics} />
      ))}
    </div>
  )
}
