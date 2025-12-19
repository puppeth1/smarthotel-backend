'use client'
import { useState, useEffect } from 'react'
import { useHotel } from '@/components/HotelProvider'

const ROOM_TYPES_ENUM = [
  'single',
  'double',
  'deluxe',
  'suite',
  'family_suite',
  'cabin',
  'garden_view',
  'river_view',
  'mountain_view',
]

export default function RoomsSettingsPage() {
  const { hotel, saveSettings } = useHotel()
  const settings = hotel.settings || {}

  const [defaultMaxGuests, setDefaultMaxGuests] = useState(settings.maxGuestsPerRoom || 2)
  const [checkinTime, setCheckinTime] = useState(settings.checkinTime || '12:00')
  const [checkoutTime, setCheckoutTime] = useState(settings.checkoutTime || '11:00')
  const [totalTables, setTotalTables] = useState<any>(settings.totalTables || 6)
  
  const [roomTypes, setRoomTypes] = useState<any[]>([])
  const [selectedNewType, setSelectedNewType] = useState('')
  
  const [allowOverbooking, setAllowOverbooking] = useState(settings.allowOverbooking || false)
  const [maintenanceBuffer, setMaintenanceBuffer] = useState<any>(settings.maintenanceBuffer || 0)
  const [autoPriceOverride, setAutoPriceOverride] = useState(settings.autoPriceOverride || false)

  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    // Initialize room types from settings
    // Only load active types or types that are present in the settings array
    // Filter out any that are not in our ENUM to be safe
    const current = settings.roomTypes || []
    const valid = current.filter((r: any) => ROOM_TYPES_ENUM.includes(r.type) && r.active !== false)
    
    // Avoid infinite loops by checking if content actually changed
    if (JSON.stringify(valid) !== JSON.stringify(roomTypes)) {
      setRoomTypes(valid)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.roomTypes])

  // Also update other fields when settings change (e.g. initial load)
  useEffect(() => {
    if (settings.maxGuestsPerRoom !== undefined && settings.maxGuestsPerRoom !== defaultMaxGuests) setDefaultMaxGuests(settings.maxGuestsPerRoom)
    if (settings.checkinTime && settings.checkinTime !== checkinTime) setCheckinTime(settings.checkinTime)
    if (settings.checkoutTime && settings.checkoutTime !== checkoutTime) setCheckoutTime(settings.checkoutTime)
    if (settings.totalTables !== undefined && settings.totalTables !== totalTables) setTotalTables(settings.totalTables)
    if (settings.allowOverbooking !== undefined && settings.allowOverbooking !== allowOverbooking) setAllowOverbooking(settings.allowOverbooking)
    if (settings.maintenanceBuffer !== undefined && settings.maintenanceBuffer !== maintenanceBuffer) setMaintenanceBuffer(settings.maintenanceBuffer)
    if (settings.autoPriceOverride !== undefined && settings.autoPriceOverride !== autoPriceOverride) setAutoPriceOverride(settings.autoPriceOverride)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  async function handleSave(silent = false) {
    await saveSettings({
      maxGuestsPerRoom: Number(defaultMaxGuests),
      checkinTime,
      checkoutTime,
      totalTables: Number(totalTables),
      roomTypes: roomTypes.map(r => ({
        ...r,
        count: Number(r.count),
        maxGuests: Number(r.maxGuests),
        basePrice: Number(r.basePrice),
        active: true,
        roomNumberStart: r.roomNumberStart ? Number(r.roomNumberStart) : undefined,
        roomNumberEnd: r.roomNumberEnd ? Number(r.roomNumberEnd) : undefined
      })),
      allowOverbooking,
      maintenanceBuffer: Number(maintenanceBuffer),
      autoPriceOverride
    })
    if (!silent) {
      setToast('Settings saved successfully')
      setTimeout(() => setToast(null), 3000)
    }
  }

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSave(true)
    }, 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultMaxGuests, checkinTime, checkoutTime, totalTables, roomTypes, allowOverbooking, maintenanceBuffer, autoPriceOverride])

  function updateRoomType(index: number, field: string, value: any) {
    const next = [...roomTypes]
    next[index] = { ...next[index], [field]: value }

    // Auto-calculate count if start/end are valid
    if (field === 'roomNumberStart' || field === 'roomNumberEnd') {
      const s = parseInt(next[index].roomNumberStart)
      const e = parseInt(next[index].roomNumberEnd)
      if (!isNaN(s) && !isNaN(e) && e >= s) {
        next[index].count = e - s + 1
      }
    }

    setRoomTypes(next)
  }

  function removeRoomType(index: number) {
    const next = [...roomTypes]
    next.splice(index, 1)
    setRoomTypes(next)
  }

  function addRoomType() {
    if (!selectedNewType) return
    const exists = roomTypes.find(r => r.type === selectedNewType)
    if (exists) return

    setRoomTypes([
      ...roomTypes,
      {
        type: selectedNewType,
        count: 0,
        maxGuests: 2,
        basePrice: 1000,
        active: true
      }
    ])
    setSelectedNewType('')
  }

  function formatType(t: string) {
    return t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const availableTypes = ROOM_TYPES_ENUM.filter(t => !roomTypes.find(r => r.type === t))

  return (
    <div className="max-w-4xl pb-10">
      {toast && (
        <div className="fixed top-4 right-4 bg-accentPrimary text-textPrimary px-4 py-2 rounded shadow-lg z-50 animate-fade-in-down">
          {toast}
        </div>
      )}

      <h2 className="text-xl font-semibold mb-6">Rooms & Capacity</h2>

      {/* Hotel Operations */}
      <section className="mb-8">
        <h3 className="text-lg font-medium mb-4 border-b border-borderLight pb-2">Hotel Operations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-textMuted mb-1">Check-in Time</label>
            <input 
              type="time" 
              className="input w-full"
              value={checkinTime}
              onChange={e => setCheckinTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-textMuted mb-1">Check-out Time</label>
            <input 
              type="time" 
              className="input w-full"
              value={checkoutTime}
              onChange={e => setCheckoutTime(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Room Types */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4 border-b border-borderLight pb-2">
          <h3 className="text-lg font-medium">Room Types</h3>
          <div className="flex items-center gap-2">
            <select 
              className="input py-1 text-sm w-40"
              value={selectedNewType}
              onChange={e => setSelectedNewType(e.target.value)}
            >
              <option value="">Select Type...</option>
              {availableTypes.map(t => (
                <option key={t} value={t}>{formatType(t)}</option>
              ))}
            </select>
            <button 
              onClick={addRoomType}
              disabled={!selectedNewType}
              className="px-3 py-1 rounded bg-accentSecondary text-textPrimary text-sm font-medium disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
        
        {roomTypes.length === 0 ? (
          <div className="text-center py-8 text-textMuted bg-gray-50 rounded border border-borderLight border-dashed">
            No room types configured. Add one above.
          </div>
        ) : (
          <div className="bg-white border border-borderLight rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-bgSecondary text-textMuted font-medium border-b border-borderLight">
                <tr>
                  <th className="px-4 py-3">Room Type</th>
                  <th className="px-4 py-3">From Room No.</th>
                  <th className="px-4 py-3">To Room No.</th>
                  <th className="px-4 py-3">Rooms Count</th>
                  <th className="px-4 py-3">Max Guests</th>
                  <th className="px-4 py-3">Base Price (₹)</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight">
                {roomTypes.map((rt, idx) => (
                  <tr key={rt.type} className="bg-white">
                    <td className="px-4 py-3 font-medium text-textPrimary">
                      {formatType(rt.type)}
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        min={1}
                        className="input w-24 px-2 py-1 text-right"
                        placeholder="Start"
                        value={rt.roomNumberStart || ''}
                        onChange={e => updateRoomType(idx, 'roomNumberStart', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        min={1}
                        className="input w-24 px-2 py-1 text-right"
                        placeholder="End"
                        value={rt.roomNumberEnd || ''}
                        onChange={e => updateRoomType(idx, 'roomNumberEnd', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        min={0}
                        className="input w-24 px-2 py-1 text-right"
                        value={rt.count}
                        onChange={e => updateRoomType(idx, 'count', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        min={1}
                        className="input w-20 px-2 py-1 text-right"
                        value={rt.maxGuests}
                        onChange={e => updateRoomType(idx, 'maxGuests', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        min={0}
                        className="input w-28 px-2 py-1 text-right"
                        value={rt.basePrice}
                        onChange={e => updateRoomType(idx, 'basePrice', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => removeRoomType(idx)}
                        className="text-red-500 hover:text-red-700 font-medium text-xs"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Total Tables */}
      <section className="mb-8">
        <h3 className="text-lg font-medium mb-4 border-b border-borderLight pb-2">Restaurant</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-textMuted mb-1">Total Tables *</label>
            <input 
              type="number" 
              min={0}
              className="input w-full"
              value={totalTables}
              onChange={e => setTotalTables(e.target.value)}
            />
            <p className="text-xs text-textMuted mt-1">Used for table booking & food orders</p>
          </div>
        </div>
      </section>

      {/* Additional Settings */}
      <section className="mb-8">
        <h3 className="text-lg font-medium mb-4 border-b border-borderLight pb-2">Advanced</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between max-w-lg p-3 border border-borderLight rounded-lg bg-white">
            <div>
              <div className="font-medium text-textPrimary">Allow Overbooking</div>
              <div className="text-xs text-textMuted">Allow bookings beyond room capacity</div>
            </div>
            <input 
              type="checkbox" 
              className="toggle h-6 w-11"
              checked={allowOverbooking}
              onChange={e => setAllowOverbooking(e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between max-w-lg p-3 border border-borderLight rounded-lg bg-white">
            <div>
              <div className="font-medium text-textPrimary">Maintenance Buffer</div>
              <div className="text-xs text-textMuted">Rooms blocked for maintenance (subtracted from vacant)</div>
            </div>
            <input 
              type="number" 
              min={0}
              className="input w-20 text-right"
              value={maintenanceBuffer}
              onChange={e => setMaintenanceBuffer(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between max-w-lg p-3 border border-borderLight rounded-lg bg-white">
            <div>
              <div className="font-medium text-textPrimary">Auto-Price Override</div>
              <div className="text-xs text-textMuted">Allow manual price override during booking</div>
            </div>
            <input 
              type="checkbox" 
              className="toggle h-6 w-11"
              checked={autoPriceOverride}
              onChange={e => setAutoPriceOverride(e.target.checked)}
            />
          </div>
        </div>
      </section>

      <div className="mt-8 pt-4 border-t border-borderLight flex items-center gap-4">
        <button 
          onClick={() => handleSave(false)}
          className="bg-accentPrimary text-textPrimary px-6 py-2 rounded-lg font-medium shadow-sm transition-colors hover:opacity-90"
        >
          Save Changes
        </button>
        <div className="text-sm text-textMuted">
          {toast ? 'Saved' : 'Changes save automatically'}
        </div>
      </div>
    </div>
  )
}
