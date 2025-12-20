'use client'
import { useState } from 'react'

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER'

export default function PaymentSelector({
  value,
  onChange,
}: {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
}) {
  return (
    <div className="space-y-2">
        <div className="flex flex-col gap-2">
            {['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'].map((m) => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="radio" 
                        name="paymentMethod" 
                        value={m} 
                        checked={value === m} 
                        onChange={(e) => {
                            const val = e.target.value as PaymentMethod
                            onChange(val)
                        }}
                        className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                    />
                    <span className="text-sm font-medium text-gray-700">
                        {m === 'BANK_TRANSFER' ? 'Bank Transfer' : m.charAt(0) + m.slice(1).toLowerCase()}
                    </span>
                </label>
            ))}
        </div>
    </div>
  )
}

