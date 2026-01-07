import Image from "next/image"
import BrandLogo from "../../../components/BrandLogo"

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <BrandLogo />
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">About SmartHotel</h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          SmartHotel is a modern hotel management platform designed to simplify daily operations for hotels, guest houses, and short-stay properties.
          We help hospitality businesses manage rooms, guests, check-ins, payments, and compliance — all from one intuitive dashboard.
        </p>
      </div>

      <div className="space-y-12">
        {/* Why SmartHotel? */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Why SmartHotel?</h2>
          <p className="text-gray-600 mb-4">
            Managing a hotel involves more than just bookings. SmartHotel is built to handle the <span className="font-semibold text-gray-800">real operational flow</span> of hospitality:
          </p>
          <ul className="space-y-3 pl-5 list-none">
            {[
              "Room availability & live occupancy",
              "Guest check-in and check-out",
              "Secure ID recording for compliance",
              "Payments, billing, and records",
              "Inventory, orders, and services (where enabled)"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-700">
                <span className="text-blue-500 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-gray-600 italic">
            Everything is structured to reflect how hotels actually operate on the ground.
          </p>
        </section>

        {/* Designed for Simplicity & Control */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Designed for Simplicity & Control</h2>
          <p className="text-gray-600 mb-4">SmartHotel focuses on:</p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "Clear room management", desc: "see availability, occupancy, and guest status at a glance" },
              { title: "Accurate guest records", desc: "including ID details linked to stays" },
              { title: "Reliable data flow", desc: "no manual tracking, no confusion" },
              { title: "Scalable systems", desc: "suitable for small hotels and growing properties" }
            ].map((item, i) => (
              <li key={i} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <strong className="block text-gray-900 mb-1">{item.title}</strong>
                <span className="text-sm text-gray-600">{item.desc}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-gray-600">
            The goal is to reduce manual work, prevent errors, and give hotel owners full operational visibility.
          </p>
        </section>

        {/* Built for Modern Hospitality */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Built for Modern Hospitality</h2>
          <p className="text-gray-600 mb-4">SmartHotel is designed with:</p>
          <ul className="space-y-2 pl-5">
            {[
              "Fast workflows for front-desk staff",
              "Clean dashboards for owners and managers",
              "Secure handling of guest data",
              "A foundation that supports future automation and integrations"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Powered by HighPuppet */}
        <section className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Powered by HighPuppet</h2>
              <p className="text-gray-600 mb-4">
                SmartHotel is developed and powered by <span className="font-semibold text-gray-900">HighPuppet</span>, a product-focused technology studio building smart tools for modern businesses.
              </p>
              
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">HighPuppet specializes in:</p>
              <div className="flex flex-wrap gap-2">
                {["SaaS platforms", "Business automation", "AI-powered operational systems"].map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700 font-medium shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="hidden md:block flex-shrink-0">
              <Image
                src="/IMG_1377.JPG"
                alt="HighPuppet"
                className="rounded-xl object-cover"
                width={120}
                height={120}
                priority
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
