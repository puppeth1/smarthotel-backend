"use client"
import { useEffect, useState, useContext } from "react"
import { CheckCircleIcon } from "@heroicons/react/24/solid"
import BrandLogo from "../../components/BrandLogo"
import { useSearchParams } from "next/navigation"
import { AuthContext } from "@/components/AuthProvider"
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function SubscriptionPage() {
  const searchParams = useSearchParams()
  const inactive = searchParams.get('inactive') === '1'
  const { user } = useContext(AuthContext)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const handleSubscribe = async (plan: 'monthly' | 'quarterly' | 'yearly') => {
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const token = user ? await user.getIdToken() : ''
      const res = await fetch(`${API_URL}/subscription/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan_type: plan }),
      })
      const data = await res.json()
      if (res.ok && data?.status === 'success') {
        const subscriptionId = data?.data?.subscriptionId
        if (!subscriptionId) throw new Error('Subscription ID missing')
        // Load Razorpay script if not present
        if (typeof window !== 'undefined' && !window.Razorpay) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script')
            s.src = 'https://checkout.razorpay.com/v1/checkout.js'
            s.onload = () => resolve()
            s.onerror = () => reject(new Error('Failed to load Razorpay'))
            document.body.appendChild(s)
          })
        }
        if (!RAZORPAY_KEY_ID) {
          setSuccess('Subscription initiated. Awaiting activation.')
          return
        }
        const rzp = new window.Razorpay({
          key: RAZORPAY_KEY_ID,
          subscription_id: subscriptionId,
          name: 'SmartHotel',
          description: 'SmartHotel Pro Subscription',
          prefill: {
            email: (user as any)?.email || '',
            name: (user as any)?.displayName || ''
          }
        })
        rzp.open()
        setSuccess('Opening Razorpay Checkout...')
      } else {
        throw new Error(data?.message || 'Failed to initiate subscription')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to initiate subscription')
    } finally {
      setSubmitting(false)
    }
  }

  const features = [
    "Room management dashboard",
    "Live room availability & occupancy",
    "Guest check-in & check-out",
    "Guest name & phone tracking",
    "Guest ID recording (Aadhaar / Passport)",
    "Secure ID storage linked to stays",
    "Payment status tracking",
    "Inventory & orders module",
    "Billing & basic reports",
    "Priority support"
  ]

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-full flex justify-center">
      <div className="max-w-4xl w-full space-y-8">
        <BrandLogo />
        {inactive && (
          <div className="bg-yellow-100 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm text-center">
            Your subscription is inactive. Please renew to continue.
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm text-center">
            {success}
          </div>
        )}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            One plan, everything you need to run your hotel efficiently.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="p-8 sm:p-10">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">SmartHotel Pro</h3>
              <p className="mt-2 text-base text-gray-500">Full access to all features</p>
            </div>
            
            <div className="mt-8 border-t border-gray-100 pt-8">
              <h4 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
                What's included
              </h4>
              <ul role="list" className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature} className="flex space-x-3">
                    <CheckCircleIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 p-8 sm:p-10 border-t border-gray-200">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {/* Monthly */}
              <div className="flex flex-col rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Monthly</h4>
                  <p className="mt-2">
                    <span className="text-2xl font-bold text-gray-900">₹2,499</span>
                    <span className="text-base font-medium text-gray-500">/mo</span>
                  </p>
                </div>
                <button
                  disabled={submitting}
                  onClick={() => handleSubscribe("monthly")}
                  className="mt-auto w-full block bg-gray-800 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-gray-900 disabled:opacity-60"
                >
                  Subscribe Monthly
                </button>
              </div>

              {/* Quarterly */}
              <div className="flex flex-col rounded-lg border border-blue-200 bg-blue-50 p-6 shadow-sm hover:shadow-md transition-shadow relative">
                <div className="absolute top-0 right-0 -mt-3 -mr-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  POPULAR
                </div>
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Quarterly</h4>
                  <p className="mt-2">
                    <span className="text-2xl font-bold text-gray-900">₹6,999</span>
                    <span className="text-base font-medium text-gray-500">/qtr</span>
                  </p>
                </div>
                <button
                  disabled={submitting}
                  onClick={() => handleSubscribe("quarterly")}
                  className="mt-auto w-full block bg-blue-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-blue-700 disabled:opacity-60"
                >
                  Subscribe Quarterly
                </button>
              </div>

              {/* Yearly */}
              <div className="flex flex-col rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Yearly</h4>
                  <p className="mt-2">
                    <span className="text-2xl font-bold text-gray-900">₹24,999</span>
                    <span className="text-base font-medium text-gray-500">/yr</span>
                  </p>
                </div>
                <button
                  disabled={submitting}
                  onClick={() => handleSubscribe("yearly")}
                  className="mt-auto w-full block bg-gray-800 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-gray-900 disabled:opacity-60"
                >
                  Subscribe Yearly
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                All payments will be processed securely via Razorpay.
                <br />
                You can upgrade, downgrade, or cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
