'use client'

import type { WorkspaceFeatureReadiness } from '@/lib/api/openapi-client'
import { getFeatureStatusLabel, type FeatureStatusBadgeLabel } from '@/components/feature-readiness'

interface FeatureStatusBadgeProps {
  status?: FeatureStatusBadgeLabel
  reason?: string
  readiness?: WorkspaceFeatureReadiness | null
  className?: string
}

const statusStyles: Record<FeatureStatusBadgeLabel, string> = {
  Ready: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100',
  'Needs prerequisite': 'border-amber-400/40 bg-amber-500/10 text-amber-100',
  Loading: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100',
  Generated: 'border-sky-400/40 bg-sky-500/10 text-sky-100',
  'Empty because no data exists': 'border-white/15 bg-black/30 text-gray-100',
  'Unavailable because service/data is not configured': 'border-rose-400/40 bg-rose-500/10 text-rose-100',
  'Failed with retry': 'border-orange-400/40 bg-orange-500/10 text-orange-100',
}

export default function FeatureStatusBadge({ status, reason, readiness, className = '' }: FeatureStatusBadgeProps) {
  const displayStatus = getFeatureStatusLabel(readiness, status)
  const displayReason = readiness?.message || reason
  return (
    <div className={`inline-flex flex-col gap-1 ${className}`.trim()}>
      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] ${statusStyles[displayStatus]}`}>
        {displayStatus}
      </span>
      {displayReason ? <span className="text-[11px] leading-5 text-gray-300">{displayReason}</span> : null}
    </div>
  )
}
