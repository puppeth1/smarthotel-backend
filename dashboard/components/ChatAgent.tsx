'use client'
import { useEffect, useState } from 'react'
import SettingsPanel from './SettingsPanel'
import { useHotel } from './HotelProvider'
import CheckInDrawer from './CheckInDrawer'

export default function ChatAgent({ showSidebar = true, useExternalInput = false }: { showSidebar?: boolean; useExternalInput?: boolean }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [page, setPage] = useState<'home' | 'settings'>('home')
  type Task = { id: string; text: string; done: boolean; createdAt: number; completedAt?: number }
  const [tasks, setTasks] = useState<Task[]>([])
  const [addingTask, setAddingTask] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [helper, setHelper] = useState<null | 'room' | 'inventory' | 'menu' | 'order' | 'checkout'>(null)
  const [roomNumber, setRoomNumber] = useState('101')
  const [roomType, setRoomType] = useState('deluxe')
  const [roomPrice, setRoomPrice] = useState('5000')
  const [invName, setInvName] = useState('Tomato')
  const [invQty, setInvQty] = useState('5')
  const [invUnit, setInvUnit] = useState('kg')
  const [menuName, setMenuName] = useState('Paneer Butter Masala')
  const [menuPrice, setMenuPrice] = useState('280')
  const [menuItem, setMenuItem] = useState('Paneer')
  const [menuItemQty, setMenuItemQty] = useState('0.2')
  const [menuItemUnit, setMenuItemUnit] = useState('kg')
  const [toast, setToast] = useState<string | null>(null)
  const [checkInOpen, setCheckInOpen] = useState(false)

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

  async function submitAction(cmd: string) {
    const res = await fetch('http://localhost:3000/api/agent/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cmd, actor_id: 'u_owner', tenant_id: 'hotel_default' }),
    })
    const data = await res.json()
    setToast(typeof data?.message === 'string' ? data.message : 'Action completed')
  }

  async function answerQuestion(q: string) {
    const text = q.toLowerCase()

    function formatINR(n: number) {
      try {
        return `₹${Number(n || 0).toLocaleString('en-IN')}`
      } catch {
        return `₹${n}`
      }
    }

    // Rooms: vacant count
    if (text.includes('vacant') && text.includes('room')) {
      const res = await fetch('http://localhost:3000/api/rooms')
      const json = await res.json()
      const rooms = json?.data || []
      const vacant = rooms.filter((r: any) => (r.status || '').toUpperCase() === 'VACANT').length
      const total = rooms.length
      return `Vacant Rooms: ${vacant} / ${total}`
    }

    // Pending payments: invoices UNPAID
    if (text.includes('pending') && text.includes('payment')) {
      const res = await fetch('http://localhost:3000/api/billing/invoices')
      const json = await res.json()
      const inv = json?.data || []
      const pending = inv.filter((i: any) => (i.status || '').toUpperCase() === 'UNPAID')
      const totalAmt = pending.reduce((s: number, i: any) => s + (i.amount || 0), 0)
      return `Pending Payments: ${pending.length} invoices · Total ${formatINR(totalAmt)}`
    }

    // Orders today count
    if ((text.includes('orders') && text.includes('today')) || text.includes('food orders')) {
      const res = await fetch('http://localhost:3000/api/orders')
      const json = await res.json()
      const orders = json?.data || []
      const today = new Date().toDateString()
      const todayOrders = orders.filter((o: any) => new Date(o.created_at).toDateString() === today)
      return `Orders Today: ${todayOrders.length}`
    }

    // Yearly revenue from invoices
    if (text.includes('yearly revenue') || (text.includes('revenue') && text.includes('year'))) {
      const year = new Date().getFullYear()
      const res = await fetch('http://localhost:3000/api/billing/invoices')
      const json = await res.json()
      const inv = (json?.data || []).filter((i: any) => new Date(i.created_at).getFullYear() === year)
      const total = inv.reduce((s: number, i: any) => s + (i.amount || 0), 0)
      return `Yearly Revenue (${year})\n${formatINR(total)}`
    }

    // Inventory low items (stock <= min_stock)
    if (text.includes('inventory') && (text.includes('low') || text.includes('alert'))) {
      const res = await fetch('http://localhost:3000/api/inventory')
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
            onClick={() => setHelper(helper === 'inventory' ? null : 'inventory')}
          >
            📦 Add Inventory
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-bgSoft text-textPrimary border border-borderLight hover:bg-accentSecondary"
            onClick={() => setHelper(helper === 'menu' ? null : 'menu')}
          >
            🍽 Add Menu Item
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-bgSoft text-textPrimary border border-borderLight hover:bg-accentSecondary"
            onClick={() => setHelper(helper === 'order' ? null : 'order')}
          >
            🧾 Create Order
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-bgSoft text-textPrimary border border-borderLight hover:bg-accentSecondary"
            onClick={() => setHelper(helper === 'checkout' ? null : 'checkout')}
          >
            💳 Invoice / Checkout
          </button>
        </div>

        {helper === 'room' && (
          <div className="mt-3 grid grid-cols-4 gap-2 bg-bgSoft border border-borderLight rounded p-3">
            <input className="border border-borderLight rounded px-2 py-1" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="Room #" />
            <input className="border border-borderLight rounded px-2 py-1" value={roomType} onChange={(e) => setRoomType(e.target.value)} placeholder="Type" />
            <input className="border border-borderLight rounded px-2 py-1" value={roomPrice} onChange={(e) => setRoomPrice(e.target.value)} placeholder="Price" />
            <button className="bg-accentPrimary text-textPrimary rounded px-3" onClick={() => submitAction(`Add room ${roomNumber} as ${roomType} price ${roomPrice}`)}>Submit</button>
          </div>
        )}

        {helper === 'inventory' && (
          <div className="mt-3 grid grid-cols-5 gap-2 bg-bgSoft border border-borderLight rounded p-3">
            <input className="border border-borderLight rounded px-2 py-1" value={invName} onChange={(e) => setInvName(e.target.value)} placeholder="Item" />
            <input className="border border-borderLight rounded px-2 py-1" value={invQty} onChange={(e) => setInvQty(e.target.value)} placeholder="Qty" />
            <input className="border border-borderLight rounded px-2 py-1" value={invUnit} onChange={(e) => setInvUnit(e.target.value)} placeholder="Unit" />
            <div />
            <button className="bg-accentPrimary text-textPrimary rounded px-3" onClick={() => submitAction(`Add inventory ${invName} ${invQty} ${invUnit}`)}>Submit</button>
          </div>
        )}

        {helper === 'menu' && (
          <div className="mt-3 grid grid-cols-6 gap-2 bg-bgSoft border border-borderLight rounded p-3">
            <input className="border border-borderLight rounded px-2 py-1" value={menuName} onChange={(e) => setMenuName(e.target.value)} placeholder="Dish" />
            <input className="border border-borderLight rounded px-2 py-1" value={menuPrice} onChange={(e) => setMenuPrice(e.target.value)} placeholder="Price" />
            <input className="border border-borderLight rounded px-2 py-1" value={menuItem} onChange={(e) => setMenuItem(e.target.value)} placeholder="Ingredient" />
            <input className="border border-borderLight rounded px-2 py-1" value={menuItemQty} onChange={(e) => setMenuItemQty(e.target.value)} placeholder="Qty" />
            <input className="border border-borderLight rounded px-2 py-1" value={menuItemUnit} onChange={(e) => setMenuItemUnit(e.target.value)} placeholder="Unit" />
            <button className="bg-accentPrimary text-textPrimary rounded px-3" onClick={() => submitAction(`Add menu ${menuName} ${menuPrice} uses ${menuItem} ${menuItemQty} ${menuItemUnit}`)}>Submit</button>
          </div>
        )}

        {helper === 'order' && (
          <div className="mt-3 grid grid-cols-4 gap-2 bg-bgSoft border border-borderLight rounded p-3">
            <input className="border border-borderLight rounded px-2 py-1" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="Room #" />
            <div />
            <div />
            <button className="bg-accentPrimary text-textPrimary rounded px-3" onClick={() => submitAction(`Create food order for room ${roomNumber}`)}>Submit</button>
          </div>
        )}

        {helper === 'checkout' && (
          <div className="mt-3 grid grid-cols-4 gap-2 bg-bgSoft border border-borderLight rounded p-3">
            <input className="border border-borderLight rounded px-2 py-1" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="Room #" />
            <div />
            <div />
            <button className="bg-accentPrimary text-textPrimary rounded px-3" onClick={() => submitAction(`Checkout room ${roomNumber}`)}>Submit</button>
          </div>
        )}

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
        <CheckInDrawer open={checkInOpen} onClose={() => setCheckInOpen(false)} />
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
