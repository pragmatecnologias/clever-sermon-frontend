'use client'

import { useState } from 'react'
import { Target, AlertTriangle, TrendingDown, Loader2 } from 'lucide-react'
import axios from 'axios'

interface Deviation {
  point: string
  severity: 'minor' | 'moderate' | 'major'
  explanation: string
}

interface SuppressionSuggestion {
  theme: string
  reason: string
  impact: string
}

interface TheologicalCenterAnalysis {
  id: string
  dominantCenter: string
  textualWarrant: string
  alignmentScore: number
  deviations: Deviation[]
  secondaryThemes: string[]
  suppressionSuggestions: SuppressionSuggestion[]
}

export default function TheologicalCenterPanel({ 
  workspaceId, 
  token 
}: { 
  workspaceId: string
  token: string 
}) {
  const [analysis, setAnalysis] = useState<TheologicalCenterAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/theological-center/${workspaceId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setAnalysis(response.data)
    } catch (err) {
      setError('Failed to analyze theological center')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadExisting = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/theological-center/${workspaceId}`,
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'major': return 'text-red-400 border-red-500/50'
      case 'moderate': return 'text-yellow-400 border-yellow-500/50'
      case 'minor': return 'text-blue-400 border-blue-500/50'
      default: return 'text-gray-400 border-gray-500/50'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold text-purple-200">Theological Center Analysis</h3>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Run Analysis'
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
          {/* Dominant Center */}
          <div className="bg-black/30 rounded-lg p-5 border border-purple-500/20">
            <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wide mb-2">
              Dominant Theological Center
            </h4>
            <p className="text-lg text-purple-100 font-medium mb-3">{analysis.dominantCenter}</p>
            <div className="text-sm text-gray-300">
              <span className="font-semibold text-purple-300">Textual Warrant:</span> {analysis.textualWarrant}
            </div>
          </div>

          {/* Alignment Score */}
          <div className="bg-black/30 rounded-lg p-5 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wide">
                Alignment Score
              </h4>
              <span className={`text-4xl font-bold ${getScoreColor(analysis.alignmentScore)}`}>
                {analysis.alignmentScore}
              </span>
            </div>
            <div className="mt-3 bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  analysis.alignmentScore >= 80 ? 'bg-green-500' :
                  analysis.alignmentScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${analysis.alignmentScore}%` }}
              />
            </div>
          </div>

          {/* Deviations */}
          {analysis.deviations && analysis.deviations.length > 0 && (
            <div className="bg-black/30 rounded-lg p-5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h4 className="text-sm font-semibold text-red-300 uppercase tracking-wide">
                  Deviations from Center
                </h4>
              </div>
              <div className="space-y-3">
                {analysis.deviations.map((dev, idx) => (
                  <div key={idx} className={`border-l-4 pl-4 py-2 ${getSeverityColor(dev.severity)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs uppercase font-bold">{dev.severity}</span>
                      <span className="text-sm font-semibold text-gray-200">{dev.point}</span>
                    </div>
                    <p className="text-sm text-gray-300">{dev.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suppression Suggestions */}
          {analysis.suppressionSuggestions && analysis.suppressionSuggestions.length > 0 && (
            <div className="bg-black/30 rounded-lg p-5 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-yellow-400" />
                <h4 className="text-sm font-semibold text-yellow-300 uppercase tracking-wide">
                  Themes to Suppress
                </h4>
              </div>
              <div className="space-y-3">
                {analysis.suppressionSuggestions.map((sugg, idx) => (
                  <div key={idx} className="bg-yellow-900/10 rounded-lg p-3 border border-yellow-500/30">
                    <div className="font-semibold text-yellow-200 mb-1">{sugg.theme}</div>
                    <div className="text-sm text-gray-300 mb-2">
                      <span className="font-semibold">Why:</span> {sugg.reason}
                    </div>
                    <div className="text-sm text-gray-300">
                      <span className="font-semibold">Impact:</span> {sugg.impact}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Secondary Themes */}
          {analysis.secondaryThemes && analysis.secondaryThemes.length > 0 && (
            <div className="bg-black/30 rounded-lg p-5 border border-purple-500/20">
              <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wide mb-3">
                Secondary Themes Detected
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.secondaryThemes.map((theme, idx) => (
                  <span key={idx} className="px-3 py-1 bg-purple-900/30 border border-purple-500/30 rounded-full text-sm text-purple-200">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!analysis && !loading && (
        <div className="text-center py-12 text-gray-400">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Click "Run Analysis" to identify the theological center of your sermon</p>
        </div>
      )}
    </div>
  )
}
