"use client"
import { useEffect, useState } from 'react'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://smarthotel-backend-984031420056.asia-south1.run.app'

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/inventory`)
      .then((res) => res.json())
      .then((data) => {
        setItems(data.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-6">Loading inventory…</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Inventory</h1>

      {items.length === 0 ? (
        <p>No inventory items yet</p>
      ) : (
        <ul className="space-y-2">
          {items.map((i, idx) => (
            <li key={idx} className="border p-3 rounded">
              {i.name} — {i.quantity ?? i.stock} {i.unit}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
