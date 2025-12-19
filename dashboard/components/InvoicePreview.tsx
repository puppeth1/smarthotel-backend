'use client'
import { formatMoney } from '@/lib/formatMoney'

export default function InvoicePreview({
  currency,
  nights,
  roomRate,
  foodTotal,
  extrasTotal,
  taxPercent,
}: {
  currency: { code: string; locale: string } | undefined
  nights: number
  roomRate: number
  foodTotal: number
  extrasTotal: number
  taxPercent: number
}) {
  const subtotal = roomRate * nights + foodTotal + extrasTotal
  const taxAmount = Math.round(subtotal * (taxPercent / 100))
  const total = subtotal + taxAmount

  const fmt = (v: number) => formatMoney(v, currency?.code || 'INR', currency?.locale || 'en-IN')

  return (
    <div className="bg-white rounded border border-gray-200 p-3 space-y-1 text-sm">
      <div className="flex justify-between"><span>Room: {nights} night(s)</span><span>{fmt(roomRate * nights)}</span></div>
      <div className="flex justify-between"><span>Food</span><span>{fmt(foodTotal)}</span></div>
      <div className="flex justify-between"><span>Extras</span><span>{fmt(extrasTotal)}</span></div>
      <div className="flex justify-between font-medium"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
      <div className="flex justify-between"><span>GST ({taxPercent}%)</span><span>{fmt(taxAmount)}</span></div>
      <div className="flex justify-between text-base font-bold"><span>Grand Total</span><span>{fmt(total)}</span></div>
    </div>
  )
}

