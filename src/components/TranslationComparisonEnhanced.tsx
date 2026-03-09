'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Info, Zap } from 'lucide-react'
import axios from 'axios'

interface Translation {
  code: string
  name: string
  text: string
  verses?: Array<{ number: string; text: string; reference?: string }>
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
  onDataLoad?: (data: TranslationComparisonData) => void
}

export default function TranslationComparisonEnhanced({ 
  reference, 
  token,
  language = 'en',
  cachedData = null,
  onDataLoad,
}: TranslationComparisonEnhancedProps) {
  const [data, setData] = useState<TranslationComparisonData | null>(cachedData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDifference, setSelectedDifference] = useState<KeyDifference | null>(null)

  useEffect(() => {
    if (cachedData) {
      const hasVerseRows = Array.isArray(cachedData.translations)
        && cachedData.translations.some((trans) => Array.isArray(trans.verses) && trans.verses.length > 0)
      setData(cachedData)
      if (hasVerseRows) {
        return
      }
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
      onDataLoad?.(response.data)
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

  const buildVerseRows = () => {
    if (!data?.translations?.length) {
      return {
        verseNumbers: [] as string[],
        byTranslation: {} as Record<string, Record<string, string>>,
      }
    }

    const byTranslation: Record<string, Record<string, string>> = {}
    const verseSet = new Set<string>()

    data.translations.forEach((trans) => {
      byTranslation[trans.code] = {}

      if (Array.isArray(trans.verses) && trans.verses.length > 0) {
        trans.verses.forEach((verse) => {
          const number = String(verse.number || '').trim()
          if (!number) return
          verseSet.add(number)
          byTranslation[trans.code][number] = String(verse.text || '').trim()
        })
        return
      }

      // Fallback for legacy payloads without verse arrays.
      byTranslation[trans.code].full = trans.text
      verseSet.add('full')
    })

    const verseNumbers = Array.from(verseSet).sort((a, b) => {
      if (a === 'full') return 1
      if (b === 'full') return -1
      return Number(a) - Number(b)
    })

    return { verseNumbers, byTranslation }
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
    <div className="cyber-panel rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-2 pr-24">
        <AlertTriangle className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold">Translation Comparison</h3>
      </div>

      {/* Reference Header */}
      <div>
        <h4 className="text-xl font-semibold text-cyan-200">{data.reference}</h4>
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
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            Verse-by-Verse Comparison
          </h4>
          {(() => {
            const { verseNumbers, byTranslation } = buildVerseRows()
            const columnCount = data.translations.length

            return (
              <div className="border border-gray-700 rounded-xl overflow-hidden bg-black/30">
                <div
                  className="grid bg-slate-900/80 border-b border-gray-700"
                  style={{ gridTemplateColumns: `72px repeat(${columnCount}, minmax(260px, 1fr))` }}
                >
                  <div className="px-3 py-3 text-xs uppercase tracking-widest text-cyan-200/80">Verse</div>
                  {data.translations.map((trans) => (
                    <div key={trans.code} className="px-4 py-3 border-l border-gray-700/60">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-cyan-300">{trans.code}</p>
                          <p className="text-[11px] text-gray-400">{trans.name}</p>
                        </div>
                        <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                          trans.type === 'formal'
                            ? 'bg-blue-500/20 text-blue-200 border border-blue-400/30'
                            : trans.type === 'dynamic'
                            ? 'bg-green-500/20 text-green-200 border border-green-400/30'
                            : 'bg-purple-500/20 text-purple-200 border border-purple-400/30'
                        }`}>
                          {trans.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="max-h-[520px] overflow-auto">
                  {verseNumbers.map((verseNum, rowIndex) => (
                    <div
                      key={verseNum}
                      className={`grid ${rowIndex % 2 === 0 ? 'bg-slate-950/30' : 'bg-slate-900/20'}`}
                      style={{ gridTemplateColumns: `72px repeat(${columnCount}, minmax(260px, 1fr))` }}
                    >
                      <div className="px-3 py-3 text-cyan-300 font-semibold border-t border-gray-800/80">
                        {verseNum === 'full' ? 'Text' : verseNum}
                      </div>
                      {data.translations.map((trans) => (
                        <div
                          key={`${verseNum}-${trans.code}`}
                          className="px-4 py-3 border-l border-t border-gray-800/80 text-sm leading-relaxed text-gray-100"
                        >
                          {byTranslation[trans.code]?.[verseNum] || <span className="text-gray-500">—</span>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
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
