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

  const renderGroup = (title: string, items: Array<ReturnType<typeof sectionNavButton> | null>) => (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-cyan-200/70">{title}</p>
      <div className="space-y-2">{items}</div>
    </div>
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

      <div className="cyber-panel rounded-2xl p-4 space-y-4">
        {renderGroup('Setup', [sectionNavButton('workspace', 'Sermon Setup'), sectionNavButton('church-settings', 'Church Details')])}
        {renderGroup('Study', [sectionNavButton('scripture', 'Scripture'), sectionNavButton('study-report', 'Study Notes')])}
        {renderGroup('Draft', [sectionNavButton('outlines', 'Outline'), sectionNavButton('manuscript', 'Manuscript')])}
        {renderGroup('Review', [sectionNavButton('citations', 'Sources & Support')])}
        {renderGroup('Media & Export', [sectionNavButton('media', 'Media & Export')])}

        {advancedMode ? (
          <>
            {renderGroup('Advanced Study Tools', [
              sectionNavButton('word-study', 'Word Study'),
              sectionNavButton('cross-references', 'Cross References'),
            ])}
            {renderGroup('Advanced Review Tools', [
              sectionNavButton('coach', 'Coach'),
              sectionNavButton('dna', 'Sermon DNA'),
              (() => (
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
              ))(),
            ])}
            {renderGroup('Visual Exploration', [
              (() =>
                sectionNavButton('visualizations', 'Visual Exploration'))(),
            ])}
          </>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Optional tools</p>
            <p className="text-xs text-gray-400">Keep these tucked away unless you need deeper study or visual exploration.</p>
            <button
              onClick={() => onToggleAdvancedMode(true)}
              className="cyber-outline text-xs px-3 py-2 rounded-xl w-full text-left"
            >
              Show optional tools
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
