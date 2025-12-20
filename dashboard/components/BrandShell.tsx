"use client"

import { usePathname } from "next/navigation"
import BrandLogo from "./BrandLogo"

export default function BrandShell() {
  const pathname = usePathname()
  
  // Hide on landing page because it has its own entrance animation
  if (pathname === "/") return null

  return (
    // Aligned with footer area
    <div className="fixed bottom-4 left-4 z-20 opacity-70 pointer-events-none">
      <BrandLogo size={72} />
    </div>
  )
}
