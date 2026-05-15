'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function TopicGraphPage() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [topics, setTopics] = useState<any[]>([])
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('token')
    if (!stored) {
      router.push('/login')
    } else {
      setToken(stored)
    }
  }, [router])

  const searchTopics = async () => {
    if (!topic.trim() || !token) return

    setLoading(true)
    setError(null)
    try {
      // GET /topic-graph/nodes?query=topic
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/topic-graph/nodes`,
        {
          params: { query: topic },
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setTopics(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to search topics')
    } finally {
      setLoading(false)
    }
  }

  const searchNodes = async () => {
    if (!topic.trim() || !token) return

    setLoading(true)
    setError(null)
    try {
      // GET /topic-graph/nodes?query=topic (same as searchTopics)
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/topic-graph/nodes`,
        {
          params: { query: topic },
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setTopics(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get nodes')
    } finally {
      setLoading(false)
    }
  }

  const searchEdges = async () => {
    if (!topic.trim() || !token) return

    setLoading(true)
    setError(null)
    try {
      // GET /topic-graph/edges?query=topic
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/topic-graph/edges`,
        {
          params: { query: topic },
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setTopics(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get edges')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-black/40 backdrop-blur border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">Clever Sermon</p>
            <h1 className="text-2xl font-bold text-white">Topic Graph</h1>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs cyber-outline px-4 py-2 rounded-full"
          >
            Back to dashboard
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto cyber-panel rounded-2xl p-8">
          <h2 className="text-3xl font-bold mb-6 text-white">Explore Topic Graph</h2>

          {error && <p className="text-red-400 mb-4">{error}</p>}

          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest cyber-muted mb-2">
                Topic or Keyword
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., salvation, grace, prophecy"
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-gray-100/90"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={searchTopics}
                disabled={loading}
                className="cyber-button px-4 py-3 rounded-xl disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search Topics'}
              </button>
              <button
                onClick={searchNodes}
                disabled={loading}
                className="cyber-outline px-4 py-3 rounded-xl disabled:opacity-50"
              >
                Get Nodes
              </button>
              <button
                onClick={searchEdges}
                disabled={loading}
                className="cyber-outline px-4 py-3 rounded-xl disabled:opacity-50"
              >
                Get Edges
              </button>
            </div>
          </div>

          {topics.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Results</h3>
              <div className="space-y-3">
                {topics.map((item, idx) => (
                  <div key={idx} className="cyber-panel rounded-lg p-4">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
