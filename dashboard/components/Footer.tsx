"use client"

import Link from "next/link"
import BrandLogo from "@/components/BrandLogo"

export default function Footer() {
  return (
    <footer className="w-full border-t bg-white">
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-4">
          <BrandLogo size={50} className="shrink-0" imageClassName="scale-[1.8] object-contain" />
          <span className="text-lg font-bold text-black leading-none tracking-wide uppercase">
            SmartHotel
          </span>
        </div>

        {/* Right: Navigation & Copyright */}
        <div className="flex items-center gap-4 md:gap-6">
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-gray-600">
            <Link href="/about" className="hover:text-black transition">
              About
            </Link>
            <Link href="/subscription" className="hover:text-black transition">
              Subscription
            </Link>
            <Link href="/contact" className="hover:text-black transition">
              Contact
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/privacy" className="hover:text-black transition">
              Privacy & Terms
            </Link>
          </nav>
          
          <div className="text-[10px] text-gray-400 leading-none">
            © 2025 SmartHotel · Powered by HIGHPUPPET
          </div>
        </div>

      </div>
    </footer>
  )
}
