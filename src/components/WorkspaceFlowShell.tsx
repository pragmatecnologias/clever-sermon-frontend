'use client'

import PhaseNavigation, { Phase } from '@/components/PhaseNavigation'
import WorkspaceStateSummary from '@/components/WorkspaceStateSummary'
import type { WorkspaceSection, WorkspaceStateResponse } from '@/lib/api/openapi-client'
import { getWorkspaceGuardrailProfile, getWorkspacePlanningSummary } from '@/components/workspace-metadata.helpers'

interface WorkspaceFlowShellProps {
  workspaceId: string
  state: WorkspaceStateResponse | null
  activePhase: Phase
  onPhaseChange: (phase: Phase) => void
  onSectionChange?: (section: WorkspaceSection) => void
}

export default function WorkspaceFlowShell({
  workspaceId,
  state,
  activePhase,
  onPhaseChange,
  onSectionChange,
}: WorkspaceFlowShellProps) {
  const workspaceSnapshot = state?.workspace as any
  const guardrail = getWorkspaceGuardrailProfile(workspaceSnapshot)
  const planningSummary = getWorkspacePlanningSummary(workspaceSnapshot)
  const progress = state?.progress || {
    themeConfigured: false,
    passageExplored: false,
    studyGenerated: false,
    outlineCreated: false,
    manuscriptWritten: false,
    refineCompleted: false,
    deliverPrepared: false,
  }

  const phaseGuidance = {
    THEME: {
      title: 'Setup',
      for: 'Define the sermon context.',
      now: 'Set the passage, title, language, audience, and sermon goals.',
      produces: 'A configured sermon workspace.',
      next: 'Go to Scripture to start reading the text.',
      nextPhase: 'PASSAGE' as Phase,
    },
    PASSAGE: {
      title: 'Scripture',
      for: 'Start by reading the passage.',
      now: 'Open the text, compare translations, and save passage notes.',
      produces: 'Scripture snapshots and passage understanding.',
      next: 'Move into Deep Study for context, words, references, and EGW support.',
      nextPhase: 'STUDY' as Phase,
    },
    STUDY: {
      title: 'Deep Study',
      for: 'Explore context, words, references, and EGW support.',
      now: 'Generate study notes, inspect references, and gather support.',
      produces: 'Study report, cross references, word study, and supporting insight.',
      next: 'Use Sermon Core to clarify the message before outlining.',
      nextPhase: 'THEME' as Phase,
    },
    SERMON_CORE: {
      title: 'Sermon Core',
      for: 'Clarify the message before generating an outline.',
      now: 'Refine the big idea, tension, restoration, invitation, and theological lens.',
      produces: 'A clear sermon center ready for structure.',
      next: 'Shape that core into an outline.',
      nextPhase: 'OUTLINE' as Phase,
    },
    OUTLINE: {
      title: 'Outline',
      for: 'Shape the sermon structure.',
      now: 'Generate, select, and edit points with applications and support.',
      produces: 'A preaching outline with movement and support.',
      next: 'Draft the manuscript from the outline.',
      nextPhase: 'WRITE' as Phase,
    },
    WRITE: {
      title: 'Manuscript',
      for: 'Draft what you will preach.',
      now: 'Write the sermon text, transitions, key lines, and cues.',
      produces: 'A preach-ready manuscript.',
      next: 'Run Review to check support, clarity, and theological balance.',
      nextPhase: 'REFINE' as Phase,
    },
    REFINE: {
      title: 'Review',
      for: 'Check support, clarity, and theological balance.',
      now: 'Validate citations, claims, integrity, and blind spots.',
      produces: 'A reviewed sermon with trustworthy support.',
      next: 'Move to Media & Export when the sermon is ready to deliver.',
      nextPhase: 'DELIVER' as Phase,
    },
    DELIVER: {
      title: 'Media & Export',
      for: 'Prepare slides, exports, and delivery assets.',
      now: 'Generate media, slides, PDFs, and sermon handouts.',
      produces: 'Decks and exportable sermon assets.',
      next: 'Return to Scripture or Outline if you want to revise the sermon.',
      nextPhase: 'PASSAGE' as Phase,
    },
  } as const

  const activeGuidance = phaseGuidance[activePhase || state?.activePhase || 'THEME'] || phaseGuidance.THEME

  return (
    <div className="space-y-6">
      <div className="bg-black/40 backdrop-blur border-b border-white/10 rounded-2xl overflow-hidden">
        <div className="container mx-auto px-1 py-4 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">Clever Sermon</p>
            <h1 className="text-2xl font-bold text-white">
              {state?.workspace?.title || 'Sermon Workspace'}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/60">Main Passage</p>
            <p className="text-sm text-cyan-100/90">{state?.workspace?.mainPassage || 'Loading...'}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-1">
        <div className="cyber-panel rounded-2xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">{activeGuidance.title}</p>
              <h2 className="text-2xl font-semibold text-white">{activeGuidance.for}</h2>
              <p className="text-sm text-gray-200/80">{activeGuidance.now}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-200/85 max-w-md">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Produces</p>
              <p className="mt-1">{activeGuidance.produces}</p>
          <p className="mt-2 text-xs text-gray-400">Next: {activeGuidance.next}</p>
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
      {workspaceSnapshot?.sermonCore ? (
        <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-50">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Core Message</p>
              <p className="mt-1 font-medium">{workspaceSnapshot.sermonCore.bigIdea || workspaceSnapshot.sermonCore.centralTruth || workspaceSnapshot.sermonCore.mainIdea || workspaceSnapshot.sermonCore.summary || 'Core message available'}</p>
              <p className="mt-1 text-xs text-cyan-100/70">Use this to generate or refine the outline.</p>
            </div>
          ) : null}
        </div>
      </div>

      <PhaseNavigation
        activePhase={state?.activePhase || 'THEME'}
        onPhaseChange={onPhaseChange}
        onSectionChange={onSectionChange}
        featureReadiness={state?.featureReadiness}
        progress={progress}
      />

      <div className="container mx-auto px-1">
        <WorkspaceStateSummary workspaceId={workspaceId} state={state} />
      </div>

      {onSectionChange && (
        <div className="container mx-auto px-1">
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                { section: 'workspace', label: 'Setup' },
                { section: 'scripture', label: 'Scripture' },
                { section: 'study-report', label: 'Study Notes' },
                { section: 'outlines', label: 'Outline' },
                { section: 'manuscript', label: 'Manuscript' },
                { section: 'citations', label: 'Review' },
                { section: 'dna', label: 'Review Tools' },
                { section: 'media', label: 'Media & Export' },
              ] as const
            ).map(({ section, label }) => (
              <button
                key={section}
                onClick={() => onSectionChange(section)}
                className={`cyber-outline text-xs px-3 py-2 rounded-full ${
                  state?.activeSection === section ? 'border-cyan-400/70 text-cyan-100 bg-cyan-500/10' : ''
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
