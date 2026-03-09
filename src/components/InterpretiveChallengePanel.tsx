'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, ChevronDown, ChevronUp, Book } from 'lucide-react'

interface InterpretiveView {
  viewName: string
  summary: string
  keyArguments: string[]
}

interface SDAPerspective {
  position: string
  reasoning: string
  supportingTexts: string[]
}

interface InterpretiveChallenge {
  passage: string
  challenge: string
  views: InterpretiveView[]
  sdaPerspective?: SDAPerspective
  dataSource: string
}

interface InterpretiveChallengePanelProps {
  passage: string
  token: string
  cachedData?: InterpretiveChallenge | null
}

export default function InterpretiveChallengePanel({ passage, token, cachedData }: InterpretiveChallengePanelProps) {
  const [challenge, setChallenge] = useState<InterpretiveChallenge | null>(cachedData || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedViews, setExpandedViews] = useState<Set<string>>(new Set())
  const [showSDA, setShowSDA] = useState(false)

  useEffect(() => {
    if (cachedData) {
      setChallenge(cachedData)
      return
    }
    if (passage) {
      fetchChallenge()
    }
  }, [passage, cachedData])

  const fetchChallenge = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scripture/interpretive-challenge?passage=${encodeURIComponent(passage)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (response.ok) {
        const data = await response.json()
        if (data.dataSource === 'unavailable') {
          setError('No interpretive challenges documented for this passage')
          setChallenge(null)
        } else {
          setChallenge(data)
        }
      } else {
        setError('Unable to load interpretive challenges')
      }
    } catch (err) {
      setError('Failed to fetch interpretive challenges')
    } finally {
      setLoading(false)
    }
  }

  const toggleView = (viewName: string) => {
    const newExpanded = new Set(expandedViews)
    if (newExpanded.has(viewName)) {
      newExpanded.delete(viewName)
    } else {
      newExpanded.add(viewName)
    }
    setExpandedViews(newExpanded)
  }

  if (loading) {
    return (
      <div className="cyber-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-400 animate-pulse" />
          <h3 className="text-lg font-semibold">Interpretive Challenges</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span className="h-2 w-2 rounded-full bg-amber-300 animate-pulse" />
            Loading interpretive challenges...
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full animate-[progress_loop_1.1s_linear_infinite] bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="cyber-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-semibold">Interpretive Challenges</h3>
        </div>
        <div className="border border-amber-400/40 bg-amber-500/10 text-amber-100 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      </div>
    )
  }

  if (!challenge || !challenge.views || !Array.isArray(challenge.views)) {
    return (
      <div className="cyber-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold">Interpretive Challenges</h3>
        </div>
        <p className="text-sm text-gray-400">No interpretive challenges documented.</p>
      </div>
    )
  }

  return (
    <div className="cyber-panel rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold">Interpretive Challenges</h3>
      </div>

      {/* Challenge Statement */}
      <div className="border border-amber-400/40 bg-amber-500/10 rounded-xl p-4">
        <p className="text-xs uppercase tracking-widest text-amber-300 mb-2">Challenge</p>
        <p className="text-sm text-amber-100 leading-relaxed">{challenge.challenge}</p>
      </div>

      {/* Different Views */}
      <div>
        <p className="text-xs uppercase tracking-widest cyber-muted mb-3">Different Interpretive Views</p>
        <div className="space-y-2">
          {challenge.views.map((view, index) => (
            <div key={index} className="border border-white/10 rounded-xl bg-black/30">
              <button
                onClick={() => toggleView(view.viewName)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-cyan-300">{view.viewName}</span>
                </div>
                {expandedViews.has(view.viewName) ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {expandedViews.has(view.viewName) && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-xs uppercase tracking-widest cyber-muted mb-2">Summary</p>
                    <p className="text-sm text-gray-300 leading-relaxed mb-3">{view.summary}</p>
                    
                    {view.keyArguments && Array.isArray(view.keyArguments) && view.keyArguments.length > 0 && (
                      <>
                        <p className="text-xs uppercase tracking-widest cyber-muted mb-2">Key Arguments</p>
                        <ul className="space-y-1">
                          {view.keyArguments.map((arg, argIndex) => (
                            <li key={argIndex} className="text-sm text-gray-300 flex items-start gap-2">
                              <span className="text-cyan-400 mt-1">•</span>
                              <span>{arg}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SDA Perspective */}
      {challenge.sdaPerspective && (
        <div className="border border-blue-400/40 rounded-xl bg-blue-500/10">
          <button
            onClick={() => setShowSDA(!showSDA)}
            className="w-full flex items-center justify-between p-4 hover:bg-blue-500/5 transition-colors rounded-xl"
          >
            <div className="flex items-center gap-2">
              <Book className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-300">SDA Perspective</span>
            </div>
            {showSDA ? (
              <ChevronUp className="w-4 h-4 text-blue-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-blue-400" />
            )}
          </button>

          {showSDA && (
            <div className="px-4 pb-4 space-y-3">
              <div className="border-t border-blue-400/20 pt-3">
                <p className="text-xs uppercase tracking-widest text-blue-300 mb-2">Position</p>
                <p className="text-sm text-blue-100 leading-relaxed mb-3">{challenge.sdaPerspective.position}</p>
                
                <p className="text-xs uppercase tracking-widest text-blue-300 mb-2">Reasoning</p>
                <p className="text-sm text-blue-100 leading-relaxed mb-3">{challenge.sdaPerspective.reasoning}</p>
                
                {challenge.sdaPerspective?.supportingTexts && Array.isArray(challenge.sdaPerspective.supportingTexts) && challenge.sdaPerspective.supportingTexts.length > 0 && (
                  <>
                    <p className="text-xs uppercase tracking-widest text-blue-300 mb-2">Supporting Texts</p>
                    <div className="flex flex-wrap gap-2">
                      {challenge.sdaPerspective.supportingTexts.map((text, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/40"
                        >
                          {text}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-gray-400">
          <span className="italic">Data source: {challenge.dataSource}</span>
          {' • '}
          Understanding different interpretive views helps develop balanced, well-informed sermons.
        </p>
      </div>
    </div>
  )
}
