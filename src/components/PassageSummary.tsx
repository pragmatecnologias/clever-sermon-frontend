'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Target, AlertTriangle, Loader2 } from 'lucide-react'

interface PassageSummaryData {
  passage: string
  summary: string
  interpretiveCenter: string
  mainTension: string
  movement: string[]
  dataSource: 'llm-generated' | 'curated' | 'unavailable'
}

interface PassageSummaryProps {
  reference: string
  token: string
  language?: string
  cachedData?: PassageSummaryData | null
}

export default function PassageSummary({ reference, token, language = 'en', cachedData }: PassageSummaryProps) {
  const [data, setData] = useState<PassageSummaryData | null>(cachedData || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cachedData) {
      setData(cachedData)
      return
    }
    if (reference) {
      fetchSummary()
    }
  }, [reference, language, cachedData])

  const fetchSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scripture/passage-summary?reference=${encodeURIComponent(reference)}&language=${encodeURIComponent(language)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (response.ok) {
        const result = await response.json()
        if (result.dataSource === 'unavailable') {
          setError('Summary not available for this passage')
          setData(null)
        } else {
          setData(result)
        }
      } else {
        setError('Unable to load passage summary')
      }
    } catch (err) {
      setError('Failed to fetch passage summary')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="cyber-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h3 className="text-lg font-semibold">Passage Overview</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
            Analyzing passage...
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full animate-[progress_loop_1.1s_linear_infinite] bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return null
  }

  return (
    <div className="cyber-panel rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold">Passage Overview</h3>
        {data.dataSource === 'llm-generated' && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/40">
            AI-Generated
          </span>
        )}
      </div>

      {/* Passage Summary */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-cyan-400 rounded-full" />
          <h4 className="text-sm font-semibold text-cyan-300 uppercase tracking-wider">Summary</h4>
        </div>
        <p className="text-base text-gray-200 leading-relaxed pl-4">
          {data.summary}
        </p>
      </div>

      {/* Movement (if narrative) */}
      {data.movement && Array.isArray(data.movement) && data.movement.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-400 rounded-full" />
            <h4 className="text-sm font-semibold text-blue-300 uppercase tracking-wider">Passage Movement</h4>
          </div>
          <div className="pl-4 space-y-2">
            {data.movement.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-xs font-semibold text-blue-200">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interpretive Center */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-semibold text-amber-300 uppercase tracking-wider">Interpretive Center</h4>
        </div>
        <div className="pl-4 p-4 rounded-lg bg-amber-500/10 border border-amber-400/30">
          <p className="text-base text-amber-100 leading-relaxed font-medium">
            {data.interpretiveCenter}
          </p>
        </div>
      </div>

      {/* Main Tension */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-400" />
          <h4 className="text-sm font-semibold text-orange-300 uppercase tracking-wider">Main Tension</h4>
        </div>
        <div className="pl-4 p-4 rounded-lg bg-orange-500/10 border border-orange-400/30">
          <p className="text-base text-orange-100 leading-relaxed">
            {data.mainTension}
          </p>
        </div>
      </div>
    </div>
  )
}
