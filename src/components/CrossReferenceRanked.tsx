'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import axios from 'axios'

interface RankedCrossReference {
  reference: string
  category: 'direct_quotation' | 'explicit_fulfillment' | 'thematic_parallel' | 'typological_pattern' | 'general_thematic'
  relevanceScore: number
  explanation?: string
  text?: string
}

interface CrossReferenceRankedProps {
  verse: string
  token: string
  showTopOnly?: boolean
  topLimit?: number
}

export default function CrossReferenceRanked({ 
  verse, 
  token,
  showTopOnly = true,
  topLimit = 3
}: CrossReferenceRankedProps) {
  const [references, setReferences] = useState<RankedCrossReference[]>([])
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(!showTopOnly)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    if (verse) {
      fetchRankedReferences()
    }
  }, [verse])

  const fetchRankedReferences = async () => {
    setLoading(true)
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/scripture/cross-references-ranked`,
        {
          params: { verse },
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setReferences(response.data.references || [])
    } catch (error) {
      console.error('Failed to fetch ranked cross-references:', error)
    } finally {
      setLoading(false)
    }
  }

  const categoryLabels = {
    direct_quotation: { label: 'Direct Quote', color: 'bg-purple-500/20 text-purple-200 border-purple-400/40', priority: 1 },
    explicit_fulfillment: { label: 'Fulfillment', color: 'bg-blue-500/20 text-blue-200 border-blue-400/40', priority: 2 },
    thematic_parallel: { label: 'Thematic', color: 'bg-green-500/20 text-green-200 border-green-400/40', priority: 3 },
    typological_pattern: { label: 'Typology', color: 'bg-amber-500/20 text-amber-200 border-amber-400/40', priority: 4 },
    general_thematic: { label: 'Related', color: 'bg-gray-500/20 text-gray-200 border-gray-400/40', priority: 5 }
  }

  const filteredReferences = selectedCategory === 'all' 
    ? references 
    : references.filter(ref => ref.category === selectedCategory)

  const displayedReferences = showAll 
    ? filteredReferences 
    : filteredReferences.slice(0, topLimit)

  const categories = Array.from(new Set(references.map(r => r.category)))

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-400">Loading cross-references...</p>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full animate-[progress_loop_1.1s_linear_infinite] bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
        </div>
      </div>
    )
  }

  if (references.length === 0) {
    return <div className="text-sm text-gray-400">No cross-references found</div>
  }

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              selectedCategory === 'all'
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40'
                : 'bg-gray-500/10 text-gray-300 border-gray-400/20 hover:border-gray-400/40'
            }`}
          >
            All ({references.length})
          </button>
          {categories.map(cat => {
            const count = references.filter(r => r.category === cat).length
            const catInfo = categoryLabels[cat]
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  selectedCategory === cat
                    ? catInfo.color
                    : 'bg-gray-500/10 text-gray-300 border-gray-400/20 hover:border-gray-400/40'
                }`}
              >
                {catInfo.label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* References List */}
      <div className="space-y-2">
        {displayedReferences.map((ref, idx) => {
          const catInfo = categoryLabels[ref.category]
          return (
            <div 
              key={idx}
              className="border border-gray-700 rounded-lg p-3 bg-black/30 hover:bg-black/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-200">{ref.reference}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${catInfo.color}`}>
                    {catInfo.label}
                  </span>
                  {ref.relevanceScore && (
                    <span className="text-xs text-gray-400">
                      {Math.round(ref.relevanceScore * 100)}%
                    </span>
                  )}
                </div>
              </div>
              {ref.explanation && (
                <p className="text-xs text-gray-300 mb-2">{ref.explanation}</p>
              )}
              {ref.text && (
                <p className="text-xs text-gray-400 italic border-l-2 border-gray-600 pl-3">
                  {ref.text}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Show More/Less Toggle */}
      {filteredReferences.length > topLimit && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show Top {topLimit}
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show All {filteredReferences.length} References
            </>
          )}
        </button>
      )}
    </div>
  )
}
