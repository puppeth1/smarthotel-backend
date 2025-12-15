'use client'

type CardProps = {
  title: string
  value: string | number
  subtitle?: string
  accent?: 'primary' | 'secondary'
}

export default function DashboardCard({ title, value, subtitle, accent = 'secondary' }: CardProps) {
  const bg = accent === 'primary' ? 'bg-[#e7f78f]' : 'bg-[#d6f6e5]'
  return (
    <div className={`rounded-xl p-4 ${bg}`}>
      <p className="text-xs text-black/60">{title}</p>
      <p className="text-2xl font-semibold text-black">{value}</p>
      {subtitle && <p className="text-xs text-black/60 mt-1">{subtitle}</p>}
    </div>
  )
}
