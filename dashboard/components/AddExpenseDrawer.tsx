'use client'
import { useState, useEffect } from 'react'
import { useHotel } from './HotelProvider'
import { useExpenses } from '@/hooks/useExpenses'

// Simple Icons
const ChevronDown = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
)

const EXPENSE_TYPES = ['Staff Salary', 'Operational', 'Vendor Payment']
const RECURRING_TYPES = ['One-time', 'Recurring']
const FREQUENCIES = ['Monthly', 'Weekly', 'Bi-Weekly', 'Yearly']
const SALARY_TYPES = [
  'Salaries & Wages',
  'Overtime Payments',
  'Staff Advances',
  'Bonuses / Incentives',
  'Staff Meals',
  'Uniforms',
  'Staff Training'
]

const OPS_CATEGORIES: Record<string, string[]> = {
  "Utilities": ["Electricity", "Water", "Gas", "Generator / Fuel", "Internet / Wi-Fi", "Telephone"],
  "Housekeeping & Cleaning": ["Cleaning Supplies", "Room Linen Washing", "Toiletries", "Detergents & Chemicals", "Garbage Bags", "Sanitization"],
  "Kitchen & Restaurant Operations": ["Cooking Gas (LPG)", "Kitchen Supplies", "Disposable Items", "Packaging Materials", "Napkins / Tissues", "Outside Food Purchase"],
  "Rooms & Guest Services": ["Room Amenities", "Bedsheets & Towels", "Curtains / Upholstery", "Guest Complimentary Items", "Room Décor Items"],
  "Maintenance & Repairs": ["Plumbing Repair", "Electrical Repair", "AC Maintenance", "Appliance Repair", "Furniture Repair", "Painting & Renovation"],
  "IT & Software": ["POS Software", "PMS / Hotel Software", "Domain & Hosting", "Hardware Repair", "CCTV Maintenance"],
  "Administration & Office": ["Stationery", "Printing", "Accounting Fees", "Legal Fees", "Consultancy Charges"],
  "Marketing & Sales": ["Online Advertising", "Promotions & Offers", "OTA Commission", "Printing & Branding", "Influencer / Agency Fees"],
  "Government & Compliance": ["License Fees", "GST / VAT", "Property Tax", "Fire Safety Certificate", "Health License"],
  "Transport & Logistics": ["Fuel", "Vehicle Maintenance", "Taxi / Courier", "Delivery Charges", "Parking Fees"],
  "Miscellaneous": ["Emergency Expense", "One-time Expense", "Other Operational Cost"]
}

const VENDOR_CATEGORIES: Record<string, string[]> = {
  "Laundry Vendors": ["Linen Laundry", "Uniform Laundry", "Curtain / Upholstery Laundry"],
  "Housekeeping Vendors": ["Outsourced Cleaning Staff", "Deep Cleaning Service", "Sanitization Vendor"],
  "Security Vendors": ["Security Guards", "CCTV Monitoring", "Security Agency Fees"],
  "Food & Supply Vendors": ["Vegetable Supplier", "Dairy Supplier", "Meat / Poultry Supplier", "Grocery Supplier", "Beverage Supplier"],
  "Maintenance Vendors": ["Plumbing Contractor", "Electrical Contractor", "AC Service Provider", "Lift Maintenance Vendor"],
  "Waste Management Vendors": ["Garbage Collection", "Recycling Service", "Bio-waste Management"],
  "Professional Services": ["Accountant", "Legal Consultant", "IT Support Vendor", "Marketing Agency"],
  "Logistics & Transport Vendors": ["Transport Contractor", "Delivery Partner", "Courier Service"],
  "Renovation & Construction Vendors": ["Interior Contractor", "Carpenter", "Painter", "Civil Work Contractor"],
  "Other Vendors": ["One-time Vendor", "Miscellaneous Vendor"]
}

export default function AddExpenseDrawer({ open, onClose, onSave, initialType }: { open: boolean; onClose: () => void; onSave: (cmd: any) => void; initialType?: string }) {
  const { hotel } = useHotel()
  const { staff, addExpense } = useExpenses()
  
  const [expenseType, setExpenseType] = useState(initialType || EXPENSE_TYPES[0])
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  
  // Update local type if initialType changes when opening
  useEffect(() => {
      if (initialType) setExpenseType(initialType)
  }, [initialType, open])

  // Staff Fields
  const [staffName, setStaffName] = useState('')
  const [role, setRole] = useState('')
  const [frequency, setFrequency] = useState(FREQUENCIES[0])
  const [salaryType, setSalaryType] = useState(SALARY_TYPES[0])

  // Ops Fields
  const [opsCategory, setOpsCategory] = useState(Object.keys(OPS_CATEGORIES)[0])
  const [opsSubType, setOpsSubType] = useState(OPS_CATEGORIES[Object.keys(OPS_CATEGORIES)[0]][0])
  const [recurringType, setRecurringType] = useState(RECURRING_TYPES[0])

  // Handle Ops Category Change
  useEffect(() => {
    if (OPS_CATEGORIES[opsCategory]) {
        setOpsSubType(OPS_CATEGORIES[opsCategory][0])
    }
  }, [opsCategory])

  // Vendor Fields
  const [vendorName, setVendorName] = useState('')
  const [vendorCategory, setVendorCategory] = useState(Object.keys(VENDOR_CATEGORIES)[0])
  const [vendorSubType, setVendorSubType] = useState(VENDOR_CATEGORIES[Object.keys(VENDOR_CATEGORIES)[0]][0])

  // Handle Vendor Category Change
  useEffect(() => {
    if (VENDOR_CATEGORIES[vendorCategory]) {
        setVendorSubType(VENDOR_CATEGORIES[vendorCategory][0])
    }
  }, [vendorCategory])

  // Handle staff selection
  useEffect(() => {
    if (expenseType === 'Staff Salary' && staffName) {
        const s = staff.find(s => s.name === staffName)
        if (s) {
            setRole(s.role)
            setAmount(s.salary.toString())
            setFrequency(s.frequency)
        }
    }
  }, [staffName, expenseType, staff])

  if (!open) return null

  const handleSave = () => {
    if (!amount) return

    let payload: any = {
        amount: Number(amount),
        date: date,
        type: expenseType === 'Operational' ? recurringType : (expenseType === 'Staff Salary' ? salaryType : 'One-time'),
        name: ''
    }

    if (expenseType === 'Staff Salary') {
        if (!staffName || !role) return
        payload = {
            ...payload,
            category: 'STAFF',
            name: `Salary: ${staffName} (${role})`,
            // extra metadata can be stored if backend supports it, for now we map to flat structure
        }
    } else if (expenseType === 'Operational') {
        if (!opsCategory || !opsSubType) return
        payload = {
            ...payload,
            category: 'OPERATIONAL',
            name: `${opsCategory}: ${opsSubType}`,
        }
    } else if (expenseType === 'Vendor Payment') {
        if (!vendorName || !vendorCategory || !vendorSubType) return
        payload = {
            ...payload,
            category: 'VENDOR',
            name: `Vendor: ${vendorName} (${vendorCategory}: ${vendorSubType})`,
        }
    }

    // Save to local hook
    addExpense(payload)
    
    // Also trigger onSave for parent (if needed for API/ChatAgent)
    onSave(payload)
    
    onClose()
    
    // Reset fields
    setAmount('')
    setStaffName('')
    setRole('')
    setVendorName('')
    setVendorCategory(Object.keys(VENDOR_CATEGORIES)[0])
    setVendorSubType(VENDOR_CATEGORIES[Object.keys(VENDOR_CATEGORIES)[0]][0])
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[400px] bg-white border-l border-borderLight shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Add Expense</h3>
          <button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-sm transition-colors" onClick={onClose}>Close</button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Expense Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expense Type</label>
            <div className="grid grid-cols-3 gap-2">
                {EXPENSE_TYPES.map(type => (
                    <button
                        key={type}
                        onClick={() => setExpenseType(type)}
                        className={`px-2 py-2 text-xs font-medium rounded-lg border transition-all ${
                            expenseType === type 
                                ? 'bg-black text-white border-black' 
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {type.split(' ')[0]}
                    </button>
                ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Dynamic Fields based on Type */}
          
          {/* STAFF SALARY */}
          {expenseType === 'Staff Salary' && (
             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                      value={staffName} 
                      onChange={(e) => setStaffName(e.target.value)}
                    >
                      <option value="">Select Staff Member</option>
                      {staff.filter(s => s.status === 'Active').map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none">
                      <ChevronDown size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                    placeholder="e.g. Receptionist" 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary Type</label>
                  <div className="relative">
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                      value={salaryType} 
                      onChange={(e) => setSalaryType(e.target.value)}
                    >
                      {SALARY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none">
                      <ChevronDown size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Frequency</label>
                  <div className="relative">
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                      value={frequency} 
                      onChange={(e) => setFrequency(e.target.value)}
                    >
                      {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none">
                      <ChevronDown size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>
             </div>
          )}

          {/* OPERATIONAL */}
          {expenseType === 'Operational' && (
             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expense Category <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                      value={opsCategory} 
                      onChange={(e) => setOpsCategory(e.target.value)}
                    >
                      {Object.keys(OPS_CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none">
                      <ChevronDown size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Type <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                      value={opsSubType} 
                      onChange={(e) => setOpsSubType(e.target.value)}
                    >
                      {OPS_CATEGORIES[opsCategory]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none">
                      <ChevronDown size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <div className="flex gap-2">
                    {RECURRING_TYPES.map(t => (
                        <button
                            key={t}
                            onClick={() => setRecurringType(t)}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                                recurringType === t 
                                    ? 'bg-gray-100 text-black border-gray-300' 
                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                  </div>
                </div>
             </div>
          )}

          {/* VENDOR */}
          {expenseType === 'Vendor Payment' && (
             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name <span className="text-red-500">*</span></label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                    placeholder="e.g. City Laundry Services" 
                    value={vendorName} 
                    onChange={(e) => setVendorName(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Type <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                      value={vendorCategory} 
                      onChange={(e) => setVendorCategory(e.target.value)}
                    >
                      {Object.keys(VENDOR_CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none">
                      <ChevronDown size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Type <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                      value={vendorSubType} 
                      onChange={(e) => setVendorSubType(e.target.value)}
                    >
                      {VENDOR_CATEGORIES[vendorCategory]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none">
                      <ChevronDown size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>
             </div>
          )}

          <hr className="border-gray-100" />

          {/* Common Fields */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 tracking-wider">Payment Details</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) <span className="text-red-500">*</span></label>
              <input 
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium text-lg" 
                placeholder="0.00" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>
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
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              disabled={!amount || (expenseType === 'Staff Salary' && !staffName) || (expenseType === 'Operational' && (!opsCategory || !opsSubType)) || (expenseType === 'Vendor Payment' && !vendorName)}
              onClick={handleSave}
            >
              Save Expense
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
