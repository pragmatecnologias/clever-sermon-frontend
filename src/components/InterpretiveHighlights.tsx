'use client'

import { useState } from 'react'
import { AlertTriangle, BookOpen, FileText, Layers } from 'lucide-react'

interface InterpretiveHighlightsProps {
  verseText: string
  highlights: {
    phrase: string
    startIndex: number
    endIndex: number
    type: 'grammatical_ambiguity' | 'theological_debate' | 'textual_variant' | 'contextual_tension'
    options: {
      view: string
      explanation: string
      proponents: string[]
    }[]
    significance: string
  }[]
}

export default function InterpretiveHighlights({ verseText, highlights }: InterpretiveHighlightsProps) {
  const [selectedHighlight, setSelectedHighlight] = useState<number | null>(null)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'grammatical_ambiguity': return <BookOpen className="w-3 h-3" />
      case 'theological_debate': return <AlertTriangle className="w-3 h-3" />
      case 'textual_variant': return <FileText className="w-3 h-3" />
      case 'contextual_tension': return <Layers className="w-3 h-3" />
      default: return <AlertTriangle className="w-3 h-3" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'grammatical_ambiguity': return 'bg-blue-500/20 text-blue-200 border-blue-400/40'
      case 'theological_debate': return 'bg-purple-500/20 text-purple-200 border-purple-400/40'
      case 'textual_variant': return 'bg-amber-500/20 text-amber-200 border-amber-400/40'
      case 'contextual_tension': return 'bg-red-500/20 text-red-200 border-red-400/40'
      default: return 'bg-white/10 text-gray-300 border-white/20'
    }
  }

  const getTypeLabel = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  // Build highlighted text segments
  const buildSegments = () => {
    const segments: any[] = []
    let currentIndex = 0

    // Sort highlights by start index
    const sorted = [...highlights].sort((a, b) => a.startIndex - b.startIndex)

    sorted.forEach((highlight, idx) => {
      // Add text before highlight
      if (currentIndex < highlight.startIndex) {
        segments.push({
          text: verseText.substring(currentIndex, highlight.startIndex),
          highlighted: false
        })
      }

      // Add highlighted text
      segments.push({
        text: highlight.phrase,
        highlighted: true,
        highlightIndex: idx,
        type: highlight.type
      })

      currentIndex = highlight.endIndex
    })

    // Add remaining text
    if (currentIndex < verseText.length) {
      segments.push({
        text: verseText.substring(currentIndex),
        highlighted: false
      })
    }

    return segments
  }

  const segments = buildSegments()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-gray-100">Interpretive Challenges</h3>
        <span className="text-xs text-gray-400">({highlights.length} identified)</span>
      </div>

      {/* Highlighted Text */}
      <div className="border border-white/10 rounded-xl p-4 bg-black/30">
        <p className="text-sm leading-relaxed">
          {segments.map((segment, idx) => (
            segment.highlighted ? (
              <span
                key={idx}
                onClick={() => setSelectedHighlight(segment.highlightIndex)}
                className={`cursor-pointer border-b-2 ${getTypeColor(segment.type)} px-1 hover:opacity-80 transition-opacity`}
                title="Click for details"
              >
                {segment.text}
              </span>
            ) : (
              <span key={idx} className="text-gray-100">{segment.text}</span>
            )
          ))}
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/40">
          <BookOpen className="w-3 h-3" /> Grammatical
        </span>
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/40">
          <AlertTriangle className="w-3 h-3" /> Theological
        </span>
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40">
          <FileText className="w-3 h-3" /> Textual Variant
        </span>
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-200 border border-red-400/40">
          <Layers className="w-3 h-3" /> Contextual
        </span>
      </div>

      {/* Selected Highlight Details */}
      {selectedHighlight !== null && highlights[selectedHighlight] && (
        <div className={`border rounded-xl p-4 ${getTypeColor(highlights[selectedHighlight].type)}`}>
          <div className="flex items-center gap-2 mb-3">
            {getTypeIcon(highlights[selectedHighlight].type)}
            <p className="text-sm font-semibold">{getTypeLabel(highlights[selectedHighlight].type)}</p>
          </div>

          <p className="text-sm mb-3">"{highlights[selectedHighlight].phrase}"</p>
          
          <p className="text-xs text-gray-300 mb-3">{highlights[selectedHighlight].significance}</p>

          {highlights[selectedHighlight].options.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest opacity-70">Interpretive Options</p>
              {highlights[selectedHighlight].options.map((option, idx) => (
                <div key={idx} className="p-2 bg-black/30 rounded-lg">
                  <p className="text-sm font-medium mb-1">{option.view}</p>
                  <p className="text-xs text-gray-300 mb-1">{option.explanation}</p>
                  {option.proponents.length > 0 && (
                    <p className="text-xs opacity-70">
                      Proponents: {option.proponents.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setSelectedHighlight(null)}
            className="mt-3 text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
