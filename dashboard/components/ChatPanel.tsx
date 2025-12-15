'use client'
import { useState } from 'react'

export default function ChatPanel({ onSend }: { onSend: (text: string) => Promise<any> | void }) {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')

  async function handleSend() {
    if (!input.trim()) return
    const text = input
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text }])
    const res = await onSend?.(text)
    if (res) {
      setMessages((prev) => [...prev, { role: 'agent', text: typeof res === 'string' ? res : JSON.stringify(res) }])
    }
  }

  return (
    <div className="flex flex-col bg-bg border border-borderLight rounded-xl h-full">
      <div className="px-4 py-3 bg-bgSoft border-b border-borderLight rounded-t-xl"></div>
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i}>
            <span className="font-semibold">{m.role === 'user' ? 'You' : 'Agent'}: </span>
            <span className="whitespace-pre-wrap">{m.text}</span>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-borderLight flex gap-2">
        <input
          className="flex-1 border border-borderLight rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accentPrimary"
          placeholder="Ask about revenue, rooms, inventory, or orders…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="px-4 py-2 rounded-lg bg-accentPrimary text-textPrimary font-medium hover:opacity-90"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  )
}
