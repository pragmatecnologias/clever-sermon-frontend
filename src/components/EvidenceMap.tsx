'use client'

import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'

interface EvidenceMapProps {
  evidencePoints: {
    sermonPoint: string
    supportingVerses: {
      reference: string
      text: string
      containsConcept: boolean
      supportingPhrases: string[]
      relevanceScore: number
      notes: string
    }[]
    integrityScore: number
    warnings: string[]
  }[]
}

export default function EvidenceMap({ evidencePoints }: EvidenceMapProps) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-300 border-green-400/40'
    if (score >= 50) return 'text-amber-300 border-amber-400/40'
    return 'text-red-300 border-red-400/40'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 75) return <CheckCircle className="w-4 h-4 text-green-400" />
    if (score >= 50) return <AlertCircle className="w-4 h-4 text-amber-400" />
    return <XCircle className="w-4 h-4 text-red-400" />
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
        <span>Sermon Evidence Map</span>
        <span className="text-xs text-gray-400">(Scriptural Integrity Check)</span>
      </h3>

      {evidencePoints.map((point, idx) => (
        <div key={idx} className="border border-white/10 rounded-xl p-4 bg-black/30">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-100">{point.sermonPoint}</p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getScoreColor(point.integrityScore)}`}>
              {getScoreIcon(point.integrityScore)}
              <span className="text-xs font-semibold">{point.integrityScore}%</span>
            </div>
          </div>

          {point.warnings.length > 0 && (
            <div className="mb-3 p-2 bg-amber-500/10 border border-amber-400/40 rounded-lg">
              {point.warnings.map((warning, wIdx) => (
                <p key={wIdx} className="text-xs text-amber-200">⚠️ {warning}</p>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-gray-400">Supporting Verses</p>
            {point.supportingVerses.length > 0 ? (
              point.supportingVerses.map((verse, vIdx) => (
                <div key={vIdx} className="border-l-2 border-cyan-400/20 pl-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-cyan-300">{verse.reference}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{verse.notes}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200">
                        {verse.relevanceScore}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 mb-1">{verse.text}</p>
                  {verse.supportingPhrases.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {verse.supportingPhrases.map((phrase, pIdx) => (
                        <span key={pIdx} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200">
                          "{phrase}"
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No direct scriptural support found</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
