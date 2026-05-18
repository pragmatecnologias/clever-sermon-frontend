'use client'

import { useState } from 'react'
import { AlertCircle, BookOpen, CheckCircle2 } from 'lucide-react'
import WorkspaceCitationActionLane from '@/components/WorkspaceCitationActionLane'
import { renderMarkdown } from '@/components/workspace-render.helpers'
import type {
  WorkspaceCitationDraft,
  WorkspaceCitationItem,
  WorkspaceClaimLedgerEntry,
  WorkspaceClaimReviewDecision,
  WorkspaceSourceLedgerEntry,
  WorkspaceSupportLevel,
} from '@/components/workspace-domain.types'

interface WorkspaceCitationReviewProps {
  workspace: {
    citations?: WorkspaceCitationItem[]
  }
  workspaceState: {
    claimLedger?: WorkspaceClaimLedgerEntry[]
    sourceLedger?: WorkspaceSourceLedgerEntry[]
    claimReviewDecisions?: WorkspaceClaimReviewDecision[]
  } | null
  actionLoading: string[]
  citationTranslation: string
  setCitationTranslation: (value: string) => void
  onOpenPromptEditor: (type: 'citations') => void
  onGenerateCitations: () => void
  onValidateCitations: () => void
  editingCitationId: string | null
  citationDraft: WorkspaceCitationDraft | null
  setEditingCitationId: (id: string | null) => void
  setCitationDraft: (draft: WorkspaceCitationDraft | null) => void
  handleCitationSave: () => Promise<void>
  onOpenRefine: () => void
  onRepairClaim: (claim: WorkspaceClaimLedgerEntry) => void
  onAcknowledgeClaim: (claim: WorkspaceClaimLedgerEntry) => void
  onCiteClaim: (claim: WorkspaceClaimLedgerEntry) => void
}

const supportLabels: Record<WorkspaceSupportLevel, string> = {
  supported: 'Supported',
  partially_supported: 'Partial',
  needs_review: 'Needs review',
  unsupported: 'Unsupported',
}

const supportToneClasses: Record<WorkspaceSupportLevel, string> = {
  supported: 'border-cyan-400/60 text-cyan-200',
  partially_supported: 'border-amber-400/60 text-amber-200',
  needs_review: 'border-fuchsia-400/60 text-fuchsia-200',
  unsupported: 'border-red-400/60 text-red-200',
}

const normalizeSupportLevel = (
  value: WorkspaceCitationItem['supportLevel'] | WorkspaceClaimLedgerEntry['supportLevel'],
) : WorkspaceSupportLevel => {
  if (value === 'supported' || value === 'partially_supported' || value === 'needs_review' || value === 'unsupported') {
    return value
  }

  return 'needs_review'
}

export default function WorkspaceCitationReview({
  workspace,
  workspaceState,
  actionLoading,
  citationTranslation,
  setCitationTranslation,
  onOpenPromptEditor,
  onGenerateCitations,
  onValidateCitations,
  editingCitationId,
  citationDraft,
  setEditingCitationId,
  setCitationDraft,
  handleCitationSave,
  onOpenRefine,
  onRepairClaim,
  onAcknowledgeClaim,
  onCiteClaim,
}: WorkspaceCitationReviewProps) {
  const claims = Array.isArray(workspaceState?.claimLedger) ? workspaceState.claimLedger : []
  const sources = Array.isArray(workspaceState?.sourceLedger) ? workspaceState.sourceLedger : []
  const claimReviewDecisions = Array.isArray(workspaceState?.claimReviewDecisions) ? workspaceState.claimReviewDecisions : []
  const [filter, setFilter] = useState<'all' | 'supported' | 'partial' | 'review' | 'unsupported'>('all')
  const decisionMap = new Map<string, WorkspaceClaimReviewDecision>(
    claimReviewDecisions.map((item) => [String(item.claimId), item]),
  )

  const filteredClaims = claims.filter((claim) => {
    if (filter === 'supported') return claim.supportLevel === 'supported'
    if (filter === 'partial') return claim.supportLevel === 'partially_supported'
    if (filter === 'review') return claim.supportLevel === 'needs_review'
    if (filter === 'unsupported') return claim.supportLevel === 'unsupported'
    return true
  })

  return (
    <div className="space-y-4 relative min-h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">Citations</h3>
          <p className="text-sm text-gray-300 mt-1">
            Draft here. Review support in the ledger. Validate before preaching.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <select
            value={citationTranslation}
            onChange={(e) => setCitationTranslation(e.target.value.toUpperCase())}
            className="cyber-outline text-xs px-3 py-2 rounded-full"
          >
            <option value="KJV">KJV</option>
            <option value="WEB">WEB</option>
          </select>
          <button
            onClick={() => onOpenPromptEditor('citations')}
            className="cyber-outline text-xs px-4 py-2 rounded-full"
          >
            Prompt
          </button>
          <button
            onClick={onGenerateCitations}
            className="cyber-button-secondary text-xs px-4 py-2 rounded-full disabled:opacity-60"
            disabled={actionLoading.includes('citations')}
          >
            {actionLoading.includes('citations') ? 'Generating...' : 'Generate'}
          </button>
          <button
            onClick={onValidateCitations}
            className="cyber-outline text-xs px-4 py-2 rounded-full disabled:opacity-60"
            disabled={actionLoading.includes('citations-validate')}
          >
            {actionLoading.includes('citations-validate') ? 'Validating...' : 'Validate'}
          </button>
        </div>
      </div>

      <WorkspaceCitationActionLane
        claimReviewDecisions={claimReviewDecisions}
        claims={claims}
        sources={sources}
        filter={filter}
        onFilterChange={setFilter}
        onOpenRefine={onOpenRefine}
      />

      {workspace.citations?.length ? (
        <div className="space-y-3">
          {workspace.citations.map((citation) => {
            const supportLevel = normalizeSupportLevel(citation.supportLevel)
            const verseReferences = Array.isArray(citation.verseReferences) ? citation.verseReferences : []

            return (
              <div key={citation.id} className="border border-white/10 rounded-xl p-4 bg-black/30">
              <div className="flex items-center justify-between gap-3">
                <span className="cyber-tag">{citation.statementType}</span>
                <button
                  onClick={() => {
                    setEditingCitationId(citation.id)
                    setCitationDraft({
                      id: citation.id,
                      statement: citation.statement || '',
                      verseReferences: (citation.verseReferences || []).join(', '),
                    })
                  }}
                  className="cyber-outline px-3 py-1 text-xs rounded-full"
                >
                  Edit
                </button>
              </div>

              {editingCitationId === citation.id && citationDraft ? (
                <div className="space-y-3 mt-3">
                  <label className="text-xs uppercase tracking-widest cyber-muted">Statement</label>
                  <textarea
                    value={citationDraft.statement}
                    onChange={(e) => setCitationDraft({ ...citationDraft, statement: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                    rows={3}
                  />
                  <label className="text-xs uppercase tracking-widest cyber-muted">Verse References (comma separated)</label>
                  <input
                    value={citationDraft.verseReferences}
                    onChange={(e) => setCitationDraft({ ...citationDraft, verseReferences: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCitationSave}
                      className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60"
                      disabled={actionLoading.includes('citation-edit')}
                    >
                      {actionLoading.includes('citation-edit') ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingCitationId(null)
                        setCitationDraft(null)
                      }}
                      className="cyber-outline text-xs px-4 py-2 rounded-full"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 mt-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">{renderMarkdown(String(citation.statement || ''))}</div>
                    <span
                      className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border ${supportToneClasses[supportLevel] || 'border-white/20 text-gray-200'}`}
                    >
                      {supportLabels[supportLevel] || supportLevel || 'Unknown'}
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_0.7fr]">
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400">Claim review</p>
                      <div className="mt-2 text-sm text-gray-100/90 space-y-2">
                        <p>
                          <span className="text-gray-400">Type:</span> {citation.statementType || 'claim'}
                        </p>
                        <p>
                          <span className="text-gray-400">Support:</span> {citation.isVerified ? 'Verified' : 'Unverified'}
                        </p>
                        {verseReferences.length > 0 && (
                          <p className="text-xs text-cyan-200">
                            Verses: {verseReferences.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400">Source status</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-300">
                        {citation.isVerified ? (
                          <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-300" />
                        )}
                        <span>{citation.isVerified ? 'Supported by citation review' : 'Needs pastoral review before preaching'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            )
          })}
        </div>
      ) : (
        <p className="text-gray-100/90">No citations yet. Generate them to check support and strengthen the sermon.</p>
      )}

      {filteredClaims.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-cyan-200/80">
            <CheckCircle2 className="w-4 h-4" />
            <p className="text-xs uppercase tracking-[0.25em]">Claim ledger</p>
          </div>
          <div className="space-y-3">
            {filteredClaims.map((claim) => {
              const supportLevel = normalizeSupportLevel(claim.supportLevel)

              return (
              <div key={claim.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{claim.claimType}</p>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {decisionMap.has(claim.id) && (
                      <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border border-cyan-400/50 text-cyan-200">
                        {decisionMap.get(claim.id)?.decision}
                      </span>
                    )}
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border ${supportToneClasses[supportLevel] || 'border-white/20 text-gray-200'}`}>
                      {supportLabels[supportLevel] || supportLevel}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-200/90">{claim.claimText}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-300">
                  <span className="cyber-tag">Source: {claim.sourceType}</span>
                  {claim.location && <span className="cyber-tag">Location: {claim.location}</span>}
                  {Array.isArray(claim.sourceIds) && claim.sourceIds.length > 0 && (
                    <span className="cyber-tag">Refs: {claim.sourceIds.join(', ')}</span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => onRepairClaim(claim)}
                    className="cyber-outline text-xs px-3 py-2 rounded-full"
                  >
                    Repair
                  </button>
                  <button
                    onClick={() => onAcknowledgeClaim(claim)}
                    className="cyber-outline text-xs px-3 py-2 rounded-full"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => onCiteClaim(claim)}
                    className="cyber-outline text-xs px-3 py-2 rounded-full"
                  >
                    Cite
                  </button>
                </div>
              </div>
              )
            })}
          </div>
        </div>
      )}

      {sources.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-cyan-200/80">
            <BookOpen className="w-4 h-4" />
            <p className="text-xs uppercase tracking-[0.25em]">Source ledger</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {sources.map((source) => (
              <div key={source.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{source.label}</p>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border border-white/20 text-gray-300">
                    {source.sourceType}
                  </span>
                </div>
                {source.reference && <p className="mt-2 text-xs text-cyan-200/80">{source.reference}</p>}
                <p className="mt-2 text-xs text-gray-400">
                  {source.verified ? 'Verified' : 'Unverified'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
