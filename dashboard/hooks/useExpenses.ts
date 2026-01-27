import { useState, useEffect } from 'react'

export type Staff = {
  id: number
  name: string
  role: string
  salary: number
  frequency: string
  status: string
}

export type Expense = {
  id: number
  name: string
  date: string
  type: string
  category: 'STAFF' | 'OPERATIONAL' | 'VENDOR'
  amount: number
  staffId?: number
  vendorId?: number
}

export type Vendor = {
  id: number
  name: string
  service: string
  monthly_avg: number
  last_payment: string
}

export function useExpenses() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = localStorage.getItem('hp_staff')
    if (s) setStaff(JSON.parse(s))
    else {
       setStaff([
         { id: 1, name: 'Rahul Kumar', role: 'Receptionist', salary: 15000, frequency: 'Monthly', status: 'Active' },
         { id: 2, name: 'Suresh Singh', role: 'Housekeeping', salary: 12000, frequency: 'Monthly', status: 'Active' },
       ])
    }

    const e = localStorage.getItem('hp_expenses')
    if (e) setExpenses(JSON.parse(e))
    else {
        setExpenses([
            { id: 1, name: 'Electricity Bill', amount: 15000, type: 'Recurring', category: 'OPERATIONAL', date: new Date().toISOString() },
            { id: 2, name: 'Internet Bill', amount: 1200, type: 'Recurring', category: 'OPERATIONAL', date: new Date().toISOString() },
        ])
    }

    const v = localStorage.getItem('hp_vendors')
    if (v) setVendors(JSON.parse(v))
    else {
        setVendors([
            { id: 1, name: 'Fresh Laundry Services', service: 'Laundry', monthly_avg: 8000, last_payment: '2024-01-15' },
            { id: 2, name: 'City Grocers', service: 'Supplies', monthly_avg: 12000, last_payment: '2024-01-20' },
        ])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!loading) localStorage.setItem('hp_staff', JSON.stringify(staff))
  }, [staff, loading])

  useEffect(() => {
    if (!loading) localStorage.setItem('hp_expenses', JSON.stringify(expenses))
  }, [expenses, loading])

  useEffect(() => {
    if (!loading) localStorage.setItem('hp_vendors', JSON.stringify(vendors))
  }, [vendors, loading])

  const addStaff = (s: Omit<Staff, 'id'>) => setStaff(prev => [...prev, { ...s, id: Date.now() }])
  const updateStaff = (s: Staff) => setStaff(prev => prev.map(x => x.id === s.id ? s : x))
  const deleteStaff = (id: number) => setStaff(prev => prev.filter(x => x.id !== id))

  const addExpense = (e: Omit<Expense, 'id'>) => setExpenses(prev => [...prev, { ...e, id: Date.now() }])
  
  const addVendor = (v: Omit<Vendor, 'id'>) => setVendors(prev => [...prev, { ...v, id: Date.now() }])

  return {
    staff, addStaff, updateStaff, deleteStaff,
    expenses, addExpense,
    vendors, setVendors, addVendor
  }
}
