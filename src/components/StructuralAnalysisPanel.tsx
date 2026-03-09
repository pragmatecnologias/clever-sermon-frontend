'use client'

import { useState, useEffect } from 'react'
import { Layers, ChevronDown, ChevronUp } from 'lucide-react'

interface StructureElement {
  verses: string
  type: string
  description: string
}

interface ChiasmElement {
  label: string
  verses: string
  content: string
}

interface Chiasm {
  pattern: string
  elements: ChiasmElement[]
}

interface StructuralAnalysis {
  passage: string
  literaryGenre: string
  structure: StructureElement[]
  chiasm?: Chiasm
  dataSource: string
}

interface StructuralAnalysisPanelProps {
  passage: string
  token: string
  cachedData?: StructuralAnalysis | null
}

export default function StructuralAnalysisPanel({ passage, token, cachedData }: StructuralAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<StructuralAnalysis | null>(cachedData || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showChiasm, setShowChiasm] = useState(false)

  useEffect(() => {
    if (cachedData) {
      setAnalysis(cachedData)
      return
    }
    if (passage) {
      fetchAnalysis()
    }
  }, [passage, cachedData])

  const fetchAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scripture/structural-analysis?passage=${encodeURIComponent(passage)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (response.ok) {
        const data = await response.json()
        if (data.dataSource === 'unavailable') {
          setError('Structural analysis not available for this passage')
          setAnalysis(null)
        } else {
          setAnalysis(data)
        }
      } else {
        setError('Unable to load structural analysis')
      }
    } catch (err) {
      setError('Failed to fetch structural analysis')
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'introduction':
        return 'bg-blue-500/20 text-blue-200 border-blue-400/40'
      case 'body':
      case 'main':
        return 'bg-purple-500/20 text-purple-200 border-purple-400/40'
      case 'conclusion':
        return 'bg-green-500/20 text-green-200 border-green-400/40'
      case 'transition':
        return 'bg-amber-500/20 text-amber-200 border-amber-400/40'
      default:
        return 'bg-gray-500/20 text-gray-200 border-gray-400/40'
    }
  }

  if (loading) {
    return (
      <div className="cyber-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h3 className="text-lg font-semibold">Structural Analysis</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse" />
            Analyzing passage structure...
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
          <Layers className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold">Structural Analysis</h3>
        </div>
        <div className="border border-amber-400/40 bg-amber-500/10 text-amber-100 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      </div>
    )
  }

  if (!analysis || !analysis.structure || !Array.isArray(analysis.structure)) {
    return (
      <div className="cyber-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold">Structural Analysis</h3>
        </div>
        <p className="text-sm text-gray-400">No structural analysis available.</p>
      </div>
    )
  }

  return (
    <div className="cyber-panel rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold">Structural Analysis</h3>
      </div>

      <div className="space-y-4">
        {/* Literary Genre */}
        <div className="border border-white/10 rounded-xl p-4 bg-black/30">
          <p className="text-xs uppercase tracking-widest cyber-muted mb-2">Literary Genre</p>
          <p className="text-sm font-semibold text-cyan-300">{analysis.literaryGenre}</p>
        </div>

        {/* Structure Elements */}
        <div>
          <p className="text-xs uppercase tracking-widest cyber-muted mb-3">Passage Structure</p>
          <div className="space-y-2">
            {analysis.structure.map((element, index) => (
              <div
                key={index}
                className="border border-white/10 rounded-xl p-4 bg-black/30 hover:border-cyan-400/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-cyan-300">Verses {element.verses}</span>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getTypeColor(element.type)}`}>
                    {element.type}
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{element.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chiasm (if available) */}
        {analysis.chiasm && (
          <div className="border border-white/10 rounded-xl bg-black/30">
            <button
              onClick={() => setShowChiasm(!showChiasm)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-purple-300">Chiastic Structure</span>
                <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/40">
                  {analysis.chiasm.pattern}
                </span>
              </div>
              {showChiasm ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {showChiasm && analysis.chiasm && Array.isArray(analysis.chiasm.elements) && (
              <div className="px-4 pb-4 space-y-2">
                <div className="border-t border-white/10 pt-3">
                  {analysis.chiasm.elements.map((element, index) => (
                    <div
                      key={index}
                      className="mb-2 p-3 rounded-lg bg-black/40 border border-purple-400/20"
                      style={{ marginLeft: `${Math.min(index, analysis.chiasm!.elements.length - 1 - index) * 12}px` }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-purple-300">{element.label}</span>
                        <span className="text-xs text-gray-400">({element.verses})</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{element.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Data Source */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-400">
            <span className="italic">Data source: {analysis.dataSource}</span>
            {' • '}
            Structural analysis reveals the literary design and flow of the passage.
          </p>
        </div>
      </div>
    </div>
  )
}
