'use client'
import Link from 'next/link'
import { useHotel } from './HotelProvider'

export default function TopNav() {
  const { hotel } = useHotel()
  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-borderLight bg-bg">
      <div className="flex items-center gap-3">
        <Avatar name={hotel.hotelName} />
        <span className="text-lg font-bold text-textPrimary">SmartHotel - {hotel.hotelName}</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <Link href="/" className="text-textPrimary">Home</Link>
        <Link href="/rooms" className="text-textPrimary">Rooms</Link>
        <Link href="/menu" className="text-textPrimary">Menu</Link>
        <Link href="/orders" className="text-textPrimary">Orders</Link>
        <Link href="/inventory" className="text-textPrimary">Inventory</Link>
        <Link href="/billing" className="text-textPrimary">Billing</Link>
        <Link href="/settings" className="text-textPrimary font-semibold">Settings</Link>
      </div>
    </nav>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || 'HP'
  return (
    <div className="w-8 h-8 rounded-full bg-[#111827] text-[#F9FAFB] flex items-center justify-center text-sm font-bold">
      {initials}
    </div>
  )
}
