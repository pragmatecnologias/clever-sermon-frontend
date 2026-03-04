'use client'

import { Quote, Zap, Link2, Layers, Circle } from 'lucide-react'

interface RankedCrossReferencesProps {
  references: {
    reference: string
    category: 'direct_quote' | 'explicit_fulfillment' | 'thematic_parallel' | 'typological' | 'general_thematic'
    relevanceScore: number
    explanation: string
    text?: string
  }[]
  onVerseClick?: (reference: string) => void
}

export default function RankedCrossReferences({ references, onVerseClick }: RankedCrossReferencesProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'direct_quote': return <Quote className="w-4 h-4" />
      case 'explicit_fulfillment': return <Zap className="w-4 h-4" />
      case 'thematic_parallel': return <Link2 className="w-4 h-4" />
      case 'typological': return <Layers className="w-4 h-4" />
      default: return <Circle className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'direct_quote': return 'border-green-400/40 bg-green-500/10 text-green-200'
      case 'explicit_fulfillment': return 'border-purple-400/40 bg-purple-500/10 text-purple-200'
      case 'thematic_parallel': return 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200'
      case 'typological': return 'border-amber-400/40 bg-amber-500/10 text-amber-200'
      default: return 'border-white/10 bg-white/5 text-gray-300'
    }
  }

  const getCategoryLabel = (category: string) => {
    return category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-300'
    if (score >= 70) return 'text-cyan-300'
    if (score >= 50) return 'text-amber-300'
    return 'text-gray-400'
  }

  // Group by category
  const grouped = references.reduce((acc, ref) => {
    if (!acc[ref.category]) acc[ref.category] = []
    acc[ref.category].push(ref)
    return acc
  }, {} as Record<string, typeof references>)

  const categoryOrder = ['direct_quote', 'explicit_fulfillment', 'thematic_parallel', 'typological', 'general_thematic']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-100">Ranked Cross References</h3>
        <p className="text-xs text-gray-400">{references.length} total</p>
      </div>

      {/* Top 3 Strongest */}
      <div className="border border-cyan-400/40 rounded-xl p-4 bg-gradient-to-br from-cyan-900/20 to-purple-900/20">
        <p className="text-xs uppercase tracking-widest text-cyan-200/60 mb-3">Top 3 Strongest</p>
        <div className="space-y-2">
          {references.slice(0, 3).map((ref, idx) => (
            <div key={idx} className="flex items-start gap-3 p-2 bg-black/30 rounded-lg">
              <div className={`mt-0.5 ${getScoreColor(ref.relevanceScore)}`}>
                {getCategoryIcon(ref.category)}
              </div>
              <div className="flex-1">
                {onVerseClick ? (
                  <button
                    onClick={() => onVerseClick(ref.reference)}
                    className="text-sm font-medium text-cyan-200 hover:text-cyan-100 underline decoration-dotted"
                  >
                    {ref.reference}
                  </button>
                ) : (
                  <p className="text-sm font-medium text-cyan-200">{ref.reference}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{ref.explanation}</p>
                {ref.text && (
                  <p className="text-xs text-gray-300 mt-2 italic">"{ref.text.slice(0, 100)}..."</p>
                )}
              </div>
              <span className={`text-xs font-semibold ${getScoreColor(ref.relevanceScore)}`}>
                {ref.relevanceScore}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* By Category */}
      <div className="space-y-3">
        {categoryOrder.map(category => {
          const refs = grouped[category]
          if (!refs || refs.length === 0) return null

          return (
            <div key={category} className={`border rounded-xl p-3 ${getCategoryColor(category)}`}>
              <div className="flex items-center gap-2 mb-2">
                {getCategoryIcon(category)}
                <p className="text-sm font-semibold">{getCategoryLabel(category)}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
                  {refs.length}
                </span>
              </div>
              
              <div className="space-y-1">
                {refs.slice(0, 5).map((ref, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    {onVerseClick ? (
                      <button
                        onClick={() => onVerseClick(ref.reference)}
                        className="hover:underline"
                      >
                        {ref.reference}
                      </button>
                    ) : (
                      <span>{ref.reference}</span>
                    )}
                    <span className="text-xs opacity-70">{ref.relevanceScore}</span>
                  </div>
                ))}
                {refs.length > 5 && (
                  <p className="text-xs opacity-70">+{refs.length - 5} more</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
