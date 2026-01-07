"use client"
import { useState, useRef, useEffect } from "react"
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon, UserIcon, CpuChipIcon } from "@heroicons/react/24/solid"
import BrandLogo from "../../components/BrandLogo"

export default function ContactPage() {
  // --- Contact Form State ---
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    message: ""
  })
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState("")

  // --- AI Chat State ---
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai', content: string }>>([
    { role: 'ai', content: "Hello! I'm your AI support assistant. How can I help you today?" }
  ])
  const [chatInput, setChatInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages, isTyping])

  // --- Handlers: Contact Form ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormStatus('submitting')
    setErrorMessage("")

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const res = await fetch(`${API_URL}/contact/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok && data.status === 'success') {
        setFormStatus('success')
        setFormData({ fullName: "", email: "", subject: "", message: "" })
      } else {
        throw new Error(data.message || 'Failed to send message')
      }
    } catch (err: any) {
      setFormStatus('error')
      setErrorMessage(err.message || "Something went wrong. Please try again.")
    }
  }

  // --- Handlers: AI Chat ---
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMsg = chatInput.trim()
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setChatInput("")
    setIsTyping(true)

    // Simulate AI delay
    setTimeout(() => {
      // Simple mock logic for now
      let aiResponse = "I'm not sure about that. Please contact support via email."
      const lower = userMsg.toLowerCase()

      if (lower.includes("price") || lower.includes("cost") || lower.includes("plan")) {
        aiResponse = "We offer three plans: Monthly (₹2,499), Quarterly (₹6,999), and Yearly (₹24,999). Check our Subscription page for details."
      } else if (lower.includes("hello") || lower.includes("hi")) {
        aiResponse = "Hi there! Ask me anything about SmartHotel."
      } else if (lower.includes("feature") || lower.includes("what")) {
        aiResponse = "SmartHotel helps you manage rooms, guests, payments, and inventory all in one place."
      } else if (lower.includes("support") || lower.includes("help")) {
        aiResponse = "You can fill out the form on the left to reach our human support team."
      }

      setChatMessages(prev => [...prev, { role: 'ai', content: aiResponse }])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-full">
      <div className="max-w-7xl mx-auto">
        <BrandLogo />
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Contact Support</h1>
          <p className="mt-4 text-xl text-gray-600">
            We're here to help. Send us an email or chat with our AI assistant.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Section 1: Contact Form */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  <PaperAirplaneIcon className="w-6 h-6" />
                </span>
                Email Support
              </h2>

              {formStatus === 'success' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <PaperAirplaneIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-green-900">Message Sent!</h3>
                  <p className="mt-2 text-sm text-green-600">
                    Your message has been sent. Our support team will get back to you shortly.
                  </p>
                  <button 
                    onClick={() => setFormStatus('idle')}
                    className="mt-4 text-sm font-medium text-green-700 hover:text-green-800 underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      id="fullName"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                      value={formData.fullName}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                      value={formData.email}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      id="subject"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                      value={formData.subject}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                    <textarea
                      name="message"
                      id="message"
                      rows={4}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                      value={formData.message}
                      onChange={handleFormChange}
                    />
                  </div>

                  {formStatus === 'error' && (
                    <div className="rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error sending message</h3>
                          <div className="mt-2 text-sm text-red-700">{errorMessage}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={formStatus === 'submitting'}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {formStatus === 'submitting' ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Section 2: AI Chat Support */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 flex flex-col h-[600px] lg:h-auto">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-purple-100 text-purple-600 p-2 rounded-lg">
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Instant AI Support</h2>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Online
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-purple-600'}`}>
                      {msg.role === 'user' ? <UserIcon className="w-5 h-5 text-gray-600" /> : <CpuChipIcon className="w-5 h-5 text-white" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                      <CpuChipIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200"></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your question..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isTyping}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-5 h-5 transform -rotate-45" />
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
