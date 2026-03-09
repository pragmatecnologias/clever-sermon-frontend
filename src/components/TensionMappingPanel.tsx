'use client'

import { useState } from 'react'
import { Zap, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import axios from 'axios'

interface Tension {
  type: 'paradox' | 'unresolved_phrase' | 'theological_friction'
  text: string
  verseReference: string
  explanation: string
  preservationStrategy: string
}

interface SermonTensionHandling {
  tension: string
  isPreserved: boolean
  resolutionTiming: 'too_early' | 'appropriate' | 'unresolved'
  recommendation: string
}

interface TensionAnalysis {
  id: string
  tensions: Tension[]
  sermonTensionHandling: SermonTensionHandling[]
  tensionPreservationScore: number
}

export default function TensionMappingPanel({ 
  workspaceId, 
  token 
}: { 
  workspaceId: string
  token: string 
}) {
  const [analysis, setAnalysis] = useState<TensionAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/tension-mapping/${workspaceId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setAnalysis(response.data)
    } catch (err) {
      setError('Failed to map tensions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadExisting = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/tension-mapping/${workspaceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.data) {
        setAnalysis(response.data)
      }
    } catch (err) {
      console.error('No existing analysis found')
    }
  }

  useState(() => {
    loadExisting()
  })

  const getTensionTypeIcon = (type: string) => {
    return <Zap className="w-4 h-4" />
  }

  const getTimingColor = (timing: string) => {
    switch (timing) {
      case 'too_early': return 'text-red-400 border-red-500/50'
      case 'appropriate': return 'text-green-400 border-green-500/50'
      case 'unresolved': return 'text-yellow-400 border-yellow-500/50'
      default: return 'text-gray-400 border-gray-500/50'
    }
  }

  return (
    <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-500/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-orange-400" />
          <h3 className="text-xl font-bold text-orange-200">Tension Mapping</h3>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Mapping...
            </>
          ) : (
            'Map Tensions'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Preservation Score */}
          <div className="bg-black/30 rounded-lg p-5 border border-orange-500/20">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-orange-300 uppercase tracking-wide">
                Tension Preservation Score
              </h4>
              <span className={`text-4xl font-bold ${
                analysis.tensionPreservationScore >= 70 ? 'text-green-400' :
                analysis.tensionPreservationScore >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {analysis.tensionPreservationScore}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Tension creates weight. Quick resolution creates shallowness.
            </p>
          </div>

          {/* Textual Tensions */}
          {analysis.tensions && analysis.tensions.length > 0 && (
            <div className="bg-black/30 rounded-lg p-5 border border-orange-500/20">
              <h4 className="text-sm font-semibold text-orange-300 uppercase tracking-wide mb-4">
                Textual Tensions Detected
              </h4>
              <div className="space-y-4">
                {analysis.tensions.map((tension, idx) => (
                  <div key={idx} className="bg-orange-900/10 rounded-lg p-4 border border-orange-500/30">
                    <div className="flex items-start gap-3 mb-2">
                      {getTensionTypeIcon(tension.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs uppercase font-bold text-orange-400">{tension.type.replace(/_/g, ' ')}</span>
                          <span className="text-xs text-gray-400">{tension.verseReference}</span>
                        </div>
                        <p className="text-sm font-semibold text-orange-100 italic mb-2">"{tension.text}"</p>
                        <p className="text-sm text-gray-300 mb-3">{tension.explanation}</p>
                        <div className="bg-black/30 rounded p-3 border-l-4 border-orange-500">
                          <div className="text-xs font-semibold text-orange-300 mb-1">Preservation Strategy:</div>
                          <div className="text-sm text-gray-200">{tension.preservationStrategy}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sermon Tension Handling */}
          {analysis.sermonTensionHandling && analysis.sermonTensionHandling.length > 0 && (
            <div className="bg-black/30 rounded-lg p-5 border border-orange-500/20">
              <h4 className="text-sm font-semibold text-orange-300 uppercase tracking-wide mb-4">
                How Your Sermon Handles Tension
              </h4>
              <div className="space-y-3">
                {analysis.sermonTensionHandling.map((handling, idx) => (
                  <div key={idx} className={`border-l-4 pl-4 py-3 ${getTimingColor(handling.resolutionTiming)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {handling.isPreserved ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm font-semibold text-gray-200">{handling.tension}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs uppercase font-bold">{handling.resolutionTiming.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-sm text-gray-300">{handling.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!analysis && !loading && (
        <div className="text-center py-12 text-gray-400">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Click "Map Tensions" to identify paradoxes and theological friction</p>
        </div>
      )}
    </div>
  )
}
