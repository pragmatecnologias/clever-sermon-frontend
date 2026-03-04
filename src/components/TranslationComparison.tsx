'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface TranslationComparisonProps {
  reference: string
  translations: string[]
  onLoad: (data: any) => void
}

export default function TranslationComparison({ reference, translations, onLoad }: TranslationComparisonProps) {
  const [highlightMode, setHighlightMode] = useState<'all' | 'verbs' | 'theological' | 'covenant'>('all')
  const [comparisonData, setComparisonData] = useState<any>(null)
  const [expanded, setExpanded] = useState(true)

  const getWordClass = (word: any, mode: string) => {
    const classes = ['inline-block', 'px-1', 'rounded']
    
    if (mode === 'all' || mode === 'verbs') {
      if (word.isVerb) classes.push('bg-blue-500/20', 'text-blue-200', 'border-b-2', 'border-blue-400')
    }
    
    if (mode === 'all' || mode === 'theological') {
      if (word.isTheologicalTerm) classes.push('bg-purple-500/20', 'text-purple-200', 'font-semibold')
    }
    
    if (mode === 'all' || mode === 'covenant') {
      if (word.isCovenantLanguage) classes.push('bg-amber-500/20', 'text-amber-200', 'underline', 'decoration-wavy')
    }
    
    return classes.join(' ')
  }

  if (!comparisonData) return null

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-black/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-100">Translation Comparison</h3>
          <div className="flex gap-2">
            {['all', 'verbs', 'theological', 'covenant'].map(mode => (
              <button
                key={mode}
                onClick={(e) => {
                  e.stopPropagation()
                  setHighlightMode(mode as any)
                }}
                className={`text-xs px-2 py-1 rounded-full ${
                  highlightMode === mode
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {comparisonData.map((verse: any) => (
            <div key={verse.reference} className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-cyan-200/60">{verse.reference}</p>
              
              {verse.translations.map((trans: any) => (
                <div key={trans.code} className="border-l-2 border-cyan-400/20 pl-3 py-2">
                  <p className="text-xs font-semibold text-cyan-300 mb-1">{trans.code}</p>
                  <p className="text-sm text-gray-100 leading-relaxed">
                    {trans.words.map((word: any, idx: number) => (
                      <span key={idx} className={getWordClass(word, highlightMode)}>
                        {word.word}{' '}
                      </span>
                    ))}
                  </p>
                </div>
              ))}

              {verse.differences.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs uppercase tracking-widest text-gray-400">Differences</p>
                  {verse.differences.map((diff: any, idx: number) => (
                    <p key={idx} className="text-xs text-gray-300">
                      • {diff.description}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="mt-4 p-3 bg-white/5 rounded-lg">
            <p className="text-xs text-gray-400">
              <span className="text-blue-200">■</span> Verbs &nbsp;
              <span className="text-purple-200">■</span> Theological Terms &nbsp;
              <span className="text-amber-200">■</span> Covenant Language
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
