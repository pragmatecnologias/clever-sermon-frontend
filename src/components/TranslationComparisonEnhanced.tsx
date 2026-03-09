'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Info, Zap } from 'lucide-react'
import axios from 'axios'

interface Translation {
  code: string
  name: string
  text: string
  type: 'formal' | 'dynamic' | 'paraphrase'
}

interface KeyDifference {
  category: 'theological_term' | 'verb_difference' | 'literal_vs_dynamic' | 'addition_omission'
  translations: string[]
  difference: string
  explanation: string
  significance: 'high' | 'medium' | 'low'
}

interface TranslationComparisonData {
  reference: string
  translations: Translation[]
  keyDifferences: KeyDifference[]
  analysis: {
    verbDifferences: string[]
    theologicalTermDifferences: string[]
    literalVsDynamic: string[]
    overallAssessment: string
  }
}

interface TranslationComparisonEnhancedProps {
  reference: string
  token: string
  language?: string
  cachedData?: TranslationComparisonData | null
}

export default function TranslationComparisonEnhanced({ 
  reference, 
  token,
  language = 'en',
  cachedData = null
}: TranslationComparisonEnhancedProps) {
  const [data, setData] = useState<TranslationComparisonData | null>(cachedData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDifference, setSelectedDifference] = useState<KeyDifference | null>(null)

  useEffect(() => {
    if (cachedData) {
      setData(cachedData)
      return
    }
    if (reference) {
      fetchComparison()
    }
  }, [reference, language, cachedData])

  const fetchComparison = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/scripture/translation-comparison-enhanced`,
        {
          params: { reference, language },
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setData(response.data)
    } catch (err) {
      console.error('Failed to fetch translation comparison:', err)
      setError('Unable to load translation comparison')
    } finally {
      setLoading(false)
    }
  }

  const significanceColors = {
    high: 'bg-red-500/20 text-red-200 border-red-400/40',
    medium: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/40',
    low: 'bg-blue-500/20 text-blue-200 border-blue-400/40'
  }

  const categoryIcons = {
    theological_term: Zap,
    verb_difference: Info,
    literal_vs_dynamic: AlertTriangle,
    addition_omission: AlertTriangle
  }

  const categoryLabels = {
    theological_term: 'Theological Term',
    verb_difference: 'Verb Difference',
    literal_vs_dynamic: 'Literal vs Dynamic',
    addition_omission: 'Addition/Omission'
  }

  if (loading) {
    return (
      <div className="cyber-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold">Translation Comparison</h3>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-gray-400">Loading translation comparison...</p>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full animate-[progress_1s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="cyber-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold">Translation Comparison</h3>
        </div>
        <div className="border border-amber-400/40 bg-amber-500/10 text-amber-100 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="cyber-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold">Translation Comparison</h3>
        </div>
        <p className="text-sm text-gray-400">No comparison data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Reference Header */}
      <div className="border border-cyan-400/40 rounded-lg p-4 bg-cyan-500/10">
        <h3 className="text-xl font-semibold text-cyan-200">{data.reference}</h3>
        <p className="text-xs text-gray-400 mt-1">{data.translations?.length || 0} translations compared</p>
      </div>

      {/* Key Differences */}
      {data.keyDifferences && data.keyDifferences.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Key Differences
          </h4>
          {data.keyDifferences.map((diff, idx) => {
            const Icon = categoryIcons[diff.category]
            return (
              <div 
                key={idx}
                className={`border rounded-lg p-4 ${
                  diff.significance === 'high' 
                    ? 'border-red-400/40 bg-red-500/10' 
                    : diff.significance === 'medium'
                    ? 'border-yellow-400/40 bg-yellow-500/10'
                    : 'border-blue-400/40 bg-blue-500/10'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-semibold text-white">
                      {categoryLabels[diff.category]}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${significanceColors[diff.significance]}`}>
                    {diff.significance} significance
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2">
                  <strong>Difference:</strong> {diff.difference}
                </p>
                <p className="text-sm text-gray-300 mb-2">
                  <strong>Explanation:</strong> {diff.explanation}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {diff.translations.map((trans, i) => (
                    <span 
                      key={i}
                      className="text-xs px-2 py-1 rounded bg-gray-700/50 text-gray-200"
                    >
                      {trans}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Translations Side-by-Side */}
      {data.translations && data.translations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-white">Translations</h4>
          {data.translations.map((trans, idx) => (
            <div 
              key={idx}
              className="border border-gray-700 rounded-lg p-4 bg-black/30"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-cyan-200">{trans.code}</span>
                  <span className="text-xs text-gray-400">{trans.name}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  trans.type === 'formal' 
                    ? 'bg-blue-500/20 text-blue-200' 
                    : trans.type === 'dynamic'
                    ? 'bg-green-500/20 text-green-200'
                    : 'bg-purple-500/20 text-purple-200'
                }`}>
                  {trans.type}
                </span>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">{trans.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Overall Assessment */}
      {data.analysis && data.analysis.overallAssessment && (
        <div className="border border-purple-400/40 rounded-lg p-4 bg-purple-500/10">
          <h4 className="text-lg font-semibold text-purple-200 mb-2">Overall Assessment</h4>
          <p className="text-sm text-gray-300">{data.analysis.overallAssessment}</p>
        </div>
      )}
    </div>
  )
}
