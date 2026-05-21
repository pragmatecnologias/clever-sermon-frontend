'use client'

import { Book } from 'lucide-react'
import SermonCore, { SermonCoreData } from '@/components/SermonCore'
import WorkspaceOutlineControls from '@/components/WorkspaceOutlineControls'
import { renderCollapsibleMarkdown, renderOutlinePointSection } from '@/components/workspace-render.helpers'
import type {
  WorkspaceFlowNarrativeEntry,
  WorkspaceOutlineDraft,
  WorkspaceOutlineItem,
  WorkspaceOutlinePoint,
  WorkspaceOutlineStructure,
} from '@/components/workspace-domain.types'

interface WorkspaceOutlinePhaseProps {
  workspace: {
    id?: string
    mainPassage?: string
    theme?: string
    theologicalLens?: string
    egwEnabled?: boolean
    outlines?: WorkspaceOutlineItem[]
    studyReports?: Array<{ sections?: Record<string, unknown> }>
    sermonCore?: SermonCoreData | null
  }
  workspaceState: {
    activeOutline?: { id?: string } | null
  } | null
  actionLoading: string[]
  sermonCoreGenerating: boolean
  getPassageFocusText: () => string
  getOutlinePointNodes: (structure: WorkspaceOutlineStructure | Record<string, unknown> | undefined) => WorkspaceOutlinePoint[]
  estimatePointMinutes: (point: WorkspaceOutlinePoint) => number
  getFlowNarrativeEntries: (outline: WorkspaceOutlineItem, pointNodes: WorkspaceOutlinePoint[]) => WorkspaceFlowNarrativeEntry[]
  getOutlineTitle: (outline: WorkspaceOutlineItem) => string
  getOutlineBigIdea: (outline: WorkspaceOutlineItem) => string
  expandedTextBlocks: Record<string, boolean>
  toggleTextBlock: (key: string) => void
  openReferencePreview: (reference: string, context?: string) => void
  onOpenPromptEditor: (type: 'outline') => void
  onGenerateOutlines: () => void
  onGenerateSermonCore: () => Promise<SermonCoreData | null>
  onSermonCoreChange: (data: SermonCoreData) => Promise<void>
  onSelectOutline: (outlineId: string) => Promise<void>
  editingOutlineId: string | null
  outlineDraft: WorkspaceOutlineDraft | null
  setEditingOutlineId: (id: string | null) => void
  setOutlineDraft: (draft: WorkspaceOutlineDraft | null) => void
  handleOutlineSave: () => Promise<void>
  expandedOutlineId: string | null
  setExpandedOutlineId: (updater: (prev: string | null) => string | null) => void
}

export default function WorkspaceOutlinePhase({
  workspace,
  workspaceState,
  actionLoading,
  sermonCoreGenerating,
  getPassageFocusText,
  getOutlinePointNodes,
  estimatePointMinutes,
  getFlowNarrativeEntries,
  getOutlineTitle,
  getOutlineBigIdea,
  expandedTextBlocks,
  toggleTextBlock,
  openReferencePreview,
  onOpenPromptEditor,
  onGenerateOutlines,
  onGenerateSermonCore,
  onSermonCoreChange,
  onSelectOutline,
  editingOutlineId,
  outlineDraft,
  setEditingOutlineId,
  setOutlineDraft,
  handleOutlineSave,
  expandedOutlineId,
  setExpandedOutlineId,
}: WorkspaceOutlinePhaseProps) {
  const outlines = Array.isArray(workspace?.outlines) ? [...workspace.outlines] : []
  const activeOutlineId = workspaceState?.activeOutline?.id || outlines.find((outline) => outline?.isSelected)?.id || null

  return (
    <div className="space-y-4 relative min-h-full">
      <SermonCore
        workspaceId={workspace?.id || ''}
        mainPassage={workspace?.mainPassage || ''}
        theme={workspace?.theme}
        theologicalLens={workspace?.theologicalLens}
        studyReport={(workspace as any)?.workspace?.studyReports?.[0]?.sections ?? workspace?.studyReports?.[0]?.sections}
        initialData={workspace?.sermonCore ?? undefined}
        onDataChange={onSermonCoreChange}
        onGenerate={onGenerateSermonCore}
        onUseInOutline={onGenerateOutlines}
        isGenerating={sermonCoreGenerating}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold">Outlines</h3>
          {workspace?.egwEnabled && (
            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/40 flex items-center gap-1">
              <Book className="w-3 h-3" />
              EGW Enabled
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenPromptEditor('outline')}
            className="cyber-outline text-xs px-4 py-2 rounded-full"
          >
            Prompt
          </button>
          <button
            onClick={onGenerateOutlines}
            className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60"
            disabled={actionLoading.includes('outlines')}
          >
            {actionLoading.includes('outlines') ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {outlines.length ? (
        <div className="space-y-4">
          <div className="border border-cyan-400/30 rounded-xl p-4 bg-cyan-500/10">
            <p className="text-[11px] uppercase tracking-widest text-cyan-200/80">Passage Focus</p>
            <p className="text-sm text-cyan-100/95 mt-1">
              {getPassageFocusText() || `${workspace.mainPassage} is the controlling passage for this sermon movement.`}
            </p>
          </div>

          {[...outlines]
            .sort((a, b) => Number(Boolean(b?.isSelected)) - Number(Boolean(a?.isSelected)))
            .map((outline) => {
              const pointNodes = getOutlinePointNodes(outline.structure)
              const isExpanded = expandedOutlineId === outline.id || Boolean(outline.isSelected) || activeOutlineId === outline.id
              const totalMinutes = pointNodes.reduce((sum: number, point) => sum + estimatePointMinutes(point), 6)
              const flowNarrativeEntries = getFlowNarrativeEntries(outline, pointNodes)
              const isActive = activeOutlineId === outline.id || Boolean(outline.isSelected)
              const selectionLoadingKey = `outline-select-${outline.id}`

              return (
                <div
                  key={outline.id}
                  className={`border rounded-xl p-4 transition-all ${
                    isActive
                      ? 'border-cyan-300/70 bg-cyan-500/10 ring-1 ring-cyan-300/60 shadow-[0_0_24px_rgba(34,211,238,0.22)]'
                      : 'border-white/10 bg-black/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-cyan-300">{getOutlineTitle(outline)}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {isActive && <span className="cyber-tag">Active outline</span>}
                      </div>
                    </div>
                    <WorkspaceOutlineControls
                      isActive={isActive}
                      isExpanded={isExpanded}
                      selectionLoading={actionLoading.includes(selectionLoadingKey)}
                      onSelect={() => onSelectOutline(outline.id)}
                      onToggleExpand={() => setExpandedOutlineId((prev) => (prev === outline.id ? null : outline.id))}
                      onEdit={() => {
                        setEditingOutlineId(outline.id)
                        setOutlineDraft({
                          id: outline.id,
                          title: outline.title || '',
                          introduction: outline.structure?.introduction || '',
                          points: outline.structure?.points || [],
                          pointNodes: Array.isArray(outline.structure?.pointNodes) ? outline.structure.pointNodes : [],
                          conclusion: outline.structure?.conclusion || '',
                          callToAction: outline.structure?.callToAction || '',
                        })
                      }}
                      outlineType={outline?.structure?.outlineType}
                    />
                  </div>

                  <div className="space-y-3 mb-3">
                    <div className="grid md:grid-cols-12 gap-3">
                      <div className="md:col-span-8 border border-white/10 rounded-xl p-3 bg-black/20">
                        <p className="text-[10px] uppercase tracking-widest cyber-muted">Big Idea</p>
                        <div className="mt-1">
                          {renderCollapsibleMarkdown(getOutlineBigIdea(outline), `${outline.id}-bigidea`, expandedTextBlocks, toggleTextBlock, 'max-h-20')}
                        </div>
                      </div>
                      <div className="md:col-span-4 border border-white/10 rounded-xl p-3 bg-black/20">
                        <p className="text-[10px] uppercase tracking-widest cyber-muted">Estimated Timing</p>
                        <p className="text-sm text-gray-100/95 mt-1">{totalMinutes} minutes</p>
                        <p className="text-xs text-gray-300 mt-1">Intro 3 • Body {Math.max(1, totalMinutes - 6)} • Conclusion 3</p>
                      </div>
                    </div>
                    <div className="border border-white/10 rounded-xl p-3 bg-black/20">
                      <p className="text-[10px] uppercase tracking-widest cyber-muted">Flow</p>
                      <div className="mt-3 overflow-x-auto pb-1">
                        <div className="flex items-stretch gap-2 min-w-max pr-1">
                        {flowNarrativeEntries.map((entry, index: number) => (
                          <div key={`${outline.id}-flow-detail-${entry.id}`} className="flex items-stretch gap-2">
                              <div className="w-72 border border-cyan-400/20 rounded-lg p-3 bg-cyan-500/5">
                                <p className="text-[10px] uppercase tracking-widest text-cyan-300/90">{entry.label}</p>
                                <p className="text-sm text-cyan-100 font-medium mt-1 leading-relaxed">{entry.title}</p>
                                <div className="mt-2 text-xs">
                                  {renderCollapsibleMarkdown(entry.detail, `${outline.id}-flow-detail-${entry.id}`, expandedTextBlocks, toggleTextBlock, 'max-h-20')}
                                </div>
                              </div>
                              {index < flowNarrativeEntries.length - 1 && (
                                <div className="flex items-center text-cyan-300/80 px-1 text-lg">→</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {editingOutlineId === outline.id && outlineDraft ? (
                    <div className="space-y-3">
                      <label className="text-xs uppercase tracking-widest cyber-muted">Outline Title</label>
                      <input
                        value={outlineDraft.title}
                        onChange={(e) => setOutlineDraft({ ...outlineDraft, title: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                      />
                      <label className="text-xs uppercase tracking-widest cyber-muted">Introduction</label>
                      <textarea
                        value={outlineDraft.introduction}
                        onChange={(e) => setOutlineDraft({ ...outlineDraft, introduction: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                        rows={2}
                      />
                      <label className="text-xs uppercase tracking-widest cyber-muted">Main Points (one per line)</label>
                      <textarea
                        value={outlineDraft.points?.join('\n')}
                        onChange={(e) => setOutlineDraft({ ...outlineDraft, points: e.target.value.split('\n').filter(Boolean) })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                        rows={4}
                      />
                      <label className="text-xs uppercase tracking-widest cyber-muted">Conclusion</label>
                      <textarea
                        value={outlineDraft.conclusion}
                        onChange={(e) => setOutlineDraft({ ...outlineDraft, conclusion: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                        rows={2}
                      />
                      <label className="text-xs uppercase tracking-widest cyber-muted">Call To Action</label>
                      <textarea
                        value={outlineDraft.callToAction}
                        onChange={(e) => setOutlineDraft({ ...outlineDraft, callToAction: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleOutlineSave}
                          className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60"
                          disabled={actionLoading.includes('outline-edit')}
                        >
                          {actionLoading.includes('outline-edit') ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingOutlineId(null)
                            setOutlineDraft(null)
                          }}
                          className="cyber-outline text-xs px-4 py-2 rounded-full"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : isExpanded ? (
                    <div className="text-sm text-gray-100/90 space-y-3">
                      {pointNodes.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-widest cyber-muted">Main Points</p>
                          {pointNodes.map((point, index: number) => {
                            const supportingVerses = Array.isArray(point.supportingVerses) ? point.supportingVerses : []
                            const insightText = point.summary || point.movement || ''
                            return (
                              <div key={`${outline.id}-point-${index}`} className="border border-white/10 rounded-xl p-3 bg-black/20">
                                <p className="font-semibold text-white leading-relaxed">
                                  {index + 1}. {point.title}
                                </p>
                                {(point.summary || point.movement) && (
                                  <div className="mt-2 border border-cyan-400/20 rounded-lg p-2 bg-cyan-500/5">
                                    <p className="text-[10px] uppercase tracking-widest text-cyan-300/90">Preaching Insight</p>
                                    {renderCollapsibleMarkdown(insightText, `${outline.id}-${index}-insight`, expandedTextBlocks, toggleTextBlock, 'max-h-20')}
                                  </div>
                                )}
                                {renderOutlinePointSection('Subpoints', point.subpoints, `${outline.id}-${index}-subpoints`, expandedTextBlocks, toggleTextBlock, 'text-gray-200')}
                                {renderOutlinePointSection(
                                  'Supporting Verses',
                                  supportingVerses,
                                  `${outline.id}-${index}-verses`,
                                  expandedTextBlocks,
                                  toggleTextBlock,
                                  'text-cyan-200',
                                  (verse: string) => {
                                    openReferencePreview(
                                      verse,
                                      point.summary || point.movement || 'This verse reinforces the point through direct thematic support.',
                                    )
                                  },
                                )}
                                {renderOutlinePointSection('Themes', point.canonicalThemes, `${outline.id}-${index}-themes`, expandedTextBlocks, toggleTextBlock, 'text-emerald-200')}
                                {renderOutlinePointSection('Applications', point.applications, `${outline.id}-${index}-apps`, expandedTextBlocks, toggleTextBlock, 'text-amber-200')}
                                {renderOutlinePointSection('Discussion Questions', point.discussionQuestions, `${outline.id}-${index}-questions`, expandedTextBlocks, toggleTextBlock, 'text-sky-200')}
                                {renderOutlinePointSection('Illustration Ideas', point.illustrationIdeas, `${outline.id}-${index}-illustrations`, expandedTextBlocks, toggleTextBlock, 'text-rose-200')}
                                {renderOutlinePointSection('Media Suggestions', point.mediaSuggestions, `${outline.id}-${index}-media`, expandedTextBlocks, toggleTextBlock, 'text-violet-200')}
                                {Array.isArray(point.egwSupport) && point.egwSupport.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-[10px] uppercase tracking-widest text-cyan-300/90 mb-2">EGW Support</p>
                                    <div className="space-y-2">
                                      {point.egwSupport.map((item, egwIndex: number) => (
                                        <div key={`${outline.id}-${index}-egw-${egwIndex}`} className="border border-blue-400/20 rounded-lg p-3 bg-blue-500/5">
                                          {(item?.citation || item?.reference) && (
                                            <p className="text-xs font-semibold text-blue-200">{item?.citation || item?.reference}</p>
                                          )}
                                          {(item?.quote || item?.text) && (
                                            <p className="text-xs text-gray-100/90 mt-1 leading-relaxed">{item?.quote || item?.text}</p>
                                          )}
                                          {item?.relevance && (
                                            <p className="text-[11px] text-blue-200/80 mt-1">{item.relevance}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {renderOutlinePointSection('References', point.references, `${outline.id}-${index}-references`, expandedTextBlocks, toggleTextBlock, 'text-fuchsia-200')}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-300">Collapsed. Expand to view full structure.</p>
                  )}
                </div>
              )
            })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-cyan-400/30 bg-black/20 p-4">
          <p className="text-gray-100/90">No outline yet.</p>
          <p className="mt-1 text-xs text-gray-400">
            Generate study notes first, then build an outline from the main passage movement.
          </p>
        </div>
      )}
    </div>
  )
}
