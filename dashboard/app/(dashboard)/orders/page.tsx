"use client"
import { useEffect, useState } from 'react'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://smarthotel-backend-984031420056.asia-south1.run.app'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/orders`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-6">Loading orders…</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Orders</h1>

      {orders.length === 0 ? (
        <p>No orders yet</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((o, i) => (
            <li key={i} className="border p-3 rounded">
              Room: {o.room} • Items: {o.items?.length || 0}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
