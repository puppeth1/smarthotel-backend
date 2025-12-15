'use client'
import { useEffect, useMemo, useState } from 'react'

export default function CheckInDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [primaryGuestName, setPrimaryGuestName] = useState('')
  const [primaryGuestPhone, setPrimaryGuestPhone] = useState('')
  const [additionalGuests, setAdditionalGuests] = useState<Array<{ id: string; name: string; relation?: 'Friend' | 'Family' | 'Colleague' }>>([])
  const [roomNumber, setRoomNumber] = useState('101')
  const [roomType, setRoomType] = useState('deluxe')
  const [price, setPrice] = useState('5000')
  const [showPayment, setShowPayment] = useState(false)
  const [payMethod, setPayMethod] = useState<'UPI' | 'CASH' | 'CARD'>('UPI')
  const [payAmount, setPayAmount] = useState('5000')
  const [generateInvoice, setGenerateInvoice] = useState(true)
  const [showIdPanel, setShowIdPanel] = useState(false)
  const [idGuest, setIdGuest] = useState<'Primary Guest' | string>('Primary Guest')
  const [idType, setIdType] = useState<'Aadhaar' | 'Passport' | 'Driving License' | 'Voter ID' | 'Other'>('Aadhaar')
  const [idLabel, setIdLabel] = useState('')
  const [idFront, setIdFront] = useState<string | null>(null)
  const [idBack, setIdBack] = useState<string | null>(null)
  const [guestIds, setGuestIds] = useState<Array<{ guest_name: string; id_type: string; label?: string; front_url?: string | null; back_url?: string | null }>>([])
  const canSave = useMemo(() => primaryGuestName.trim().length > 0 && roomNumber.trim().length > 0, [primaryGuestName, roomNumber])

  useEffect(() => {
    if (!open) {
      setShowPayment(false)
    }
  }, [open])

  async function ensureRoom() {
    try {
      const res = await fetch('http://localhost:3000/api/rooms')
      const json = await res.json()
      const rooms = json?.data || []
      const exists = rooms.some((r: any) => String(r.room_number) === String(roomNumber))
      if (!exists) {
        await fetch('http://localhost:3000/api/agent/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `Add room ${roomNumber} as ${roomType} price ${price}`, actor_id: 'u_owner', tenant_id: 'hotel_default' }),
        })
      }
    } catch {}
  }

  async function markOccupied() {
    try {
      await fetch('http://localhost:3000/api/agent/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `Mark room ${roomNumber} as occupied`, actor_id: 'u_owner', tenant_id: 'hotel_default' }),
      })
    } catch {}
  }

  async function savePayment() {
    try {
      const payment = { amount: Number(payAmount || price), method: payMethod, created_at: Date.now(), room_number: roomNumber }
      const saved = localStorage.getItem('hp_payments')
      const arr = saved ? JSON.parse(saved) : []
      localStorage.setItem('hp_payments', JSON.stringify([payment, ...arr]))
      if (generateInvoice) {
        const invSaved = localStorage.getItem('hp_invoices')
        const invArr = invSaved ? JSON.parse(invSaved) : []
        const nextId = `inv_${(invArr?.length || 0) + 1}`
        const invoice = { invoice_id: nextId, room_number: roomNumber, amount: Number(payAmount || price), currency: 'INR', status: 'PAID', payment_method: payMethod, paid_at: Date.now(), created_at: Date.now() }
        localStorage.setItem('hp_invoices', JSON.stringify([invoice, ...invArr]))
      }
    } catch {}
  }

  function toTitleCase(v: string) {
    return v
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }

  async function handleSave() {
    await ensureRoom()
    await markOccupied()
    try {
      const guestsSaved = localStorage.getItem('hp_guests')
      const guestArr = guestsSaved ? JSON.parse(guestsSaved) : []
      const primaryGuest = { id: crypto.randomUUID(), name: toTitleCase(primaryGuestName.trim()), phone: primaryGuestPhone.trim(), role: 'PRIMARY' }
      const others = additionalGuests.map((g) => ({ id: crypto.randomUUID(), name: toTitleCase((g.name || '').trim()), relation: g.relation, role: 'ADDITIONAL' }))
      const allGuests = [primaryGuest, ...others.filter((g) => g.name.trim().length > 0)]
      localStorage.setItem('hp_guests', JSON.stringify([...allGuests, ...guestArr]))

      const invSaved = localStorage.getItem('hp_invoices')
      const invArr = invSaved ? JSON.parse(invSaved) : []
      let invoice_id: string | undefined
      if (generateInvoice && !showPayment) {
        const nextId = `inv_${(invArr?.length || 0) + 1}`
        const invoice = { invoice_id: nextId, room_number: roomNumber, amount: Number(price || 0), currency: 'INR', status: 'UNPAID', created_at: Date.now() }
        localStorage.setItem('hp_invoices', JSON.stringify([invoice, ...invArr]))
        invoice_id = nextId
      }

      const checkin = {
        id: crypto.randomUUID(),
        room_number: roomNumber,
        room_type: roomType,
        primary_guest_id: primaryGuest.id,
        additional_guest_ids: others.map((g) => g.id),
        checkin_time: Date.now(),
        payment_method: showPayment ? payMethod : undefined,
        payment_amount: showPayment ? Number(payAmount || price) : undefined,
        guest_ids: guestIds,
        invoice_id,
      }
      const ciSaved = localStorage.getItem('hp_checkins')
      const ciArr = ciSaved ? JSON.parse(ciSaved) : []
      localStorage.setItem('hp_checkins', JSON.stringify([checkin, ...ciArr]))

      if (showPayment) await savePayment()
    } catch {}
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[480px] bg-bg border-l border-borderLight shadow-xl p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-textPrimary">Add Room / Check-In</h3>
          <button className="px-3 py-1 rounded bg-bgSoft border border-borderLight" onClick={onClose}>Close</button>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-semibold text-textPrimary mb-2">Guest Details</h4>
          <div className="space-y-2">
            <div className="text-xs font-medium text-textMuted">Primary Guest (required)</div>
            <input className="w-full border border-borderLight rounded px-3 py-2" placeholder="Primary Guest Name" value={primaryGuestName} onChange={(e) => setPrimaryGuestName(e.target.value)} />
            <input className="w-full border border-borderLight rounded px-3 py-2" placeholder="Phone Number" value={primaryGuestPhone} onChange={(e) => setPrimaryGuestPhone(e.target.value)} />
            <div className="flex items-center justify-between mt-2">
              <div className="text-sm text-textMuted">Add Guest ({additionalGuests.length} / 5)</div>
              <button
                className="px-3 py-1 rounded border border-borderLight"
                onClick={() => {
                  if (additionalGuests.length >= 5) return
                  setAdditionalGuests((g) => [...g, { id: crypto.randomUUID(), name: '', relation: undefined }])
                }}
              >
                ＋ Add Guest
              </button>
            </div>
            {additionalGuests.map((g, idx) => (
              <div key={g.id} className="mt-2 border border-borderLight rounded p-2">
                <div className="grid grid-cols-2 gap-2">
                  <input className="border border-borderLight rounded px-3 py-2" placeholder={`Guest ${idx + 1} Name`} value={g.name} onChange={(e) => setAdditionalGuests((arr) => arr.map((x) => x.id === g.id ? { ...x, name: e.target.value } : x))} />
                  <select className="border border-borderLight rounded px-3 py-2" value={g.relation || ''} onChange={(e) => setAdditionalGuests((arr) => arr.map((x) => x.id === g.id ? { ...x, relation: (e.target.value || undefined) as any } : x))}>
                    <option value="">Relation (optional)</option>
                    <option>Friend</option>
                    <option>Family</option>
                    <option>Colleague</option>
                  </select>
                </div>
                <div className="mt-2">
                  <button className="px-2 py-1 rounded bg-bgSoft border border-borderLight" onClick={() => setAdditionalGuests((arr) => arr.filter((x) => x.id !== g.id))}>Remove Guest ❌</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-semibold text-textPrimary mb-2">Room Details</h4>
          <div className="grid grid-cols-2 gap-2">
            <input className="border border-borderLight rounded px-3 py-2" placeholder="Room Number" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} />
            <select className="border border-borderLight rounded px-3 py-2" value={roomType} onChange={(e) => setRoomType(e.target.value)}>
              <option>single</option>
              <option>double</option>
              <option>suite</option>
              <option>deluxe</option>
              <option>cabin</option>
              <option>family suite</option>
              <option>garden view</option>
              <option>river view</option>
              <option>mountain view</option>
            </select>
            <input className="border border-borderLight rounded px-3 py-2 col-span-2" placeholder="Price per Night" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-semibold text-textPrimary mb-2">Actions</h4>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded text-black" style={{ backgroundColor: '#E7F78F' }} onClick={() => setShowPayment(true)}>💳 Take Payment</button>
            <button className="px-3 py-2 rounded text-black" style={{ backgroundColor: '#D6F6E5' }} onClick={() => setShowIdPanel(true)}>📷 Record ID</button>
          </div>
        </div>

        {showIdPanel && (
          <div className="border border-borderLight rounded p-3 mb-4">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <select className="border border-borderLight rounded px-3 py-2" value={idGuest} onChange={(e) => setIdGuest(e.target.value as any)}>
                <option>Primary Guest</option>
                {additionalGuests.map((g) => (
                  <option key={g.id} value={g.name || g.id}>{g.name || `Guest (${g.id.slice(0, 6)})`}</option>
                ))}
              </select>
              <select className="border border-borderLight rounded px-3 py-2" value={idType} onChange={(e) => setIdType(e.target.value as any)}>
                <option>Aadhaar</option>
                <option>Passport</option>
                <option>Driving License</option>
                <option>Voter ID</option>
                <option>Other</option>
              </select>
            </div>
            {idType === 'Other' && (
              <input className="w-full border border-borderLight rounded px-3 py-2 mb-2" placeholder="Specify ID Type" value={idLabel} onChange={(e) => setIdLabel(e.target.value)} />
            )}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <label className="px-3 py-2 rounded bg-bgSoft border border-borderLight text-center cursor-pointer">
                📷 Capture ID Front
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setIdFront(String(r.result)); r.readAsDataURL(f) } }} />
              </label>
              <label className="px-3 py-2 rounded bg-bgSoft border border-borderLight text-center cursor-pointer">
                📷 Capture ID Back
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setIdBack(String(r.result)); r.readAsDataURL(f) } }} />
              </label>
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-2 rounded bg-accentPrimary text-textPrimary"
                onClick={() => {
                  const gname = idGuest === 'Primary Guest' ? primaryGuestName.trim() : (additionalGuests.find((g) => g.name === idGuest)?.name || primaryGuestName.trim())
                  if (!gname) return
                  const entry = { guest_name: toTitleCase(gname), id_type: idType, label: idType === 'Other' ? idLabel.trim() || undefined : undefined, front_url: idFront, back_url: idBack }
                  setGuestIds((arr) => [entry, ...arr])
                  setIdFront(null)
                  setIdBack(null)
                  setIdLabel('')
                }}
              >
                Save ID
              </button>
              <button className="px-3 py-2 rounded bg-bgSoft border border-borderLight" onClick={() => { setIdFront(null); setIdBack(null); setIdLabel('') }}>＋ Record Another ID</button>
              <button className="ml-auto px-3 py-2 rounded bg-bgSoft border border-borderLight" onClick={() => setShowIdPanel(false)}>Close</button>
            </div>
            {guestIds.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium text-textPrimary mb-2">Recorded IDs ({guestIds.length})</div>
                <div className="space-y-2">
                  {guestIds.map((id, i) => (
                    <div key={i} className="text-sm border border-borderLight rounded px-3 py-2">
                      <div>{id.guest_name} — {id.id_type}{id.label ? ` (${id.label})` : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          <button className={`px-4 py-2 rounded bg-[#111827] text-white font-medium ${!canSave ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!canSave} onClick={handleSave}>Save Check-In</button>
        </div>

        {showPayment && (
          <div className="fixed right-[480px] top-0 h-full w-[360px] bg-bg border-l border-borderLight shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-textPrimary">Payment</h4>
              <button className="px-2 py-1 rounded bg-bgSoft border border-borderLight" onClick={() => setShowPayment(false)}>Close</button>
            </div>
            <div className="space-y-2">
              <select className="w-full border border-borderLight rounded px-3 py-2" value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)}>
                <option>UPI</option>
                <option>CASH</option>
                <option>CARD</option>
              </select>
              <input className="w-full border border-borderLight rounded px-3 py-2" placeholder="Amount" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={generateInvoice} onChange={(e) => setGenerateInvoice(e.target.checked)} />
                <span>Generate Invoice</span>
              </label>
              <button className="w-full px-3 py-2 rounded bg-accentPrimary text-textPrimary font-medium" onClick={async () => { await savePayment(); setShowPayment(false) }}>Confirm Payment</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
