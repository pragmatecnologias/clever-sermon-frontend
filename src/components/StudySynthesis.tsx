'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Crown, MessageSquare, Loader2 } from 'lucide-react'

interface StudySynthesisData {
  passage: string
  centralClaim: string
  canonicalSignificance: string
  pastoralTakeaway: string
  preachingFocus: string
  dataSource: 'llm-generated' | 'curated' | 'unavailable'
}

interface StudySynthesisProps {
  reference: string
  token: string
  language?: string
  cachedData?: StudySynthesisData | null
  onDataLoad?: (data: StudySynthesisData) => void
}

export default function StudySynthesis({ reference, token, language = 'en', cachedData, onDataLoad }: StudySynthesisProps) {
  const [data, setData] = useState<StudySynthesisData | null>(cachedData || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cachedData) {
      setData(cachedData)
      return
    }
    if (reference) {
      fetchSynthesis()
    }
  }, [reference, language, cachedData])

  const fetchSynthesis = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scripture/study-synthesis?reference=${encodeURIComponent(reference)}&language=${encodeURIComponent(language)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (response.ok) {
        const result = await response.json()
        if (result.dataSource === 'unavailable') {
          setError('Synthesis not available for this passage')
          setData(null)
        } else {
          setData(result)
          onDataLoad?.(result)
        }
      } else {
        setError('Unable to load study synthesis')
      }
    } catch (err) {
      setError('Failed to fetch study synthesis')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="cyber-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-400 animate-pulse" />
          <h3 className="text-lg font-semibold">Study Synthesis</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
            Synthesizing insights...
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
    <div className="cyber-panel rounded-2xl p-6 space-y-6 border-2 border-amber-400/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold">Study Synthesis</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40">
          Interpretive Summary
        </span>
      </div>

      <p className="text-sm text-gray-400 italic">
        After analyzing the passage through multiple lenses, here is the theological synthesis:
      </p>

      {/* Central Claim */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full" />
          <h4 className="text-sm font-semibold text-cyan-300 uppercase tracking-wider">Central Claim</h4>
        </div>
        <div className="pl-4 p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/40">
          <p className="text-lg text-cyan-100 leading-relaxed font-medium">
            {data.centralClaim}
          </p>
        </div>
      </div>

      {/* Canonical Significance */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-purple-400" />
          <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wider">Canonical Significance</h4>
        </div>
        <div className="pl-4 p-5 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/40">
          <p className="text-base text-purple-100 leading-relaxed">
            {data.canonicalSignificance}
          </p>
        </div>
      </div>

      {/* Pastoral Takeaway */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-green-400" />
          <h4 className="text-sm font-semibold text-green-300 uppercase tracking-wider">Pastoral Takeaway</h4>
        </div>
        <div className="pl-4 p-5 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/40">
          <p className="text-base text-green-100 leading-relaxed">
            {data.pastoralTakeaway}
          </p>
        </div>
      </div>

      {/* Preaching Focus */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-gradient-to-b from-amber-400 to-orange-400 rounded-full" />
          <h4 className="text-sm font-semibold text-amber-300 uppercase tracking-wider">Preaching Focus</h4>
        </div>
        <div className="pl-4 p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/40">
          <p className="text-base text-amber-100 leading-relaxed font-medium">
            {data.preachingFocus}
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-xs text-gray-400 italic">
          This synthesis integrates structural, contextual, canonical, and interpretive insights to provide a unified theological understanding.
        </p>
      </div>
    </div>
  )
}
