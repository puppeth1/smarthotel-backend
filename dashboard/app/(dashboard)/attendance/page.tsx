'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useExpenses } from '@/hooks/useExpenses'

export default function AttendancePage() {
  const { staff, addStaff, updateStaff, deleteStaff } = useExpenses()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState<Record<number, string>>({})

  // New Staff Modal State (Copied from Expenses)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null)
  const [staffForm, setStaffForm] = useState({ name: '', role: '', salary: '', frequency: 'Monthly', status: 'Active' })

  const handleEditStaff = (s: any) => {
    setEditingStaffId(s.id)
    setStaffForm({ ...s, salary: s.salary.toString() })
    setIsStaffModalOpen(true)
  }

  const handleAddStaff = () => {
    setEditingStaffId(null)
    setStaffForm({ name: '', role: '', salary: '', frequency: 'Monthly', status: 'Active' })
    setIsStaffModalOpen(true)
  }

  const saveStaff = () => {
    if (!staffForm.name || !staffForm.role || !staffForm.salary) return

    if (editingStaffId) {
        updateStaff({ id: editingStaffId, ...staffForm, salary: Number(staffForm.salary) })
    } else {
        addStaff({ ...staffForm, salary: Number(staffForm.salary) })
    }
    setIsStaffModalOpen(false)
  }

  const handleDeleteStaff = (id: number) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
        deleteStaff(id)
    }
  }

  // Load attendance for selected date
  useEffect(() => {
    // In a real app, we would fetch this from an API
    // For now, we simulate persistence with localStorage
    const saved = localStorage.getItem(`hp_attendance_${date}`)
    if (saved) {
        setAttendance(JSON.parse(saved))
    } else {
        // Default to empty or previously set defaults
        setAttendance({})
    }
  }, [date])

  const handleMark = (staffId: number, status: string) => {
    const updated = { ...attendance, [staffId]: status }
    setAttendance(updated)
    localStorage.setItem(`hp_attendance_${date}`, JSON.stringify(updated))
  }

  const activeStaff = staff.filter(s => s.status === 'Active')
  
  const stats = {
      present: Object.values(attendance).filter(s => s === 'Present').length,
      absent: Object.values(attendance).filter(s => s === 'Absent').length,
      leave: Object.values(attendance).filter(s => s === 'Leave').length,
      total: activeStaff.length
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Attendance</h1>
          <p className="text-sm text-gray-500">Track daily staff presence</p>
        </div>
        <div>
            <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black"
            />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Staff</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Present Today</div>
          <div className="text-2xl font-bold text-green-600">{stats.present}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Absent</div>
          <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">On Leave</div>
          <div className="text-2xl font-bold text-orange-600">{stats.leave}</div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Mark Attendance for {format(new Date(date), 'MMMM d, yyyy')}</h3>
            <button 
                onClick={handleAddStaff}
                className="text-sm px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
            >
                <span>+</span> Add New Staff
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Staff Name</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Shift</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Time In</th>
                <th className="px-6 py-3 text-right">Time Out</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeStaff.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{s.name}</td>
                  <td className="px-6 py-4 text-gray-600">{s.role}</td>
                  <td className="px-6 py-4 text-gray-500">Morning (9-6)</td>
                  <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                          {['Present', 'Absent', 'Leave'].map((status) => (
                              <button
                                key={status}
                                onClick={() => handleMark(s.id, status)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                    attendance[s.id] === status
                                        ? status === 'Present' ? 'bg-green-100 text-green-700 border-green-200'
                                        : status === 'Absent' ? 'bg-red-100 text-red-700 border-red-200'
                                        : 'bg-orange-100 text-orange-700 border-orange-200'
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                  {status}
                              </button>
                          ))}
                      </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400 font-mono">
                      {attendance[s.id] === 'Present' ? '09:00 AM' : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400 font-mono">
                      {attendance[s.id] === 'Present' ? '06:00 PM' : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                          <button onClick={() => handleEditStaff(s)} className="text-gray-500 hover:text-blue-600 transition-colors" title="Edit">
                            ✏️
                          </button>
                          <button onClick={() => handleDeleteStaff(s.id)} className="text-gray-500 hover:text-red-600 transition-colors" title="Remove">
                            🗑️
                          </button>
                      </div>
                  </td>
                </tr>
              ))}
              {activeStaff.length === 0 && (
                  <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                          No active staff found. Click "Add New Staff" to get started.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-semibold text-gray-900">{editingStaffId ? 'Edit Staff Member' : 'Add New Staff'}</h3>
                    <button onClick={() => setIsStaffModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input 
                            value={staffForm.name}
                            onChange={e => setStaffForm({...staffForm, name: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                            placeholder="e.g. Rahul Kumar"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role / Designation</label>
                        <input 
                            value={staffForm.role}
                            onChange={e => setStaffForm({...staffForm, role: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                            placeholder="e.g. Housekeeping"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Salary Amount</label>
                            <input 
                                type="number"
                                value={staffForm.salary}
                                onChange={e => setStaffForm({...staffForm, salary: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Salary Type</label>
                            <select 
                                value={staffForm.frequency}
                                onChange={e => setStaffForm({...staffForm, frequency: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                            >
                                <option value="Monthly">Monthly</option>
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select 
                            value={staffForm.status}
                            onChange={e => setStaffForm({...staffForm, status: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="On Leave">On Leave</option>
                        </select>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                    <button 
                        onClick={() => setIsStaffModalOpen(false)}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={saveStaff}
                        className="px-4 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Save Staff
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
