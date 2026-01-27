'use client'
import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthContext } from '@/components/AuthProvider'
import SettingsPanel from './SettingsPanel'
import { useHotel } from './HotelProvider'
import { useRoomsEngine } from '@/lib/rooms-engine'
import CheckInDrawer from './CheckInDrawer'
import AddInventoryDrawer from './AddInventoryDrawer'
import AddMenuDrawer from './AddMenuDrawer'
import CreateOrderDrawer from './CreateOrderDrawer'
import CheckoutDrawer from './CheckoutDrawer'
import AddExpenseDrawer from './AddExpenseDrawer'
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://smarthotel-backend-984031420056.asia-south1.run.app'

export default function ChatAgent({ showSidebar = true, useExternalInput = false }: { showSidebar?: boolean; useExternalInput?: boolean }) {
  const { user } = useContext(AuthContext)
  const engine = useRoomsEngine()
  const rooms = engine?.rooms || []
  
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [page, setPage] = useState<'home' | 'settings'>('home')
  type Task = { id: string; text: string; done: boolean; createdAt: number; completedAt?: number }
  const [tasks, setTasks] = useState<Task[]>([])
  const [addingTask, setAddingTask] = useState(false)
  const [newTask, setNewTask] = useState('')
  // helper state removed in favor of drawers
  const [toast, setToast] = useState<string | null>(null)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)

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
    function onTaskSelected(e: any) {
      try {
        const text = e?.detail?.text
        if (typeof text === 'string' && text.trim()) setInput(text)
      } catch {}
    }
    window.addEventListener('hp_task_selected', onTaskSelected)
    return () => window.removeEventListener('hp_task_selected', onTaskSelected)
  }, [])

  useEffect(() => {
    function onChatQuestion(e: any) {
      try {
        const text = e?.detail?.text
        if (typeof text === 'string' && text.trim()) {
          setInput(text)
          sendToAgent(text)
        }
      } catch {}
    }
    window.addEventListener('hp_chat_question', onChatQuestion)
    return () => window.removeEventListener('hp_chat_question', onChatQuestion)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  async function sendToAgent(override?: string) {
    const toSend = (override ?? input).trim()
    if (!toSend) return

    // Guard: prevent mutations via chat
    if (/^(add|update|create|checkout|mark|confirm|switch|collect payment)/i.test(toSend)) {
      setMessages((m) => [
        ...m,
        { role: 'user', text: toSend },
        { role: 'agent', text: 'Use Quick Actions for changes. Chat answers insights and summaries.' },
      ])
      setInput('')
      return
    }

    setMessages((m) => [...m, { role: 'user', text: toSend }])
    if (!override) setInput('')

    const reply = await answerQuestion(toSend)
    setMessages((m) => [...m, { role: 'agent', text: reply }])
  }

  async function submitAction(cmd: string | any) {
    const payload = typeof cmd === 'string' 
      ? { text: cmd, actor_id: 'u_owner', tenant_id: 'hotel_default' }
      : { ...cmd, actor_id: 'u_owner', tenant_id: 'hotel_default' }

    const res = await fetch(`${API_URL}/agent/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setToast(typeof data?.message === 'string' ? data.message : 'Action completed')
    window.dispatchEvent(new CustomEvent('hp_refresh_stats'))
  }

  async function answerQuestion(q: string) {
    const token = user ? await user.getIdToken() : ''
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {}

    const text = q.toLowerCase()

    function formatINR(n: number) {
      try {
        return `₹${Number(n || 0).toLocaleString('en-IN')}`
      } catch {
        return `₹${n}`
      }
    }

    // Use Dashboard Stats API for common metrics
    if (text.includes('vacant') || text.includes('revenue') || text.includes('orders') || text.includes('pending')) {
      try {
        const res = await fetch(`${API_URL}/dashboard/stats`, { headers })
        const stats = await res.json()
        
        if (text.includes('vacant')) {
          return `Vacant Rooms: ${stats.vacantRooms} / ${stats.totalRooms}`
        }
        if (text.includes('pending')) {
          return `Pending Payments: ${stats.pendingPayments}`
        }
        if (text.includes('orders')) {
          return `Orders Today: ${stats.foodOrdersToday}`
        }
        if (text.includes('revenue')) {
           return `Revenue Today: ${formatINR(stats.todayRevenue)}\nMonthly: ${formatINR(stats.monthlyRevenue)}`
        }
      } catch {
        return 'Could not fetch stats.'
      }
    }

    // Inventory low items (stock <= min_stock)
    if (text.includes('inventory') && (text.includes('low') || text.includes('alert'))) {
      const res = await fetch(`${API_URL}/inventory`, { headers })
      const json = await res.json()
      const items = json?.data || []
      const low = items.filter((i: any) => (i.stock || 0) <= (i.min_stock ?? 0))
      if (!low.length) return 'No low-stock items.'
      const list = low.map((i: any) => `${i.name}: ${i.stock} ${i.unit}`).join('\n')
      return `Low Stock Items:\n${list}`
    }

    return 'I can answer questions about revenue, rooms, inventory, and orders.'
  }

  return (
    <div className="flex h-full">
      {showSidebar && (
        <aside className="w-64 bg-bgSoft border-r border-borderLight p-4">
          <SidebarTitle />
          <ul className="mt-6 space-y-3 text-sm text-textMuted">
            <li className={`font-semibold ${page === 'home' ? 'text-textPrimary' : 'text-textMuted'}`}> 
              <button className="w-full text-left" onClick={() => setPage('home')}>Home</button>
            </li>
            <li className="text-textPrimary">
              <button className="w-full text-left" onClick={() => setPage('home')}>Rooms</button>
            </li>
            <li className="text-textPrimary">
              <button className="w-full text-left" onClick={() => setPage('home')}>Reservations</button>
            </li>
            <li className="text-textPrimary">
              <button className="w-full text-left" onClick={() => setPage('home')}>Menu</button>
            </li>
            <li className="text-textPrimary">
              <button className="w-full text-left" onClick={() => setPage('home')}>Orders</button>
            </li>
            <li className="text-textPrimary">
              <button className="w-full text-left" onClick={() => setPage('home')}>Inventory</button>
            </li>
            <li className="text-textPrimary">
              <button className="w-full text-left" onClick={() => setPage('home')}>Billing</button>
            </li>
            <li className={`text-textPrimary`}>
              <button className="w-full text-left" onClick={() => setPage('settings')}>Settings</button>
            </li>
          </ul>

          <div className="mt-6 border-t border-borderLight pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-textPrimary">Tasks</span>
              <button
                className="text-sm px-2 py-1 rounded bg-bgSoft border border-borderLight hover:bg-accentSecondary"
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
                  className="flex-1 border border-borderLight rounded px-2 py-1 text-sm"
                />
                <button
                  className="px-3 py-1 rounded bg-accentPrimary text-textPrimary text-sm"
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
                  className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${t.id?.startsWith('seed-') ? 'bg-bgSoft' : 'bg-bg'} border border-borderLight`}
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
                    className={`flex-1 text-left hover:bg-accentSecondary rounded px-1 ${t.done ? 'line-through text-textMuted' : t.id?.startsWith('seed-') ? 'text-textMuted' : 'text-textPrimary'}`}
                    onClick={() => setInput(t.text)}
                  >
                    {t.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}

      <section className="flex flex-col flex-1 p-6 overflow-hidden">

        {page === 'settings' ? (
          <SettingsPanel />
        ) : (
          <>
        {toast && (
          <div className="mb-2 px-3 py-2 rounded bg-accentSecondary text-textPrimary border border-borderLight">
            {toast}
          </div>
        )}

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            className="px-3 py-2 rounded-lg bg-bgSoft text-textPrimary border border-borderLight hover:bg-accentSecondary"
            onClick={() => setCheckInOpen(true)}
          >
            ➕ Add Room
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-bgSoft text-textPrimary border border-borderLight hover:bg-accentSecondary"
            onClick={() => setInventoryOpen(true)}
          >
            📦 Add Inventory
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-bgSoft text-textPrimary border border-borderLight hover:bg-accentSecondary"
            onClick={() => setExpenseOpen(true)}
          >
            💸 Add Expense
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-bgSoft text-textPrimary border border-borderLight hover:bg-accentSecondary"
            onClick={() => setMenuOpen(true)}
          >
            🍽 Add Menu
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-bgSoft text-textPrimary border border-borderLight hover:bg-accentSecondary"
            onClick={() => setOrderOpen(true)}
          >
            🧾 Create Order
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-bgSoft text-textPrimary border border-borderLight hover:bg-accentSecondary"
            onClick={() => setCheckoutOpen(true)}
          >
            💳 Invoice / Checkout
          </button>
        </div>

        <div className="flex flex-col bg-bg border border-borderLight rounded-xl h-[300px]">
          <div className="flex-1 min-h-0 p-3 space-y-2 overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded max-w-xl ${m.role === 'user' ? 'bg-accentPrimary self-end' : 'bg-accentSecondary'}`}
              >
                <pre className="text-sm whitespace-pre-wrap text-textPrimary">{m.text}</pre>
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-borderLight">
            <div className="flex gap-2 items-center">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about revenue, rooms, inventory, or orders…"
                className="flex-1 border border-borderLight rounded px-2 py-1.5 text-sm"
              />
              <button onClick={() => sendToAgent()} className="bg-accentPrimary px-3 py-2 rounded font-medium text-textPrimary text-sm">
                Send
              </button>
            </div>
          </div>
        </div>
        <div className="h-0" /> {/* Spacer removal */}
        <CheckInDrawer open={checkInOpen} onClose={() => setCheckInOpen(false)} rooms={rooms} />
        <AddInventoryDrawer open={inventoryOpen} onClose={() => setInventoryOpen(false)} onSave={submitAction} />
        <AddMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} onSave={submitAction} />
        <CreateOrderDrawer open={orderOpen} onClose={() => setOrderOpen(false)} onSave={submitAction} />
        <CheckoutDrawer open={checkoutOpen} onClose={() => { setCheckoutOpen(false); window.dispatchEvent(new CustomEvent('hp_refresh_stats')); }} room={null} />
        <AddExpenseDrawer open={expenseOpen} onClose={() => setExpenseOpen(false)} onSave={submitAction} />
          </>
        )}
      </section>
    </div>
  )
}

function SidebarTitle() {
  const { hotel } = useHotel()
  return <h2 className="font-bold text-lg text-textPrimary">{hotel.hotelName}</h2>
}
