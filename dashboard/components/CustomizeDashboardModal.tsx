'use client'
import { useState } from 'react'
import { DASHBOARD_CARD_REGISTRY, DashboardCardKey, labelForKey } from '@/lib/dashboardCards'

export default function CustomizeDashboardModal({
  selectedCards,
  onSave,
  onClose,
}: {
  selectedCards: DashboardCardKey[]
  onSave: (cards: DashboardCardKey[]) => void
  onClose: () => void
}) {
  const [tempSelected, setTempSelected] = useState<DashboardCardKey[]>(selectedCards)

  function toggleCard(key: DashboardCardKey) {
    setTempSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key)
      if (prev.length >= 8) return prev
      return [...prev, key]
    })
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[520px] bg-white border-l border-[#E5E7EB] shadow-xl p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold text-[#111827]">Customize Dashboard</div>
          <button className="px-3 py-1 rounded bg-[#F9FAFB] border border-[#E5E7EB]" onClick={onClose}>Close</button>
        </div>

        <div className="mb-4">
          <div className="text-sm font-medium text-[#111827] mb-2">Selected Cards ({tempSelected.length} / 8)</div>
          <ul className="space-y-2">
            {tempSelected.map((k) => (
              <li key={k} className="flex items-center gap-2 border border-[#E5E7EB] rounded px-3 py-2 text-sm">
                <span className="flex-1">{labelForKey(k)}</span>
                <button className="px-2 py-1 rounded bg-[#F9FAFB] border border-[#E5E7EB]" onClick={() => toggleCard(k)}>Remove</button>
              </li>
            ))}
            {!tempSelected.length && (
              <li className="text-sm text-[#6B7280]">No cards selected</li>
            )}
          </ul>
        </div>

        <div className="mb-4">
          <div className="text-sm font-medium text-[#111827] mb-2">Available Cards</div>
          <div className="space-y-3">
            {DASHBOARD_CARD_REGISTRY.map((grp) => (
              <div key={grp.group}>
                <div className="text-xs font-semibold text-[#6B7280] mb-1">{grp.group}</div>
                <div className="grid grid-cols-2 gap-2">
                  {grp.cards.map((c) => {
                    const selected = tempSelected.includes(c.key)
                    return (
                      <label key={c.key} className={`px-3 py-2 rounded border border-[#E5E7EB] cursor-pointer ${selected ? 'bg-accentSecondary' : 'hover:bg-[#F9FAFB]'}`}>
                        <input type="checkbox" className="mr-2" checked={selected} onChange={() => toggleCard(c.key)} />
                        {c.label}
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button className="px-3 py-2 rounded bg-[#F9FAFB] border border-[#E5E7EB]" onClick={onClose}>Cancel</button>
          <button className="px-3 py-2 rounded bg-accentPrimary text-black border border-[#E5E7EB]" onClick={() => onSave(tempSelected)}>Save</button>
        </div>
      </div>
    </div>
  )
}
