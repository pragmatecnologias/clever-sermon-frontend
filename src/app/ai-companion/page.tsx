'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function AICompanionPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('token')
    if (!stored) {
      router.push('/login')
    } else {
      setToken(stored)
    }
  }, [router])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !token) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/ai-companion/conversations`,
        {
          message: input,
          conversationId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      setConversationId(response.data.conversationId || conversationId)
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.message || response.data.response || 'No response'
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (err: any) {
      const errorMsg: Message = {
        role: 'assistant',
        content: err.response?.data?.message || 'Sorry, something went wrong'
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-black/40 backdrop-blur border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">Clever Sermon</p>
            <h1 className="text-2xl font-bold text-white">AI Companion</h1>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs cyber-outline px-4 py-2 rounded-full"
          >
            Back to dashboard
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <p>Ask a question about your sermon or Bible study...</p>
              <p className="text-sm mt-2">e.g., "What does Romans 8:28 mean?"</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'cyber-button rounded-br-none'
                    : 'cyber-panel rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="cyber-panel rounded-2xl rounded-bl-none px-4 py-3">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-gray-100/90"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="cyber-button px-6 py-3 rounded-xl disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
