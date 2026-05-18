'use client'

import InteractiveCanonicalConstellation from '@/components/InteractiveCanonicalConstellation'
import SanctuaryProphecyMapper from '@/components/SanctuaryProphecyMapper'
import InteractiveProphecyWeb from '@/components/InteractiveProphecyWeb'
import InteractiveSermonFlowSculptor from '@/components/InteractiveSermonFlowSculptor'
import BiblicalNarrativeMap from '@/components/BiblicalNarrativeMap'

interface WorkspaceVisualizationsSectionProps {
  workspace: any
  visualizationMode: 'passage' | 'refine'
  setVisualizationMode: (mode: 'passage' | 'refine') => void
  setActivePhase: (phase: any) => void
}

function getOutlinePointNodes(structure: any) {
  const points = Array.isArray(structure?.points) ? structure.points : []
  return points.map((point: any) => ({
    ...point,
    applications: Array.isArray(point?.applications) ? point.applications : [],
    illustrationIdeas: Array.isArray(point?.illustrationIdeas) ? point.illustrationIdeas : [],
  }))
}

export default function WorkspaceVisualizationsSection({
  workspace,
  visualizationMode,
  setVisualizationMode,
  setActivePhase,
}: WorkspaceVisualizationsSectionProps) {
  const hasOutline = Array.isArray(workspace?.outlines) && workspace.outlines.length > 0
  const hasManuscript = Array.isArray(workspace?.manuscripts) && workspace.manuscripts.length > 0
  const visualPrerequisiteMessage = !workspace?.mainPassage
    ? 'Add a main passage first so these maps can anchor to the sermon text.'
    : !hasOutline && !hasManuscript
      ? 'Create an outline or manuscript to unlock deeper visual analysis.'
      : 'These tools read the current passage, outline, manuscript, and sermon theme.'
  const selectedOutline = (workspace?.outlines?.find((o: any) => o.isSelected) || workspace?.outlines?.[0])?.structure || {}
  const selectedPointNodes = getOutlinePointNodes(selectedOutline)
  const outlinePointCount = Array.isArray(selectedOutline?.points) ? selectedOutline.points.length : 0
  const applicationCount = selectedPointNodes.flatMap((point: any) => point.applications || []).length
  const illustrationCount = selectedPointNodes.flatMap((point: any) => point.illustrationIdeas || []).length
  const workspaceLabel = workspace?.title || 'No workspace selected'
  const passageLabel = workspace?.mainPassage || 'No passage selected'

  return (
    <div className="space-y-6 relative min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">Visualizations</p>
          <h3 className="text-2xl font-semibold">3D Insight Tools</h3>
          <p className="mt-2 text-sm text-gray-200/80 max-w-3xl">{visualPrerequisiteMessage}</p>
          <p className="mt-2 text-xs text-cyan-100/70">
            Use this section to see how your sermon connects to broader theological patterns before you polish the manuscript.
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="cyber-panel rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-1">Workspace</p>
          <p className="text-sm text-gray-100">{workspaceLabel}</p>
        </div>
        <div className="cyber-panel rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-1">Passage</p>
          <p className="text-sm text-gray-100">{passageLabel}</p>
        </div>
        <div className="cyber-panel rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-1">Outline</p>
          <p className="text-sm text-gray-100">{outlinePointCount ? `${outlinePointCount} point(s)` : 'No outline yet'}</p>
        </div>
        <div className="cyber-panel rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-1">Support</p>
          <p className="text-sm text-gray-100">
            {applicationCount || illustrationCount ? `${applicationCount} application(s), ${illustrationCount} illustration(s)` : 'Add outline detail to deepen the map'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setVisualizationMode('passage')
            setActivePhase('PASSAGE')
          }}
          className={visualizationMode === 'passage' ? 'cyber-button text-xs px-4 py-2 rounded-full' : 'cyber-outline text-xs px-4 py-2 rounded-full'}
        >
          Passage Tools
        </button>
        <button
          onClick={() => {
            setVisualizationMode('refine')
            setActivePhase('REFINE')
          }}
          className={visualizationMode === 'refine' ? 'cyber-button text-xs px-4 py-2 rounded-full' : 'cyber-outline text-xs px-4 py-2 rounded-full'}
        >
          Refine Flow
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="cyber-panel rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-2">Passage</p>
          <p className="text-sm text-gray-200/80">
            Canonical Constellation, Prophecy Web, Sanctuary connections, and Narrative Map belong to passage discovery. Use them while shaping the sermon core and study report.
          </p>
          <p className="mt-3 text-xs text-cyan-100/70">
            Inputs used: current passage, theme, study report, outline, and manuscript when they exist.
          </p>
        </div>
        <div className="cyber-panel rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-2">Refine</p>
          <p className="text-sm text-gray-200/80">
            Sermon Flow Sculptor belongs to refinement. Use it after outline and manuscript work to test movement, grounding, and delivery balance.
          </p>
          <p className="mt-3 text-xs text-cyan-100/70">
            Inputs used: outline points, applications, illustrations, manuscript cues, and claim support.
          </p>
        </div>
      </div>
      <div className="cyber-panel rounded-2xl p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-2">How To Read These Tools</p>
        <p className="text-sm text-gray-200/80">
          Each visual tool explains a relationship inside the current sermon. If a prerequisite is missing, use Setup, Scripture, Deep Study, Sermon Core, or Outline to create the inputs first.
        </p>
        <p className="mt-2 text-xs text-cyan-100/70">
          When a tool is unavailable, it usually means the passage has not been loaded, the outline/manuscript is missing, or the required seed/service is not configured.
        </p>
      </div>
      <div className="cyber-panel rounded-2xl p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-2">Legend</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded-full border border-cyan-400/40 bg-cyan-500/10 text-cyan-200">solid = quotation / fulfillment</span>
          <span className="px-2 py-1 rounded-full border border-green-400/40 bg-green-500/10 text-green-200">dashed = thematic</span>
          <span className="px-2 py-1 rounded-full border border-purple-400/40 bg-purple-500/10 text-purple-200">dotted = typology / lexical</span>
          <span className="px-2 py-1 rounded-full border border-red-400/40 bg-red-500/10 text-red-200">red warnings = weak grounding</span>
        </div>
      </div>
      <div className="space-y-6">
        {visualizationMode === 'passage' && (
          <>
            <div className="cyber-panel rounded-2xl p-6">
              <h4 className="text-lg font-semibold mb-2">Canonical Constellation</h4>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-2">What This Answers</p>
              <p className="text-base text-cyan-100 mb-2">Where does this passage connect across Scripture and how does that shape the sermon?</p>
              <p className="text-sm text-gray-200/80 mb-4">
                Visualize cross-testament connections for {passageLabel}. Start here when you want to see canonical links that support the current theme or outline.
              </p>
              <InteractiveCanonicalConstellation focusPassage={workspace.mainPassage} />
            </div>

            {workspace.mainPassage && /Daniel|Revelation|Hebrews|Leviticus|Exodus 25/.test(workspace.mainPassage) && (
              <div className="cyber-panel rounded-2xl p-6">
                <h4 className="text-lg font-semibold mb-2">Sanctuary & Prophecy Connections</h4>
                <p className="text-sm text-gray-200/80 mb-4">
                  Trace sanctuary and prophetic connections for {passageLabel}.
                </p>
                <SanctuaryProphecyMapper
                  passage={workspace.mainPassage}
                  mode={/Daniel|Revelation/.test(workspace.mainPassage) ? 'prophecy' : 'sanctuary'}
                  language={workspace.language || 'en'}
                />
              </div>
            )}

            <div className="cyber-panel rounded-2xl p-6">
              <h4 className="text-lg font-semibold mb-2">Prophecy Fulfillment Web</h4>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-2">What This Answers</p>
              <p className="text-base text-cyan-100 mb-2">How do prophecy and fulfillment relate, and when should the sermon lean on that pattern?</p>
              <p className="text-sm text-gray-200/80 mb-4">
                Explore Daniel/Revelation connections and thematic threads when your passage or outline points in that direction.
              </p>
              <InteractiveProphecyWeb theme="all" />
            </div>

            <div className="cyber-panel rounded-2xl p-6">
              <h4 className="text-lg font-semibold mb-2">Biblical Narrative Map</h4>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-2">What This Answers</p>
              <p className="text-base text-cyan-100 mb-2">Where does this passage sit in the redemptive storyline and what movement should the sermon follow?</p>
              <p className="text-sm text-gray-200/80 mb-4">
                Timeline map from Creation to New Creation with canonical links around {passageLabel}.
              </p>
              <BiblicalNarrativeMap focusPassage={workspace.mainPassage} />
            </div>
          </>
        )}

        {visualizationMode === 'refine' && (
          <div className="cyber-panel rounded-2xl p-6">
            <h4 className="text-lg font-semibold mb-2">Sermon Flow Sculptor</h4>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-2">What This Answers</p>
            <p className="text-base text-cyan-100 mb-2">Is my sermon structurally and biblically grounded, and does the movement match the outline?</p>
            <p className="text-sm text-gray-200/80 mb-4">
              Map your outline into a spatial integrity model. If you do not have an outline yet, generate one first and return here to test flow.
            </p>
            {(() => {
              return (
                <InteractiveSermonFlowSculptor
                  bigIdea={workspace.theme || workspace.title}
                  points={selectedOutline?.points || []}
                  applications={applicationCount ? selectedPointNodes.flatMap((point: any) => point.applications || []) : (workspace.applications || []).map((app: any) => app.content)}
                  supportingVerses={{}}
                  illustrations={illustrationCount ? selectedPointNodes.flatMap((point: any) => point.illustrationIdeas || []) : (workspace.illustrations || []).map((ill: any) => ill.content)}
                />
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
