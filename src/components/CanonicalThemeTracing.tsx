'use client'

import { useState, useEffect } from 'react'
import { Network, BookOpen, ChevronDown, ChevronUp, ArrowRight, Sparkles } from 'lucide-react'
import dynamic from 'next/dynamic'

const InteractiveCanonicalConstellation = dynamic(
  () => import('./InteractiveCanonicalConstellation'),
  { ssr: false }
)

interface ThemeVerse {
  reference: string
  snippet: string
  explanation: string
  stage: 'foundation' | 'expansion' | 'echo' | 'fulfillment'
  testament: 'OT' | 'NT'
  era: 'Torah' | 'History' | 'Wisdom' | 'Prophets' | 'Gospels' | 'Acts' | 'Epistles' | 'Revelation'
}

interface CanonicalTheme {
  theme: string
  description: string
  explanation: string
  canonicalMovement: string
  category: string
  verses: ThemeVerse[]
  isPrimary?: boolean
}

interface CanonicalThemesResponse {
  passage: string
  themes: CanonicalTheme[]
  dataSource: 'llm-generated' | 'unavailable'
}

interface CanonicalThemeTracingProps {
  reference: string
  token: string
  workspaceId?: string
  onAddToOutline?: (theme: string, verses: string[]) => void
  cachedData?: CanonicalThemesResponse | null
}

export default function CanonicalThemeTracing({ reference, token, workspaceId, onAddToOutline, cachedData }: CanonicalThemeTracingProps) {
  const [themes, setThemes] = useState<CanonicalTheme[]>(cachedData?.themes || [])
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set())
  const [show3DModal, setShow3DModal] = useState(false)
  const [selected3DTheme, setSelected3DTheme] = useState<string | null>(null)
  const [selectedVerse, setSelectedVerse] = useState<ThemeVerse | null>(null)
  const [verseText, setVerseText] = useState<string>('')
  const [loadingVerse, setLoadingVerse] = useState(false)

  useEffect(() => {
    if (cachedData) {
      setThemes(cachedData.themes || [])
      return
    }
    if (reference) {
      fetchThemesForPassage()
    }
  }, [reference, cachedData])

  const fetchThemesForPassage = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scripture/canonical-themes?reference=${encodeURIComponent(reference)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (response.ok) {
        const data: CanonicalThemesResponse = await response.json()
        if (data.dataSource === 'unavailable') {
          setError('No canonical themes found for this passage')
          setThemes([])
        } else {
          setThemes(data.themes || [])
        }
      } else {
        setError('Unable to load themes for this passage')
      }
    } catch (err) {
      setError('Failed to fetch canonical themes')
    } finally {
      setLoading(false)
    }
  }


  const fetchSpecificTheme = async (themeName: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scripture/canonical-theme?theme=${encodeURIComponent(themeName)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (response.ok) {
        const data = await response.json()
        setSelectedTheme(themeName)
        setThemes([data])
      } else {
        setError('Unable to load theme details')
      }
    } catch (err) {
      setError('Failed to fetch theme details')
    } finally {
      setLoading(false)
    }
  }

  const toggleTheme = (themeName: string) => {
    const newExpanded = new Set(expandedThemes)
    if (newExpanded.has(themeName)) {
      newExpanded.delete(themeName)
    } else {
      newExpanded.add(themeName)
    }
    setExpandedThemes(newExpanded)
  }

  const openThemeIn3D = (themeName: string) => {
    setSelected3DTheme(themeName)
    setShow3DModal(true)
  }

  const handleVerseClick = async (verse: ThemeVerse) => {
    setSelectedVerse(verse)
    setLoadingVerse(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scripture/passage?reference=${encodeURIComponent(verse.reference)}&translation=KJV`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (response.ok) {
        const data = await response.json()
        const text = data.verses?.map((v: any) => v.text).join(' ') || verse.snippet
        setVerseText(text)
      } else {
        setVerseText(verse.snippet)
      }
    } catch (err) {
      setVerseText(verse.snippet)
    } finally {
      setLoadingVerse(false)
    }
  }

  const handleAddToOutline = (theme: CanonicalTheme) => {
    if (onAddToOutline) {
      const verseRefs = theme.verses.map(v => v.reference)
      onAddToOutline(theme.theme, verseRefs)
    }
  }

  const openPassage = (reference: string) => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/scripture/${encodeURIComponent(reference)}`, '_blank')
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'foundation':
        return 'bg-blue-500/20 text-blue-200 border-blue-400/40'
      case 'expansion':
        return 'bg-purple-500/20 text-purple-200 border-purple-400/40'
      case 'echo':
        return 'bg-amber-500/20 text-amber-200 border-amber-400/40'
      case 'fulfillment':
        return 'bg-green-500/20 text-green-200 border-green-400/40'
      default:
        return 'bg-gray-500/20 text-gray-200 border-gray-400/40'
    }
  }

  const getStageLabel = (stage: string) => {
    if (!stage) return 'Unknown'
    return stage.charAt(0).toUpperCase() + stage.slice(1)
  }

  const isCurrentPassage = (verseRef: string) => {
    // Simple check if verse reference matches current passage
    const normalizedRef = verseRef.toLowerCase().trim()
    const normalizedCurrent = reference.toLowerCase().trim()
    return normalizedRef.includes(normalizedCurrent.split(':')[0]) || normalizedCurrent.includes(verseRef.split(':')[0])
  }

  if (loading && themes.length === 0) {
    return (
      <div className="cyber-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Network className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h3 className="text-lg font-semibold">Canonical Theme Tracing</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse" />
            Tracing canonical themes...
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full animate-[progress_loop_1.1s_linear_infinite] bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cyber-panel rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold">Canonical Theme Tracing</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/40">
          AI-Generated
        </span>
      </div>

      {error && (
        <div className="border border-red-400/40 bg-red-500/10 text-red-100 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {themes.length === 0 && !loading ? (
        <p className="text-sm text-gray-400">No canonical themes found for this passage.</p>
      ) : themes.length > 0 ? (
        <div className="space-y-4">
          {themes.map((theme) => (
            <div key={theme.theme} className="border border-cyan-400/20 rounded-xl bg-black/30">
              <button
                onClick={() => toggleTheme(theme.theme)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors rounded-xl"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-semibold text-cyan-300">{theme.theme}</h4>
                    {theme.isPrimary && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/60 font-semibold">
                        PRIMARY
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{theme.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/40">
                      {theme.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {theme.verses?.length || 0} verses
                    </span>
                  </div>
                </div>
                {expandedThemes.has(theme.theme) ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {expandedThemes.has(theme.theme) && theme.verses && (
                <div className="px-4 pb-4 space-y-4">
                  <div className="border-t border-cyan-400/20 pt-4">
                    {/* Action Buttons */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => openThemeIn3D(theme.theme)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/40 hover:border-purple-400/60 transition-all group"
                      >
                        <Sparkles className="w-4 h-4 text-purple-300 group-hover:animate-pulse" />
                        <span className="text-sm font-semibold text-purple-200">Explore in 3D</span>
                      </button>
                      {onAddToOutline && (
                        <button
                          onClick={() => handleAddToOutline(theme)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/40 hover:border-green-400/60 transition-all group"
                        >
                          <span className="text-sm font-semibold text-green-200">Add to Outline</span>
                          <ArrowRight className="w-4 h-4 text-green-300 group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                    {/* Theme Explanation */}
                    <div className="mb-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-400/20">
                      <p className="text-xs uppercase tracking-widest text-cyan-300 mb-2">How This Theme Develops</p>
                      <p className="text-sm text-gray-200 leading-relaxed">{theme.explanation}</p>
                    </div>

                    {/* Canonical Movement */}
                    <div className="mb-4 flex items-center gap-2 flex-wrap">
                      <p className="text-xs uppercase tracking-widest text-cyan-300">Canonical Movement:</p>
                      <div className="flex items-center gap-1 text-xs text-gray-300">
                        {theme.canonicalMovement.split('→').map((era, idx, arr) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200">{era.trim()}</span>
                            {idx < arr.length - 1 && <ArrowRight className="w-3 h-3 text-cyan-400" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Theme Thread */}
                    <p className="text-xs uppercase tracking-widest cyber-muted mb-3">Theme Thread</p>
                    <div className="space-y-3">
                      {theme.verses.map((verse, index) => {
                        const isCurrent = isCurrentPassage(verse.reference)
                        return (
                          <button
                            key={`${verse.reference}-${index}`}
                            onClick={() => handleVerseClick(verse)}
                            className={`relative flex items-start gap-3 p-3 rounded-lg border transition-all w-full text-left cursor-pointer ${
                              isCurrent
                                ? 'bg-cyan-500/20 border-cyan-400/60 shadow-lg shadow-cyan-500/20'
                                : 'bg-black/40 border-white/5 hover:border-cyan-400/30 hover:bg-cyan-500/10'
                            }`}
                          >
                            {/* Position Indicator */}
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center text-xs font-semibold text-cyan-200 border border-cyan-400/40">
                              {index + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Reference and Stage */}
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <BookOpen className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                <span className="text-sm font-semibold text-cyan-300">{verse.reference}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStageColor(verse.stage)}`}>
                                  {getStageLabel(verse.stage)}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-300 border border-gray-400/40">
                                  {verse.era}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-100 border border-cyan-400/60 font-semibold">
                                    YOU ARE HERE
                                  </span>
                                )}
                              </div>

                              {/* Snippet */}
                              <p className="text-xs text-gray-300 leading-relaxed mb-2 italic">"{verse.snippet}"</p>

                              {/* Explanation */}
                              <p className="text-xs text-gray-400 leading-relaxed">{verse.explanation}</p>
                            </div>

                            {/* Connector Line */}
                            {index < theme.verses.length - 1 && (
                              <div className="absolute left-7 top-12 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400/40 to-transparent" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-gray-400 italic">
          Canonical themes trace how biblical ideas develop across Scripture, showing God's plan unfolding from foundation to fulfillment.
        </p>
      </div>

      {/* Verse Context Modal */}
      {selectedVerse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setSelectedVerse(null)}>
          <div className="relative w-[600px] max-w-[90vw] bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-cyan-400/30 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedVerse(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-cyan-300">{selectedVerse.reference}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStageColor(selectedVerse.stage)}`}>
                  {getStageLabel(selectedVerse.stage)}
                </span>
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-xs uppercase tracking-widest text-cyan-300 mb-2">Verse Text</p>
                {loadingVerse ? (
                  <p className="text-sm text-gray-400 italic">Loading...</p>
                ) : (
                  <p className="text-sm text-gray-200 leading-relaxed italic">"{verseText}"</p>
                )}
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-xs uppercase tracking-widest text-cyan-300 mb-2">Role in Theme</p>
                <p className="text-sm text-gray-300 leading-relaxed">{selectedVerse.explanation}</p>
              </div>

              <div className="border-t border-white/10 pt-4 flex gap-2">
                <button
                  onClick={() => openPassage(selectedVerse.reference)}
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/30 transition-colors text-sm font-semibold"
                >
                  Open Full Passage
                </button>
                <button
                  onClick={() => setSelectedVerse(null)}
                  className="px-4 py-2 rounded-lg bg-gray-500/20 border border-gray-400/40 text-gray-200 hover:bg-gray-500/30 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3D Constellation Modal */}
      {show3DModal && selected3DTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShow3DModal(false)}>
          <div className="relative w-[95vw] h-[90vh] bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-cyan-400/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-4 left-4 z-10 bg-black/80 px-4 py-2 rounded-lg border border-cyan-400/40">
              <h3 className="text-lg font-semibold text-cyan-300">Theme: {selected3DTheme}</h3>
              <p className="text-xs text-gray-400">Explore the canonical constellation</p>
            </div>
            <button
              onClick={() => setShow3DModal(false)}
              className="absolute top-4 right-4 z-10 px-4 py-2 rounded-lg bg-red-500/20 border border-red-400/40 text-red-200 hover:bg-red-500/30 transition-colors"
            >
              Close
            </button>
            <div className="w-full h-full p-4">
              <InteractiveCanonicalConstellation focusPassage={reference} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
