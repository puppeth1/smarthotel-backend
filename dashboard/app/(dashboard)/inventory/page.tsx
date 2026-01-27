'use client'
import { useState, useEffect, useMemo } from 'react'
import { useHotel } from '@/components/HotelProvider'
import AddInventoryDrawer from '@/components/AddInventoryDrawer'
import { 
  PlusIcon, 
  MinusIcon, 
  TrashIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CurrencyRupeeIcon,
  CubeIcon
} from '@heroicons/react/24/outline'

// Types
interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  minStock: number
  costPerUnit: number
  supplier?: string
  lastUpdated: string
}

interface StockLog {
  id: string
  itemId: string
  itemName: string
  type: 'IN' | 'OUT' | 'WASTAGE'
  quantity: number
  reason?: string
  date: string
  value?: number
}

// Mock Data
const MOCK_ITEMS: InventoryItem[] = [
  { id: '1', name: 'Tomatoes', category: 'Vegetables', quantity: 15, unit: 'kg', minStock: 5, costPerUnit: 40, lastUpdated: '2024-01-25' },
  { id: '2', name: 'Rice (Basmati)', category: 'Grains', quantity: 45, unit: 'kg', minStock: 20, costPerUnit: 120, lastUpdated: '2024-01-20' },
  { id: '3', name: 'Milk', category: 'Dairy', quantity: 4, unit: 'litre', minStock: 10, costPerUnit: 60, lastUpdated: '2024-01-26' },
  { id: '4', name: 'Eggs', category: 'Dairy', quantity: 120, unit: 'pcs', minStock: 50, costPerUnit: 6, lastUpdated: '2024-01-25' },
  { id: '5', name: 'Chicken', category: 'Meat', quantity: 8, unit: 'kg', minStock: 10, costPerUnit: 220, lastUpdated: '2024-01-26' },
  { id: '6', name: 'Whisky (Black Label)', category: 'Beverages', quantity: 3, unit: 'bottle', minStock: 5, costPerUnit: 3500, lastUpdated: '2024-01-15' },
]

export default function InventoryPage() {
  const { hotel } = useHotel()
  const currency = hotel?.settings?.currency || { code: 'INR', symbol: '₹' }

  // State
  const [items, setItems] = useState<InventoryItem[]>(MOCK_ITEMS)
  const [logs, setLogs] = useState<StockLog[]>([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterStatus, setFilterStatus] = useState<'All' | 'Low Stock' | 'Out of Stock'>('All')
  
  // Modals
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean
    type: 'IN' | 'OUT' | 'WASTAGE' | null
    item: InventoryItem | null
  }>({ isOpen: false, type: null, item: null })
  
  const [actionForm, setActionForm] = useState({ quantity: '', reason: '', cost: '' })

  // Derived Data
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory
      
      let matchesStatus = true
      if (filterStatus === 'Low Stock') matchesStatus = item.quantity <= item.minStock && item.quantity > 0
      if (filterStatus === 'Out of Stock') matchesStatus = item.quantity === 0
      
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [items, search, filterCategory, filterStatus])

  const stats = useMemo(() => {
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0)
    const lowStockCount = items.filter(i => i.quantity <= i.minStock).length
    const wastageValue = logs
      .filter(l => l.type === 'WASTAGE' && new Date(l.date).getMonth() === new Date().getMonth())
      .reduce((sum, l) => sum + (l.value || 0), 0)
      
    return { totalValue, lowStockCount, wastageValue }
  }, [items, logs])

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))]

  // Handlers
  const handleAddNewItem = (cmd: string) => {
    // Parse command string from drawer (e.g. "Add inventory Name Qty Unit...")
    // This is a rough parser matching the drawer's output format
    const parts = cmd.split(' ')
    // Simple mock add
    const newItem: InventoryItem = {
      id: `new_${Date.now()}`,
      name: parts[2] || 'New Item',
      quantity: Number(parts[3]) || 0,
      unit: parts[4] || 'units',
      category: 'Uncategorized',
      minStock: 0,
      costPerUnit: 0,
      lastUpdated: new Date().toISOString()
    }
    setItems(prev => [...prev, newItem])
    alert('Item Added Successfully!')
  }

  const openActionModal = (type: 'IN' | 'OUT' | 'WASTAGE', item: InventoryItem) => {
    setActionModal({ isOpen: true, type, item })
    setActionForm({ quantity: '', reason: '', cost: item.costPerUnit.toString() })
  }

  const handleActionSubmit = () => {
    if (!actionModal.item || !actionForm.quantity) return

    const qty = Number(actionForm.quantity)
    if (qty <= 0) return

    const currentItem = actionModal.item
    let newQty = currentItem.quantity

    if (actionModal.type === 'IN') {
      newQty += qty
    } else {
      newQty = Math.max(0, currentItem.quantity - qty)
    }

    // Update Item
    setItems(prev => prev.map(i => i.id === currentItem.id ? { ...i, quantity: newQty, lastUpdated: new Date().toISOString() } : i))

    // Add Log
    const newLog: StockLog = {
      id: `log_${Date.now()}`,
      itemId: currentItem.id,
      itemName: currentItem.name,
      type: actionModal.type!,
      quantity: qty,
      reason: actionForm.reason,
      date: new Date().toISOString(),
      value: actionModal.type === 'WASTAGE' ? (qty * currentItem.costPerUnit) : undefined
    }
    setLogs(prev => [newLog, ...prev])

    setActionModal({ isOpen: false, type: null, item: null })
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-500">Track stock, manage purchases, and minimize wastage</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsAddDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Total Stock Value</p>
            <h3 className="text-2xl font-bold text-gray-900">{currency.symbol}{stats.totalValue.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <CurrencyRupeeIcon className="w-6 h-6" />
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Low Stock Alerts</p>
            <h3 className={`text-2xl font-bold ${stats.lowStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {stats.lowStockCount} <span className="text-sm font-normal text-gray-500">items</span>
            </h3>
          </div>
          <div className={`p-3 rounded-lg ${stats.lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
            <ExclamationTriangleIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Wastage (This Month)</p>
            <h3 className="text-2xl font-bold text-gray-900">{currency.symbol}{stats.wastageValue.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
            <TrashIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Filters Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between bg-gray-50/50">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
              />
            </div>
            <div className="relative">
               <select 
                 value={filterCategory}
                 onChange={e => setFilterCategory(e.target.value)}
                 className="appearance-none pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black cursor-pointer"
               >
                 {categories.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               <FunnelIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          <div className="flex bg-gray-200 p-1 rounded-lg">
             {['All', 'Low Stock', 'Out of Stock'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    filterStatus === status ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {status}
                </button>
             ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3 w-[30%]">Item Name</th>
                <th className="px-6 py-3 w-[20%]">Stock Level</th>
                <th className="px-6 py-3 w-[15%]">Value</th>
                <th className="px-6 py-3 w-[15%]">Status</th>
                <th className="px-6 py-3 w-[20%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No items found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const stockPercent = Math.min(100, (item.quantity / (item.minStock * 3)) * 100)
                  const isLow = item.quantity <= item.minStock
                  const isOut = item.quantity === 0
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOut ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600'}`}>
                             <CubeIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.category} • {item.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 mb-1.5">
                           <span className="font-medium text-gray-900">{item.quantity} {item.unit}</span>
                           <span className="text-xs text-gray-400">/ min {item.minStock}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isOut ? 'bg-red-500' : isLow ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${stockPercent}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{currency.symbol}{(item.quantity * item.costPerUnit).toLocaleString()}</div>
                        <div className="text-xs text-gray-400">{currency.symbol}{item.costPerUnit} / {item.unit}</div>
                      </td>
                      <td className="px-6 py-4">
                        {isOut ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openActionModal('IN', item)}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Stock In (Purchase)"
                          >
                            <PlusIcon className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => openActionModal('OUT', item)}
                            disabled={item.quantity === 0}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30"
                            title="Stock Out (Usage)"
                          >
                            <MinusIcon className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => openActionModal('WASTAGE', item)}
                            disabled={item.quantity === 0}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                            title="Record Wastage"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {actionModal.isOpen && actionModal.item && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">
                {actionModal.type === 'IN' ? 'Stock In' : actionModal.type === 'OUT' ? 'Record Usage' : 'Record Wastage'}
              </h3>
              <button onClick={() => setActionModal({ ...actionModal, isOpen: false })} className="text-gray-500 hover:text-black">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CubeIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{actionModal.item.name}</div>
                  <div className="text-xs text-gray-500">Current: {actionModal.item.quantity} {actionModal.item.unit}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity ({actionModal.item.unit})
                </label>
                <input 
                  type="number"
                  autoFocus
                  min="0"
                  value={actionForm.quantity}
                  onChange={e => setActionForm({...actionForm, quantity: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                  placeholder="0.00"
                />
              </div>

              {actionModal.type === 'WASTAGE' && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <select 
                      value={actionForm.reason}
                      onChange={e => setActionForm({...actionForm, reason: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                    >
                      <option value="">Select Reason</option>
                      <option value="Expired">Expired</option>
                      <option value="Damaged">Damaged</option>
                      <option value="Spilled">Spilled / Wasted</option>
                      <option value="Quality Issue">Quality Issue</option>
                      <option value="Other">Other</option>
                    </select>
                 </div>
              )}

              {actionModal.type === 'OUT' && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select 
                      value={actionForm.reason}
                      onChange={e => setActionForm({...actionForm, reason: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                    >
                      <option value="">Select Department</option>
                      <option value="Kitchen">Kitchen</option>
                      <option value="Bar">Bar</option>
                      <option value="Housekeeping">Housekeeping</option>
                      <option value="Staff Meal">Staff Meal</option>
                    </select>
                 </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 flex gap-3">
              <button onClick={() => setActionModal({ ...actionModal, isOpen: false })} className="flex-1 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button 
                onClick={handleActionSubmit}
                disabled={!actionForm.quantity}
                className={`flex-[2] py-2.5 text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                  actionModal.type === 'WASTAGE' ? 'bg-red-600 hover:bg-red-700' :
                  actionModal.type === 'OUT' ? 'bg-blue-600 hover:bg-blue-700' :
                  'bg-black hover:bg-gray-800'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <AddInventoryDrawer 
        open={isAddDrawerOpen} 
        onClose={() => setIsAddDrawerOpen(false)} 
        onSave={handleAddNewItem} 
      />
    </div>
  )
}