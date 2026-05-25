'use client'

import { useState } from 'react'
import { AlertTriangle, Lightbulb, MessageSquare, ChevronDown, ChevronUp, Wrench, Flag } from 'lucide-react'
import type { WorkspaceClaimLedgerEntry } from '@/components/workspace-domain.types'

interface ReviewSummary {
  totalClaims: number
  supportedClaims: number
  needsReview: number
  highRiskClaims: number
  theologicalExtensions: number
  illustrations: number
  outsideRangeClaims: number
  suggestedRepairs: number
}

interface Props {
  claim: WorkspaceClaimLedgerEntry
  defaultExpanded?: boolean
}

function riskLabel(risk: string | undefined): string {
  switch (risk) {
    case 'high': return 'High risk'
    case 'medium': return 'Medium risk'
    case 'low': return 'Low risk'
    default: return 'No pastoral risk detected'
  }
}

function riskColor(risk: string | undefined): string {
  switch (risk) {
    case 'high': return 'bg-red-500/20 text-red-200 border-red-400/40'
    case 'medium': return 'bg-amber-500/20 text-amber-200 border-amber-400/40'
    case 'low': return 'bg-yellow-500/20 text-yellow-200 border-yellow-400/40'
    default: return 'bg-green-500/20 text-green-200 border-green-400/40'
  }
}

function subTypeLabel(t: string | undefined): string {
  switch (t) {
    case 'textual_observation': return 'Textual observation'
    case 'interpretation': return 'Interpretation'
    case 'theological_extension': return 'Theological extension'
    case 'application': return 'Application'
    case 'illustration': return 'Illustration'
    case 'external_reference': return 'External reference'
    case 'wider_context': return 'Wider context'
    default: return t || ''
  }
}

export default function WorkspaceSocraticReviewPanel({ claim, defaultExpanded }: Props) {
  const hasSocratic = Array.isArray(claim.socraticQuestions) && claim.socraticQuestions.length > 0
  const hasRepair = Boolean(claim.suggestedRepair)
  const isRisky = claim.pastoralRisk === 'high' || claim.pastoralRisk === 'medium'

  const [socraticOpen, setSocraticOpen] = useState(defaultExpanded || isRisky)
  const [repairOpen, setRepairOpen] = useState(defaultExpanded || isRisky)

  return (
    <div className="space-y-2 pt-2 border-t border-white/10">
      {/* Pastoral Risk Badge */}
      {claim.pastoralRisk !== undefined && (
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${riskColor(claim.pastoralRisk)} flex items-center gap-1`}>
            <AlertTriangle className="w-3 h-3" />
            {riskLabel(claim.pastoralRisk)}
          </span>
          {claim.claimSubType && (
            <span className="text-xs text-gray-400">{subTypeLabel(claim.claimSubType)}</span>
          )}
        </div>
      )}

      {/* Flags */}
      <div className="flex flex-wrap gap-1">
        {claim.outsideSelectedRange && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/40 flex items-center gap-1">
            <Flag className="w-3 h-3" />
            Outside selected range
          </span>
        )}
        {claim.theologicalExtension && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/40 flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            Theological extension
          </span>
        )}
        {claim.homileticalImagination && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-200 border border-orange-400/40 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Homiletical imagination
          </span>
        )}
      </div>

      {/* Flag explanations */}
      {claim.outsideSelectedRange && (
        <p className="text-xs text-purple-200/70">
          This claim uses wider literary context outside the selected passage.
          {claim.outsideRangeReason && <span className="block mt-0.5 italic">{claim.outsideRangeReason}</span>}
        </p>
      )}
      {claim.theologicalExtension && (
        <p className="text-xs text-blue-200/70">
          This is a theological extension and may need additional support.
        </p>
      )}
      {claim.homileticalImagination && (
        <p className="text-xs text-orange-200/70">
          This claim may add imagined details not stated in the passage.
        </p>
      )}

      {/* Risk Reason */}
      {claim.riskReason && (
        <p className="text-xs text-gray-300 leading-relaxed">{claim.riskReason}</p>
      )}

      {/* Claim Split Suggestions */}
      {Array.isArray(claim.claimSplitSuggestion) && claim.claimSplitSuggestion.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Suggested Split</p>
          {claim.claimSplitSuggestion.map((split, idx) => (
            <div key={idx} className="text-xs text-gray-300 border-l-2 border-cyan-400/40 pl-2">
              <p>{split.claimText}</p>
              <p className="text-gray-500">{split.supportHint}</p>
            </div>
          ))}
        </div>
      )}

      {/* Socratic Questions */}
      {hasSocratic && (
        <div>
          <button
            type="button"
            onClick={() => setSocraticOpen(!socraticOpen)}
            className="flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200 uppercase tracking-wide w-full text-left"
          >
            <MessageSquare className="w-3 h-3" />
            Socratic Review
            {socraticOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {socraticOpen && (
            <div className="mt-1 space-y-1">
              {claim.socraticQuestions!.map((q, idx) => (
                <p key={idx} className="text-xs text-gray-300 italic border-l-2 border-cyan-400/30 pl-2">
                  {q}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Socratic fallback */}
      {!hasSocratic && !hasRepair && !claim.riskReason && (
        <p className="text-xs text-gray-500 italic">No Socratic review available for this claim.</p>
      )}

      {/* Suggested Repair */}
      {hasRepair && (
        <div>
          <button
            type="button"
            onClick={() => setRepairOpen(!repairOpen)}
            className="flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200 uppercase tracking-wide w-full text-left"
          >
            <Wrench className="w-3 h-3" />
            Suggested Repair
            {repairOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {repairOpen && (
            <p className="mt-1 text-xs text-gray-200 bg-amber-500/10 border border-amber-400/20 rounded-lg px-3 py-2 leading-relaxed">
              {claim.suggestedRepair}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function WorkspaceReviewSummaryBar({ summary }: { summary: ReviewSummary | null | undefined }) {
  if (!summary || summary.totalClaims === 0) return null

  return (
    <div className="cyber-panel rounded-2xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-cyan-200 uppercase tracking-wide">Review Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <SummaryStat label="Total claims" value={summary.totalClaims} />
        <SummaryStat label="Supported" value={summary.supportedClaims} color="text-green-300" />
        <SummaryStat label="Needs review" value={summary.needsReview} color="text-amber-300" />
        <SummaryStat label="High risk" value={summary.highRiskClaims} color="text-red-300" />
        <SummaryStat label="Theological ext." value={summary.theologicalExtensions} color="text-blue-300" />
        <SummaryStat label="Outside range" value={summary.outsideRangeClaims} color="text-purple-300" />
        <SummaryStat label="Illustrations" value={summary.illustrations} color="text-pink-300" />
        <SummaryStat label="Suggested repairs" value={summary.suggestedRepairs} color="text-amber-300" />
      </div>
    </div>
  )
}

function SummaryStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-black/20 rounded-lg p-2 text-center">
      <p className={`text-lg font-bold ${color || 'text-gray-200'}`}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}
