'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const items = [
    { href: '/settings/hotel', label: 'Hotel Info' },
    { href: '/settings/rooms', label: 'Rooms & Capacity' },
    { href: '/settings/billing', label: 'Billing & Payments' },
    { href: '/settings/branding', label: 'Branding & Theme' },
    { href: '/settings/whatsapp', label: 'WhatsApp Integration' },
    { href: '/settings/subscription', label: 'Subscription' },
  ]
  return (
    <div className="h-full flex">
      <aside className="w-64 shrink-0 border-r border-borderLight bg-bgSoft p-4">
        <h2 className="text-lg font-bold text-textPrimary mb-4">Settings</h2>
        <ul className="space-y-2 text-sm">
          {items.map((it) => {
            const active = pathname?.startsWith(it.href)
            return (
              <li key={it.href}>
                <Link
                  className={`block px-2 py-1 rounded ${active ? 'font-semibold text-textPrimary bg-accentSecondary' : 'text-textMuted hover:text-textPrimary'}`}
                  href={it.href}
                >
                  {it.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}

