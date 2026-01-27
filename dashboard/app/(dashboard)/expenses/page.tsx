'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import { formatMoney } from '@/lib/formatMoney'
import { useHotel } from '@/components/HotelProvider'
import { useExpenses } from '@/hooks/useExpenses'
import AddExpenseDrawer from '@/components/AddExpenseDrawer'

type ExpenseType = 'OPERATIONAL' | 'VENDOR' | 'STAFF_EXPENSE'

export default function ExpensesPage() {
  const { hotel } = useHotel()
  const currency = hotel?.settings?.currency
  const { staff, expenses, vendors, addExpense, addVendor } = useExpenses()
  const [activeTab, setActiveTab] = useState<ExpenseType>('STAFF_EXPENSE')

  // Operational Modal State
  const [isOpsModalOpen, setIsOpsModalOpen] = useState(false)
  const [opsForm, setOpsForm] = useState({ name: '', amount: '', type: 'Recurring', date: new Date().toISOString().split('T')[0] })

  // Vendor Modal State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false)
  const [vendorForm, setVendorForm] = useState({ name: '', service: '', monthly_avg: '', last_payment: new Date().toISOString().split('T')[0] })

  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false)
  const [initialExpenseType, setInitialExpenseType] = useState('Staff Salary')
  
  // Reuse the global AddExpenseDrawer for staff payments if needed, 
  // or we can just trigger the same flow as the top button.
  // The user asked for a specific "+ Add Expense" button to record salary payment.
  // Let's import the drawer here or use a state to trigger the main one if possible.
  // Since AddExpenseDrawer is in layout/ChatAgent, we can't easily trigger it from here without context/event.
  // BUT we can import and render it locally for this page's specific needs if we want, 
  // or just use a custom simple modal for "Record Payment".
  // Given the "Use '+ Add Expense' button" instruction, let's make a button that opens our local drawer.
  
  // We need to import AddExpenseDrawer
  // It is a default export from components/AddExpenseDrawer
  
  // Let's add the import at the top first (done in previous thought if I could, but I'll add it now)
  // Actually I need to add import line. I will do it in next step.
  // For now, let's add the state and button logic.

  const openStaffPaymentDrawer = () => {
      // We will use the existing Ops/Vendor modals pattern but for Staff Payment?
      // No, user said "Use '+ Add Expense' button to record salary payment".
      // This implies using the component we built earlier.
      setInitialExpenseType('Staff Salary')
      setExpenseDrawerOpen(true)
  }

  const openVendorPaymentDrawer = () => {
      setInitialExpenseType('Vendor Payment')
      setExpenseDrawerOpen(true)
  }

  const handleAddOps = () => {
    setOpsForm({ name: '', amount: '', type: 'Recurring', date: new Date().toISOString().split('T')[0] })
    setIsOpsModalOpen(true)
  }

  const handleAddVendor = () => {
    setVendorForm({ name: '', service: '', monthly_avg: '', last_payment: new Date().toISOString().split('T')[0] })
    setIsVendorModalOpen(true)
  }

  const saveOps = () => {
    if (!opsForm.name || !opsForm.amount) return
    addExpense({
        name: opsForm.name,
        amount: Number(opsForm.amount),
        type: opsForm.type,
        category: 'OPERATIONAL',
        date: opsForm.date
    })
    setIsOpsModalOpen(false)
  }

  const saveVendor = () => {
    if (!vendorForm.name || !vendorForm.service) return
    
    addVendor({
        name: vendorForm.name,
        service: vendorForm.service,
        monthly_avg: Number(vendorForm.monthly_avg) || 0,
        last_payment: vendorForm.last_payment
    })
    setIsVendorModalOpen(false)
  }
  
  const [timeRange, setTimeRange] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')

  // Filter Logic based on Time Range
  const filteredExpenses = expenses.filter(e => {
      if (timeRange === 'MONTHLY') {
          return new Date(e.date).getMonth() === new Date().getMonth() && 
                 new Date(e.date).getFullYear() === new Date().getFullYear()
      }
      return new Date(e.date).getFullYear() === new Date().getFullYear()
  })

  // Filter expenses by category (from filtered list)
  const opsExpenses = filteredExpenses.filter(e => e.category === 'OPERATIONAL')
  const staffExpenses = filteredExpenses.filter(e => e.category === 'STAFF')
  const vendorExpenses = filteredExpenses.filter(e => e.category === 'VENDOR') // Assuming vendor payments are also logged in expenses for history

  // Calculations
  const monthlyStaffCost = staff.filter(s => s.status === 'Active').reduce((sum, s) => sum + s.salary, 0)
  const totalOpsCost = opsExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalSalaryPaid = staffExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalVendorPaid = vendorExpenses.reduce((sum, e) => sum + e.amount, 0) // Mock if not in list
  
  const totalPeriodExpenses = totalSalaryPaid + totalOpsCost + totalVendorPaid

  // Yearly Projection (Only relevant for Monthly view)
  const yearlyExpenseProjection = totalPeriodExpenses * 12

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500">Track operations, vendors, and staff payments</p>
        </div>
        
        <div className="flex items-center gap-4">
            {/* Time Range Toggle */}
            <div className="bg-gray-100 p-1 rounded-lg flex">
                <button 
                    onClick={() => setTimeRange('MONTHLY')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        timeRange === 'MONTHLY' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                    Monthly
                </button>
                <button 
                    onClick={() => setTimeRange('YEARLY')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        timeRange === 'YEARLY' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                    Yearly
                </button>
            </div>

            <div className="flex gap-2">
                <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
                Download Report
                </button>
                <button 
                    onClick={openStaffPaymentDrawer}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                >
                + Add Expense
                </button>
            </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">
              {timeRange === 'MONTHLY' ? 'Total Monthly Expenses' : 'Total Yearly Expenses'}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatMoney(totalPeriodExpenses, currency?.code, currency?.locale)}
          </div>
          <div className="text-xs text-green-600 mt-1 font-medium">↑ 5% from last period</div>
        </div>
        
        {/* Vendor Expenses Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Vendor Expenses</div>
          <div className="text-2xl font-bold text-purple-600">
            {formatMoney(totalVendorPaid, currency?.code, currency?.locale)}
          </div>
          <div className="text-xs text-purple-400 mt-1">{vendorExpenses.length} Payments</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Staff Expenses</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatMoney(totalSalaryPaid, currency?.code, currency?.locale)}
          </div>
          <div className="text-xs text-gray-400 mt-1">{staffExpenses.length} Payments</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Operational Costs</div>
          <div className="text-2xl font-bold text-orange-600">
            {formatMoney(totalOpsCost, currency?.code, currency?.locale)}
          </div>
          <div className="text-xs text-gray-400 mt-1">{opsExpenses.length} Transactions</div>
        </div>
      </div>
      
      {/* Expense Breakdown (Visual) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
        <div className="flex flex-col md:flex-row gap-6 items-center">
             {/* Simple Bar Chart Visualization */}
             <div className="flex-1 w-full space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">Staff Expenses</span>
                        <span className="text-gray-900">{formatMoney(totalSalaryPaid, currency?.code, currency?.locale)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(totalSalaryPaid / (totalPeriodExpenses || 1)) * 100}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">Operational Expenses</span>
                        <span className="text-gray-900">{formatMoney(totalOpsCost, currency?.code, currency?.locale)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${(totalOpsCost / (totalPeriodExpenses || 1)) * 100}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">Vendor Payments</span>
                        <span className="text-gray-900">{formatMoney(totalVendorPaid, currency?.code, currency?.locale)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${(totalVendorPaid / (totalPeriodExpenses || 1)) * 100}%` }}></div>
                    </div>
                </div>
             </div>
             
             {/* Trend Placeholder */}
             <div className="flex-1 w-full h-32 bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-200">
                 <span className="text-sm text-gray-400">Expense Trend Chart (Coming Soon)</span>
             </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {(['STAFF_EXPENSE', 'OPERATIONAL', 'VENDOR'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'border-b-2 border-black text-black'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'STAFF_EXPENSE' ? 'Staff Expenses' : tab === 'OPERATIONAL' ? 'Operational Expenses' : 'Vendor Payments'}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
        
        {/* Action Bar inside the card but above the table */}
        <div className="flex justify-end p-4 border-b border-gray-100">
            {activeTab === 'STAFF_EXPENSE' && (
                <button 
                    onClick={openStaffPaymentDrawer}
                    className="text-sm px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
                >
                    <span>+</span> Add Salary
                </button>
            )}
            {activeTab === 'OPERATIONAL' && (
                <button 
                    onClick={handleAddOps}
                    className="text-sm px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
                >
                    <span>+</span> Add Expense
                </button>
            )}
            {activeTab === 'VENDOR' && (
                <>
                    <button 
                        onClick={handleAddVendor}
                        className="text-sm px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                    >
                        <span>+</span> Add Vendor
                    </button>
                    <button 
                        onClick={openVendorPaymentDrawer}
                        className="ml-2 text-sm px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
                    >
                        <span>+</span> Add Expense
                    </button>
                </>
            )}
        </div>

        {/* STAFF EXPENSE TAB */}
        {activeTab === 'STAFF_EXPENSE' && (
          <div className="overflow-x-auto relative">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Staff Name</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Base Salary</th>
                  <th className="px-6 py-3 text-right">Paid Amount</th>
                  <th className="px-6 py-3 text-right">Month</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffExpenses.map((e) => {
                  // We need to extract Staff Name/Role from description or store it better
                  // For now, parsing from description: "Salary: Rahul Kumar (Receptionist)"
                  const desc = e.name || ''
                  const nameMatch = desc.match(/Salary: (.*) \((.*)\)/)
                  const staffName = nameMatch ? nameMatch[1] : e.name
                  const staffRole = nameMatch ? nameMatch[2] : '-'
                  
                  const staffMember = staff.find(s => s.name === staffName)
                  const baseSalary = staffMember ? staffMember.salary : null

                  return (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{staffName}</td>
                    <td className="px-6 py-4 text-gray-500">
                        <div>{staffRole}</div>
                        {e.type && e.type !== 'One-time' && <div className="text-xs text-gray-400">{e.type}</div>}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                        {baseSalary ? formatMoney(baseSalary, currency?.code, currency?.locale) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-green-700">{formatMoney(e.amount, currency?.code, currency?.locale)}</td>
                    <td className="px-6 py-4 text-right text-gray-500">
                        {format(new Date(e.date), 'MMMM yyyy')}
                    </td>
                  </tr>
                  )
                })}
                {staffExpenses.length === 0 && (
                    <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                            <p className="mb-1">No staff payments recorded for this period.</p>
                            <p className="text-xs text-gray-300">Staff payments may vary monthly due to attendance, leave, or overtime.</p>
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* OPERATIONAL TAB */}
        {activeTab === 'OPERATIONAL' && (
          <div className="overflow-x-auto relative">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Expense Name</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {opsExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{e.name}</td>
                    <td className="px-6 py-4 text-gray-500">{format(new Date(e.date), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        e.type === 'Recurring' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                      }`}>
                        {e.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{formatMoney(e.amount, currency?.code, currency?.locale)}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-500 hover:text-black text-xs">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VENDOR TAB */}
        {activeTab === 'VENDOR' && (
          <div className="overflow-x-auto relative">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Vendor Name</th>
                  <th className="px-6 py-3">Service</th>
                  <th className="px-6 py-3">Monthly Avg</th>
                  <th className="px-6 py-3">Last Payment</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{v.name}</td>
                    <td className="px-6 py-4 text-gray-600">{v.service}</td>
                    <td className="px-6 py-4 font-medium">{formatMoney(v.monthly_avg, currency?.code, currency?.locale)}</td>
                    <td className="px-6 py-4 text-gray-500">{v.last_payment}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:underline text-xs mr-3">History</button>
                      <button className="text-gray-500 hover:text-black text-xs">Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Ops Modal */}
      {isOpsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-semibold text-gray-900">Add Operational Expense</h3>
                    <button onClick={() => setIsOpsModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expense Name</label>
                        <input 
                            value={opsForm.name}
                            onChange={e => setOpsForm({...opsForm, name: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                            placeholder="e.g. Electricity Bill"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <input 
                            type="number"
                            value={opsForm.amount}
                            onChange={e => setOpsForm({...opsForm, amount: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select 
                            value={opsForm.type}
                            onChange={e => setOpsForm({...opsForm, type: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                        >
                            <option value="Recurring">Recurring</option>
                            <option value="One-time">One-time</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input 
                            type="date"
                            value={opsForm.date}
                            onChange={e => setOpsForm({...opsForm, date: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                    <button onClick={() => setIsOpsModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                    <button onClick={saveOps} className="px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors">Save Expense</button>
                </div>
            </div>
        </div>
      )}

      {/* Vendor Modal */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-semibold text-gray-900">Add New Vendor</h3>
                    <button onClick={() => setIsVendorModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                        <input 
                            value={vendorForm.name}
                            onChange={e => setVendorForm({...vendorForm, name: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                            placeholder="e.g. City Laundry"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                        <input 
                            value={vendorForm.service}
                            onChange={e => setVendorForm({...vendorForm, service: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                            placeholder="e.g. Laundry / Supplies"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Avg Cost</label>
                            <input 
                                type="number"
                                value={vendorForm.monthly_avg}
                                onChange={e => setVendorForm({...vendorForm, monthly_avg: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Payment Date</label>
                            <input 
                                type="date"
                                value={vendorForm.last_payment}
                                onChange={e => setVendorForm({...vendorForm, last_payment: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                    <button onClick={() => setIsVendorModalOpen(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                    <button onClick={saveVendor} className="px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors">Save Vendor</button>
                </div>
            </div>
        </div>
      )}

      {/* Add Expense Drawer (Reused for Staff Payments) */}
      <AddExpenseDrawer 
        open={expenseDrawerOpen} 
        initialType={initialExpenseType}
        onClose={() => setExpenseDrawerOpen(false)} 
        onSave={(data) => {
            // Data is already saved via hook in the drawer itself, we just close.
            // If we needed to refresh local state, we rely on the hook.
            setExpenseDrawerOpen(false)
        }} 
      />

    </div>
  )
}
