'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function SermonDnaPage() {
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('')
  const [analyses, setAnalyses] = useState<any[]>([])
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } }
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/workspaces`, config)
        setWorkspaces(response.data)
        if (response.data[0]?.id) {
          setSelectedWorkspace(response.data[0].id)
        }
      } catch (err) {
        console.error(err)
        setError('Unable to load workspaces.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || !selectedWorkspace) return

    const fetchAnalyses = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } }
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/sermon-dna/workspace/${selectedWorkspace}`,
          config,
        )
        setAnalyses(response.data)
      } catch (err) {
        console.error(err)
        setError('Unable to load DNA analysis.')
      }
    }

    fetchAnalyses()
  }, [selectedWorkspace])

  const handleAnalyze = async () => {
    const token = localStorage.getItem('token')
    if (!token || !selectedWorkspace) return

    setActionLoading(true)
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/sermon-dna/analyze`, { workspaceId: selectedWorkspace }, config)
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/sermon-dna/workspace/${selectedWorkspace}`,
        config,
      )
      setAnalyses(response.data)
    } catch (err) {
      console.error(err)
      setError('DNA analysis failed.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-black/40 backdrop-blur border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">Clever Sermon</p>
            <h1 className="text-2xl font-bold text-white">Sermon DNA Lab</h1>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="cyber-outline px-4 py-2 text-xs rounded-full"
          >
            Back to dashboard
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10 space-y-8">
        <div className="cyber-panel rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Selection</p>
          <h2 className="text-3xl font-bold mt-2">Pick a Workspace</h2>
          <p className="text-gray-200/80 mt-2">Run DNA analysis to profile tone, structure, and spiritual emphasis.</p>
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <select
              value={selectedWorkspace}
              onChange={(event) => setSelectedWorkspace(event.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-100"
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.title}
                </option>
              ))}
            </select>
            <button
              onClick={handleAnalyze}
              className="cyber-button px-6 py-3 rounded-full disabled:opacity-60"
              disabled={actionLoading || !selectedWorkspace}
            >
              {actionLoading ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        ) : error ? (
          <div className="cyber-panel rounded-2xl p-6 text-center">
            <p className="text-red-300">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {analyses.length === 0 ? (
              <div className="cyber-panel rounded-2xl p-6">
                <p className="text-gray-200/80">No DNA analysis yet.</p>
              </div>
            ) : (
              analyses.map((analysis) => (
                <div key={analysis.id} className="cyber-panel rounded-2xl p-6">
                  <p className="text-gray-100/80">{analysis.summary}</p>
                  {analysis.themes?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {analysis.themes.map((theme: string) => (
                        <span
                          key={theme}
                          className="px-2 py-1 rounded-md text-[10px] uppercase tracking-widest bg-cyan-500/10 text-cyan-200 border border-cyan-500/20"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-6 space-y-3">
                    {analysis.scores && Object.entries(analysis.scores).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between text-xs uppercase tracking-widest cyber-muted mb-1">
                          <span>{String(key)}</span>
                          <span>{Number(value)}/10</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${Math.min(100, Number(value) * 10)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs cyber-muted mt-4">{new Date(analysis.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
