'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

interface EGWCitationModalProps {
  isOpen: boolean
  onClose: () => void
  citation: {
    book: string
    chapter: string
    paragraph: string
    reference?: string
    text: string
    page?: number
  }
}

export default function EGWCitationModal({ isOpen, onClose, citation }: EGWCitationModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl max-h-[85vh] bg-gradient-to-br from-slate-900 to-slate-800 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-amber-900/40 to-amber-800/40 border-b border-amber-500/30 px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-widest text-amber-400/80">Spirit of Prophecy</span>
                {citation.page && (
                  <>
                    <span className="text-amber-400/40">•</span>
                    <span className="text-xs text-amber-400/60">Page {citation.page}</span>
                  </>
                )}
              </div>
              <h3 className="text-xl font-semibold text-amber-100">
                {citation.book}
              </h3>
              <p className="text-sm text-amber-200/70 mt-1">
                Chapter {citation.chapter}
                {citation.reference ? ` • ${citation.reference}` : ''}
                {(() => {
                  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                    citation.paragraph,
                  )
                  return !citation.reference && !isUuid ? `, Paragraph ${citation.paragraph}` : ''
                })()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-amber-200" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-120px)] px-6 py-6">
          <div className="max-w-none space-y-4">
            {(() => {
              // Split text into sentences
              const sentences = citation.text.match(/[^.!?]+[.!?]+/g) || [citation.text];
              const paragraphs: string[][] = [];
              let currentParagraph: string[] = [];
              
              sentences.forEach((sentence, idx) => {
                currentParagraph.push(sentence.trim());
                
                // Create new paragraph every 3-4 sentences or at natural breaks
                if (
                  currentParagraph.length >= 3 && (
                    sentence.includes(';') || 
                    sentence.includes(':') ||
                    idx === sentences.length - 1 ||
                    currentParagraph.length >= 4
                  )
                ) {
                  paragraphs.push([...currentParagraph]);
                  currentParagraph = [];
                }
              });
              
              // Add any remaining sentences
              if (currentParagraph.length > 0) {
                paragraphs.push(currentParagraph);
              }
              
              return paragraphs.map((para, idx) => (
                <p 
                  key={idx} 
                  className="text-[17px] leading-[1.8] text-gray-200 indent-8 text-justify"
                  style={{ hyphens: 'auto' }}
                >
                  {para.join(' ')}
                </p>
              ));
            })()}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-t from-slate-900 to-transparent border-t border-amber-500/20 px-6 py-4">
          <div className="flex items-center justify-between text-xs text-amber-400/60">
            <span>Ellen G. White Estate</span>
            <span>Press ESC to close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
