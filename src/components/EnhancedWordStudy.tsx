'use client'

import { useState, useEffect } from 'react'
import { Book, TrendingUp, List, Info } from 'lucide-react'
import axios from 'axios'

interface MorphologyData {
  word: string
  lemma: string
  strongs: string
  parsing: {
    partOfSpeech: string
    tense?: string
    voice?: string
    mood?: string
    person?: string
    number?: string
    gender?: string
    case?: string
  }
  transliteration: string
  gloss: string
  verseReference: string
}

interface OccurrenceDistribution {
  totalOccurrences: number
  byBook: Array<{ book: string; count: number }>
  byTestament: { ot: number; nt: number }
}

interface ContextualExample {
  reference: string
  text: string
  usage: string
}

interface EnhancedWordStudyData {
  word: string
  language: 'greek' | 'hebrew'
  strongs: string
  lemma: string
  transliteration: string
  gloss: string
  morphology?: {
    partOfSpeech: string
    parsing: any
  }
  occurrenceDistribution?: OccurrenceDistribution
  contextualExamples?: ContextualExample[]
  semanticRange?: string[]
  dataSource: string
}

interface EnhancedWordStudyProps {
  strongs: string
  token: string
}

export default function EnhancedWordStudy({ strongs, token }: EnhancedWordStudyProps) {
  const [data, setData] = useState<EnhancedWordStudyData | null>(null)
  const [morphologyData, setMorphologyData] = useState<MorphologyData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (strongs) {
      fetchWordStudy()
    }
  }, [strongs])

  const fetchWordStudy = async () => {
    setLoading(true)
    setError(null)
    try {
      const [wordStudyRes, morphologyRes] = await Promise.allSettled([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scripture/word-study-enhanced`, {
          params: { strongs },
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scripture/morphology-data`, {
          params: { 
            word: strongs.replace(/[GH]/, ''),
            language: strongs.startsWith('G') ? 'greek' : 'hebrew'
          },
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (wordStudyRes.status === 'fulfilled') {
        setData(wordStudyRes.value.data)
      }
      if (morphologyRes.status === 'fulfilled') {
        setMorphologyData(morphologyRes.value.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch word study:', err)
      setError('Unable to load word study data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-400">Loading enhanced word study...</p>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full animate-[progress_loop_1.1s_linear_infinite] bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="text-sm text-red-400">{error}</div>
  }

  if (!data) {
    return <div className="text-sm text-gray-400">No word study data available</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-cyan-400/40 rounded-lg p-4 bg-cyan-500/10">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-cyan-200 mb-1">{data.lemma}</h3>
            <p className="text-sm text-gray-300 italic">{data.transliteration}</p>
          </div>
          <div className="text-right">
            <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/40">
              {data.strongs}
            </span>
          </div>
        </div>
        <p className="text-lg text-gray-200 mt-3">{data.gloss}</p>
      </div>

      {/* Morphology Section */}
      {morphologyData.length > 0 && (
        <div className="border border-purple-400/40 rounded-lg p-4 bg-purple-500/10">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-purple-400" />
            <h4 className="text-lg font-semibold text-purple-200">Morphology</h4>
          </div>
          <div className="space-y-3">
            {morphologyData.slice(0, 5).map((morph, idx) => (
              <div key={idx} className="border-l-2 border-purple-400/30 pl-3">
                <p className="text-xs text-purple-300 mb-1">{morph.verseReference}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-200">
                    {morph.parsing.partOfSpeech}
                  </span>
                  {morph.parsing.tense && (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-200">
                      {morph.parsing.tense}
                    </span>
                  )}
                  {morph.parsing.voice && (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-200">
                      {morph.parsing.voice}
                    </span>
                  )}
                  {morph.parsing.mood && (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-200">
                      {morph.parsing.mood}
                    </span>
                  )}
                  {morph.parsing.case && (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-200">
                      {morph.parsing.case}
                    </span>
                  )}
                  {morph.parsing.number && (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-200">
                      {morph.parsing.number}
                    </span>
                  )}
                  {morph.parsing.gender && (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-200">
                      {morph.parsing.gender}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Occurrence Distribution */}
      {data.occurrenceDistribution && (
        <div className="border border-blue-400/40 rounded-lg p-4 bg-blue-500/10">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h4 className="text-lg font-semibold text-blue-200">Occurrence Distribution</h4>
          </div>
          <div className="mb-4">
            <p className="text-sm text-gray-300">
              Total occurrences: <span className="font-bold text-blue-200">{data.occurrenceDistribution.totalOccurrences}</span>
            </p>
            <div className="flex gap-4 mt-2">
              <p className="text-sm text-gray-300">
                OT: <span className="font-semibold text-blue-200">{data.occurrenceDistribution.byTestament.ot}</span>
              </p>
              <p className="text-sm text-gray-300">
                NT: <span className="font-semibold text-blue-200">{data.occurrenceDistribution.byTestament.nt}</span>
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-blue-300 mb-2">Top Books</p>
            {data.occurrenceDistribution.byBook.slice(0, 10).map((book, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{book.book}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-blue-900/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-400"
                      style={{ 
                        width: `${(book.count / data.occurrenceDistribution!.totalOccurrences) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-xs text-blue-200 w-8 text-right">{book.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contextual Examples */}
      {data.contextualExamples && data.contextualExamples.length > 0 && (
        <div className="border border-green-400/40 rounded-lg p-4 bg-green-500/10">
          <div className="flex items-center gap-2 mb-3">
            <List className="w-5 h-5 text-green-400" />
            <h4 className="text-lg font-semibold text-green-200">Contextual Examples</h4>
          </div>
          <div className="space-y-3">
            {data.contextualExamples.slice(0, 5).map((example, idx) => (
              <div key={idx} className="border-l-2 border-green-400/30 pl-3">
                <p className="text-xs text-green-300 mb-1">{example.reference}</p>
                <p className="text-sm text-gray-300 italic mb-1">"{example.text}"</p>
                <p className="text-xs text-green-200">{example.usage}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Semantic Range */}
      {data.semanticRange && data.semanticRange.length > 0 && (
        <div className="border border-amber-400/40 rounded-lg p-4 bg-amber-500/10">
          <div className="flex items-center gap-2 mb-3">
            <Book className="w-5 h-5 text-amber-400" />
            <h4 className="text-lg font-semibold text-amber-200">Semantic Range</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.semanticRange.map((meaning, idx) => (
              <span 
                key={idx}
                className="text-sm px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40"
              >
                {meaning}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Data Source */}
      <div className="text-xs text-gray-500 italic">
        Data source: {data.dataSource}
      </div>
    </div>
  )
}
