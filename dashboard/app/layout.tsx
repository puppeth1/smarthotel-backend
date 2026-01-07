import './globals.css'
import { HotelProvider } from '../components/HotelProvider'
import { AuthProvider } from '../components/AuthProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-bg">
        <AuthProvider>
          <HotelProvider>
            {children}
          </HotelProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
