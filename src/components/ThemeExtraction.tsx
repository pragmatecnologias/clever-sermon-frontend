'use client'

import { TrendingUp, BookMarked, Crown, Church } from 'lucide-react'

interface ThemeExtractionProps {
  themes: {
    theme: string
    words: string[]
    frequency: number
    verses: string[]
    type: 'noun' | 'verb' | 'concept'
  }[]
  covenantThreads: {
    type: 'covenant' | 'kingdom' | 'sanctuary'
    references: {
      verse: string
      phrase: string
      significance: string
    }[]
  }[]
}

export default function ThemeExtraction({ themes, covenantThreads }: ThemeExtractionProps) {
  const getThreadIcon = (type: string) => {
    switch (type) {
      case 'covenant': return <BookMarked className="w-4 h-4" />
      case 'kingdom': return <Crown className="w-4 h-4" />
      case 'sanctuary': return <Church className="w-4 h-4" />
      default: return <TrendingUp className="w-4 h-4" />
    }
  }

  const getThreadColor = (type: string) => {
    switch (type) {
      case 'covenant': return 'border-amber-400/40 bg-amber-500/10 text-amber-200'
      case 'kingdom': return 'border-purple-400/40 bg-purple-500/10 text-purple-200'
      case 'sanctuary': return 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200'
      default: return 'border-white/10 bg-white/5 text-gray-200'
    }
  }

  return (
    <div className="space-y-4">
      {/* Key Themes */}
      <div className="border border-white/10 rounded-xl p-4 bg-black/30">
        <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          Key Themes (Non-LLM Analysis)
        </h3>
        
        <div className="grid md:grid-cols-2 gap-3">
          {themes.slice(0, 8).map((theme, idx) => (
            <div key={idx} className="border border-white/10 rounded-lg p-3 bg-black/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-cyan-200">{theme.theme}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200">
                  {theme.frequency}x
                </span>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {theme.words.map((word, wIdx) => (
                  <span key={wIdx} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200">
                    {word}
                  </span>
                ))}
              </div>
              
              <p className="text-xs text-gray-400">
                Found in: {theme.verses.slice(0, 3).join(', ')}
                {theme.verses.length > 3 && ` +${theme.verses.length - 3} more`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Covenant Threads */}
      {covenantThreads.length > 0 && (
        <div className="border border-white/10 rounded-xl p-4 bg-black/30">
          <h3 className="text-sm font-semibold text-gray-100 mb-3">Theological Threads</h3>
          
          <div className="space-y-3">
            {covenantThreads.map((thread, idx) => (
              <div key={idx} className={`border rounded-lg p-3 ${getThreadColor(thread.type)}`}>
                <div className="flex items-center gap-2 mb-2">
                  {getThreadIcon(thread.type)}
                  <p className="text-sm font-semibold capitalize">{thread.type} Language</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
                    {thread.references.length} references
                  </span>
                </div>
                
                <div className="space-y-2">
                  {thread.references.slice(0, 3).map((ref, rIdx) => (
                    <div key={rIdx} className="text-xs">
                      <p className="font-medium">{ref.verse}</p>
                      <p className="text-gray-300 italic">"{ref.phrase}"</p>
                      <p className="text-gray-400 mt-1">{ref.significance}</p>
                    </div>
                  ))}
                  {thread.references.length > 3 && (
                    <p className="text-xs text-gray-400">
                      +{thread.references.length - 3} more references
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
