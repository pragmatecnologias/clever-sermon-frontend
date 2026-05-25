'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, BookOpen, Lightbulb, MapPin, ChevronDown, ChevronUp } from 'lucide-react'

interface CommentaryNote {
  type: 'context' | 'word' | 'historical' | 'theological' | 'egw'
  content: string
  source: string
}

interface VerseCommentary {
  verseReference: string
  notes: CommentaryNote[]
  dataSource: 'egw' | 'llm-generated' | 'unavailable'
}

interface VerseCommentaryPanelProps {
  reference: string
  token: string
  language?: string
  cachedData?: VerseCommentary | null
  onDataLoad?: (data: VerseCommentary) => void
}

export default function VerseCommentaryPanel({ reference, token, language = 'en', cachedData, onDataLoad }: VerseCommentaryPanelProps) {
  const [commentary, setCommentary] = useState<VerseCommentary | null>(cachedData || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (cachedData) {
      setCommentary(cachedData)
      if (cachedData.notes?.length) {
        setExpandedSections(Object.fromEntries(cachedData.notes.map((_, index) => [index, true])))
      }
      return
    }
    if (reference) {
      fetchCommentary()
    }
  }, [reference, language, cachedData])

  const fetchCommentary = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/scripture/verse-commentary?reference=${encodeURIComponent(reference)}&force=true&language=${encodeURIComponent(language)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }
      )
      if (response.ok) {
        const data: VerseCommentary = await response.json()
        setCommentary(data)
        if (data.notes?.length) {
          setExpandedSections(Object.fromEntries(data.notes.map((_, index) => [index, true])))
        }
        onDataLoad?.(data)
      } else if (response.status === 304 && commentary?.notes?.length) {
        onDataLoad?.(commentary)
      } else {
        setError('Commentary not available for this verse')
      }
    } catch (err) {
      setError('Failed to fetch verse commentary')
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'context':
        return <MapPin className="w-4 h-4 text-blue-400" />
      case 'word':
        return <BookOpen className="w-4 h-4 text-purple-400" />
      case 'historical':
        return <MessageSquare className="w-4 h-4 text-amber-400" />
      case 'theological':
        return <Lightbulb className="w-4 h-4 text-green-400" />
      case 'egw':
        return <BookOpen className="w-4 h-4 text-cyan-400" />
      default:
        return <MessageSquare className="w-4 h-4 text-gray-400" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'context':
        return 'Context'
      case 'word':
        return 'Word Study'
      case 'historical':
        return 'Historical'
      case 'theological':
        return 'Theological'
      case 'egw':
        return 'EGW Commentary'
      default:
        return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'context':
        return 'bg-blue-500/20 text-blue-200 border-blue-400/40'
      case 'word':
        return 'bg-purple-500/20 text-purple-200 border-purple-400/40'
      case 'historical':
        return 'bg-amber-500/20 text-amber-200 border-amber-400/40'
      case 'theological':
        return 'bg-green-500/20 text-green-200 border-green-400/40'
      case 'egw':
        return 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40'
      default:
        return 'bg-gray-500/20 text-gray-200 border-gray-400/40'
    }
  }

  const toggleSection = (index: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const formatContent = (content: string) => {
    // First try to split by explicit paragraph markers
    if (content.includes('\n\n')) {
      const paragraphs = content.split('\n\n').filter(p => p.trim())
      return paragraphs.map((paragraph, idx) => (
        <p key={idx} className="mb-3 last:mb-0 leading-relaxed">
          {paragraph.trim()}
        </p>
      ))
    }
    
    // If no paragraph markers, intelligently split long text into readable chunks
    // Split into sentences first
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content]
    
    // Group sentences into paragraphs (3-4 sentences per paragraph)
    const paragraphs: string[] = []
    let currentParagraph: string[] = []
    
    sentences.forEach((sentence, idx) => {
      currentParagraph.push(sentence.trim())
      
      // Create a new paragraph every 3-4 sentences, or at the end
      if (currentParagraph.length >= 3 || idx === sentences.length - 1) {
        paragraphs.push(currentParagraph.join(' '))
        currentParagraph = []
      }
    })
    
    // If we still have a very long single paragraph (>500 chars), split it further
    const finalParagraphs = paragraphs.flatMap(p => {
      if (p.length > 500) {
        // Split at sentence boundaries every ~300 chars
        const parts: string[] = []
        const sentencesInPara = p.match(/[^.!?]+[.!?]+/g) || [p]
        let chunk = ''
        
        sentencesInPara.forEach(s => {
          if (chunk.length + s.length > 300 && chunk.length > 0) {
            parts.push(chunk.trim())
            chunk = s
          } else {
            chunk += (chunk ? ' ' : '') + s
          }
        })
        
        if (chunk) parts.push(chunk.trim())
        return parts
      }
      return [p]
    })
    
    return finalParagraphs.filter(p => p.trim()).map((paragraph, idx) => (
      <p key={idx} className="mb-3 last:mb-0 leading-relaxed">
        {paragraph.trim()}
      </p>
    ))
  }

  if (loading) {
    return (
      <div className="cyber-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold">Verse Commentary</h3>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-gray-400">Loading commentary...</p>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full animate-[progress_1s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="cyber-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold">Verse Commentary</h3>
        </div>
        <div className="border border-amber-400/40 bg-amber-500/10 text-amber-100 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      </div>
    )
  }

  if (!commentary || !commentary.notes || commentary.notes.length === 0) {
    return (
      <div className="cyber-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold">Verse Commentary</h3>
        </div>
        <p className="text-sm text-gray-400">
          No commentary available for this passage.
        </p>
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-400 italic">
            Verse commentary provides focused insights on context, key words, historical background, and theological significance for individual verses.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="cyber-panel rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4 flex-wrap pr-24">
        <MessageSquare className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold">Verse Commentary</h3>
        {commentary.dataSource === 'egw' && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/40">
            EGW Insights
          </span>
        )}
        {commentary.dataSource === 'llm-generated' && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/40">
            AI-Generated
          </span>
        )}
        <span className="w-full sm:w-auto sm:ml-auto text-xs text-gray-400">{commentary.verseReference}</span>
      </div>

      <div className="space-y-3">
        {commentary.notes.map((note, index) => {
          const isExpanded = expandedSections[index] ?? false // Default to collapsed
          
          return (
            <div
              key={index}
              className="border border-white/10 rounded-xl bg-black/30 hover:border-cyan-400/30 transition-colors overflow-hidden"
            >
              {/* Collapsible Header */}
              <button
                onClick={() => toggleSection(index)}
                className="w-full flex items-center gap-2 p-4 hover:bg-white/5 transition-colors"
              >
                {getTypeIcon(note.type)}
                <span className={`text-xs px-2 py-1 rounded-full border ${getTypeColor(note.type)}`}>
                  {getTypeLabel(note.type)}
                </span>
                <span className="ml-auto text-xs text-gray-400 mr-2">{note.source}</span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-white/10">
                  <div className="text-sm text-gray-300">
                    {formatContent(note.content)}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-gray-400 italic">
          Micro-commentary provides focused insights on context, key words, historical background, and theological significance.
        </p>
      </div>
    </div>
  )
}
