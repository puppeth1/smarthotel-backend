'use client'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'

type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED'

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  roomNumber: string
  guestName: string
  items: OrderItem[]
  status: OrderStatus
  totalAmount: number
  createdAt: string
  updatedAt: string
  notes?: string
}

// Mock Data for Demo
const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-1001',
    roomNumber: '101',
    guestName: 'Rahul Kumar',
    items: [
      { name: 'Grilled Chicken', quantity: 1, price: 550 },
      { name: 'Coke', quantity: 2, price: 60 }
    ],
    status: 'PENDING',
    totalAmount: 670,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ORD-1002',
    roomNumber: '205',
    guestName: 'Sarah Smith',
    items: [
      { name: 'Pancakes Stack', quantity: 1, price: 250 },
      { name: 'Cappuccino', quantity: 1, price: 180 }
    ],
    status: 'PREPARING',
    totalAmount: 430,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ORD-1003',
    roomNumber: '302',
    guestName: 'Amit Patel',
    items: [
      { name: 'Paneer Butter Masala', quantity: 1, price: 450 },
      { name: 'Butter Naan', quantity: 2, price: 40 }
    ],
    status: 'SERVED',
    totalAmount: 530,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    updatedAt: new Date().toISOString()
  }
]

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'LIVE' | 'HISTORY'>('LIVE')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Load orders (Mock + LocalStorage for persistence)
  useEffect(() => {
    const saved = localStorage.getItem('hp_orders')
    if (saved) {
      setOrders(JSON.parse(saved))
    } else {
      setOrders(MOCK_ORDERS)
      localStorage.setItem('hp_orders', JSON.stringify(MOCK_ORDERS))
    }
    setLoading(false)
  }, [])

  // Update LocalStorage whenever orders change
  useEffect(() => {
    if (!loading && orders.length > 0) {
      localStorage.setItem('hp_orders', JSON.stringify(orders))
    }
  }, [orders, loading])

  const updateStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o
    ))
  }

  const liveOrders = orders.filter(o => ['PENDING', 'PREPARING', 'READY'].includes(o.status))
  const historyOrders = orders.filter(o => ['SERVED', 'CANCELLED'].includes(o.status)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'PREPARING': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'READY': return 'bg-green-100 text-green-800 border-green-200'
      case 'SERVED': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) return <div className="p-6">Loading orders...</div>

  return (
    <div className="p-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Kitchen Orders</h1>
          <p className="text-sm text-gray-500">Manage food preparation and delivery</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('LIVE')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'LIVE' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Active Orders ({liveOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'HISTORY' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Order History
          </button>
        </div>
      </div>

      {activeTab === 'LIVE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveOrders.length === 0 ? (
             <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
               <p className="text-gray-500 text-lg">No active orders right now.</p>
               <p className="text-sm text-gray-400">New orders will appear here automatically.</p>
             </div>
          ) : (
            liveOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                {/* Card Header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg text-gray-900">Room {order.roomNumber}</span>
                      <span className="text-xs text-gray-500 font-mono">#{order.id.slice(-4)}</span>
                    </div>
                    <div className="text-sm text-gray-500">{order.guestName}</div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {/* Items List */}
                <div className="p-4 flex-1 space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 bg-gray-100 w-6 h-6 flex items-center justify-center rounded-full text-xs">
                          {item.quantity}x
                        </span>
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-gray-500">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  
                  {order.notes && (
                    <div className="mt-3 p-2 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-100">
                      <strong>Note:</strong> {order.notes}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs text-gray-500">{format(new Date(order.createdAt), 'h:mm a')}</span>
                    <span className="font-bold text-gray-900">Total: ₹{order.totalAmount}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {order.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => updateStatus(order.id, 'CANCELLED')}
                          className="px-3 py-2 bg-white border border-gray-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => updateStatus(order.id, 'PREPARING')}
                          className="px-3 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          Accept & Cook
                        </button>
                      </>
                    )}
                    {order.status === 'PREPARING' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'READY')}
                        className="col-span-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Mark Ready for Pickup
                      </button>
                    )}
                    {order.status === 'READY' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'SERVED')}
                        className="col-span-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Mark Served
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Date & Time</th>
                <th className="px-6 py-3">Room</th>
                <th className="px-6 py-3">Items</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historyOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-gray-500">#{order.id.slice(-4)}</td>
                  <td className="px-6 py-4 text-gray-900">
                    <div>{format(new Date(order.createdAt), 'MMM d, yyyy')}</div>
                    <div className="text-xs text-gray-500">{format(new Date(order.createdAt), 'h:mm a')}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">{order.roomNumber}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </td>
                  <td className="px-6 py-4 font-medium">₹{order.totalAmount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {historyOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No order history available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
