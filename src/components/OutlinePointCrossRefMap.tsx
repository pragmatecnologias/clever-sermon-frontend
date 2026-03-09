'use client'

import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

interface PointMappingItem {
  pointId: string
  pointText: string
  suggestedReferences: Array<{
    reference: string
    category?: string
    tier?: string
    relevanceScore?: number
    connectionExplanation?: string
  }>
}

export default function OutlinePointCrossRefMap({
  verse,
  token,
  points,
}: {
  verse: string
  token: string
  points: Array<{ id?: string; text: string; supportingVerses?: string[] }>
}) {
  const [mappings, setMappings] = useState<PointMappingItem[]>([])
  const [loading, setLoading] = useState(false)

  const normalizedPoints = useMemo(
    () =>
      (Array.isArray(points) ? points : [])
        .map((point, index) => ({
          id: point?.id || `point-${index + 1}`,
          text: String(point?.text || '').trim(),
          supportingVerses: Array.isArray(point?.supportingVerses) ? point.supportingVerses : [],
        }))
        .filter((point) => point.text),
    [points],
  )

  useEffect(() => {
    if (!verse || !token || !normalizedPoints.length) {
      setMappings([])
      return
    }
    const fetchMap = async () => {
      setLoading(true)
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/scripture/cross-references-outline-map`,
          {
            verse,
            points: normalizedPoints,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
        setMappings(Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        console.error('Failed to fetch outline-point cross reference map:', error)
        setMappings([])
      } finally {
        setLoading(false)
      }
    }
    fetchMap()
  }, [verse, token, normalizedPoints])

  return (
    <div className="border border-emerald-400/30 rounded-xl p-4 bg-emerald-500/10">
      <p className="text-xs uppercase tracking-widest text-emerald-200/80">Outline Point Cross-Reference Map</p>
      {loading ? (
        <p className="text-sm text-gray-300 mt-2">Mapping cross references to outline points...</p>
      ) : mappings.length ? (
        <div className="mt-3 space-y-3">
          {mappings.map((item) => (
            <div key={item.pointId} className="border border-white/10 rounded-lg p-3 bg-black/20">
              <p className="text-sm font-medium text-emerald-100">{item.pointText}</p>
              {item.suggestedReferences?.length ? (
                <div className="mt-2 space-y-1">
                  {item.suggestedReferences.slice(0, 3).map((ref) => (
                    <div key={`${item.pointId}-${ref.reference}`} className="text-xs text-gray-200 flex items-center gap-2">
                      <span className="text-cyan-200">{ref.reference}</span>
                      {ref.tier ? <span className="text-[10px] px-1.5 py-0.5 rounded border border-gray-400/30">{ref.tier}</span> : null}
                      {ref.category ? <span className="text-[10px] px-1.5 py-0.5 rounded border border-gray-400/30">{ref.category}</span> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-300 mt-1">No suggestions for this point.</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-300 mt-2">No outline-point mapping available.</p>
      )}
    </div>
  )
}
