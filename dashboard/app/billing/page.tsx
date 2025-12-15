'use client'
import { useEffect, useState } from 'react'

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3000/api/billing/invoices')
      .then((res) => res.json())
      .then((data) => setInvoices(data.data || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h1>Invoices</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table border={1} cellPadding={10}>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Room</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr key={i}>
                <td>{inv.invoice_id}</td>
                <td>{inv.room_number}</td>
                <td>₹{inv.amount}</td>
                <td>{inv.status}</td>
                <td>{inv.payment_method || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
