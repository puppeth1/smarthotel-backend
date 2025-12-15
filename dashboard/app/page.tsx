"use client"
import ChatAgent from '@/components/ChatAgent'
import DashboardCard from '@/components/DashboardCard'
import { useEffect, useState } from 'react'
import { useHotel } from '@/components/HotelProvider'

function SidebarHeader() {
  const { hotel } = useHotel()
  return <h2 className="font-bold text-lg text-[#111827]">{hotel.hotelName}</h2>
}

type Task = { id: string; text: string; done: boolean; createdAt: number; completedAt?: number }

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [addingTask, setAddingTask] = useState(false)
  const [newTask, setNewTask] = useState('')

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

  return (
    <div className="h-screen overflow-hidden bg-white flex">
      <aside className="w-64 bg-[#F7F8FA] border-r border-[#E5E7EB] p-4">
        <div className="">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#111827]">Tasks</span>
            <button
              className="text-sm px-2 py-1 rounded bg-[#F9FAFB] border border-[#E5E7EB] hover:bg-[#D6F6E5]"
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
                className="px-3 py-1 rounded bg-[#E7F78F] text-black text-sm"
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
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${t.id?.startsWith('seed-') ? 'bg-[#F9FAFB]' : 'bg-white'} border border-[#E5E7EB]`}
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
                  className={`flex-1 text-left hover:bg-[#D6F6E5] rounded px-1 ${t.done ? 'line-through text-[#6B7280]' : t.id?.startsWith('seed-') ? 'text-[#6B7280]' : 'text-[#111827]'}`}
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
        <div className="grid grid-cols-4 gap-4 mb-6">
          <DashboardCard title="Rooms" value="18 / 24" subtitle="Occupied" accent="primary" />
          <DashboardCard title="Vacant Rooms" value={6} />
          <DashboardCard title="Cleaning Pending" value={3} />
          <DashboardCard title="Today Flow" value="4 / 5" subtitle="Check-in / out" />

          <DashboardCard title="Today Revenue" value="₹18,500" accent="primary" />
          <DashboardCard title="Monthly Revenue" value="₹4,25,000" />
          <DashboardCard title="Pending Payments" value="₹22,000" accent="primary" />
          <DashboardCard title="Food Orders Today" value="12" subtitle="₹6,800" />
        </div>

        <ChatAgent showSidebar={false} />
      </main>
    </div>
  )
}
