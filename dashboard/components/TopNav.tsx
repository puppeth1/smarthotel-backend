"use client";

import Link from "next/link";
import { useContext } from "react";
import { AuthContext } from "@/components/AuthProvider";
import { HotelContext } from "@/components/HotelProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function TopNav() {
  const { user } = useContext(AuthContext);
  const hotelContext = useContext(HotelContext);
  const hotelName = hotelContext?.hotel?.name || "SmartHotel";
  const logoUrl = hotelContext?.hotel?.settings?.branding?.logoUrl || hotelContext?.hotel?.settings?.hotelInfo?.logoUrl;

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b relative z-30">
      <Link href="/dashboard" className="flex items-center gap-3">
        {/* Logo or Placeholder */}
        {logoUrl ? (
          <img src={logoUrl} alt="Hotel Logo" className="w-8 h-8 rounded object-cover" />
        ) : (
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-sm">
            {hotelName.charAt(0)}
          </div>
        )}
        <h1 className="text-lg font-semibold">{hotelName}</h1>
      </Link>

      <div className="flex items-center gap-6">
        {user ? (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-black transition">Dashboard</Link>
            <Link href="/rooms" className="hover:text-black transition">Rooms</Link>
            <Link href="/reservations" className="hover:text-black transition">Reservations</Link>
            <Link href="/orders" className="hover:text-black transition">Orders</Link>
            <Link href="/attendance" className="hover:text-black transition">Attendance</Link>
            <Link href="/inventory" className="hover:text-black transition">Inventory</Link>
            <Link href="/revenue" className="hover:text-black transition">Revenue</Link>
            <Link href="/expenses" className="hover:text-black transition">Expenses</Link>
            <Link href="/billing" className="hover:text-black transition">Billing</Link>
            <Link href="/menu" className="hover:text-black transition">Menu</Link>
            <Link href="/settings" className="hover:text-black transition">Settings</Link>
            <button 
              onClick={() => signOut(auth)} 
              className="text-red-600 hover:text-red-800 transition"
            >
              Logout
            </button>
          </nav>
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm">
              Login
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-black text-white px-3 py-1 rounded"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
