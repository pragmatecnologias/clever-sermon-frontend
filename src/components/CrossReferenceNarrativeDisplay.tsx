'use client'

import { useState } from 'react'
import { GitBranch, BookOpen, Loader2 } from 'lucide-react'
import axios from 'axios'

interface ChainItem {
  reference: string
  era: string
  contribution: string
  order: number
}

interface CrossReferenceNarrative {
  id: string
  narrativeTitle: string
  narrativeDescription: string
  chain: ChainItem[]
  thematicThread: string
  redemptiveMovement: string | null
}

export default function CrossReferenceNarrativeDisplay({ 
  verse,
  token 
}: { 
  verse: string
  token: string 
}) {
  const [narratives, setNarratives] = useState<CrossReferenceNarrative[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buildNarratives = async () => {
    if (!verse) {
      setError('Please provide a verse reference')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/cross-reference-narrative/${encodeURIComponent(verse)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setNarratives(response.data || [])
    } catch (err) {
      setError('Failed to build narrative threads')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadExisting = async () => {
    if (!verse) return
    
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/cross-reference-narrative/${encodeURIComponent(verse)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.data && response.data.length > 0) {
        setNarratives(response.data)
      }
    } catch (err) {
      console.error('No existing narratives found')
    }
  }

  useState(() => {
    loadExisting()
  })

  return (
    <div className="bg-gradient-to-br from-emerald-900/20 to-green-900/20 border border-emerald-500/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GitBranch className="w-6 h-6 text-emerald-400" />
          <h3 className="text-xl font-bold text-emerald-200">Cross-Reference Narrative Threads</h3>
        </div>
        <button
          onClick={buildNarratives}
          disabled={loading || !verse}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Building...
            </>
          ) : (
            'Build Narratives'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {narratives.length > 0 ? (
        <div className="space-y-6">
          {narratives.map((narrative, idx) => (
            <div key={narrative.id || idx} className="bg-black/30 rounded-lg p-5 border border-emerald-500/20">
              {/* Narrative Title */}
              <div className="mb-4">
                <h4 className="text-lg font-bold text-emerald-200 mb-2">{narrative.narrativeTitle}</h4>
                <p className="text-gray-300">{narrative.narrativeDescription}</p>
              </div>

              {/* Thematic Thread */}
              <div className="bg-emerald-900/20 rounded-lg p-3 border border-emerald-500/30 mb-4">
                <div className="text-xs font-semibold text-emerald-300 uppercase mb-1">Thematic Thread</div>
                <p className="text-sm text-emerald-100 italic">"{narrative.thematicThread}"</p>
              </div>

              {/* Chain */}
              {narrative.chain && narrative.chain.length > 0 && (
                <div className="space-y-3 mb-4">
                  {narrative.chain
                    .sort((a, b) => a.order - b.order)
                    .map((item, chainIdx) => (
                      <div key={chainIdx} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                          {item.order}
                        </div>
                        <div className="flex-1 bg-emerald-900/10 rounded-lg p-3 border border-emerald-500/30">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="w-4 h-4 text-emerald-400" />
                            <span className="font-semibold text-emerald-200">{item.reference}</span>
                            <span className="text-xs text-gray-400">• {item.era}</span>
                          </div>
                          <p className="text-sm text-gray-300">{item.contribution}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Redemptive Movement */}
              {narrative.redemptiveMovement && (
                <div className="bg-black/30 rounded p-4 border-l-4 border-emerald-500">
                  <div className="text-xs font-semibold text-emerald-300 uppercase mb-1">
                    Redemptive Movement
                  </div>
                  <p className="text-sm text-gray-200">{narrative.redemptiveMovement}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : !loading ? (
        <div className="text-center py-12 text-gray-400">
          <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Click "Build Narratives" to create thematic chains</p>
          <p className="text-sm mt-2">Cross-references will tell a story, not just be a list</p>
        </div>
      ) : null}
    </div>
  )
}
