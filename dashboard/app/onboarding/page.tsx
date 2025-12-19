"use client"
import { useContext, useState } from 'react'
import { AuthContext } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export default function OnboardingPage() {
  const { user } = useContext(AuthContext)
  const [hotelName, setHotelName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function createHotel(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!hotelName.trim()) {
      setError('Hotel name is required')
      return
    }
    setLoading(true)
    try {
      const token = user ? await user.getIdToken() : ''
      const res = await fetch(`${API_URL}/api/hotels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: hotelName }),
      })
      const json = await res.json()
      if (json?.data?.id) {
        router.push('/dashboard')
      } else {
        setError(json?.message || 'Failed to create hotel')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create hotel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form onSubmit={createHotel} className="w-full max-w-sm space-y-3 border border-gray-200 p-6 rounded-lg">
        <div className="text-lg font-semibold">Welcome 👋</div>
        <div className="text-sm text-gray-600">Let’s set up your hotel</div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <input className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Hotel Name" value={hotelName} onChange={(e)=>setHotelName(e.target.value)} />
        <button disabled={loading} className="w-full px-3 py-2 rounded bg-gray-900 text-white disabled:opacity-60">{loading ? 'Creating…' : 'Create Hotel'}</button>
      </form>
    </div>
  )
}

