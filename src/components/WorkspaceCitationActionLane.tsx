import { BookOpen, CheckCircle2, Layers } from 'lucide-react'
import type {
  WorkspaceClaimReviewDecision,
  WorkspaceClaimLedgerEntry,
  WorkspaceSourceLedgerEntry,
  WorkspaceSupportLevel,
} from '@/components/workspace-domain.types'

type Props = {
  claimReviewDecisions: WorkspaceClaimReviewDecision[]
  claims: WorkspaceClaimLedgerEntry[]
  sources: WorkspaceSourceLedgerEntry[]
  filter: 'all' | 'supported' | 'partial' | 'review' | 'unsupported'
  onFilterChange: (value: 'all' | 'supported' | 'partial' | 'review' | 'unsupported') => void
  onOpenRefine: () => void
}

export default function WorkspaceCitationActionLane({
  claimReviewDecisions,
  claims,
  sources,
  filter,
  onFilterChange,
  onOpenRefine,
}: Props) {
  const normalizeSupportLevel = (value: WorkspaceClaimLedgerEntry['supportLevel']): WorkspaceSupportLevel => {
    if (value === 'supported' || value === 'partially_supported' || value === 'needs_review' || value === 'unsupported') {
      return value
    }

    return 'needs_review'
  }

  const normalizedClaims = claims.map((item) => ({
    ...item,
    supportLevel: normalizeSupportLevel(item.supportLevel),
  }))

  const supportCounts = {
    supported: normalizedClaims.filter((item) => item.supportLevel === 'supported').length,
    partial: normalizedClaims.filter((item) => item.supportLevel === 'partially_supported').length,
    review: normalizedClaims.filter((item) => item.supportLevel === 'needs_review').length,
    unsupported: normalizedClaims.filter((item) => item.supportLevel === 'unsupported').length,
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Claims</p>
          <p className="mt-1 text-lg font-semibold text-white">{claims.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Sources</p>
          <p className="mt-1 text-lg font-semibold text-white">{sources.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Supported</p>
          <p className="mt-1 text-lg font-semibold text-white">{supportCounts.supported}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Needs review</p>
          <p className="mt-1 text-lg font-semibold text-white">{supportCounts.review + supportCounts.unsupported}</p>
        </div>
      </div>

      {claimReviewDecisions.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Claim review decisions</p>
          <div className="flex flex-wrap gap-2">
            {claimReviewDecisions.map((decision) => (
              <span key={`${decision.claimId}-${decision.updatedAt}`} className="cyber-tag">
                {decision.claimId}: {decision.decision}
              </span>
            ))}
          </div>
        </div>
      )}

      {claimReviewDecisions.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Claim review history</p>
            <span className="text-[10px] uppercase tracking-widest text-cyan-200/70">{claimReviewDecisions.length} event(s)</span>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {[...claimReviewDecisions]
              .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
              .map((decision) => (
                <div key={`${decision.claimId}-${decision.updatedAt}-history`} className="rounded-lg border border-white/10 bg-black/25 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{decision.claimId}</p>
                    <span className="text-[10px] uppercase tracking-widest text-cyan-200">{decision.decision}</span>
                  </div>
                  {decision.note && <p className="mt-1 text-xs text-gray-300">{decision.note}</p>}
                  <p className="mt-1 text-[11px] text-gray-500">{new Date(decision.updatedAt).toLocaleString()}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
        <div className="flex items-center gap-2 text-cyan-200/80">
          <Layers className="w-4 h-4" />
          <p className="text-xs uppercase tracking-[0.25em]">Support filters</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ['all', `All (${claims.length})`],
            ['supported', `Supported (${supportCounts.supported})`],
            ['partial', `Partial (${supportCounts.partial})`],
            ['review', `Review (${supportCounts.review})`],
            ['unsupported', `Unsupported (${supportCounts.unsupported})`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => onFilterChange(key as 'all' | 'supported' | 'partial' | 'review' | 'unsupported')}
              className={`text-xs px-3 py-2 rounded-full border transition-colors ${
                filter === key ? 'border-cyan-400/70 text-cyan-100 bg-cyan-500/10' : 'border-white/10 text-gray-300 hover:border-cyan-400/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-cyan-200/80">
            <BookOpen className="w-4 h-4" />
            <p className="text-xs uppercase tracking-[0.25em]">Drafting lane</p>
          </div>
          <button onClick={onOpenRefine} className="cyber-outline text-xs px-3 py-2 rounded-full">
            Open Refine
          </button>
        </div>
        <p className="text-sm text-gray-200">
          Citation drafting stays editable here. Validation is a separate step so support status is visible before delivery.
        </p>
      </div>
    </>
  )
}
