'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'

interface SOPReference {
  reference: string
  category?: string
  tier?: string
  connectionExplanation?: string
  relevanceScore?: number
  text?: string
  scriptureReference?: string
  bookTitle?: string
  chapterTitle?: string
  rankingReason?: string
}

export default function CrossReferenceSOPPanel({
  verse,
  token,
  language = 'en',
}: {
  verse: string
  token: string
  language?: string
}) {
  const [items, setItems] = useState<SOPReference[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!verse || !token) return
    const fetchItems = async () => {
      setLoading(true)
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/scripture/cross-references-sop-linked`,
          {
            params: { verse, language },
            headers: { Authorization: `Bearer ${token}` },
          },
        )
        setItems(Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        console.error('Failed to fetch SOP linked references:', error)
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [verse, token, language])

  return (
    <div className="border border-blue-400/30 rounded-xl p-4 bg-blue-500/10">
      <p className="text-xs uppercase tracking-widest text-blue-200/80">Spirit of Prophecy Linked References</p>
      {loading ? (
        <p className="text-sm text-gray-300 mt-2">Loading linked SOP references...</p>
      ) : items.length ? (
        <div className="mt-3 space-y-2">
          {items.slice(0, 6).map((item, index) => (
            <div key={`${item.reference}-${index}`} className="border border-white/10 rounded-lg px-3 py-2 bg-black/20">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-blue-100">{item.reference}</p>
                <div className="flex items-center gap-2">
                  {item.category ? (
                    <span className="text-[10px] px-2 py-1 rounded-full border border-blue-300/40 text-blue-100 uppercase">
                      {item.category.replace(/_/g, ' ')}
                    </span>
                  ) : null}
                  {item.tier ? (
                    <span className="text-[10px] px-2 py-1 rounded-full border border-emerald-300/40 text-emerald-100 uppercase">
                      {item.tier}
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-gray-200/90 mt-1">
                {item.connectionExplanation || 'Linked Spirit of Prophecy reference for this passage.'}
              </p>
              {item.scriptureReference ? (
                <p className="text-[11px] text-cyan-200/80 mt-1">
                  Related Scripture: {item.scriptureReference}
                </p>
              ) : null}
              {item.text ? (
                <p className="text-xs text-gray-300/90 border-l-2 border-blue-300/40 pl-2 mt-2 line-clamp-3 italic">
                  {item.text}
                </p>
              ) : null}
              {(item.bookTitle || item.chapterTitle || item.rankingReason) ? (
                <p className="text-[11px] text-gray-400 mt-2">
                  {[item.bookTitle, item.chapterTitle, item.rankingReason?.replace(/_/g, ' ')].filter(Boolean).join(' • ')}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-300 mt-2">No linked SOP references available for this passage.</p>
      )}
    </div>
  )
}
