"use client"

import BrandLogo from "../../../components/BrandLogo"

export default function PrivacyTermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <BrandLogo />
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Privacy Policy & Terms</h1>
        <p className="text-lg text-gray-600">
          Last updated: January 2026
        </p>
      </div>

      <div className="space-y-16">
        
        {/* PRIVACY POLICY SECTION */}
        <section id="privacy" className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <span className="bg-blue-100 text-blue-600 p-2 rounded-lg font-bold">1</span>
            <h2 className="text-2xl font-bold text-gray-900">Privacy Policy</h2>
          </div>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Information We Collect</h3>
              <p>
                To provide the SmartHotel service, we collect the following types of information:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Account Data:</strong> Name, email address, phone number, and hotel business details.</li>
                <li><strong>Guest Data:</strong> Information you enter about your guests, including names, phone numbers, and check-in details.</li>
                <li><strong>Sensitive Data:</strong> Government ID details (Aadhaar/Passport) required for compliance, which are stored securely.</li>
                <li><strong>Usage Data:</strong> Basic logs of how you interact with the platform to improve performance.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. How We Use Information</h3>
              <p>We use your data solely for:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Providing and maintaining the SmartHotel platform.</li>
                <li>Processing subscriptions and billing via Razorpay.</li>
                <li>Ensuring legal compliance for hotel guest records.</li>
                <li>Sending critical account updates and support responses.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Data Security & Storage</h3>
              <p>
                We implement industry-standard security measures to protect your data. Guest ID proofs are stored with restricted access and are only viewable by authorized hotel staff. We do not sell your data to third parties.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Third-Party Services</h3>
              <p>
                We trust the following partners to help run our service:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Razorpay:</strong> For secure payment processing. We do not store card details.</li>
                <li><strong>Google Cloud / Firebase:</strong> For secure hosting and database infrastructure.</li>
                <li><strong>Email Providers:</strong> For sending system notifications.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">5. Your Rights</h3>
              <p>
                You have the right to access, correct, or request deletion of your data. For any data-related requests, please contact us at <a href="mailto:support@highpuppet.com" className="text-blue-600 hover:underline">support@highpuppet.com</a>.
              </p>
            </div>
          </div>
        </section>

        {/* TERMS & CONDITIONS SECTION */}
        <section id="terms" className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <span className="bg-purple-100 text-purple-600 p-2 rounded-lg font-bold">2</span>
            <h2 className="text-2xl font-bold text-gray-900">Terms & Conditions</h2>
          </div>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Service Description</h3>
              <p>
                SmartHotel is a SaaS platform provided by HighPuppet designed to assist hotels with room management, guest records, and billing. We provide the software "as is" and do not manage your physical property.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Account Responsibility</h3>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials. You are also responsible for all activities that occur under your account, including the actions of your staff.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Subscription & Payments</h3>
              <p>
                Services are billed on a subscription basis (Monthly, Quarterly, or Yearly). All payments are processed securely via <strong>Razorpay</strong>. By subscribing, you agree to pay the fees associated with your chosen plan.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Acceptable Use</h3>
              <p>
                You agree not to use the platform for any illegal activities. You must ensure that the guest data you collect complies with local regulations.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">5. Limitation of Liability</h3>
              <p>
                HighPuppet shall not be liable for any indirect, incidental, or consequential damages arising from the use of the SmartHotel platform. Our liability is limited to the amount paid by you for the service in the last 12 months.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">6. Governing Law</h3>
              <p>
                These terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.
              </p>
            </div>
          </div>
        </section>

        {/* REFUND & CANCELLATION POLICY SECTION */}
        <section id="refund" className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <span className="bg-green-100 text-green-600 p-2 rounded-lg font-bold">3</span>
            <h2 className="text-2xl font-bold text-gray-900">Refund & Cancellation Policy</h2>
          </div>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Subscription Cancellation</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Users can cancel their subscription at any time directly from their account settings.</li>
                <li>Cancellation stops future renewals immediately.</li>
                <li>Access to the service remains active until the end of the currently paid billing cycle.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Refund Policy</h3>
              <p>
                Subscription fees are <strong>non-refundable</strong>. We do not provide refunds for:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Partial usage of the billing cycle.</li>
                <li>Unused time if you cancel early.</li>
                <li>Downgrades to a lower plan.</li>
              </ul>
              <p className="mt-2 text-sm text-gray-500 italic">
                This applies to all monthly, quarterly, and yearly plans.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Exceptional Cases</h3>
              <p>
                Refunds may be considered only under the following specific circumstances:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Payment was charged incorrectly due to a system error.</li>
                <li>Duplicate payment occurred for the same invoice.</li>
                <li>A verified technical failure on our end prevented you from accessing the service entirely.</li>
              </ul>
              <p className="mt-2">
                All such requests must be sent to <a href="mailto:support@highpuppet.com" className="text-blue-600 hover:underline">support@highpuppet.com</a> with proof of payment.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Payment Processing</h3>
              <p>
                All payments are processed securely via <strong>Razorpay</strong>. SmartHotel does not store or process your credit card, debit card, or UPI details on our servers.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">5. Policy Updates</h3>
              <p>
                SmartHotel reserves the right to update this policy at any time. Any changes will be reflected on this page immediately.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="font-medium text-gray-900">Questions about refunds?</p>
              <p>
                Contact us at <a href="mailto:support@highpuppet.com" className="text-blue-600 hover:underline">support@highpuppet.com</a>
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
