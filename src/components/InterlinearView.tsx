'use client'

import { useState, useEffect } from 'react'
import { Book, Languages, ChevronDown, ChevronUp } from 'lucide-react'

interface InterlinearWord {
  english: string
  original: string
  transliteration: string
  strongs: string
  partOfSpeech: string
  gloss: string
}

interface InterlinearVerse {
  verseNumber: number
  reference: string
  words: InterlinearWord[]
}

interface HoverTooltipState {
  word: InterlinearWord
  x: number
  y: number
}

interface InterlinearViewProps {
  reference: string
  verses: Array<{ reference: string; text: string }>
  language?: 'en' | 'es'
  onWordClick?: (word: InterlinearWord) => void
}

export default function InterlinearView({ 
  reference, 
  verses, 
  language = 'en',
  onWordClick 
}: InterlinearViewProps) {
  const [interlinearData, setInterlinearData] = useState<InterlinearVerse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [hoveredWord, setHoveredWord] = useState<HoverTooltipState | null>(null)
  const [viewMode, setViewMode] = useState<'interlinear' | 'parallel'>('interlinear')

  // Determine if passage is OT (Hebrew) or NT (Greek)
  const isOldTestament = (ref: string): boolean => {
    const otBooks = [
      'genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy',
      'joshua', 'judges', 'ruth', '1 samuel', '2 samuel', '1 kings', '2 kings',
      '1 chronicles', '2 chronicles', 'ezra', 'nehemiah', 'esther',
      'job', 'psalms', 'psalm', 'proverbs', 'ecclesiastes', 'song of solomon',
      'isaiah', 'jeremiah', 'lamentations', 'ezekiel', 'daniel',
      'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah', 'nahum',
      'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi'
    ]
    const bookName = ref.toLowerCase().split(/\d/)[0].trim()
    return otBooks.some(book => bookName.includes(book))
  }

  const originalLanguage = isOldTestament(reference) ? 'Hebrew' : 'Greek'
  const targetLanguageLabel = language === 'es' ? 'Spanish' : 'English'

  useEffect(() => {
    if (!reference || !verses.length) return

    const fetchInterlinearData = async () => {
      setLoading(true)
      setError(null)

      try {
        // For now, generate mock interlinear data based on the verses
        // In production, this would call an API endpoint
        const mockData: InterlinearVerse[] = verses.map((verse, idx) => {
          const verseNum = extractVerseNumber(verse.reference, idx)
          const words = generateMockInterlinear(verse.text, originalLanguage === 'Hebrew')
          return {
            verseNumber: verseNum,
            reference: verse.reference,
            words
          }
        })
        
        setInterlinearData(mockData)
      } catch (err) {
        setError('Failed to load interlinear data')
        console.error('Interlinear fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInterlinearData()
  }, [reference, verses, originalLanguage])

  const extractVerseNumber = (ref: string, fallbackIdx: number): number => {
    const match = ref.match(/:(\d+)/)
    return match ? parseInt(match[1], 10) : fallbackIdx + 1
  }

  // Mock function to generate interlinear data - would be replaced with real API
  const generateMockInterlinear = (text: string, isHebrew: boolean): InterlinearWord[] => {
    const words = text.split(/\s+/).filter(w => w.length > 0)
    
    // Sample Greek/Hebrew words for demonstration
    const greekSamples = [
      { original: 'ἀγάπη', transliteration: 'agapē', strongs: 'G26', pos: 'Noun', gloss: 'love' },
      { original: 'θεός', transliteration: 'theos', strongs: 'G2316', pos: 'Noun', gloss: 'God' },
      { original: 'κόσμος', transliteration: 'kosmos', strongs: 'G2889', pos: 'Noun', gloss: 'world' },
      { original: 'πιστεύω', transliteration: 'pisteuō', strongs: 'G4100', pos: 'Verb', gloss: 'believe' },
      { original: 'ζωή', transliteration: 'zōē', strongs: 'G2222', pos: 'Noun', gloss: 'life' },
      { original: 'αἰώνιος', transliteration: 'aiōnios', strongs: 'G166', pos: 'Adj', gloss: 'eternal' },
      { original: 'υἱός', transliteration: 'huios', strongs: 'G5207', pos: 'Noun', gloss: 'son' },
      { original: 'δίδωμι', transliteration: 'didōmi', strongs: 'G1325', pos: 'Verb', gloss: 'give' },
    ]
    
    const hebrewSamples = [
      { original: 'אֱלֹהִים', transliteration: 'elohim', strongs: 'H430', pos: 'Noun', gloss: 'God' },
      { original: 'יְהוָה', transliteration: 'YHWH', strongs: 'H3068', pos: 'Noun', gloss: 'LORD' },
      { original: 'אָהַב', transliteration: 'ahav', strongs: 'H157', pos: 'Verb', gloss: 'love' },
      { original: 'שָׁלוֹם', transliteration: 'shalom', strongs: 'H7965', pos: 'Noun', gloss: 'peace' },
      { original: 'בָּרָא', transliteration: 'bara', strongs: 'H1254', pos: 'Verb', gloss: 'create' },
      { original: 'אֶרֶץ', transliteration: 'erets', strongs: 'H776', pos: 'Noun', gloss: 'earth' },
      { original: 'שָׁמַיִם', transliteration: 'shamayim', strongs: 'H8064', pos: 'Noun', gloss: 'heaven' },
      { original: 'דָּבָר', transliteration: 'davar', strongs: 'H1697', pos: 'Noun', gloss: 'word' },
    ]
    
    const samples = isHebrew ? hebrewSamples : greekSamples
    
    return words.slice(0, 12).map((word, idx) => {
      const sample = samples[idx % samples.length]
      return {
        english: word.replace(/[.,;:!?'"]/g, ''),
        original: sample.original,
        transliteration: sample.transliteration,
        strongs: sample.strongs,
        partOfSpeech: sample.pos,
        gloss: sample.gloss
      }
    })
  }

  const handleWordClick = (word: InterlinearWord) => {
    if (onWordClick) {
      onWordClick(word)
    }
  }

  const handleWordMouseEnter = (word: InterlinearWord, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect()
    setHoveredWord({
      word,
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
  }

  if (!verses.length) {
    return null
  }

  return (
    <div className="cyber-panel rounded-2xl overflow-visible">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <Languages className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-lg font-semibold">Interlinear View</h3>
            <p className="text-xs text-cyan-200/70">{originalLanguage} • {reference}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {expanded && (
            <div className="flex gap-1 mr-2">
              <button
                onClick={(e) => { e.stopPropagation(); setViewMode('interlinear'); }}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  viewMode === 'interlinear' 
                    ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-400/40' 
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                Interlinear
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setViewMode('parallel'); }}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  viewMode === 'parallel' 
                    ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-400/40' 
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                Parallel
              </button>
            </div>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4 pt-0 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          ) : error ? (
            <div className="text-center py-4 text-amber-300/80 text-sm">{error}</div>
          ) : viewMode === 'interlinear' ? (
            /* Interlinear View */
            <div className="space-y-6">
              {interlinearData.map((verse) => (
                <div key={verse.reference} className="space-y-2">
                  <div className="text-xs text-cyan-300/70 font-medium">
                    Verse {verse.verseNumber}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {verse.words.map((word, idx) => (
                      <div
                        key={`${verse.verseNumber}-${idx}`}
                        className="group relative flex flex-col items-center p-2 rounded-lg bg-white/5 hover:bg-cyan-500/10 cursor-pointer transition-colors border border-transparent hover:border-cyan-400/30"
                        onClick={() => handleWordClick(word)}
                        onMouseEnter={(event) => handleWordMouseEnter(word, event.currentTarget)}
                        onMouseLeave={() => setHoveredWord(null)}
                      >
                        {/* Original language */}
                        <span className={`text-lg font-medium ${
                          originalLanguage === 'Hebrew' ? 'font-hebrew' : 'font-greek'
                        } text-amber-200`}>
                          {word.original}
                        </span>
                        
                        {/* Transliteration */}
                        <span className="text-[10px] text-cyan-300/80 italic">
                          {word.transliteration}
                        </span>
                        
                        {/* English */}
                        <span className="text-sm text-gray-100 mt-1">
                          {word.english}
                        </span>
                        
                        {/* Strongs number */}
                        <span className="text-[9px] text-gray-500 mt-0.5">
                          {word.strongs}
                        </span>

                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Parallel View */
            <div className="space-y-4">
              {interlinearData.map((verse) => (
                <div key={verse.reference} className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-white/5">
                  <div>
                    <div className="text-xs text-amber-300/70 mb-2 font-medium">
                      {originalLanguage}
                    </div>
                    <p className={`text-lg leading-relaxed ${
                      originalLanguage === 'Hebrew' ? 'font-hebrew text-right' : 'font-greek'
                    } text-amber-200`}>
                      {verse.words.map(w => w.original).join(' ')}
                    </p>
                  </div>
                  <div>
                    <div className="text-xs text-cyan-300/70 mb-2 font-medium">
                      {targetLanguageLabel}
                    </div>
                    <p className="text-lg leading-relaxed text-gray-100">
                      {verse.words.map(w => w.english).join(' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 pt-4 border-t border-white/10 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-200/30"></div>
              <span>{originalLanguage}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-cyan-300/30"></div>
              <span>Transliteration</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-100/30"></div>
              <span>{targetLanguageLabel}</span>
            </div>
          </div>
        </div>
      )}

      {hoveredWord && (
        <div
          className="fixed z-[9999] w-56 p-3 rounded-lg bg-black/95 border border-cyan-400/40 shadow-xl pointer-events-none"
          style={{
            left: hoveredWord.x,
            top: hoveredWord.y - 10,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="text-xs space-y-1">
            <div className="flex justify-between gap-3">
              <span className="text-gray-400">Strong's:</span>
              <span className="text-cyan-300">{hoveredWord.word.strongs}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-400">Part of Speech:</span>
              <span className="text-gray-200">{hoveredWord.word.partOfSpeech}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-400">Gloss:</span>
              <span className="text-amber-200">{hoveredWord.word.gloss}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-white/10 text-center text-cyan-400/80">
              Click for full word study
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
