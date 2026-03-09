'use client'

import { useState } from 'react'
import { Eye, AlertTriangle, BookOpen, TrendingUp, Loader2 } from 'lucide-react'
import axios from 'axios'

interface DoctrinalTensionMinimized {
  tension: string
  howMinimized: string
}

interface ApplicationImbalance {
  category: string
  count: number
  recommendation: string
}

interface BlindSpotAnalysis {
  id: string
  themesNotAddressed: string[]
  hardVersesAvoided: string[]
  doctrinalTensionsMinimized: DoctrinalTensionMinimized[]
  applicationImbalance: ApplicationImbalance[]
  overallAssessment: string
}

export default function BlindSpotPanel({ 
  workspaceId, 
  token 
}: { 
  workspaceId: string
  token: string 
}) {
  const [analysis, setAnalysis] = useState<BlindSpotAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/blind-spots/${workspaceId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setAnalysis(response.data)
    } catch (err) {
      setError('Failed to detect blind spots')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadExisting = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/blind-spots/${workspaceId}`,
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

  const hasBlindSpots = analysis && (
    analysis.themesNotAddressed.length > 0 ||
    analysis.hardVersesAvoided.length > 0 ||
    (analysis.doctrinalTensionsMinimized && analysis.doctrinalTensionsMinimized.length > 0) ||
    (analysis.applicationImbalance && analysis.applicationImbalance.length > 0)
  )

  return (
    <div className="bg-gradient-to-br from-gray-900/20 to-slate-900/20 border border-gray-500/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Eye className="w-6 h-6 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-200">What Is NOT Being Said</h3>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Detecting...
            </>
          ) : (
            'Detect Blind Spots'
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
          {/* Overall Assessment */}
          <div className="bg-black/30 rounded-lg p-5 border border-gray-500/20">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
              Overall Assessment
            </h4>
            <p className="text-gray-200">{analysis.overallAssessment}</p>
          </div>

          {/* Themes Not Addressed */}
          {analysis.themesNotAddressed && analysis.themesNotAddressed.length > 0 && (
            <div className="bg-black/30 rounded-lg p-5 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-yellow-400" />
                <h4 className="text-sm font-semibold text-yellow-300 uppercase tracking-wide">
                  Themes Present in Passage But Missing from Sermon
                </h4>
              </div>
              <ul className="space-y-2">
                {analysis.themesNotAddressed.map((theme, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-200">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>{theme}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hard Verses Avoided */}
          {analysis.hardVersesAvoided && analysis.hardVersesAvoided.length > 0 && (
            <div className="bg-black/30 rounded-lg p-5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h4 className="text-sm font-semibold text-red-300 uppercase tracking-wide">
                  Difficult Verses Being Skipped
                </h4>
              </div>
              <ul className="space-y-2">
                {analysis.hardVersesAvoided.map((verse, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-200">
                    <span className="text-red-400 mt-1">•</span>
                    <span className="font-mono text-sm">{verse}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Doctrinal Tensions Minimized */}
          {analysis.doctrinalTensionsMinimized && analysis.doctrinalTensionsMinimized.length > 0 && (
            <div className="bg-black/30 rounded-lg p-5 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <h4 className="text-sm font-semibold text-orange-300 uppercase tracking-wide">
                  Theological Tensions Being Smoothed Over
                </h4>
              </div>
              <div className="space-y-3">
                {analysis.doctrinalTensionsMinimized.map((item, idx) => (
                  <div key={idx} className="bg-orange-900/10 rounded-lg p-3 border border-orange-500/30">
                    <div className="font-semibold text-orange-200 mb-1">{item.tension}</div>
                    <div className="text-sm text-gray-300">
                      <span className="font-semibold">How minimized:</span> {item.howMinimized}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Application Imbalance */}
          {analysis.applicationImbalance && analysis.applicationImbalance.length > 0 && (
            <div className="bg-black/30 rounded-lg p-5 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h4 className="text-sm font-semibold text-blue-300 uppercase tracking-wide">
                  Application Category Balance
                </h4>
              </div>
              <div className="space-y-3">
                {analysis.applicationImbalance.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-blue-900/10 rounded-lg p-3 border border-blue-500/30">
                    <div>
                      <div className="font-semibold text-blue-200 capitalize">{item.category}</div>
                      <div className="text-sm text-gray-300">{item.recommendation}</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">{item.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasBlindSpots && (
            <div className="bg-green-900/10 rounded-lg p-5 border border-green-500/30 text-center">
              <p className="text-green-300">✓ No major blind spots detected</p>
            </div>
          )}
        </div>
      )}

      {!analysis && !loading && (
        <div className="text-center py-12 text-gray-400">
          <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Click "Detect Blind Spots" to see what your sermon is NOT addressing</p>
          <p className="text-sm mt-2">This adds intellectual honesty by exposing weaknesses</p>
        </div>
      )}
    </div>
  )
}
