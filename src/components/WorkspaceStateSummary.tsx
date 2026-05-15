'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, Layers3, Loader2, RotateCcw, Sparkles } from 'lucide-react'
import { createWorkspaceApiClient } from '@/lib/api/openapi-client'
import type { WorkspaceStateResponse } from '@/lib/api/openapi-client'

const phaseLabels: Record<WorkspaceStateResponse['activePhase'], string> = {
  THEME: 'Theme',
  PASSAGE: 'Passage',
  STUDY: 'Study',
  OUTLINE: 'Outline',
  WRITE: 'Write',
  REFINE: 'Refine',
  DELIVER: 'Deliver',
}

interface WorkspaceStateSummaryProps {
  workspaceId?: string
  state?: WorkspaceStateResponse | null
}

export default function WorkspaceStateSummary({ workspaceId, state: initialState }: WorkspaceStateSummaryProps) {
  const [state, setState] = useState<WorkspaceStateResponse | null>(initialState || null)
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
          setError('Sign in to view workspace state.')
          setLoading(false)
        }
        return
      }

      try {
        if (!mounted) return
        const client = createWorkspaceApiClient({ token })
        const response = await client.getWorkspaceState(workspaceId)
        setState(response as WorkspaceStateResponse)
      } catch (fetchError) {
        if (!mounted) return
        setError('Unable to load workspace state.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadState()

    return () => {
      mounted = false
    }
  }, [initialState, workspaceId])

  const completionCount = state
    ? Object.values(state.progress).filter(Boolean).length
    : 0
  const completionTotal = state ? Object.keys(state.progress).length : 7
  const completionPercent = Math.round((completionCount / completionTotal) * 100)
  const formatDelta = (value: number | null) => {
    if (value === null) return '0'
    return `${value >= 0 ? '+' : ''}${value}`
  }
  const integrityIssues = state?.integrityIssueLedger || []
  const reviewedIntegrityIssues = state?.integrityIssueReviews || []

  const refreshState = async () => {
    if (!workspaceId) return
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const client = createWorkspaceApiClient({ token })
      const response = await client.getWorkspaceState(workspaceId)
      setState(response as WorkspaceStateResponse)
    } catch (fetchError) {
      setError('Unable to refresh workspace state.')
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
    } catch (restoreError) {
      setError(`Unable to restore ${kind} history entry.`)
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
    } catch (reviewError) {
      setError('Unable to record integrity issue review.')
    }
  }

  if (loading) {
    return (
      <div className="cyber-panel rounded-2xl p-4 border border-white/10 bg-black/30">
        <div className="flex items-center gap-2 text-cyan-200/80 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading workspace state...
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
            <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-300/80">Workspace State</p>
          </div>
          <h2 className="text-xl font-semibold text-white">
            {state.workspace.title}
          </h2>
          <p className="text-sm text-cyan-100/80">
            {state.workspace.mainPassage}
            {state.workspace.language ? ` • ${state.workspace.language.toUpperCase()}` : ''}
            {state.workspace.egwEnabled ? ' • EGW on' : ' • EGW off'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="cyber-tag">{phaseLabels[state.activePhase]}</span>
          <span className="cyber-tag">Section: {state.activeSection}</span>
          <span className="cyber-tag">{state.workspace.status}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">Next Action</p>
              <h3 className="mt-1 text-lg font-semibold text-white">{state.nextAction.label}</h3>
            </div>
            <ArrowRight className="w-5 h-5 text-cyan-300" />
          </div>
          <p className="mt-2 text-sm text-gray-200/80">{state.nextAction.description}</p>

          <div className="mt-4 flex items-center gap-3 text-xs text-gray-300">
            <CheckCircle2 className="w-4 h-4 text-green-300" />
            <span>{completionCount}/{completionTotal} core steps ready</span>
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
            <p className="text-xs uppercase tracking-[0.25em]">Artifact counts</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-gray-400">Outlines</p>
              <p className="mt-1 text-lg font-semibold text-white">{state.artifacts.outlines}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-gray-400">Manuscripts</p>
              <p className="mt-1 text-lg font-semibold text-white">{state.artifacts.manuscripts}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-gray-400">Study Reports</p>
              <p className="mt-1 text-lg font-semibold text-white">{state.artifacts.studyReports}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-gray-400">Citations</p>
              <p className="mt-1 text-lg font-semibold text-white">{state.artifacts.citations}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Active Outline</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {state.activeOutline?.title || 'None selected'}
          </p>
          {state.activeOutline && (
            <p className="mt-1 text-xs text-gray-400">
              {state.activeOutline.pointCount} point(s) • {state.activeOutline.isSelected ? 'selected' : 'draft'}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Active Manuscript</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {state.activeManuscript ? 'Manuscript draft' : 'None generated'}
          </p>
          {state.activeManuscript && (
            <p className="mt-1 text-xs text-gray-400">
              {state.activeManuscript.wordCount || 0} words
              {state.activeManuscript.estimatedMinutes ? ` • ${state.activeManuscript.estimatedMinutes} min` : ''}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Integrity</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {typeof state.latestIntegrityReport?.overallScore === 'number'
              ? `${state.latestIntegrityReport.overallScore}%`
              : 'Not run'}
          </p>
          {state.latestIntegrityReport && (
            <p className="mt-1 text-xs text-gray-400">
              {state.latestIntegrityReport.issueCount || 0} issues • {state.latestIntegrityReport.strengthCount || 0} strengths
              {typeof state.latestIntegrityReport.reviewedIssueCount === 'number' ? ` • ${state.latestIntegrityReport.reviewedIssueCount} reviewed` : ''}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Media Pack</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {state.mediaPack?.status === 'ready'
              ? 'Ready for export'
              : state.mediaPack?.status === 'draft'
                ? 'Draft'
                : state.mediaPack?.status === 'outdated'
                  ? 'Outdated'
                  : 'Not generated'}
          </p>
          {state.mediaPack && (
            <p className="mt-1 text-xs text-gray-400">
              {state.mediaPack.slideCount || 0} suggestion(s)
              {state.mediaPack.exportPrepared ? ' • export linked' : ''}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Export Pack</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {state.exportPack?.status === 'ready'
              ? 'Ready to download'
              : state.exportPack?.status === 'outdated'
                ? 'Outdated'
                : state.exportPack?.status === 'draft'
                  ? 'Draft'
                  : 'Not prepared'}
          </p>
          {state.exportPack && (
            <p className="mt-1 text-xs text-gray-400">
              {state.exportPack.artifacts?.length || 0} artifact(s)
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Claims</p>
          <p className="mt-1 text-sm font-semibold text-white">{state.claimLedger?.length || 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Sources</p>
          <p className="mt-1 text-sm font-semibold text-white">{state.sourceLedger?.length || 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Support</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {(state.claimLedger || []).filter((item: WorkspaceStateResponse['claimLedger'][number]) => item.supportLevel === 'supported').length || 0} supported
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Claim Reviews</p>
          <p className="mt-1 text-sm font-semibold text-white">{state.claimReviewDecisions?.length || 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Outline History</p>
          <p className="mt-1 text-sm font-semibold text-white">{state.outlineHistory?.length || 0}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Manuscript History</p>
          <p className="mt-1 text-sm font-semibold text-white">{state.manuscriptHistory?.length || 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 md:col-span-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Latest History Snapshot</p>
          <p className="mt-1 text-xs text-gray-300">
            {state.manuscriptHistory?.[0]?.revisionLabel || state.outlineHistory?.[0]?.revisionLabel || 'No archived versions yet.'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Outline History</p>
              <h3 className="mt-1 text-sm font-semibold text-white">Recent outline versions</h3>
            </div>
            <button
              type="button"
              onClick={refreshState}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-cyan-100 hover:border-cyan-400/50"
            >
              <RotateCcw className="w-3 h-3" />
              Refresh
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {(state.outlineHistory || []).slice(0, 3).map((item: WorkspaceStateResponse['outlineHistory'][number], index) => (
              <div key={`${item.id}-${index}`} className="rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-gray-400">
                      {item.revisionLabel || `Version ${index + 1}`} • {item.pointCount || 0} points
                    </p>
                  </div>
                  {index > 0 ? (
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
                  )}
                </div>
              </div>
            ))}
            {!(state.outlineHistory || []).length && (
              <p className="text-sm text-gray-400">No archived outlines yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Manuscript History</p>
              <h3 className="mt-1 text-sm font-semibold text-white">Recent manuscript versions</h3>
            </div>
            <button
              type="button"
              onClick={refreshState}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-cyan-100 hover:border-cyan-400/50"
            >
              <RotateCcw className="w-3 h-3" />
              Refresh
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {(state.manuscriptHistory || []).slice(0, 3).map((item: WorkspaceStateResponse['manuscriptHistory'][number], index) => (
              <div key={`${item.id}-${index}`} className="rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {item.wordCount ? `${item.wordCount} words` : 'Manuscript version'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.revisionLabel || `Version ${index + 1}`}
                      {item.estimatedMinutes ? ` • ${item.estimatedMinutes} min` : ''}
                    </p>
                  </div>
                  {index > 0 ? (
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
                  )}
                </div>
              </div>
            ))}
            {!(state.manuscriptHistory || []).length && (
              <p className="text-sm text-gray-400">No archived manuscripts yet.</p>
            )}
          </div>
        </div>
      </div>

      {integrityIssues.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Integrity Issues</p>
              <h3 className="mt-1 text-sm font-semibold text-white">Review and route issues</h3>
            </div>
            <span className="text-xs text-gray-400">{integrityIssues.length} item(s)</span>
          </div>
          <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
            {integrityIssues.map((issue: WorkspaceStateResponse['integrityIssueLedger'][number]) => {
              const reviewed = reviewedIntegrityIssues.find(
                (item: WorkspaceStateResponse['integrityIssueReviews'][number]) => item.issueId === issue.id,
              )
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
                    <span>{reviewed ? `${reviewed.decision} • ${new Date(reviewed.updatedAt).toLocaleString()}` : 'unreviewed'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Outline Compare</p>
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
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Manuscript Compare</p>
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
    </div>
  )
}
