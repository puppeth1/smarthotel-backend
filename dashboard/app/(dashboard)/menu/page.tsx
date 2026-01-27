'use client'
import { useState, useEffect } from 'react'
import { useHotel } from '@/components/HotelProvider'

// Types
interface MenuCategory {
  id: string
  name: string
}

interface MenuItem {
  id: string
  categoryId: string
  name: string
  price: number
  description: string
  isAvailable: boolean
}

// Order Types (Simulating backend)
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
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  createdAt: string
  updatedAt: string
  notes?: string
}

interface CartItem extends MenuItem {
    quantity: number
}

// Initial Data
const DEFAULT_CATEGORIES: MenuCategory[] = [
  { id: 'cat_1', name: 'Breakfast' },
  { id: 'cat_2', name: 'Main Course' },
  { id: 'cat_3', name: 'Beverages' }
]

const DEFAULT_ITEMS: MenuItem[] = [
  { id: 'item_1', categoryId: 'cat_1', name: 'Continental Breakfast', price: 350, description: 'Toast, eggs, juice, and coffee', isAvailable: true },
  { id: 'item_2', categoryId: 'cat_1', name: 'Pancakes Stack', price: 250, description: 'With maple syrup and berries', isAvailable: true },
  { id: 'item_3', categoryId: 'cat_2', name: 'Grilled Chicken', price: 550, description: 'Served with mashed potatoes', isAvailable: true },
  { id: 'item_4', categoryId: 'cat_2', name: 'Paneer Butter Masala', price: 450, description: 'Rich creamy curry with naan', isAvailable: true },
  { id: 'item_5', categoryId: 'cat_3', name: 'Fresh Orange Juice', price: 150, description: 'Freshly squeezed', isAvailable: true },
  { id: 'item_6', categoryId: 'cat_3', name: 'Cappuccino', price: 180, description: 'Italian style coffee', isAvailable: true },
]

export default function MenuPage() {
  const { hotel } = useHotel()
  const currency = hotel?.settings?.currency || { code: 'INR', symbol: '₹' }

  // State for Draft (Editable)
  const [draftCategories, setDraftCategories] = useState<MenuCategory[]>([])
  const [draftItems, setDraftItems] = useState<MenuItem[]>([])
  
  // State for Live (Read-only reference)
  const [liveCategories, setLiveCategories] = useState<MenuCategory[]>([])
  const [liveItems, setLiveItems] = useState<MenuItem[]>([])

  const [activeCategoryId, setActiveCategoryId] = useState<string>('')
  const [isLivePreview, setIsLivePreview] = useState(false) // Toggle View Mode
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false)

  // POS / Live Order State
  const [cart, setCart] = useState<CartItem[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [orderForm, setOrderForm] = useState({ roomNumber: '', guestName: '', notes: '', type: 'Dine-in', roomType: '' })

  // Derived Data from Settings
  const activeRoomTypes = hotel?.settings?.roomTypes?.filter((rt: any) => rt.active !== false) || []
  
  const availableRooms = activeRoomTypes.find((rt: any) => rt.type === orderForm.roomType) 
    ? Array.from({ length: (activeRoomTypes.find((rt: any) => rt.type === orderForm.roomType) as any).roomNumberEnd - (activeRoomTypes.find((rt: any) => rt.type === orderForm.roomType) as any).roomNumberStart + 1 }, (_, i) => ((activeRoomTypes.find((rt: any) => rt.type === orderForm.roomType) as any).roomNumberStart + i).toString())
    : []

  const availableTables = Array.from({ length: Number(hotel?.settings?.totalTables || 6) }, (_, i) => (i + 1).toString())

  // Format Helper
  const formatRoomType = (t: string) => t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  // Tax & Discount State
  const [taxRate, setTaxRate] = useState(5) // %
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('amount')
  const [discountValue, setDiscountValue] = useState(0)

  // Loading
  const [loading, setLoading] = useState(true)

  // Modals State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ id: '', name: '' })
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [itemForm, setItemForm] = useState<Partial<MenuItem>>({ name: '', price: 0, description: '', isAvailable: true, categoryId: '' })
  
  // Smart Suggestions
  const SUGGESTIONS = [
    { name: 'Veg Spring Roll', category: 'Appetizers', price: 220, sub: 'Veg' },
    { name: 'Paneer Tikka', category: 'Appetizers', price: 280, sub: 'Veg' },
    { name: 'Chicken Tikka', category: 'Appetizers', price: 350, sub: 'Chicken' },
    { name: 'Chicken 65', category: 'Appetizers', price: 320, sub: 'Chicken' },
    { name: 'Crispy Corn', category: 'Appetizers', price: 200, sub: 'Veg' },
    { name: 'French Fries', category: 'Appetizers', price: 150, sub: 'Veg' },
    { name: 'Dal Tadka', category: 'Main Course', price: 220, sub: 'Veg' },
    { name: 'Paneer Butter Masala', category: 'Main Course', price: 320, sub: 'Veg' },
    { name: 'Butter Chicken', category: 'Main Course', price: 380, sub: 'Chicken' },
    { name: 'Chicken Curry', category: 'Main Course', price: 350, sub: 'Chicken' },
    { name: 'Veg Kadhai', category: 'Main Course', price: 280, sub: 'Veg' },
    { name: 'Egg Curry', category: 'Main Course', price: 250, sub: 'Egg' },
    { name: 'Steamed Rice', category: 'Rice', price: 120, sub: 'Veg' },
    { name: 'Jeera Rice', category: 'Rice', price: 160, sub: 'Veg' },
    { name: 'Veg Fried Rice', category: 'Rice', price: 220, sub: 'Veg' },
    { name: 'Chicken Fried Rice', category: 'Rice', price: 280, sub: 'Chicken' },
    { name: 'Veg Noodles', category: 'Rice', price: 200, sub: 'Veg' },
    { name: 'Tandoori Roti', category: 'Breads', price: 30, sub: 'Veg' },
    { name: 'Butter Naan', category: 'Breads', price: 60, sub: 'Veg' },
    { name: 'Garlic Naan', category: 'Breads', price: 80, sub: 'Veg' },
    { name: 'Plain Paratha', category: 'Breads', price: 50, sub: 'Veg' },
    { name: 'Gulab Jamun', category: 'Desserts', price: 100, sub: 'Veg' },
    { name: 'Ice Cream', category: 'Desserts', price: 120, sub: 'Veg' },
    { name: 'Brownie', category: 'Desserts', price: 180, sub: 'Veg' },
    { name: 'Rasmalai', category: 'Desserts', price: 150, sub: 'Veg' },
    { name: 'Tea', category: 'Beverages', price: 40, sub: 'Beverage' },
    { name: 'Coffee', category: 'Beverages', price: 60, sub: 'Beverage' },
    { name: 'Soft Drink', category: 'Beverages', price: 50, sub: 'Beverage' },
    { name: 'Fresh Lime Soda', category: 'Beverages', price: 90, sub: 'Beverage' },
    { name: 'Milkshake', category: 'Beverages', price: 150, sub: 'Beverage' },
    { name: 'Mutton Rogan Josh', category: 'Main Course', price: 450, sub: 'Mutton' },
    { name: 'Mutton Biryani', category: 'Rice', price: 380, sub: 'Mutton' },
    { name: 'Fish Curry', category: 'Main Course', price: 400, sub: 'Sea Food' },
    { name: 'Prawns Fry', category: 'Appetizers', price: 420, sub: 'Sea Food' },
    { name: 'Fish & Chips', category: 'Appetizers', price: 350, sub: 'Sea Food' }
  ]

  const [suggestionSearch, setSuggestionSearch] = useState('')
  const [suggestionFilter, setSuggestionFilter] = useState<'All' | 'Veg' | 'Egg' | 'Chicken' | 'Mutton' | 'Sea Food'>('All')

  const filteredSuggestions = SUGGESTIONS.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(suggestionSearch.toLowerCase())
    const matchesFilter = suggestionFilter === 'All' || s.sub === suggestionFilter
    return matchesSearch && matchesFilter
  })

  const addSuggestion = (s: typeof SUGGESTIONS[0]) => {
    // Find or Create Category
    let targetCatId = draftCategories.find(c => c.name === s.category)?.id
    
    // Note: In a real app, we might create the category if it doesn't exist. 
    // For now, we'll default to the first available category if not found, or alert.
    if (!targetCatId) {
        // Fallback: try to find a similar category or use active
        targetCatId = activeCategoryId
    }

    const newItem: MenuItem = {
        id: `item_${Date.now()}`,
        categoryId: targetCatId,
        name: s.name,
        price: s.price,
        description: `${s.sub} - `,
        isAvailable: true
    }
    
    setDraftItems(prev => [...prev, newItem])
    // Switch view to that category to show the user what happened
    setActiveCategoryId(targetCatId)
  }

  // Sub-Category Logic
  const SUBCATEGORIES = ['Veg', 'Egg', 'Chicken', 'Mutton', 'Sea Food', 'Beverage', 'Cocktail', 'Mocktail', 'Dessert']

  const handleSubCategorySelect = (sub: string) => {
    const currentDesc = itemForm.description || ''
    // If description already starts with a sub-category prefix (e.g. "Veg - "), replace it
    const hasPrefix = SUBCATEGORIES.some(s => currentDesc.startsWith(s + ' - '))
    
    let newDesc = currentDesc
    if (hasPrefix) {
        newDesc = currentDesc.replace(/^[a-zA-Z\s]+ - /, `${sub} - `)
    } else {
        newDesc = `${sub} - ${currentDesc}`
    }
    
    setItemForm({ ...itemForm, description: newDesc })
  }

  // Initialize Data
  useEffect(() => {
    // Load Live Data
    const liveCat = localStorage.getItem('hp_menu_live_categories')
    const liveItm = localStorage.getItem('hp_menu_live_items')
    
    let lCats = liveCat ? JSON.parse(liveCat) : DEFAULT_CATEGORIES
    let lItems = liveItm ? JSON.parse(liveItm) : DEFAULT_ITEMS

    // If first run, persist defaults to Live
    if (!liveCat || !liveItm) {
       localStorage.setItem('hp_menu_live_categories', JSON.stringify(lCats))
       localStorage.setItem('hp_menu_live_items', JSON.stringify(lItems))
    }

    setLiveCategories(lCats)
    setLiveItems(lItems)

    // Load Draft Data (or init from Live if empty)
    const draftCat = localStorage.getItem('hp_menu_draft_categories')
    const draftItm = localStorage.getItem('hp_menu_draft_items')

    let dCats = draftCat ? JSON.parse(draftCat) : lCats
    let dItems = draftItm ? JSON.parse(draftItm) : lItems

    setDraftCategories(dCats)
    setDraftItems(dItems)
    
    if (dCats.length > 0) setActiveCategoryId(dCats[0].id)

    setLoading(false)
  }, [])

  // Check for changes
  useEffect(() => {
    if (loading) return
    const isDiff = JSON.stringify(draftCategories) !== JSON.stringify(liveCategories) || 
                   JSON.stringify(draftItems) !== JSON.stringify(liveItems)
    setHasUnpublishedChanges(isDiff)

    // Auto-save Draft
    localStorage.setItem('hp_menu_draft_categories', JSON.stringify(draftCategories))
    localStorage.setItem('hp_menu_draft_items', JSON.stringify(draftItems))
  }, [draftCategories, draftItems, liveCategories, liveItems, loading])


  const handlePublish = () => {
    if (!confirm('Are you sure you want to publish these changes? This will update the live menu for all guests and staff.')) return
    
    setLiveCategories([...draftCategories])
    setLiveItems([...draftItems])
    
    localStorage.setItem('hp_menu_live_categories', JSON.stringify(draftCategories))
    localStorage.setItem('hp_menu_live_items', JSON.stringify(draftItems))
    
    alert('Menu Published Successfully!')
  }

  const handleDiscardDraft = () => {
    if (!confirm('Discard all draft changes and revert to Live menu?')) return
    setDraftCategories([...liveCategories])
    setDraftItems([...liveItems])
  }

  // --- CRUD Operations (Draft Only) ---

  const saveCategory = () => {
    if (!categoryForm.name) return
    
    if (categoryForm.id) {
        // Edit
        setDraftCategories(prev => prev.map(c => c.id === categoryForm.id ? { ...c, name: categoryForm.name } : c))
    } else {
        // Add
        const newCat = { id: `cat_${Date.now()}`, name: categoryForm.name }
        setDraftCategories(prev => [...prev, newCat])
        setActiveCategoryId(newCat.id)
    }
    setIsCategoryModalOpen(false)
  }

  const deleteCategory = (id: string) => {
    if (!confirm('Delete this category? All items in it will also be deleted.')) return
    setDraftCategories(prev => prev.filter(c => c.id !== id))
    setDraftItems(prev => prev.filter(i => i.categoryId !== id))
    if (activeCategoryId === id) setActiveCategoryId(draftCategories[0]?.id || '')
  }

  const saveItem = () => {
    if (!itemForm.name || !itemForm.price || !itemForm.categoryId) return

    if (itemForm.id) {
        // Edit
        setDraftItems(prev => prev.map(i => i.id === itemForm.id ? { ...i, ...itemForm } as MenuItem : i))
    } else {
        // Add
        const newItem: MenuItem = {
            id: `item_${Date.now()}`,
            categoryId: itemForm.categoryId,
            name: itemForm.name || '',
            price: Number(itemForm.price),
            description: itemForm.description || '',
            isAvailable: itemForm.isAvailable ?? true
        }
        setDraftItems(prev => [...prev, newItem])
    }
    setIsItemModalOpen(false)
  }

  const deleteItem = (id: string) => {
    if (!confirm('Delete this item?')) return
    setDraftItems(prev => prev.filter(i => i.id !== id))
  }

  // --- POS / CART LOGIC ---
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
        const existing = prev.find(i => i.id === item.id)
        if (existing) {
            return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
        }
        return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId))
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
        if (i.id === itemId) {
            const newQty = Math.max(1, i.quantity + delta)
            return { ...i, quantity: newQty }
        }
        return i
    }))
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  // Calculate Totals
  const discountAmount = discountType === 'amount' ? discountValue : (cartTotal * (discountValue / 100))
  const taxableAmount = Math.max(0, cartTotal - discountAmount)
  const taxAmount = taxableAmount * (taxRate / 100)
  const finalTotal = taxableAmount + taxAmount

  const handlePlaceOrderClick = () => {
    if (cart.length === 0) return
    setIsOrderModalOpen(true)
  }

  const confirmOrder = () => {
    if (!orderForm.roomNumber && !orderForm.guestName) {
        alert('Please enter Room Number or Guest Name')
        return
    }

    const newOrder: Order = {
        id: `ORD-${Date.now().toString().slice(-4)}`,
        roomNumber: orderForm.roomNumber || 'N/A',
        guestName: orderForm.guestName || 'Walk-in',
        items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        status: 'PENDING',
        subtotal: cartTotal,
        discountAmount,
        taxAmount,
        totalAmount: finalTotal,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: orderForm.notes
    }

    // Save to LocalStorage (Orders)
    const existingOrdersStr = localStorage.getItem('hp_orders')
    const existingOrders = existingOrdersStr ? JSON.parse(existingOrdersStr) : []
    const updatedOrders = [newOrder, ...existingOrders]
    localStorage.setItem('hp_orders', JSON.stringify(updatedOrders))

    // Clear Cart & Close Modal
    setCart([])
    setOrderForm({ roomNumber: '', guestName: '', notes: '', type: 'Dine-in', roomType: '' })
    setIsOrderModalOpen(false)
    alert('Order Placed Successfully!')
  }

  // --- View Logic ---
  const categories = isLivePreview ? liveCategories : draftCategories
  const items = isLivePreview ? liveItems : draftItems
  
  const activeItems = items.filter(i => i.categoryId === activeCategoryId)

  if (loading) return <div className="p-6">Loading Menu...</div>

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* LEFT PANEL: Sidebar & Categories */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm shrink-0">
        <div className="p-4 border-b border-gray-100">
           <div className="flex items-center justify-between mb-4">
             <h2 className="font-bold text-lg text-gray-900">Menu</h2>
             {!isLivePreview && (
                <button 
                    onClick={() => { setCategoryForm({ id: '', name: '' }); setIsCategoryModalOpen(true) }}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors" title="Add Category"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                </button>
             )}
           </div>
           
           {/* Mode Toggle */}
           <div className="flex bg-gray-100 p-1 rounded-lg mb-2">
              <button 
                 onClick={() => setIsLivePreview(false)}
                 className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${!isLivePreview ? 'bg-white shadow text-black' : 'text-gray-500'}`}
              >
                Draft Editor
              </button>
              <button 
                 onClick={() => setIsLivePreview(true)}
                 className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${isLivePreview ? 'bg-green-50 text-green-700 shadow border border-green-100' : 'text-gray-500'}`}
              >
                Live Menu
              </button>
           </div>
           
           {hasUnpublishedChanges && !isLivePreview && (
              <div className="text-xs bg-yellow-50 text-yellow-700 px-3 py-2 rounded border border-yellow-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                  Unpublished Changes
              </div>
           )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {categories.map(cat => (
                <div 
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        activeCategoryId === cat.id 
                            ? 'bg-black text-white' 
                            : 'hover:bg-gray-50 text-gray-700'
                    }`}
                >
                    <span className="font-medium text-sm truncate">{cat.name}</span>
                    {!isLivePreview && (
                        <div className={`flex gap-1 ${activeCategoryId === cat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setCategoryForm(cat); setIsCategoryModalOpen(true) }}
                                className={`p-1 rounded ${activeCategoryId === cat.id ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id) }}
                                className={`p-1 rounded ${activeCategoryId === cat.id ? 'hover:bg-gray-700 text-red-300' : 'hover:bg-red-50 text-red-500'}`}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* CENTER PANEL: Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden relative">
        <div className="flex h-full">
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Toolbar */}
                <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {categories.find(c => c.id === activeCategoryId)?.name || 'Select Category'}
                        </h1>
                        <p className="text-xs text-gray-500">
                            {activeItems.length} items • {isLivePreview ? 'Ordering Mode' : 'Editing Mode'}
                        </p>
                    </div>
                    
                    {!isLivePreview ? (
                        <div className="flex gap-3">
                            <button 
                                onClick={handleDiscardDraft}
                                disabled={!hasUnpublishedChanges}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 transition-colors"
                            >
                                Discard Changes
                            </button>
                            <button 
                                onClick={handlePublish}
                                disabled={!hasUnpublishedChanges}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                            >
                                <span>Publish Changes</span>
                                {hasUnpublishedChanges && <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>}
                            </button>
                            <div className="w-px h-8 bg-gray-200 mx-1"></div>
                            <button 
                                onClick={() => { setItemForm({ price: 0, isAvailable: true, categoryId: activeCategoryId }); setIsItemModalOpen(true) }}
                                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <span>+</span> Add Item
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                             <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-black' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                                </button>
                                <button 
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-black' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                                </button>
                             </div>
                             <div className="bg-green-50 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Live POS
                             </div>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* LIST VIEW */}
                    {isLivePreview && viewMode === 'list' ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 font-medium text-gray-500">Item</th>
                                        <th className="px-6 py-3 font-medium text-gray-500">Price</th>
                                        <th className="px-6 py-3 font-medium text-gray-500 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {activeItems.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{item.name}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-xs">{item.description}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-900 font-medium">
                                                {currency.symbol}{item.price}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    disabled={!item.isAvailable}
                                                    onClick={() => addToCart(item)}
                                                    className="px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed"
                                                >
                                                    {item.isAvailable ? 'Add +' : 'Sold Out'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* GRID VIEW */
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                            {activeItems.map(item => (
                                <div key={item.id} className={`bg-white rounded-xl border shadow-sm transition-all group relative overflow-hidden ${!item.isAvailable ? 'opacity-60 grayscale' : 'hover:shadow-md'}`}>
                                    {/* Status Strip */}
                                    <div className={`h-1 w-full ${item.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-lg text-gray-900 pr-4">{item.name}</h3>
                                            <span className="font-bold text-gray-900 whitespace-nowrap bg-gray-50 px-2 py-1 rounded text-sm">
                                                {currency.symbol}{item.price}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">{item.description}</p>
                                        
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                            <span className={`text-xs font-medium px-2 py-1 rounded ${item.isAvailable ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {item.isAvailable ? 'Available' : 'Unavailable'}
                                            </span>
                                            
                                            {!isLivePreview ? (
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => { setItemForm(item); setIsItemModalOpen(true) }}
                                                        className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded" title="Edit"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteItem(item.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    disabled={!item.isAvailable}
                                                    onClick={() => addToCart(item)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors shadow-sm"
                                                >
                                                    <span className="text-xl leading-none mb-1">+</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {!isLivePreview && activeItems.length === 0 && (
                                <div 
                                    onClick={() => { setItemForm({ price: 0, isAvailable: true, categoryId: activeCategoryId }); setIsItemModalOpen(true) }}
                                    className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-black hover:text-black cursor-pointer transition-all min-h-[200px]"
                                >
                                    <span className="text-4xl mb-2">+</span>
                                    <span className="font-medium">Add First Item</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: Dynamic (Suggestions or Cart) */}
            {isLivePreview ? (
                // --- CART PANEL (Live Mode) ---
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full shadow-xl z-20">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-900">Current Order</h3>
                        <p className="text-xs text-gray-500">
                            {cart.length} items selected
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-center">
                                <svg className="w-10 h-10 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                                <p className="text-sm">Cart is empty</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="flex justify-between items-start group">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                        <div className="text-xs text-gray-500">{currency.symbol}{item.price} each</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-7">
                                            <button 
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="w-6 h-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600"
                                            >-</button>
                                            <span className="w-6 h-full flex items-center justify-center text-xs font-bold bg-white">{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="w-6 h-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600"
                                            >+</button>
                                        </div>
                                        <button 
                                            onClick={() => removeFromCart(item.id)}
                                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-white">
                        <div className="space-y-3 mb-6">
                            {/* Subtotal */}
                            <div className="flex justify-between items-center py-1">
                                <span className="text-gray-500 text-sm">Subtotal</span>
                                <span className="font-medium text-gray-900">{currency.symbol}{cartTotal.toFixed(2)}</span>
                            </div>

                            {/* Discount - Receipt Style */}
                            <div className="flex justify-between items-center py-1 group">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 text-sm">Discount</span>
                                    <div className="flex bg-gray-100 rounded-md p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button 
                                            onClick={() => setDiscountType('amount')}
                                            className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm transition-all ${discountType === 'amount' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                                        >{currency.symbol}</button>
                                        <button 
                                            onClick={() => setDiscountType('percent')}
                                            className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm transition-all ${discountType === 'percent' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                                        >%</button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number"
                                        min="0"
                                        value={discountValue === 0 ? '' : discountValue}
                                        onChange={e => setDiscountValue(Number(e.target.value))}
                                        placeholder="0"
                                        className="w-16 text-right bg-transparent border-b border-transparent hover:border-gray-200 focus:border-black focus:outline-none text-sm font-medium placeholder-gray-300 py-0.5 transition-colors"
                                    />
                                    {discountType === 'percent' && discountValue > 0 && (
                                        <span className="text-xs text-red-500 w-16 text-right font-medium">-{currency.symbol}{discountAmount.toFixed(2)}</span>
                                    )}
                                </div>
                            </div>

                            {/* Tax - Subtle Edit */}
                            <div className="flex justify-between items-center py-1 group">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 text-sm">Tax</span>
                                    <div className="relative flex items-center opacity-50 hover:opacity-100 transition-opacity">
                                        <input 
                                            type="number"
                                            min="0"
                                            value={taxRate}
                                            onChange={e => setTaxRate(Number(e.target.value))}
                                            className="w-8 text-center bg-gray-50 rounded text-xs font-medium text-gray-500 focus:text-black focus:bg-white focus:ring-1 focus:ring-black focus:outline-none py-0.5"
                                        />
                                        <span className="text-xs text-gray-400 ml-0.5">%</span>
                                    </div>
                                </div>
                                <span className="font-medium text-gray-900 text-sm">{currency.symbol}{taxAmount.toFixed(2)}</span>
                            </div>

                            {/* Total - Compact */}
                            <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-200 mt-2">
                                <span className="text-gray-900 font-bold text-sm">Total</span>
                                <span className="font-bold text-gray-900 text-sm">{currency.symbol}{finalTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        <button 
                            disabled={cart.length === 0}
                            onClick={handlePlaceOrderClick}
                            className="w-full py-3.5 bg-black text-white font-bold rounded-xl hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform active:scale-[0.98] transition-all flex justify-between items-center px-6"
                        >
                            <span>Place Order</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L20 7"/></svg>
                        </button>
                    </div>
                </div>
            ) : (
                // --- SUGGESTIONS PANEL (Draft Mode) ---
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full shadow-sm z-20">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-1">Quick Add Dishes</h3>
                        <p className="text-xs text-gray-500 mb-3">One-click add to draft</p>
                        
                        {/* Search */}
                        <div className="relative mb-3">
                            <input 
                                type="text" 
                                placeholder="Search dishes..." 
                                value={suggestionSearch}
                                onChange={(e) => setSuggestionSearch(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                            />
                            <svg className="absolute left-2.5 top-2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                            {['All', 'Veg', 'Egg', 'Chicken', 'Mutton', 'Sea Food'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setSuggestionFilter(f as any)}
                                    className={`px-2.5 py-1 text-xs rounded-full whitespace-nowrap border transition-colors ${
                                        suggestionFilter === f 
                                            ? 'bg-black text-white border-black' 
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {filteredSuggestions.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all group">
                                <div>
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
                                            s.sub === 'Veg' ? 'border-green-600' : 'border-red-600'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                 s.sub === 'Veg' ? 'bg-green-600' : 'bg-red-600'
                                            }`}></div>
                                        </div>
                                        <span className="font-medium text-sm text-gray-900">{s.name}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <span>{s.category}</span>
                                        <span>•</span>
                                        <span>{currency.symbol}{s.price}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => addSuggestion(s)}
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-black hover:text-white transition-colors"
                                >
                                    <span className="text-lg leading-none mb-0.5">+</span>
                                </button>
                            </div>
                        ))}
                        {filteredSuggestions.length === 0 && (
                             <div className="text-center py-8 text-gray-400 text-xs">
                                No dishes found.
                             </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* MODALS */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">{categoryForm.id ? 'Edit Category' : 'New Category'}</h3>
                    <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-500 hover:text-black">✕</button>
                </div>
                <div className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                    <input 
                        autoFocus
                        value={categoryForm.name}
                        onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                        placeholder="e.g. Starters"
                        onKeyDown={e => e.key === 'Enter' && saveCategory()}
                    />
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-2">
                    <button onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button onClick={saveCategory} disabled={!categoryForm.name} className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">Save</button>
                </div>
            </div>
        </div>
      )}

      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">{itemForm.id ? 'Edit Item' : 'New Item'}</h3>
                    <button onClick={() => setIsItemModalOpen(false)} className="text-gray-500 hover:text-black">✕</button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <div className="relative">
                            <select 
                                value={itemForm.categoryId}
                                onChange={e => setItemForm({...itemForm, categoryId: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                            >
                                <option value="" disabled>Select Category</option>
                                {draftCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-3 pointer-events-none">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                        <input 
                            value={itemForm.name}
                            onChange={e => setItemForm({...itemForm, name: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                            placeholder="e.g. Cheese Burger"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price ({currency.symbol})</label>
                        <input 
                            type="number"
                            value={itemForm.price}
                            onChange={e => setItemForm({...itemForm, price: Number(e.target.value)})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                            value={itemForm.description}
                            onChange={e => setItemForm({...itemForm, description: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black h-24 resize-none"
                            placeholder="Ingredients, portion size, etc."
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox"
                            id="isAvailable"
                            checked={itemForm.isAvailable}
                            onChange={e => setItemForm({...itemForm, isAvailable: e.target.checked})}
                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                        />
                        <label htmlFor="isAvailable" className="text-sm text-gray-700 font-medium">Available for Order</label>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-2">
                    <button onClick={() => setIsItemModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button onClick={saveItem} disabled={!itemForm.name || !itemForm.price} className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">Save Item</button>
                </div>
            </div>
        </div>
      )}

      {/* ORDER CONFIRMATION MODAL */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900">Confirm Order</h3>
                    <button onClick={() => setIsOrderModalOpen(false)} className="text-gray-500 hover:text-black">✕</button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-2">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium text-gray-900">{currency.symbol}{cartTotal.toFixed(2)}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-sm mb-1 text-green-600">
                                <span>Discount</span>
                                <span>-{currency.symbol}{discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Tax ({taxRate}%)</span>
                            <span className="font-medium text-gray-900">{currency.symbol}{taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-200">
                            <span>Total</span>
                            <span>{currency.symbol}{finalTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Order Type</label>
                        <div className="flex gap-2">
                            {['Dine-in', 'Room Service', 'Takeaway'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setOrderForm({...orderForm, type, roomNumber: '', roomType: ''})}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                                        orderForm.type === type 
                                            ? 'bg-black text-white border-black' 
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {orderForm.type === 'Room Service' ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                                    <div className="relative">
                                        <select 
                                            value={orderForm.roomType}
                                            onChange={e => setOrderForm({...orderForm, roomType: e.target.value, roomNumber: ''})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                                        >
                                            <option value="">Select Type</option>
                                            {activeRoomTypes.map((rt: any) => (
                                                <option key={rt.type} value={rt.type}>{formatRoomType(rt.type)}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-3 pointer-events-none">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                                    <div className="relative">
                                        <select 
                                            value={orderForm.roomNumber}
                                            onChange={e => setOrderForm({...orderForm, roomNumber: e.target.value})}
                                            disabled={!orderForm.roomType}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black disabled:bg-gray-50 disabled:text-gray-400"
                                        >
                                            <option value="">Select Room</option>
                                            {availableRooms.map((r: string) => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-3 pointer-events-none">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : orderForm.type === 'Dine-in' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Table Number</label>
                                <div className="relative">
                                    <select 
                                        value={orderForm.roomNumber}
                                        onChange={e => setOrderForm({...orderForm, roomNumber: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                                    >
                                        <option value="">Select Table</option>
                                        {availableTables.map((t: string) => (
                                            <option key={t} value={t}>Table {t}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-3 pointer-events-none">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Order Identifier</label>
                                <input 
                                    value={orderForm.roomNumber}
                                    onChange={e => setOrderForm({...orderForm, roomNumber: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                                    placeholder="e.g. Order #123"
                                />
                            </div>
                        )}

                        <div className={orderForm.type === 'Room Service' ? 'col-span-2' : ''}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
                            <input 
                                value={orderForm.guestName}
                                onChange={e => setOrderForm({...orderForm, guestName: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black"
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea 
                            value={orderForm.notes}
                            onChange={e => setOrderForm({...orderForm, notes: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black h-20 resize-none text-sm"
                            placeholder="Allergies, special requests..."
                        />
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex gap-3">
                    <button onClick={() => setIsOrderModalOpen(false)} className="flex-1 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                    <button 
                        onClick={confirmOrder} 
                        disabled={!orderForm.roomNumber}
                        className="flex-[2] py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                        <span>Confirm & Send to Kitchen</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
