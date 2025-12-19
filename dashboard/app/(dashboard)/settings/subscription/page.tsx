'use client'
import { useHotel } from '@/components/HotelProvider'

export default function SubscriptionSettingsPage() {
  const { hotel } = useHotel()
  return (
    <div>
      <h3 className="text-xl font-semibold text-textPrimary mb-2">Subscription</h3>
      <div className="grid grid-cols-2 gap-4 max-w-3xl text-sm">
        <div>
          <div className="text-textMuted">Current Plan</div>
          <div className="font-medium text-textPrimary">{hotel.subscription.plan}</div>
        </div>
        {typeof hotel.subscription.roomLimit !== 'undefined' && (
          <div>
            <div className="text-textMuted">Rooms Limit</div>
            <div className="font-medium text-textPrimary">{String(hotel.subscription.roomLimit)}</div>
          </div>
        )}
        {typeof hotel.subscription.staffLimit !== 'undefined' && (
          <div>
            <div className="text-textMuted">Staff Limit</div>
            <div className="font-medium text-textPrimary">{String(hotel.subscription.staffLimit)}</div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button className="px-4 py-2 rounded bg-accentPrimary text-textPrimary font-medium">Upgrade Plan</button>
      </div>
    </div>
  )
}

