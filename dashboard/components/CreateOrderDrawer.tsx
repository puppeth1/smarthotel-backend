'use client'
import { useState, useEffect } from 'react'
import { useHotel } from './HotelProvider'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://smarthotel-backend-984031420056.asia-south1.run.app'

type OrderType = 'ROOM' | 'TABLE' | 'WALKIN'

export default function CreateOrderDrawer({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (cmd: any) => void }) {
  const { hotel } = useHotel()
  
  // State
  const [orderType, setOrderType] = useState<OrderType>('ROOM')
  const [roomNumber, setRoomNumber] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<{ id: string; name: string; price: number; qty: number }[]>([])
  const [occupiedRooms, setOccupiedRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Computed
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.qty, 0)
  const tax = subtotal * 0.05 // 5% GST
  const total = subtotal + tax

  useEffect(() => {
    if (open) {
      setLoading(true)
      
      // Fetch Occupied Rooms
      fetch(`${API_URL}/api/rooms`)
        .then((res) => res.json())
        .then((data) => {
          const rooms = (data.data || []).filter((r: any) => r.status === 'OCCUPIED')
          setOccupiedRooms(rooms)
          if (rooms.length > 0 && !roomNumber) {
            setRoomNumber(rooms[0].room_number)
          }
        })
        .catch(console.error)

      // Fetch Menu
      fetch(`${API_URL}/api/menu`)
        .then((res) => res.json())
        .then((data) => {
            // Filter only available items
            const available = (data.data || []).filter((m: any) => m.availability !== 'Unavailable')
            setMenuItems(available)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [open])

  const addItem = () => {
    setSelectedItems([...selectedItems, { id: '', name: '', price: 0, qty: 1 }])
  }

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: 'name' | 'qty', value: any) => {
    const newItems = [...selectedItems]
    const item = newItems[index]

    if (field === 'name') {
      const menuItem = menuItems.find(m => m.name === value)
      if (menuItem) {
        item.id = menuItem.id || menuItem.name
        item.name = menuItem.name
        item.price = menuItem.price
      }
    } else if (field === 'qty') {
      item.qty = Number(value)
    }

    setSelectedItems(newItems)
  }

  const handleSave = () => {
    if (selectedItems.length === 0) return

    const payload: any = {
      type: orderType,
      items: selectedItems.map(i => ({ menu_id: i.id || i.name, qty: i.qty })),
      hotel_id: hotel.hotelId
    }
    
    // Step 1: Initialize Order Context
    if (orderType === 'ROOM') {
      if (!roomNumber) return
      payload.room_number = roomNumber
    } else if (orderType === 'TABLE') {
      if (!tableNumber) return
      payload.table_number = tableNumber
    } else {
      // Walk-in
      if (customerName) payload.customer_name = customerName
      if (customerPhone) payload.customer_phone = customerPhone
    }

    onSave(payload)
    onClose()
    
    // Reset state
    setSelectedItems([])
    setOrderType('ROOM')
    setCustomerName('')
    setCustomerPhone('')
  }

  const isValid = () => {
    if (selectedItems.length === 0) return false
    if (selectedItems.some(i => !i.name || i.qty <= 0)) return false

    if (orderType === 'ROOM' && !roomNumber) return false
    if (orderType === 'TABLE' && !tableNumber) return false
    // Walk-in is always valid (optional fields)

    return true
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[500px] bg-white border-l border-borderLight shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Create Food Order</h3>
          <button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-sm transition-colors" onClick={onClose}>Close</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Step 1: Order Type */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider border-b border-gray-100 pb-2">Order Type <span className="text-red-500">*</span></h4>
            
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="orderType" 
                  checked={orderType === 'ROOM'} 
                  onChange={() => setOrderType('ROOM')}
                  className="w-4 h-4 text-black focus:ring-black border-gray-300"
                />
                <span className="text-sm text-gray-700">Room Order</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="orderType" 
                  checked={orderType === 'TABLE'} 
                  onChange={() => setOrderType('TABLE')}
                  className="w-4 h-4 text-black focus:ring-black border-gray-300"
                />
                <span className="text-sm text-gray-700">Table Order</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="orderType" 
                  checked={orderType === 'WALKIN'} 
                  onChange={() => setOrderType('WALKIN')}
                  className="w-4 h-4 text-black focus:ring-black border-gray-300"
                />
                <span className="text-sm text-gray-700">Walk-in / Takeaway</span>
              </label>
            </div>

            {/* Context Specific Inputs */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              {orderType === 'ROOM' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Room <span className="text-red-500">*</span></label>
                  {loading ? (
                    <div className="text-sm text-gray-500">Loading rooms...</div>
                  ) : occupiedRooms.length > 0 ? (
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                      value={roomNumber} 
                      onChange={(e) => setRoomNumber(e.target.value)}
                    >
                      {occupiedRooms.map((r) => (
                        <option key={r.room_number} value={r.room_number}>
                          Room {r.room_number} {r.guest_name ? `– ${r.guest_name}` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                      ⚠️ No active check-ins found. Please check-in a guest or choose Table / Walk-in order.
                    </div>
                  )}
                </div>
              )}

              {orderType === 'TABLE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Table <span className="text-red-500">*</span></label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                    value={tableNumber} 
                    onChange={(e) => setTableNumber(e.target.value)}
                  >
                    <option value="">Select Table</option>
                    {Array.from({ length: hotel.settings.totalTables || 10 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>Table {i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              {orderType === 'WALKIN' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                      placeholder="Optional"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                      placeholder="Optional"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Add Food Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="text-sm font-semibold text-gray-900 tracking-wider">Add Items</h4>
              <button 
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                onClick={addItem}
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-3">
              {selectedItems.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  No items added. Click "+ Add Item" to start.
                </div>
              )}
              
              {selectedItems.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                      value={item.name} 
                      onChange={(e) => updateItem(i, 'name', e.target.value)}
                    >
                      <option value="">Select Dish</option>
                      {menuItems.map((m: any) => (
                        <option key={m.name} value={m.name}>
                          {m.name} (₹{m.price})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <input 
                      type="number"
                      min="1"
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                      placeholder="Qty" 
                      value={item.qty} 
                      onChange={(e) => updateItem(i, 'qty', e.target.value)} 
                    />
                  </div>
                  <div className="w-20 text-right text-sm font-medium text-gray-900">
                    ₹{(item.price * item.qty).toFixed(0)}
                  </div>
                  <button 
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    onClick={() => removeItem(i)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Order Summary */}
          {selectedItems.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 tracking-wider mb-2">Order Summary</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (GST 5%):</span>
                <span className="font-medium text-gray-900">₹{tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold">
                <span className="text-gray-900">Total:</span>
                <span className="text-black">₹{total.toFixed(2)}</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-3">
            <button 
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="flex-1 px-4 py-2 text-white rounded-lg hover:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: hotel?.settings?.branding?.primaryColor || 'black' }}
              disabled={!isValid()}
              onClick={handleSave}
            >
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
