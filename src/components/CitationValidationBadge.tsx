'use client'

import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

interface CitationValidationBadgeProps {
  supportLevel: 'supported' | 'weak' | 'unsupported' | 'pending'
  verseReference?: string
  matchScore?: number
  explanation?: string
  compact?: boolean
}

export default function CitationValidationBadge({
  supportLevel,
  verseReference,
  matchScore,
  explanation,
  compact = false
}: CitationValidationBadgeProps) {
  const badges = {
    supported: {
      icon: CheckCircle,
      label: 'Supported',
      color: 'bg-green-500/20 text-green-200 border-green-400/40',
      iconColor: 'text-green-400'
    },
    weak: {
      icon: AlertTriangle,
      label: 'Weak Support',
      color: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/40',
      iconColor: 'text-yellow-400'
    },
    unsupported: {
      icon: XCircle,
      label: 'Not Supported',
      color: 'bg-red-500/20 text-red-200 border-red-400/40',
      iconColor: 'text-red-400'
    },
    pending: {
      icon: AlertTriangle,
      label: 'Not Verified',
      color: 'bg-gray-500/20 text-gray-200 border-gray-400/40',
      iconColor: 'text-gray-400'
    }
  }

  const badge = badges[supportLevel]
  const Icon = badge.icon

  if (compact) {
    return (
      <span 
        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${badge.color}`}
        title={explanation || badge.label}
      >
        <Icon className={`w-3 h-3 ${badge.iconColor}`} />
        {verseReference && <span className="font-mono">{verseReference}</span>}
      </span>
    )
  }

  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border ${badge.color}`}>
      <Icon className={`w-4 h-4 mt-0.5 ${badge.iconColor}`} />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold">{badge.label}</span>
          {verseReference && (
            <span className="text-xs font-mono opacity-80">{verseReference}</span>
          )}
          {matchScore !== undefined && (
            <span className="text-xs opacity-70">({Math.round(matchScore * 100)}% match)</span>
          )}
        </div>
        {explanation && (
          <p className="text-xs opacity-90">{explanation}</p>
        )}
      </div>
    </div>
  )
}
