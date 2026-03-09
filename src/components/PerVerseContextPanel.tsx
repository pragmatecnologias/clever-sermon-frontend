'use client'

import { useState, useEffect } from 'react'
import { MapPin, Clock, Users, Book } from 'lucide-react'
import axios from 'axios'

interface HistoricalNote {
  note: string
  period: string
  source?: string
}

interface CulturalNote {
  note: string
  category: 'social' | 'religious' | 'economic' | 'political'
}

interface GeographicalInfo {
  place: string
  description: string
  significance: string
  modernLocation?: string
}

interface VerseContextData {
  reference: string
  historical: HistoricalNote[]
  cultural: CulturalNote[]
  geographical: GeographicalInfo[]
  dataSource: string
}

interface PerVerseContextPanelProps {
  reference: string
  token: string
  language?: string
  cachedData?: VerseContextData | null
}

export default function PerVerseContextPanel({ reference, token, language = 'en', cachedData }: PerVerseContextPanelProps) {
  const [data, setData] = useState<VerseContextData | null>(cachedData || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cachedData) {
      setData(cachedData)
      return
    }
    if (reference) {
      fetchContext()
    }
  }, [reference, language, cachedData])

  const fetchContext = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/scripture/verse-context`,
        {
          params: { reference, language },
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setData(response.data)
    } catch (err) {
      console.error('Failed to fetch verse context:', err)
      setError('Unable to load verse context')
    } finally {
      setLoading(false)
    }
  }

  const categoryColors = {
    social: 'bg-blue-500/20 text-blue-200 border-blue-400/40',
    religious: 'bg-purple-500/20 text-purple-200 border-purple-400/40',
    economic: 'bg-green-500/20 text-green-200 border-green-400/40',
    political: 'bg-red-500/20 text-red-200 border-red-400/40'
  }

  if (loading) {
    return (
      <div className="cyber-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold">Historical Context</h3>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-gray-400">Loading historical context...</p>
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
          <Clock className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold">Historical Context</h3>
        </div>
        <div className="border border-amber-400/40 bg-amber-500/10 text-amber-100 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      </div>
    )
  }

  if (!data || !data.reference) {
    return (
      <div className="cyber-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Book className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold">Per-Verse Context</h3>
        </div>
        <p className="text-sm text-gray-400">No context data available.</p>
      </div>
    )
  }

  return (
    <div className="cyber-panel rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 pr-24">
        <Clock className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold">Historical Context</h3>
      </div>

      {/* Reference Header */}
      <div>
        <h4 className="text-lg font-semibold text-cyan-200">{data.reference}</h4>
        <p className="text-xs text-gray-400 mt-1">Historical, Cultural & Geographical Context</p>
      </div>

      {/* Historical Context */}
      {data.historical && Array.isArray(data.historical) && data.historical.length > 0 && (
        <div className="border border-amber-400/40 rounded-lg p-4 bg-amber-500/10">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-amber-400" />
            <h5 className="text-md font-semibold text-amber-200">Historical Context</h5>
          </div>
          <div className="space-y-3">
            {data.historical.map((note, idx) => (
              <div key={idx} className="border-l-2 border-amber-400/30 pl-3">
                <p className="text-sm text-gray-200 mb-1">{note.note}</p>
                <div className="flex items-center gap-2 text-xs text-amber-300">
                  <span>{note.period}</span>
                  {note.source && (
                    <>
                      <span className="text-amber-400/40">•</span>
                      <span className="italic">{note.source}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cultural Context */}
      {data.cultural && Array.isArray(data.cultural) && data.cultural.length > 0 && (
        <div className="border border-purple-400/40 rounded-lg p-4 bg-purple-500/10">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-purple-400" />
            <h5 className="text-md font-semibold text-purple-200">Cultural Context</h5>
          </div>
          <div className="space-y-3">
            {data.cultural.map((note, idx) => (
              <div key={idx} className="border-l-2 border-purple-400/30 pl-3">
                <p className="text-sm text-gray-200 mb-2">{note.note}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[note.category]}`}>
                  {note.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Geographical Context */}
      {data.geographical && Array.isArray(data.geographical) && data.geographical.length > 0 && (
        <div className="border border-green-400/40 rounded-lg p-4 bg-green-500/10">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-green-400" />
            <h5 className="text-md font-semibold text-green-200">Geographical Context</h5>
          </div>
          <div className="space-y-4">
            {data.geographical.map((place, idx) => (
              <div key={idx} className="border-l-2 border-green-400/30 pl-3">
                <h6 className="text-sm font-semibold text-green-200 mb-1">{place.place}</h6>
                <p className="text-sm text-gray-200 mb-2">{place.description}</p>
                <p className="text-sm text-green-300 mb-2">
                  <strong>Significance:</strong> {place.significance}
                </p>
                {place.modernLocation && (
                  <p className="text-xs text-gray-400 italic">
                    Modern location: {place.modernLocation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Source */}
      {data.dataSource && data.dataSource !== 'unavailable' && (
        <div className="text-xs text-gray-500 italic text-center">
          Data source: {data.dataSource}
        </div>
      )}
    </div>
  )
}
