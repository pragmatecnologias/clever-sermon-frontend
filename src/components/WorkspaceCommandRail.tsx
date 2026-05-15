import ProgressIndicator from '@/components/ProgressIndicator'
import NextStepSuggestion from '@/components/NextStepSuggestion'
import { Phase } from '@/components/PhaseNavigation'
import { WorkspaceSection, sectionPhaseMap } from '@/components/workspace-shell.types'

type WorkspaceLike = {
  title?: string
  mainPassage?: string
  status?: string
  language?: string
}

type Props = {
  workspace: WorkspaceLike
  advancedMode: boolean
  progress: {
    themeConfigured: boolean
    passageExplored: boolean
    studyGenerated: boolean
    outlineCreated: boolean
    manuscriptWritten: boolean
    refineCompleted: boolean
    deliverPrepared: boolean
  }
  activeSection: WorkspaceSection
  activePhase: Phase
  onSectionChange: (section: WorkspaceSection) => void
  onPhaseChange: (phase: Phase) => void
  onVisualizationModeChange: (mode: 'passage' | 'refine') => void
  onToggleAdvancedMode: (enabled: boolean) => void
  onCloseRail: () => void
  onNextStepAction: (action: string) => void
}

export default function WorkspaceCommandRail({
  workspace,
  advancedMode,
  progress,
  activeSection,
  activePhase,
  onSectionChange,
  onPhaseChange,
  onVisualizationModeChange,
  onToggleAdvancedMode,
  onCloseRail,
  onNextStepAction,
}: Props) {
  const sectionNavButton = (key: WorkspaceSection, label: string) => (
    <button
      key={key}
      onClick={() => {
        onSectionChange(key)
        const nextPhase = sectionPhaseMap[key]
        if (nextPhase) onPhaseChange(nextPhase)
        if (key === 'visualizations') {
          onVisualizationModeChange(nextPhase === 'REFINE' ? 'refine' : 'passage')
        }
        onCloseRail()
      }}
      className={
        activeSection === key
          ? 'cyber-button text-xs px-3 py-2 rounded-xl w-full text-left'
          : 'cyber-outline text-xs px-3 py-2 rounded-xl w-full text-left'
      }
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-4">
      <ProgressIndicator progress={progress} />
      <NextStepSuggestion progress={progress} onAction={onNextStepAction} />

      <div className="cyber-panel rounded-2xl p-4 space-y-3">
        <p className="text-xs uppercase tracking-widest cyber-muted">Workspace</p>
        <h2 className="text-xl font-semibold text-white">{workspace.title || 'Workspace'}</h2>
        <p className="text-sm text-cyan-200/80">{workspace.mainPassage}</p>
        <div className="flex items-center gap-2">
          <span className="cyber-tag">{workspace.status}</span>
          <button
            onClick={() => {
              onPhaseChange('THEME')
              onSectionChange('workspace')
              onCloseRail()
            }}
            className="cyber-outline text-xs px-3 py-1 rounded-full"
          >
            Details
          </button>
        </div>
        <p className="text-xs cyber-muted">Language: {workspace.language || 'en'}</p>
      </div>

      <div className="cyber-panel rounded-2xl p-4 space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-cyan-200/70">Theme</p>
        {sectionNavButton('workspace', 'Workspace')}
        <p className="text-[10px] uppercase tracking-widest text-cyan-200/70">Passage</p>
        {sectionNavButton('scripture', 'Scripture')}
        {sectionNavButton('word-study', 'Word Study')}
        {sectionNavButton('cross-references', 'Cross References')}
        {advancedMode ? sectionNavButton('visualizations', 'Visualizations') : null}
        <p className="text-[10px] uppercase tracking-widest text-cyan-200/70 pt-2">Study</p>
        {sectionNavButton('study-report', 'Study Report')}
        <p className="text-[10px] uppercase tracking-widest text-cyan-200/70 pt-2">Outline</p>
        {sectionNavButton('outlines', 'Outlines')}
        <p className="text-[10px] uppercase tracking-widest text-cyan-200/70 pt-2">Write</p>
        {sectionNavButton('manuscript', 'Manuscript')}
        {sectionNavButton('citations', 'Citations')}
        <p className="text-[10px] uppercase tracking-widest text-cyan-200/70 pt-2">Refine</p>
        {sectionNavButton('coach', 'Socratic Coach')}
        {sectionNavButton('dna', 'Sermon DNA')}
        {advancedMode ? (
          <button
            onClick={() => {
              onPhaseChange('REFINE')
              onVisualizationModeChange('refine')
              onSectionChange('visualizations')
              onCloseRail()
            }}
            className={
              activeSection === 'visualizations' && activePhase === 'REFINE'
                ? 'cyber-button text-xs px-3 py-2 rounded-xl w-full text-left'
                : 'cyber-outline text-xs px-3 py-2 rounded-xl w-full text-left'
            }
          >
            Flow Tools
          </button>
        ) : (
          <button
            onClick={() => onToggleAdvancedMode(true)}
            className="cyber-outline text-xs px-3 py-2 rounded-xl w-full text-left"
          >
            Enable Advanced Mode
          </button>
        )}
        <p className="text-[10px] uppercase tracking-widest text-cyan-200/70 pt-2">Deliver</p>
        {sectionNavButton('media', 'Media')}
        <p className="text-[10px] uppercase tracking-widest text-cyan-200/70 pt-2">Settings</p>
        {sectionNavButton('church-settings', 'Church Settings')}
      </div>
    </div>
  )
}
