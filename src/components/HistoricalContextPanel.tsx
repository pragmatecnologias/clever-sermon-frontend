'use client'

import { useState } from 'react'
import { BookOpen, Users, DollarSign, Church, AlertCircle, Loader2 } from 'lucide-react'
import axios from 'axios'

interface ContextItem {
  aspect?: string
  description: string
  impact?: string
  structure?: string
  dynamics?: string
  relevance?: string
  factor?: string
  element?: string
  tension?: string
  pressure?: string
  source?: string
  pastoralResponse?: string
}

interface HistoricalContext {
  id: string
  passage: string
  socialRealities: ContextItem[]
  powerStructures: ContextItem[]
  economicContext: ContextItem[]
  religiousClimate: ContextItem[]
  audiencePressures: ContextItem[]
  synthesisStatement: string
}

export default function HistoricalContextPanel({ 
  workspaceId, 
  token 
}: { 
  workspaceId: string
  token: string 
}) {
  const [context, setContext] = useState<HistoricalContext | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/historical-context/${workspaceId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setContext(response.data)
    } catch (err) {
      setError('Failed to enhance historical context')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadExisting = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/historical-context/${workspaceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.data) {
        setContext(response.data)
      }
    } catch (err) {
      console.error('No existing context found')
    }
  }

  useState(() => {
    loadExisting()
  })

  return (
    <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-amber-400" />
          <h3 className="text-xl font-bold text-amber-200">Historical Context (Enhanced)</h3>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Enhance Context'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {context && (
        <div className="space-y-6">
          {/* Synthesis Statement */}
          <div className="bg-black/30 rounded-lg p-5 border border-amber-500/20">
            <h4 className="text-sm font-semibold text-amber-300 uppercase tracking-wide mb-3">
              Historical Synthesis
            </h4>
            <p className="text-lg text-amber-100 leading-relaxed">{context.synthesisStatement}</p>
          </div>

          {/* Social Realities */}
          {context.socialRealities && context.socialRealities.length > 0 && (
            <div className="bg-black/30 rounded-lg p-5 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-semibold text-amber-300 uppercase tracking-wide">
                  Social Realities
                </h4>
              </div>
              <div className="space-y-3">
                {context.socialRealities.map((item, idx) => (
                  <div key={idx} className="bg-amber-900/10 rounded-lg p-4 border border-amber-500/30">
                    <h5 className="font-semibold text-amber-200 mb-2">{item.aspect}</h5>
                    <p className="text-sm text-gray-300 mb-2">{item.description}</p>
                    {item.impact && (
                      <div className="text-sm text-amber-200">
                        <span className="font-semibold">Impact:</span> {item.impact}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Power Structures */}
          {context.powerStructures && context.powerStructures.length > 0 && (
            <div className="bg-black/30 rounded-lg p-5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h4 className="text-sm font-semibold text-red-300 uppercase tracking-wide">
                  Power Structures
                </h4>
              </div>
              <div className="space-y-3">
                {context.powerStructures.map((item, idx) => (
                  <div key={idx} className="bg-red-900/10 rounded-lg p-4 border border-red-500/30">
                    <h5 className="font-semibold text-red-200 mb-2">{item.structure}</h5>
                    <p className="text-sm text-gray-300 mb-2">{item.dynamics}</p>
                    {item.relevance && (
                      <div className="text-sm text-red-200">
                        <span className="font-semibold">Relevance:</span> {item.relevance}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Economic Context */}
          {context.economicContext && context.economicContext.length > 0 && (
            <div className="bg-black/30 rounded-lg p-5 border border-green-500/20">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-400" />
                <h4 className="text-sm font-semibold text-green-300 uppercase tracking-wide">
                  Economic Context
                </h4>
              </div>
              <div className="space-y-3">
                {context.economicContext.map((item, idx) => (
                  <div key={idx} className="bg-green-900/10 rounded-lg p-4 border border-green-500/30">
                    <h5 className="font-semibold text-green-200 mb-2">{item.factor}</h5>
                    <p className="text-sm text-gray-300">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Religious Climate */}
          {context.religiousClimate && context.religiousClimate.length > 0 && (
            <div className="bg-black/30 rounded-lg p-5 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-4">
                <Church className="w-5 h-5 text-purple-400" />
                <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wide">
                  Religious Climate
                </h4>
              </div>
              <div className="space-y-3">
                {context.religiousClimate.map((item, idx) => (
                  <div key={idx} className="bg-purple-900/10 rounded-lg p-4 border border-purple-500/30">
                    <h5 className="font-semibold text-purple-200 mb-2">{item.element}</h5>
                    <p className="text-sm text-gray-300 mb-2">{item.description}</p>
                    {item.tension && (
                      <div className="text-sm text-purple-200">
                        <span className="font-semibold">Tension:</span> {item.tension}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audience Pressures */}
          {context.audiencePressures && context.audiencePressures.length > 0 && (
            <div className="bg-black/30 rounded-lg p-5 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <h4 className="text-sm font-semibold text-yellow-300 uppercase tracking-wide">
                  Audience Pressures
                </h4>
              </div>
              <div className="space-y-3">
                {context.audiencePressures.map((item, idx) => (
                  <div key={idx} className="bg-yellow-900/10 rounded-lg p-4 border border-yellow-500/30">
                    <h5 className="font-semibold text-yellow-200 mb-2">{item.pressure}</h5>
                    <div className="text-sm text-gray-300 mb-2">
                      <span className="font-semibold">Source:</span> {item.source}
                    </div>
                    {item.pastoralResponse && (
                      <div className="bg-black/30 rounded p-3 border-l-4 border-yellow-500">
                        <div className="text-xs font-semibold text-yellow-300 mb-1">Pastoral Response:</div>
                        <div className="text-sm text-gray-200">{item.pastoralResponse}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!context && !loading && (
        <div className="text-center py-12 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Click "Enhance Context" for specific historical details</p>
          <p className="text-sm mt-2">Not generic summaries - deep, specific anchoring</p>
        </div>
      )}
    </div>
  )
}
