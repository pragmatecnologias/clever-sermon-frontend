'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, BarChart3, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import axios from 'axios'

interface GrowthInsight {
  strength: string
  weakness: string
  recommendation: string
}

interface SermonPatternTracker {
  id: string
  totalSermons: number
  styleFrequency: Record<string, number>
  themeFrequency: Record<string, number>
  applicationCategoryBalance: {
    personal: number
    communal: number
    missional: number
    doctrinal: number
  }
  avgChristCentrality: number | null
  avgApplicationDepth: number | null
  avoidedTexts: string[]
  overusedIllustrations: string[]
  growthInsights: GrowthInsight[]
}

export default function SermonPatternDashboard({ 
  token 
}: { 
  token: string 
}) {
  const [patterns, setPatterns] = useState<SermonPatternTracker | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPatterns = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/sermon-patterns`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.data) {
        setPatterns(response.data)
      }
    } catch (err) {
      console.error('Failed to load patterns')
    } finally {
      setLoading(false)
    }
  }

  const analyzeGrowth = async () => {
    setAnalyzing(true)
    setError(null)
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/sermon-patterns/analyze`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setPatterns(response.data)
    } catch (err) {
      setError('Failed to analyze growth patterns')
      console.error(err)
    } finally {
      setAnalyzing(false)
    }
  }

  useEffect(() => {
    loadPatterns()
  }, [])

  const getTopStyles = () => {
    if (!patterns?.styleFrequency) return []
    return Object.entries(patterns.styleFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
  }

  const getApplicationTotal = () => {
    if (!patterns?.applicationCategoryBalance) return 0
    const balance = patterns.applicationCategoryBalance
    return balance.personal + balance.communal + balance.missional + balance.doctrinal
  }

  return (
    <div className="bg-gradient-to-br from-teal-900/20 to-cyan-900/20 border border-teal-500/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-teal-400" />
          <h3 className="text-xl font-bold text-teal-200">Sermon Growth Patterns</h3>
        </div>
        <button
          onClick={analyzeGrowth}
          disabled={analyzing || !patterns || patterns.totalSermons < 3}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze Growth'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin text-teal-400" />
          <p className="text-gray-400">Loading patterns...</p>
        </div>
      ) : patterns ? (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-black/30 rounded-lg p-4 border border-teal-500/20 text-center">
              <div className="text-3xl font-bold text-teal-400">{patterns.totalSermons}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Total Sermons</div>
            </div>
            {patterns.avgChristCentrality !== null && (
              <div className="bg-black/30 rounded-lg p-4 border border-teal-500/20 text-center">
                <div className="text-3xl font-bold text-teal-400">{patterns.avgChristCentrality}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Christ Centrality</div>
              </div>
            )}
            {patterns.avgApplicationDepth !== null && (
              <div className="bg-black/30 rounded-lg p-4 border border-teal-500/20 text-center">
                <div className="text-3xl font-bold text-teal-400">{patterns.avgApplicationDepth}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Application Depth</div>
              </div>
            )}
          </div>

          {/* Style Frequency */}
          {getTopStyles().length > 0 && (
            <div className="bg-black/30 rounded-lg p-5 border border-teal-500/20">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-teal-400" />
                <h4 className="text-sm font-semibold text-teal-300 uppercase tracking-wide">
                  Most Used Styles
                </h4>
              </div>
              <div className="space-y-3">
                {getTopStyles().map(([style, count]) => (
                  <div key={style} className="flex items-center justify-between">
                    <span className="text-gray-200 capitalize">{style}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-teal-500"
                          style={{ width: `${(count / patterns.totalSermons) * 100}%` }}
                        />
                      </div>
                      <span className="text-teal-400 font-semibold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Application Balance */}
          {patterns.applicationCategoryBalance && getApplicationTotal() > 0 && (
            <div className="bg-black/30 rounded-lg p-5 border border-teal-500/20">
              <h4 className="text-sm font-semibold text-teal-300 uppercase tracking-wide mb-4">
                Application Category Balance
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(patterns.applicationCategoryBalance).map(([category, count]) => (
                  <div key={category} className="bg-teal-900/10 rounded-lg p-3 border border-teal-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300 capitalize">{category}</span>
                      <span className="text-xl font-bold text-teal-400">{count}</span>
                    </div>
                    <div className="bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-teal-500"
                        style={{ width: `${(count / getApplicationTotal()) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avoided Texts */}
          {patterns.avoidedTexts && patterns.avoidedTexts.length > 0 && (
            <div className="bg-black/30 rounded-lg p-5 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <h4 className="text-sm font-semibold text-yellow-300 uppercase tracking-wide">
                  Texts You Avoid
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {patterns.avoidedTexts.map((text, idx) => (
                  <span key={idx} className="px-3 py-1 bg-yellow-900/20 border border-yellow-500/30 rounded-full text-sm text-yellow-200">
                    {text}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Growth Insights */}
          {patterns.growthInsights && patterns.growthInsights.length > 0 && (
            <div className="bg-black/30 rounded-lg p-5 border border-teal-500/20">
              <h4 className="text-sm font-semibold text-teal-300 uppercase tracking-wide mb-4">
                Growth Insights
              </h4>
              <div className="space-y-4">
                {patterns.growthInsights.map((insight, idx) => (
                  <div key={idx} className="bg-teal-900/10 rounded-lg p-4 border border-teal-500/30">
                    <div className="flex items-start gap-3 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-green-300 uppercase mb-1">Strength</div>
                        <p className="text-sm text-gray-200">{insight.strength}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 mb-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-red-300 uppercase mb-1">Weakness</div>
                        <p className="text-sm text-gray-200">{insight.weakness}</p>
                      </div>
                    </div>
                    <div className="bg-black/30 rounded p-3 border-l-4 border-teal-500">
                      <div className="text-xs font-semibold text-teal-300 uppercase mb-1">Recommendation</div>
                      <p className="text-sm text-gray-200">{insight.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {patterns.totalSermons < 3 && (
            <div className="bg-blue-900/10 rounded-lg p-4 border border-blue-500/30 text-center">
              <p className="text-blue-200">Need at least 3 sermons for growth analysis</p>
              <p className="text-sm text-gray-400 mt-1">Keep preaching! ({patterns.totalSermons}/3)</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No sermon patterns tracked yet</p>
          <p className="text-sm mt-2">Patterns will build as you create more sermons</p>
        </div>
      )}
    </div>
  )
}
