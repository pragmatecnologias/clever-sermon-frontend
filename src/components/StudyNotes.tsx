'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, BookOpen, Info } from 'lucide-react'

interface StudyNote {
  id: string
  type: string
  text: string
  verseReference: string
  category: string
}

interface StudyNotesProps {
  notes: StudyNote[]
  onVerseClick?: (reference: string) => void
}

export default function StudyNotes({ notes, onVerseClick }: StudyNotesProps) {
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

  const toggleNote = (noteId: string) => {
    const newExpanded = new Set(expandedNotes)
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId)
    } else {
      newExpanded.add(noteId)
    }
    setExpandedNotes(newExpanded)
  }

  const getNoteIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'study':
        return <BookOpen className="w-4 h-4" />
      case 'cross-reference':
        return <Info className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'theological':
        return 'text-purple-300 border-purple-400/40'
      case 'historical':
        return 'text-amber-300 border-amber-400/40'
      case 'cultural':
        return 'text-green-300 border-green-400/40'
      default:
        return 'text-cyan-300 border-cyan-400/40'
    }
  }

  if (!notes || notes.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-gray-100">Study Notes ({notes.length})</h3>
      </div>

      <div className="space-y-2">
        {notes.map((note) => {
          const isExpanded = expandedNotes.has(note.id)
          const colorClass = getCategoryColor(note.category)

          return (
            <div
              key={note.id}
              className={`border rounded-xl overflow-hidden transition-all ${colorClass} bg-black/30`}
            >
              {/* Header */}
              <button
                onClick={() => toggleNote(note.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-cyan-300">
                    {getNoteIcon(note.type)}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      {onVerseClick ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onVerseClick(note.verseReference)
                          }}
                          className="text-sm font-medium text-cyan-200 hover:text-cyan-100 underline decoration-dotted"
                        >
                          {note.verseReference}
                        </button>
                      ) : (
                        <span className="text-sm font-medium text-cyan-200">
                          {note.verseReference}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                        {note.category}
                      </span>
                    </div>
                    {!isExpanded && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                        {note.text}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-gray-400">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/10">
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="uppercase tracking-wider">{note.type}</span>
                    </div>
                    <p className="text-sm text-gray-100 leading-relaxed">
                      {note.text}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
