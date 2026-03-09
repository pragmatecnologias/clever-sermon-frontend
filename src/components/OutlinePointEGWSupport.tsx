'use client'

import { useState, useEffect } from 'react'
import { Book, ChevronDown, ChevronUp } from 'lucide-react'

interface EGWQuote {
  reference: string
  bookTitle: string
  text: string
  preview: string
}

interface OutlinePointEGWSupportProps {
  point: string
  supportingVerses?: string[]
}

export default function OutlinePointEGWSupport({ point, supportingVerses }: OutlinePointEGWSupportProps) {
  const [egwQuotes, setEgwQuotes] = useState<EGWQuote[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showFullQuotes, setShowFullQuotes] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (supportingVerses && supportingVerses.length > 0) {
      fetchEGWSupport()
    }
  }, [supportingVerses])

  const fetchEGWSupport = async () => {
    if (!supportingVerses || supportingVerses.length === 0) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const primaryVerse = supportingVerses[0]
      
      // Parse verse reference
      const parts = primaryVerse.split(' ')
      const book = parts[0]
      const chapterVerse = parts[1]?.split(':')
      const chapter = chapterVerse?.[0]
      const verse = chapterVerse?.[1]?.split('-')[0]

      if (!book || !chapter) {
        setLoading(false)
        return
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/egw/passage-panel?book=${encodeURIComponent(book)}&chapter=${chapter}${verse ? `&verseStart=${verse}` : ''}&limit=3`
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setEgwQuotes(data.insights || [])
      }
    } catch (error) {
      console.error('Failed to fetch EGW support:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleQuote = (reference: string) => {
    const newSet = new Set(showFullQuotes)
    if (newSet.has(reference)) {
      newSet.delete(reference)
    } else {
      newSet.add(reference)
    }
    setShowFullQuotes(newSet)
  }

  if (!egwQuotes.length && !loading) return null

  return (
    <div className="ml-6 mt-2 border-l-2 border-blue-400/30 pl-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-blue-300 hover:text-blue-200 transition-colors"
      >
        <Book className="w-3 h-3" />
        <span>Spirit of Prophecy Support ({egwQuotes.length})</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {loading ? (
            <p className="text-xs text-gray-400 italic">Loading EGW references...</p>
          ) : (
            egwQuotes.map((quote) => (
              <div
                key={quote.reference}
                className="bg-gray-800/30 rounded-lg p-2 border border-gray-700/50"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-300">
                      {quote.bookTitle}
                    </p>
                    <p className="text-xs text-gray-400">{quote.reference}</p>
                  </div>
                </div>
                
                <p className="text-xs text-gray-300 leading-relaxed">
                  {showFullQuotes.has(quote.reference) ? quote.text : quote.preview}
                </p>
                
                {quote.text !== quote.preview && (
                  <button
                    onClick={() => toggleQuote(quote.reference)}
                    className="mt-1 text-xs text-blue-400 hover:text-blue-300"
                  >
                    {showFullQuotes.has(quote.reference) ? 'Show Less' : 'Read Full Quote'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
