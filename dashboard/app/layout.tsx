import './globals.css'
import { HotelProvider } from '@/components/HotelProvider'
import TopNav from '@/components/TopNav'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-bg">
        <HotelProvider>
          <TopNav />
          {children}
        </HotelProvider>
      </body>
    </html>
  )
}
