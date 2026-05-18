'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { ArrowRight, CheckCircle2, Layers3, Loader2, RotateCcw, Sparkles } from 'lucide-react'
import { createWorkspaceApiClient } from '@/lib/api/openapi-client'
import type { WorkspaceStateResponse } from '@/lib/api/openapi-client'
import { getWorkspaceGuardrailProfile, getWorkspacePlanningSummary } from '@/components/workspace-metadata.helpers'

const phaseLabels: Record<WorkspaceStateResponse['activePhase'], string> = {
  THEME: 'Setup',
  PASSAGE: 'Scripture',
  STUDY: 'Study',
  OUTLINE: 'Outline',
  WRITE: 'Manuscript',
  REFINE: 'Review',
  DELIVER: 'Media & Export',
}

const sectionLabels: Record<string, string> = {
  workspace: 'Setup',
  scripture: 'Scripture',
  'study-report': 'Study Notes',
  outlines: 'Outline',
  manuscript: 'Manuscript',
  citations: 'Review Support',
  dna: 'Review Tools',
  media: 'Media & Export',
  'church-settings': 'Church Details',
  'word-study': 'Word Study',
  'cross-references': 'Cross References',
  coach: 'Coach',
  visualizations: 'Visual Exploration',
}

interface WorkspaceStateSummaryProps {
  workspaceId?: string
  state?: WorkspaceStateResponse | null
}

export default function WorkspaceStateSummary({ workspaceId, state: initialState }: WorkspaceStateSummaryProps) {
  const [state, setState] = useState<WorkspaceStateResponse | null>(initialState ?? null)
  const [loading, setLoading] = useState(!initialState)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialState) {
      setState(initialState)
      setLoading(false)
      setError(null)
      return
    }

    if (!workspaceId) {
      setLoading(false)
      setError('Workspace state unavailable.')
      return
    }

    let mounted = true

    const loadState = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        if (mounted) {
          setError('Sign in to view sermon progress.')
          setLoading(false)
        }
        return
      }

      try {
        const client = createWorkspaceApiClient({ token })
        const response = await client.getWorkspaceState(workspaceId)
        if (mounted) {
          setState(response as WorkspaceStateResponse)
          setError(null)
        }
      } catch {
        if (mounted) {
          setError('Unable to load sermon progress.')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadState()

    return () => {
      mounted = false
    }
  }, [initialState, workspaceId])

  const refreshState = async () => {
    if (!workspaceId) return
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const client = createWorkspaceApiClient({ token })
      const response = await client.getWorkspaceState(workspaceId)
      setState(response as WorkspaceStateResponse)
      setError(null)
    } catch {
      setError('Unable to refresh sermon progress.')
    }
  }

  const restoreHistoryItem = async (kind: 'outline' | 'manuscript', historyIndex: number) => {
    if (!workspaceId) return
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const client = createWorkspaceApiClient({ token })
      if (kind === 'outline') {
        await client.restoreOutlineHistory(workspaceId, historyIndex)
      } else {
        await client.restoreManuscriptHistory(workspaceId, historyIndex)
      }
      await refreshState()
    } catch {
      setError(`Unable to restore ${kind} version.`)
    }
  }

  const recordIntegrityIssueReview = async (
    issue: NonNullable<WorkspaceStateResponse['integrityIssueLedger']>[number],
    decision: 'repair' | 'acknowledge' | 'cite',
  ) => {
    if (!workspaceId) return
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const client = createWorkspaceApiClient({ token })
      await client.recordIntegrityIssueReview(workspaceId, {
        issueId: issue.id,
        decision,
        note: issue.note || undefined,
        issueMessage: issue.message || undefined,
        severity: issue.severity || undefined,
        category: issue.category || undefined,
        affectedItem: issue.affectedItem || undefined,
      })
      await refreshState()
    } catch {
      setError('Unable to save review decision.')
    }
  }

  const completionCount = state ? Object.values(state.progress).filter(Boolean).length : 0
  const completionTotal = state ? Object.keys(state.progress).length : 7
  const completionPercent = completionTotal > 0 ? Math.round((completionCount / completionTotal) * 100) : 0
  const integrityIssues = state?.integrityIssueLedger || []
  const reviewedIntegrityIssues = state?.integrityIssueReviews || []
  const outlineHistory = state?.outlineHistory || []
  const manuscriptHistory = state?.manuscriptHistory || []
  const formatDelta = (value: number | null | undefined) => {
    if (value == null || Number.isNaN(value)) return '0'
    return `${value >= 0 ? '+' : ''}${value}`
  }
  const outlineCount = state?.artifacts?.outlines || 0
  const manuscriptCount = state?.artifacts?.manuscripts || 0
  const studyCount = state?.artifacts?.studyReports || 0
  const citationCount = state?.artifacts?.citations || 0
  const claimsSupported = (state?.claimLedger || []).filter((item) => item.supportLevel === 'supported').length
  const latestArchiveLabel =
    manuscriptHistory[0]?.revisionLabel || outlineHistory[0]?.revisionLabel || 'No archived versions yet.'
  const guardrail = getWorkspaceGuardrailProfile(state?.workspace as any)
  const planningSummary = getWorkspacePlanningSummary(state?.workspace as any)

  if (loading) {
    return (
      <div className="cyber-panel rounded-2xl p-4 border border-white/10 bg-black/30">
        <div className="flex items-center gap-2 text-cyan-200/80 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading sermon progress...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="cyber-panel rounded-2xl p-4 border border-white/10 bg-black/30">
        <p className="text-sm text-amber-200">{error}</p>
      </div>
    )
  }

  if (!state) return null

  return (
    <div className="cyber-panel rounded-2xl p-5 border border-cyan-400/20 bg-gradient-to-br from-black/80 via-black/60 to-cyan-950/30 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-300/80">Sermon Progress</p>
          </div>
          <h1 className="text-xl font-semibold text-white">{state.workspace.title}</h1>
          <p className="text-sm text-cyan-100/80">
            {state.workspace.mainPassage}
            {state.workspace.language ? ` • ${state.workspace.language.toUpperCase()}` : ''}
            {state.workspace.egwEnabled ? ' • EGW on' : ' • EGW off'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="cyber-tag">{phaseLabels[state.activePhase]}</span>
          <span className="cyber-tag">Section: {sectionLabels[state.activeSection] || state.activeSection}</span>
          <span className="cyber-tag">{state.workspace.status}</span>
        </div>
      </div>

      {guardrail.active ? (
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-50">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-200/80">{guardrail.label}</p>
          <p className="mt-1 font-medium">{guardrail.message || 'Scripture first. Christ-centered. Historical context matters.'}</p>
          <p className="mt-1 text-xs text-amber-100/70">{guardrail.reason}</p>
        </div>
      ) : null}

      {planningSummary ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {planningSummary.split(' • ').map((item) => (
            <span key={item} className="cyber-tag">{item}</span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-cyan-400/20 bg-black/35 p-5 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">Next Action</p>
              <h3 className="mt-1 text-2xl font-semibold text-white">{state.nextAction.label}</h3>
            </div>
            <ArrowRight className="w-6 h-6 text-cyan-300" />
          </div>
          <p className="mt-3 text-sm leading-6 text-gray-200/85">{state.nextAction.description}</p>

          <div className="mt-5 flex items-center gap-3 text-xs text-gray-300">
            <CheckCircle2 className="w-4 h-4 text-green-300" />
            <span>
              {completionCount}/{completionTotal} core steps ready
            </span>
            <span>({completionPercent}%)</span>
          </div>

          <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-center gap-2 text-cyan-200/80">
            <Layers3 className="w-4 h-4" />
            <p className="text-xs uppercase tracking-[0.25em]">Sermon material</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <StatCard label="Outline versions" value={outlineCount} />
            <StatCard label="Manuscript versions" value={manuscriptCount} />
            <StatCard label="Study notes" value={studyCount} />
            <StatCard label="Review items" value={citationCount} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MiniCard
          label="Latest Outline"
          title={state.activeOutline?.title || 'None selected'}
          detail={state.activeOutline ? `${state.activeOutline.pointCount || 0} point(s) • ${state.activeOutline.isSelected ? 'selected' : 'draft'}` : undefined}
        />
        <MiniCard
          label="Latest Manuscript"
          title={state.activeManuscript ? 'Manuscript draft' : 'None generated'}
          detail={
            state.activeManuscript
              ? `${state.activeManuscript.wordCount || 0} words${state.activeManuscript.estimatedMinutes ? ` • ${state.activeManuscript.estimatedMinutes} min` : ''}`
              : undefined
          }
        />
        <MiniCard
          label="Items Needing Attention"
          title={typeof state.latestIntegrityReport?.overallScore === 'number' ? `${state.latestIntegrityReport.overallScore}%` : 'Not run'}
          detail={
            state.latestIntegrityReport
              ? `${state.latestIntegrityReport.issueCount || 0} issues • ${state.latestIntegrityReport.strengthCount || 0} strengths${typeof state.latestIntegrityReport.reviewedIssueCount === 'number' ? ` • ${state.latestIntegrityReport.reviewedIssueCount} reviewed` : ''}`
              : undefined
          }
        />
        <MiniCard
          label="Media Pack"
          title={
            state.mediaPack?.status === 'ready'
              ? 'Ready for export'
              : state.mediaPack?.status === 'draft'
                ? 'Draft'
                : state.mediaPack?.status === 'outdated'
                  ? 'Outdated'
                  : 'Not generated'
          }
          detail={state.mediaPack ? `${state.mediaPack.slideCount || 0} suggestion(s)${state.mediaPack.exportPrepared ? ' • export linked' : ''}` : undefined}
        />
        <MiniCard
          label="Export Status"
          title={
            state.exportPack?.status === 'ready'
              ? 'Ready to download'
              : state.exportPack?.status === 'outdated'
                ? 'Outdated'
                : state.exportPack?.status === 'draft'
                  ? 'Draft'
                  : 'Not prepared'
          }
          detail={state.exportPack ? `${state.exportPack.artifacts?.length || 0} artifact(s)` : undefined}
        />
        <MiniCard
          label="Sources & Support"
          title={`${state.claimLedger?.length || 0} items`}
          detail={`${claimsSupported} clearly supported`}
        />
        <MiniCard
          label="Source List"
          title={`${state.sourceLedger?.length || 0} sources`}
          detail={`${state.claimReviewDecisions?.length || 0} review decisions`}
        />
        <MiniCard label="Latest saved version" title={latestArchiveLabel} />
      </div>

      <details className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <summary className="cursor-pointer text-[10px] uppercase tracking-[0.25em] text-gray-300">
          Show more
        </summary>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <HistoryPanel
            title="Recent outline versions"
            label="Outline history"
            items={outlineHistory.slice(0, 3).map((item, index) => ({
              key: `${item.id}-${index}`,
              title: item.title || 'Outline version',
              detail: `${item.revisionLabel || `Version ${index + 1}`} • ${item.pointCount || 0} points`,
              action:
                index > 0 ? (
                  <button
                    type="button"
                    onClick={() => restoreHistoryItem('outline', index)}
                    className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-100 hover:bg-cyan-500/20"
                  >
                    Restore
                  </button>
                ) : (
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-100">
                    Current
                  </span>
                ),
            }))}
            emptyText="No archived outlines yet."
            onRefresh={refreshState}
          />

          <HistoryPanel
            title="Recent manuscript versions"
            label="Manuscript history"
            items={manuscriptHistory.slice(0, 3).map((item, index) => ({
              key: `${item.id}-${index}`,
              title: item.wordCount ? `${item.wordCount} words` : 'Manuscript version',
              detail: `${item.revisionLabel || `Version ${index + 1}`}${item.estimatedMinutes ? ` • ${item.estimatedMinutes} min` : ''}`,
              action:
                index > 0 ? (
                  <button
                    type="button"
                    onClick={() => restoreHistoryItem('manuscript', index)}
                    className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-100 hover:bg-cyan-500/20"
                  >
                    Restore
                  </button>
                ) : (
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-100">
                    Current
                  </span>
                ),
            }))}
            emptyText="No archived manuscripts yet."
            onRefresh={refreshState}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Outline compare</p>
            {state.outlineComparison ? (
              <div className="mt-2 space-y-2 text-sm text-gray-200">
                <p>Compared with {state.outlineComparison.previousRevisionLabel || 'previous version'}.</p>
                <p>Point delta: {formatDelta(state.outlineComparison.pointDelta)}</p>
                <p>Title changed: {state.outlineComparison.titleChanged ? 'yes' : 'no'}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-400">Need one previous outline version to compare.</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Manuscript compare</p>
            {state.manuscriptComparison ? (
              <div className="mt-2 space-y-2 text-sm text-gray-200">
                <p>Compared with {state.manuscriptComparison.previousRevisionLabel || 'previous version'}.</p>
                <p>Word delta: {formatDelta(state.manuscriptComparison.wordDelta)}</p>
                <p>Minute delta: {formatDelta(state.manuscriptComparison.minuteDelta)}</p>
                <p>Outline changed: {state.manuscriptComparison.outlineChanged ? 'yes' : 'no'}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-400">Need one previous manuscript version to compare.</p>
            )}
          </div>
        </div>
      </details>

      {integrityIssues.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Items Needing Attention</p>
              <h3 className="mt-1 text-sm font-semibold text-white">Review and route issues</h3>
            </div>
            <span className="text-xs text-gray-400">{integrityIssues.length} item(s)</span>
          </div>
          <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
            {integrityIssues.map((issue) => {
              const reviewed = reviewedIntegrityIssues.find((item) => item.issueId === issue.id)
              return (
                <div key={issue.id} className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
                        {issue.severity || 'warning'} · {issue.category || 'general'}
                      </p>
                      <p className="text-sm text-white">{issue.message}</p>
                      {issue.affectedItem ? <p className="text-xs text-gray-400">Affected: {issue.affectedItem}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['repair', 'acknowledge', 'cite'] as const).map((decision) => (
                        <button
                          key={`${issue.id}-${decision}`}
                          type="button"
                          onClick={() => recordIntegrityIssueReview(issue, decision)}
                          className="cyber-outline text-[10px] px-2.5 py-1 rounded-full"
                        >
                          {decision}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.25em] text-gray-400">
                    <span>{issue.status || 'open'}</span>
                    <span>
                      {reviewed ? `${reviewed.decision} • ${new Date(reviewed.updatedAt).toLocaleString()}` : 'unreviewed'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

function MiniCard({ label, title, detail }: { label: string; title: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{title}</p>
      {detail ? <p className="mt-1 text-xs text-gray-400">{detail}</p> : null}
    </div>
  )
}

function HistoryPanel({
  label,
  title,
  items,
  emptyText,
  onRefresh,
}: {
  label: string
  title: string
  items: Array<{ key: string; title: string; detail: string; action: ReactNode }>
  emptyText: string
  onRefresh: () => void
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">{label}</p>
          <h3 className="mt-1 text-sm font-semibold text-white">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-cyan-100 hover:border-cyan-400/50"
        >
          <RotateCcw className="w-3 h-3" />
          Refresh
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.key} className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-gray-400">{item.detail}</p>
                </div>
                {item.action}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400">{emptyText}</p>
        )}
      </div>
    </div>
  )
}
