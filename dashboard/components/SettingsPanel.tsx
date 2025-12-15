'use client'
import { useState } from 'react'

type Tab =
  | 'hotel'
  | 'plan'
  | 'setup'
  | 'billing'
  | 'payments'
  | 'staff'
  | 'integrations'

export default function SettingsPanel() {
  const [tab, setTab] = useState<Tab>('hotel')

  const tabs: { key: Tab; label: string; disabled?: boolean }[] = [
    { key: 'hotel', label: 'Hotel Profile' },
    { key: 'plan', label: 'Subscription & Plan' },
    { key: 'setup', label: 'Rooms & Restaurant Setup' },
    { key: 'billing', label: 'Billing & Invoices' },
    { key: 'payments', label: 'Payments & WhatsApp' },
    { key: 'staff', label: 'Staff & Access', disabled: true },
    { key: 'integrations', label: 'Integrations', disabled: true },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            disabled={!!t.disabled}
            className={`px-3 py-2 rounded-lg border ${tab === t.key ? 'bg-accentPrimary text-textPrimary border-borderLight' : 'bg-bgSoft text-textPrimary border-borderLight'} ${t.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hotel' && (
        <div className="bg-bg border border-borderLight rounded-xl p-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-textPrimary mb-1">Hotel Name</label>
            <input className="w-full border border-borderLight rounded px-3 py-2" placeholder="e.g. SmartHotel Residency" />
          </div>
          <div>
            <label className="block text-sm text-textPrimary mb-1">Hotel Logo</label>
            <input type="file" className="w-full border border-borderLight rounded px-3 py-2" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm text-textPrimary mb-1">Address line</label>
            <input className="w-full border border-borderLight rounded px-3 py-2" placeholder="Street, area" />
          </div>
          <div>
            <label className="block text-sm text-textPrimary mb-1">City</label>
            <input className="w-full border border-borderLight rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-textPrimary mb-1">State</label>
            <input className="w-full border border-borderLight rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-textPrimary mb-1">Country</label>
            <input className="w-full border border-borderLight rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-textPrimary mb-1">PIN / ZIP</label>
            <input className="w-full border border-borderLight rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-textPrimary mb-1">Phone number</label>
            <input className="w-full border border-borderLight rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-textPrimary mb-1">Email</label>
            <input className="w-full border border-borderLight rounded px-3 py-2" />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="gst_enabled" className="h-4 w-4" />
            <label htmlFor="gst_enabled" className="text-sm text-textPrimary">GST / Tax ID enabled</label>
          </div>
          <div>
            <label className="block text-sm text-textPrimary mb-1">Time Zone</label>
            <input className="w-full border border-borderLight rounded px-3 py-2" placeholder="Asia/Kolkata" />
          </div>
          <div>
            <label className="block text-sm text-textPrimary mb-1">Currency</label>
            <select className="w-full border border-borderLight rounded px-3 py-2">
              <option>INR</option>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </div>
        </div>
      )}

      {tab === 'plan' && (
        <div className="bg-bg border border-borderLight rounded-xl p-4 grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <p className="text-sm text-textPrimary">Current Plan</p>
            <p className="text-lg font-semibold text-textPrimary">Basic</p>
          </div>
          <div>
            <p className="text-sm text-textPrimary">Billing Cycle</p>
            <p className="text-lg font-semibold text-textPrimary">Monthly</p>
          </div>
          <div>
            <p className="text-sm text-textPrimary">Next Billing Date</p>
            <p className="text-lg font-semibold text-textPrimary">—</p>
          </div>
          <div>
            <p className="text-sm text-textPrimary">Active Hotels</p>
            <p className="text-lg font-semibold text-textPrimary">1</p>
          </div>
          <div>
            <p className="text-sm text-textPrimary">Staff Used / Limit</p>
            <p className="text-lg font-semibold text-textPrimary">0 / 5</p>
          </div>
          <div>
            <p className="text-sm text-textPrimary">Rooms Used / Limit</p>
            <p className="text-lg font-semibold text-textPrimary">—</p>
          </div>
          <div className="col-span-3 flex gap-2 mt-2">
            <button className="px-4 py-2 rounded-lg bg-accentPrimary text-textPrimary border border-borderLight">Upgrade Plan</button>
            <button className="px-4 py-2 rounded-lg bg-bgSoft text-textPrimary border border-borderLight">View Invoices</button>
          </div>
        </div>
      )}

      {tab === 'setup' && (
        <div className="space-y-4">
          <div className="bg-bg border border-borderLight rounded-xl p-4 grid grid-cols-3 gap-4">
            <div className="col-span-3 text-sm font-semibold text-textPrimary">Rooms Setup</div>
            <div>
              <label className="block text-sm text-textPrimary mb-1">Total Rooms</label>
              <input className="w-full border border-borderLight rounded px-3 py-2" />
            </div>
            {['Single','Double','Deluxe','Suite','Family Suite','Garden View','River View','Mountain View'].map((t) => (
              <div key={t}>
                <label className="block text-sm text-textPrimary mb-1">{t}</label>
                <input className="w-full border border-borderLight rounded px-3 py-2" placeholder="Count" />
              </div>
            ))}
          </div>
          <div className="bg-bg border border-borderLight rounded-xl p-4 grid grid-cols-3 gap-4">
            <div className="col-span-3 text-sm font-semibold text-textPrimary">Restaurant Setup</div>
            <div className="col-span-1 flex items-center gap-2">
              <input type="checkbox" id="has_restaurant" className="h-4 w-4" />
              <label htmlFor="has_restaurant" className="text-sm text-textPrimary">Has Restaurant</label>
            </div>
            <div>
              <label className="block text-sm text-textPrimary mb-1">Number of Tables</label>
              <input className="w-full border border-borderLight rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-textPrimary mb-1">Operating Hours</label>
              <input className="w-full border border-borderLight rounded px-3 py-2" placeholder="e.g. 7:00–23:00" />
            </div>
            <div className="col-span-1 flex items-center gap-2">
              <input type="checkbox" id="room_service" className="h-4 w-4" />
              <label htmlFor="room_service" className="text-sm text-textPrimary">Room Service Available</label>
            </div>
          </div>
        </div>
      )}

      {tab === 'billing' && (
        <div className="space-y-4">
          <div className="bg-bg border border-borderLight rounded-xl p-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-textPrimary mb-1">Invoice Prefix</label>
              <input className="w-full border border-borderLight rounded px-3 py-2" placeholder="INV-2025-" />
            </div>
            <div>
              <label className="block text-sm text-textPrimary mb-1">Invoice Footer Note</label>
              <input className="w-full border border-borderLight rounded px-3 py-2" placeholder="Thank you for staying with us" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-textPrimary mb-1">Terms & Conditions</label>
              <textarea className="w-full border border-borderLight rounded px-3 py-2" rows={3} />
            </div>
            <div className="col-span-2 text-sm font-semibold text-textPrimary">Tax Settings</div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="gst_enabled_billing" className="h-4 w-4" />
              <label htmlFor="gst_enabled_billing" className="text-sm text-textPrimary">GST enabled</label>
            </div>
            <div>
              <label className="block text-sm text-textPrimary mb-1">CGST %</label>
              <input className="w-full border border-borderLight rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-textPrimary mb-1">SGST %</label>
              <input className="w-full border border-borderLight rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-textPrimary mb-1">Signature / Stamp</label>
              <input type="file" className="w-full border border-borderLight rounded px-3 py-2" />
            </div>
            <div className="col-span-2 text-sm font-semibold text-textPrimary">Print Settings</div>
            <div>
              <label className="block text-sm text-textPrimary mb-1">Page size</label>
              <select className="w-full border border-borderLight rounded px-3 py-2">
                <option>A4</option>
                <option>Thermal</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="show_logo" className="h-4 w-4" />
              <label htmlFor="show_logo" className="text-sm text-textPrimary">Show logo</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="show_gst" className="h-4 w-4" />
              <label htmlFor="show_gst" className="text-sm text-textPrimary">Show GST breakup</label>
            </div>
          </div>
        </div>
      )}

      {tab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-bg border border-borderLight rounded-xl p-4 grid grid-cols-3 gap-4">
            <div className="col-span-3 text-sm font-semibold text-textPrimary">Payment Methods Enabled</div>
            {['Cash','UPI','Card','Bank Transfer'].map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm text-textPrimary">
                <input type="checkbox" className="h-4 w-4" />
                {m}
              </label>
            ))}
          </div>
          <div className="bg-bg border border-borderLight rounded-xl p-4 grid grid-cols-2 gap-4">
            <div className="col-span-2 text-sm font-semibold text-textPrimary">WhatsApp Automation</div>
            <div>
              <label className="block text-sm text-textPrimary mb-1">WhatsApp Number</label>
              <input className="w-full border border-borderLight rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-textPrimary mb-1">WhatsApp Provider</label>
              <select className="w-full border border-borderLight rounded px-3 py-2">
                <option>Twilio</option>
                <option>Gupshup</option>
                <option>Meta Cloud</option>
              </select>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="auto_send" className="h-4 w-4" />
              <label htmlFor="auto_send" className="text-sm text-textPrimary">Auto-send invoice on checkout</label>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-textPrimary mb-1">Invoice message template</label>
              <textarea className="w-full border border-borderLight rounded px-3 py-2" rows={4} defaultValue={"Hi {{customer_name}},\nYour bill for room {{room_number}} is ₹{{amount}}.\nInvoice attached.\nThank you for staying with {{hotel_name}} 🙏"} />
            </div>
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div className="bg-bg border border-borderLight rounded-xl p-4 opacity-60">
          <p className="text-textPrimary">Coming soon: Staff & Access</p>
        </div>
      )}

      {tab === 'integrations' && (
        <div className="bg-bg border border-borderLight rounded-xl p-4 opacity-60">
          <p className="text-textPrimary">Coming soon: Integrations (Tally, Zoho, booking engines, channels, SMS/Email)</p>
        </div>
      )}
    </div>
  )
}

