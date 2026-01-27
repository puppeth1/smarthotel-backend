"use client"
import ChatAgent from '@/components/ChatAgent'
import DashboardCard from '@/components/DashboardCard'
import { useEffect, useState } from 'react'
import { useHotel } from '@/components/HotelProvider'
import { DashboardCardKey } from '@/lib/dashboardCards'
import CustomizeDashboardModal from '@/components/CustomizeDashboardModal'
import DashboardCardsGrid from '@/components/DashboardCardsGrid'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://smarthotel-backend-984031420056.asia-south1.run.app'

function SidebarHeader() {
  const { hotel } = useHotel()
  return <h2 className="font-bold text-lg text-[#111827]">{hotel.hotelName}</h2>
}

type Task = { id: string; text: string; done: boolean; createdAt: number; completedAt?: number }

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [addingTask, setAddingTask] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [selectedCards, setSelectedCards] = useState<DashboardCardKey[]>([])
  const { data: metrics, loading } = useDashboardMetrics()
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { hotel } = useHotel()
  const hasActiveType = ((hotel?.settings?.roomTypes as any[]) || []).some((v: any) => v?.active && (v?.count || 0) > 0)
  const settingsIncomplete = !hotel?.settings?.totalTables || !hasActiveType

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hp_tasks')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          if (parsed.length && typeof parsed[0] === 'string') {
            setTasks(parsed.map((t: string) => ({ id: crypto.randomUUID(), text: t, done: false, createdAt: Date.now() })))
          } else {
            const now = Date.now()
            const pruned = (parsed as Task[]).filter((t) => !(t.done && t.completedAt && now - t.completedAt > 24 * 60 * 60 * 1000))
            setTasks(pruned)
          }
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('hp_tasks', JSON.stringify(tasks))
    } catch {}
  }, [tasks])

  useEffect(() => {
    const i = setInterval(() => {
      const now = Date.now()
      setTasks((ts) => ts.filter((t) => !(t.done && t.completedAt && now - t.completedAt > 24 * 60 * 60 * 1000)))
    }, 5 * 60 * 1000)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const cfgRes = await fetch(`/api/dashboard/config`)
        const cfgJson = await cfgRes.json()
        const cards: DashboardCardKey[] = (cfgJson?.cards || []) as DashboardCardKey[]
        if (mounted && cards.length) setSelectedCards(cards)
      } catch {}
      if (mounted) {
        try {
          const saved = localStorage.getItem('dashboard_cards')
          if (saved) {
            const parsed = JSON.parse(saved)
            if (Array.isArray(parsed)) setSelectedCards(parsed as DashboardCardKey[])
          }
        } catch {}
      }
      if (mounted) setLoadingSummary(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  async function handleSave(cards: DashboardCardKey[]) {
    setSelectedCards(cards)
    try {
      localStorage.setItem('dashboard_cards', JSON.stringify(cards))
    } catch {}
    setSaving(true)
    try {
      await fetch(`${API_URL}/dashboard/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cards: cards.slice(0, 8) }),
      })
      
    } catch {}
    setSaving(false)
    setCustomizeOpen(false)
  }

  return (
    <div className="h-screen overflow-hidden bg-white flex">
      <aside className="w-64 bg-accentSecondary/10 border-r border-[#E5E7EB] p-4">
        <div className="">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#111827]">Tasks</span>
            <button
              className="text-sm px-2 py-1 rounded bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-accentSecondary"
              onClick={() => setAddingTask(!addingTask)}
            >
              ＋ Add Task
            </button>
          </div>

          {addingTask && (
            <div className="flex gap-2 mb-3">
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="e.g. Add room 204"
                className="flex-1 border border-[#E5E7EB] rounded px-2 py-1 text-sm"
              />
              <button
                className="px-3 py-1 rounded bg-accentPrimary text-black text-sm"
                onClick={() => {
                  if (newTask.trim()) {
                    const task: Task = { id: crypto.randomUUID(), text: newTask.trim(), done: false, createdAt: Date.now() }
                    setTasks((t) => [task, ...t])
                    setNewTask('')
                    setAddingTask(false)
                  }
                }}
              >
                Add
              </button>
            </div>
          )}

          <ul className="space-y-2">
            {(tasks.length ? tasks : [
              { id: 'seed-1', text: 'Add room 204 as deluxe price 5000', done: false, createdAt: Date.now() },
              { id: 'seed-2', text: 'Checkout room 301', done: false, createdAt: Date.now() },
            ]).map((t) => (
              <li
                key={t.id}
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${t.id?.startsWith('seed-') ? 'bg-white/50' : 'bg-white'} border border-[#E5E7EB]`}
              >
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: checked, completedAt: checked ? Date.now() : undefined } : x)))
                  }}
                />
                <button
                  className={`flex-1 text-left hover:bg-accentSecondary rounded px-1 ${t.done ? 'line-through text-[#6B7280]' : t.id?.startsWith('seed-') ? 'text-[#6B7280]' : 'text-[#111827]'}`}
                  onClick={() => {
                    const ev = new CustomEvent('hp_task_selected', { detail: { text: t.text } })
                    window.dispatchEvent(ev)
                  }}
                >
                  {t.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xl font-semibold text-[#111827]">Dashboard — {hotel.hotelName}</div>
          <button
            className="px-3 py-2 rounded bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-accentSecondary"
            onClick={() => setCustomizeOpen(true)}
          >
            Customize Dashboard
          </button>
        </div>

        {settingsIncomplete && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-[#F59E0B] bg-[#FEF3C7] px-3 py-2 text-[#92400E]">
            <span className="mt-0.5">⚠️</span>
            <div>
              <div className="font-semibold">Please complete hotel settings to see accurate dashboard data</div>
              <div className="text-sm text-[#B45309]">Configure room types and total tables in Settings.</div>
            </div>
          </div>
        )}

        {loadingSummary && !metrics ? (
          <div className="p-3">Loading dashboard…</div>
        ) : (
          <DashboardCardsGrid
            cards={selectedCards.length ? selectedCards : ['TOTAL_ROOMS', 'OCCUPIED_ROOMS', 'VACANT_ROOMS', 'TODAY_CHECKINS', 'TODAY_CHECKOUTS', 'TODAY_REVENUE', 'MONTHLY_REVENUE', 'PENDING_PAYMENTS']}
            metrics={metrics}
          />
        )}

        {customizeOpen && (
          <CustomizeDashboardModal
            selectedCards={selectedCards}
            onClose={() => setCustomizeOpen(false)}
            onSave={handleSave}
          />
        )}

        <ChatAgent showSidebar={false} />
      </main>
    </div>
  )
}
