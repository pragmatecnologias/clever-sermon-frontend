'use client'

import PhaseNavigation, { Phase } from '@/components/PhaseNavigation'
import WorkspaceStateSummary from '@/components/WorkspaceStateSummary'
import type { WorkspaceSection, WorkspaceStateResponse } from '@/lib/api/openapi-client'

interface WorkspaceFlowShellProps {
  workspaceId: string
  state: WorkspaceStateResponse | null
  onPhaseChange: (phase: Phase) => void
  onSectionChange?: (section: WorkspaceSection) => void
}

export default function WorkspaceFlowShell({ workspaceId, state, onPhaseChange, onSectionChange }: WorkspaceFlowShellProps) {
  const progress = state?.progress || {
    themeConfigured: false,
    passageExplored: false,
    studyGenerated: false,
    outlineCreated: false,
    manuscriptWritten: false,
    refineCompleted: false,
    deliverPrepared: false,
  }

  return (
    <div className="space-y-6">
      <div className="bg-black/40 backdrop-blur border-b border-white/10 rounded-2xl overflow-hidden">
        <div className="container mx-auto px-1 py-4 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">Clever Sermon</p>
            <h1 className="text-2xl font-bold text-white">
              {state?.workspace?.title || 'Workspace Core'}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/60">Main Passage</p>
            <p className="text-sm text-cyan-100/90">{state?.workspace?.mainPassage || 'Loading...'}</p>
          </div>
        </div>
      </div>

      <PhaseNavigation activePhase={state?.activePhase || 'THEME'} onPhaseChange={onPhaseChange} progress={progress} />

      <div className="container mx-auto px-1">
        <WorkspaceStateSummary workspaceId={workspaceId} state={state} />
      </div>

      {onSectionChange && (
        <div className="container mx-auto px-1">
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                { section: 'workspace', label: 'Workspace' },
                { section: 'scripture', label: 'Scripture' },
                { section: 'study-report', label: 'Study Report' },
                { section: 'outlines', label: 'Outlines' },
                { section: 'manuscript', label: 'Manuscript' },
                { section: 'citations', label: 'Citations' },
                { section: 'dna', label: 'DNA' },
                { section: 'media', label: 'Media' },
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
