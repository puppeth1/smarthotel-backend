'use client'
import { useState } from 'react'
import { useHotel } from './HotelProvider'

// Simple Icons
const ChevronDown = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
)

const ChevronUp = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m18 15-6-6-6 6"/>
  </svg>
)

const CATEGORIES = [
  'Vegetables', 'Fruits', 'Dairy', 'Grains', 'Spices', 
  'Beverages', 'Housekeeping', 'Toiletries'
]

const UNITS = ['kg', 'gm', 'litre', 'ml', 'pcs', 'packets']

export default function AddInventoryDrawer({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (cmd: string) => void }) {
  const { hotel } = useHotel()
  const [invName, setInvName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [invQty, setInvQty] = useState('')
  const [invUnit, setInvUnit] = useState(UNITS[0])
  
  const [minStock, setMinStock] = useState('')
  const [cost, setCost] = useState('')
  const [supplier, setSupplier] = useState('')
  const [phone, setPhone] = useState('')
  
  const [showAdvanced, setShowAdvanced] = useState(false)

  if (!open) return null

  const handleSave = () => {
    if (!invName || !invQty) return
    
    let cmd = `Add inventory ${invName} ${invQty} ${invUnit}`
    
    if (minStock) cmd += ` min ${minStock}`
    if (category) cmd += ` category ${category}`
    if (cost) cmd += ` cost ${cost}`
    if (supplier) cmd += ` supplier ${supplier}`
    if (phone) cmd += ` phone ${phone}`

    onSave(cmd)
    onClose()
    
    // Reset mandatory fields, keep optional or reset all? 
    // Usually reset all for new entry.
    setInvName('')
    setInvQty('')
    setMinStock('')
    setCost('')
    setSupplier('')
    setPhone('')
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[400px] bg-white border-l border-borderLight shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Add Inventory</h3>
          <button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-sm transition-colors" onClick={onClose}>Close</button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Basic Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider">Basic Details</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name <span className="text-red-500">*</span></label>
              <input 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                placeholder="e.g. Tomato, Rice" 
                value={invName} 
                onChange={(e) => setInvName(e.target.value)} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <div className="relative">
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none">
                  <ChevronDown size={16} className="text-gray-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
                <input 
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                  placeholder="0" 
                  value={invQty} 
                  onChange={(e) => setInvQty(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <div className="relative">
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                    value={invUnit} 
                    onChange={(e) => setInvUnit(e.target.value)}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <div className="absolute right-3 top-3 pointer-events-none">
                    <ChevronDown size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 2: Stock Control */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider">Stock Control</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
                <input 
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                  placeholder="Alert at..." 
                  value={minStock} 
                  onChange={(e) => setMinStock(e.target.value)} 
                />
              </div>
              <div className="pt-8 text-sm text-gray-500">
                {invUnit}
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 3: Cost Tracking */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider">Cost Tracking</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit (₹)</label>
              <input 
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                placeholder="e.g. 30" 
                value={cost} 
                onChange={(e) => setCost(e.target.value)} 
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 4: Supplier Info (Collapsible) */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
             <button 
               className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
               onClick={() => setShowAdvanced(!showAdvanced)}
             >
               <span className="text-sm font-medium text-gray-700">Supplier Info (Optional)</span>
               {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
             </button>
             
             {showAdvanced && (
               <div className="p-4 space-y-4 bg-white border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                      placeholder="e.g. Farm Fresh" 
                      value={supplier} 
                      onChange={(e) => setSupplier(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                      placeholder="e.g. 9876543210" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                    />
                  </div>
               </div>
             )}
          </div>

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
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!invName || !invQty}
              onClick={handleSave}
            >
              Add Inventory
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
