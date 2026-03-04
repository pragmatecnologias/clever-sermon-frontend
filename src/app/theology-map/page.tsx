'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function TheologyMapPage() {
  const router = useRouter()
  const [nodes, setNodes] = useState<any[]>([])
  const [edges, setEdges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } }
        const [nodeRes, edgeRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/topic-graph/nodes`, config),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/topic-graph/edges`, config),
        ])
        setNodes(nodeRes.data)
        setEdges(edgeRes.data)
      } catch (err) {
        console.error(err)
        setError('Unable to load theology map.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  return (
    <div className="min-h-screen">
      <nav className="bg-black/40 backdrop-blur border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">Clever Sermon</p>
            <h1 className="text-2xl font-bold text-white">Theology Map</h1>
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
          <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Overview</p>
          <h2 className="text-3xl font-bold mt-2">Concept Lattice</h2>
          <p className="text-gray-200/80 mt-2">
            Track themes, passages, and linked notes as a navigable map. Nodes are auto-generated and connected based on your sermon workspaces.
          </p>
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
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 cyber-panel rounded-2xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Nodes</p>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                {nodes.length === 0 ? (
                  <p className="text-gray-200/80">No nodes yet. Generate theology data from sermons.</p>
                ) : (
                  nodes.map((node) => (
                    <div key={node.id} className="border border-white/10 rounded-xl p-4 bg-black/30">
                      <p className="text-lg font-semibold text-white">{node.topic}</p>
                      <p className="text-sm text-gray-200/80 mt-2">{node.description || 'No description yet.'}</p>
                      {node.relatedVerses?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {node.relatedVerses.map((verse: string) => (
                            <span key={verse} className="cyber-tag">{verse}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="cyber-panel rounded-2xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Edges</p>
              <div className="mt-4 space-y-3">
                {edges.length === 0 ? (
                  <p className="text-gray-200/80">No edges yet.</p>
                ) : (
                  edges.map((edge) => (
                    <div key={edge.id} className="border border-white/10 rounded-xl p-4 bg-black/30">
                      <p className="text-sm text-cyan-200/80">{edge.relationshipType}</p>
                      <p className="text-sm text-gray-200/80 mt-2">{edge.sourceNodeId} → {edge.targetNodeId}</p>
                      <p className="text-xs text-gray-400 mt-2">Strength: {edge.strength}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
