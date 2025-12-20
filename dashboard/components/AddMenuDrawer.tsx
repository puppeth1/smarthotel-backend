'use client'
import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '@/components/AuthProvider'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smarthotel-backend-984031420056.asia-south1.run.app'

export default function AddMenuDrawer({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (cmd: string) => void }) {
  const { user } = useContext(AuthContext)
  // Basic Info
  const [menuName, setMenuName] = useState('')
  const [menuPrice, setMenuPrice] = useState('')
  const [category, setCategory] = useState('Main Course')
  const [isAvailable, setIsAvailable] = useState(true)

  // Ingredients
  const [ingredients, setIngredients] = useState<any[]>([])
  const [inventoryItems, setInventoryItems] = useState<any[]>([])

  // Controls
  const [prepTime, setPrepTime] = useState('')
  const [autoDisable, setAutoDisable] = useState(true)

  // Fetch Inventory
  useEffect(() => {
    if (open) {
      user?.getIdToken().then((token: string) => {
        const headers: any = token ? { Authorization: `Bearer ${token}` } : {}
        fetch(`${API_URL}/inventory`, { headers })
          .then(res => res.json())
          .then(data => {
            setInventoryItems(data.data || [])
          })
          .catch(err => console.error('Failed to fetch inventory', err))
      })
    }
  }, [open, user])

  // Calculations
  const dishCost = ingredients.reduce((sum, ing) => {
    const qty = parseFloat(ing.qty) || 0
    const cost = ing.cost || 0 // cost per unit from inventory
    return sum + (qty * cost)
  }, 0)

  const sellingPrice = parseFloat(menuPrice) || 0
  const profit = sellingPrice - dishCost

  // Handlers
  const addIngredientRow = () => {
    setIngredients([...ingredients, { id: Date.now(), inventoryId: '', name: '', qty: '', unit: '', cost: 0 }])
  }

  const updateIngredient = (index: number, field: string, value: any) => {
    const newIngs = [...ingredients]
    if (field === 'inventoryId') {
      const item = inventoryItems.find(i => i.id === value || i.name === value) // match by id or name if id missing
      if (item) {
        newIngs[index].inventoryId = value
        newIngs[index].name = item.name
        newIngs[index].unit = item.unit
        newIngs[index].cost = item.cost || 0
      }
    } else {
      newIngs[index][field] = value
    }
    setIngredients(newIngs)
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!menuName || !menuPrice) return

    const payload = {
      name: menuName,
      price: sellingPrice,
      category,
      available: isAvailable,
      recipe: ingredients.map(ing => ({
        item: ing.name,
        qty: parseFloat(ing.qty) || 0,
        unit: ing.unit
      })),
      preparationTime: parseInt(prepTime) || 0,
      autoDisable
    }

    onSave(`ADD_MENU_JSON ${JSON.stringify(payload)}`)
    
    // Reset and close
    setMenuName('')
    setMenuPrice('')
    setCategory('Main Course')
    setIngredients([])
    setPrepTime('')
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[500px] bg-white border-l border-gray-200 shadow-xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Add Menu Item</h3>
          <button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-sm transition-colors" onClick={onClose}>Close</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Section 1: Basic Dish Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider border-b border-gray-100 pb-2">Basic Dish Info</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dish Name *</label>
              <input 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                placeholder="e.g. Paneer Butter Masala" 
                value={menuName} 
                onChange={(e) => setMenuName(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>Starters</option>
                  <option>Main Course</option>
                  <option>Breads</option>
                  <option>Desserts</option>
                  <option>Beverages</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹) *</label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                  placeholder="280" 
                  value={menuPrice} 
                  onChange={(e) => setMenuPrice(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
              <select 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                value={isAvailable ? 'yes' : 'no'} 
                onChange={(e) => setIsAvailable(e.target.value === 'yes')}
              >
                <option value="yes">✅ Available</option>
                <option value="no">❌ Temporarily Unavailable</option>
              </select>
            </div>
          </div>

          {/* Section 2: Ingredients Mapping */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h4 className="text-sm font-semibold text-gray-900 tracking-wider">Ingredients Mapping</h4>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Core Feature</span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500">
                <div className="col-span-5">Ingredient</div>
                <div className="col-span-3">Qty</div>
                <div className="col-span-2">Unit</div>
                <div className="col-span-2"></div>
              </div>

              {ingredients.map((ing, idx) => (
                <div key={ing.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <select 
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                      value={ing.inventoryId || ing.name}
                      onChange={(e) => updateIngredient(idx, 'inventoryId', e.target.value)}
                    >
                      <option value="">Select...</option>
                      {inventoryItems.map(item => (
                        <option key={item.id || item.name} value={item.id || item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input 
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="0.0"
                      value={ing.qty}
                      onChange={(e) => updateIngredient(idx, 'qty', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600 px-2">{ing.unit || '-'}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <button 
                      className="text-red-500 hover:text-red-700 text-lg leading-none"
                      onClick={() => removeIngredient(idx)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              <button 
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors text-sm font-medium"
                onClick={addIngredientRow}
              >
                + Add Ingredient
              </button>
            </div>
          </div>

          {/* Section 3: Cost & Profit */}
          <div className="space-y-4">
             <h4 className="text-sm font-semibold text-gray-900 tracking-wider border-b border-gray-100 pb-2">Cost & Profit</h4>
             <div className="grid grid-cols-2 gap-4">
               <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                 <div className="text-xs text-red-600 mb-1">Estimated Cost</div>
                 <div className="text-lg font-bold text-red-700">₹{dishCost.toFixed(2)}</div>
               </div>
               <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                 <div className="text-xs text-green-600 mb-1">Estimated Profit</div>
                 <div className="text-lg font-bold text-green-700">₹{profit.toFixed(2)}</div>
               </div>
             </div>
          </div>

          {/* Section 4: Kitchen Controls */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider border-b border-gray-100 pb-2">Kitchen Controls</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preparation Time (min)</label>
              <input 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                placeholder="e.g. 15" 
                value={prepTime} 
                onChange={(e) => setPrepTime(e.target.value)} 
              />
            </div>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                checked={autoDisable} 
                onChange={(e) => setAutoDisable(e.target.checked)} 
              />
              <div>
                <div className="font-medium text-gray-900">Auto-disable if out of stock</div>
                <div className="text-xs text-gray-500">If any ingredient stock is 0, dish auto-hides.</div>
              </div>
            </label>
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
              disabled={!menuName || !menuPrice}
              onClick={handleSave}
            >
              Save Menu Item
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
