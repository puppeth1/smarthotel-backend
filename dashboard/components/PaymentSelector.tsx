'use client'
import { useState } from 'react'

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER'

export default function PaymentSelector({
  value,
  amount,
  onChange,
}: {
  value: PaymentMethod
  amount: string
  onChange: (update: { method: PaymentMethod; amount: string }) => void
}) {
  const [method, setMethod] = useState<PaymentMethod>(value)
  const [amt, setAmt] = useState<string>(amount)

  return (
    <div className="space-y-2">
      <div className="space-y-3">
        <div className="flex flex-col gap-2">
            {['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'].map((m) => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="radio" 
                        name="paymentMethod" 
                        value={m} 
                        checked={method === m} 
                        onChange={(e) => {
                            const val = e.target.value as PaymentMethod
                            setMethod(val)
                            onChange({ method: val, amount: amt })
                        }}
                        className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                    />
                    <span className="text-sm font-medium text-gray-700">
                        {m === 'BANK_TRANSFER' ? 'Bank Transfer' : m.charAt(0) + m.slice(1).toLowerCase()}
                    </span>
                </label>
            ))}
        </div>
        <input
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          placeholder="Amount Received"
          value={amt}
          onChange={(e) => {
            const v = e.target.value
            setAmt(v)
            onChange({ method, amount: v })
          }}
        />
      </div>
    </div>
  )
}

