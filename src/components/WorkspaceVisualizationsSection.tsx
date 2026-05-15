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
  return (
    <div className="space-y-6 relative min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">Visualizations</p>
          <h3 className="text-2xl font-semibold">3D Insight Tools</h3>
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
            Canonical Constellation, Prophecy Web, Sanctuary connections, and Narrative Map belong to passage discovery.
          </p>
        </div>
        <div className="cyber-panel rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-2">Refine</p>
          <p className="text-sm text-gray-200/80">
            Sermon Flow Sculptor belongs to refinement. Use it after outline and manuscript work to test movement and grounding.
          </p>
        </div>
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
              <p className="text-base text-cyan-100 mb-2">Where does this passage connect across Scripture?</p>
              <p className="text-sm text-gray-200/80 mb-4">
                Visualize cross-testament connections for {workspace.mainPassage}.
              </p>
              <InteractiveCanonicalConstellation focusPassage={workspace.mainPassage} />
            </div>

            {workspace.mainPassage && /Daniel|Revelation|Hebrews|Leviticus|Exodus 25/.test(workspace.mainPassage) && (
              <div className="cyber-panel rounded-2xl p-6">
                <h4 className="text-lg font-semibold mb-2">Sanctuary & Prophecy Connections</h4>
                <p className="text-sm text-gray-200/80 mb-4">
                  Trace sanctuary and prophetic connections for {workspace.mainPassage}.
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
              <p className="text-base text-cyan-100 mb-2">How do prophecy and fulfillment relate?</p>
              <p className="text-sm text-gray-200/80 mb-4">
                Explore Daniel/Revelation connections and thematic threads.
              </p>
              <InteractiveProphecyWeb theme="all" />
            </div>

            <div className="cyber-panel rounded-2xl p-6">
              <h4 className="text-lg font-semibold mb-2">Biblical Narrative Map</h4>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-2">What This Answers</p>
              <p className="text-base text-cyan-100 mb-2">Where does this passage sit in the redemptive storyline?</p>
              <p className="text-sm text-gray-200/80 mb-4">
                Timeline map from Creation to New Creation with canonical links around {workspace.mainPassage}.
              </p>
              <BiblicalNarrativeMap focusPassage={workspace.mainPassage} />
            </div>
          </>
        )}

        {visualizationMode === 'refine' && (
          <div className="cyber-panel rounded-2xl p-6">
            <h4 className="text-lg font-semibold mb-2">Sermon Flow Sculptor</h4>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-2">What This Answers</p>
            <p className="text-base text-cyan-100 mb-2">Is my sermon structurally and biblically grounded?</p>
            <p className="text-sm text-gray-200/80 mb-4">
              Map your outline into a spatial integrity model.
            </p>
            {(() => {
              const selectedOutline = (workspace.outlines?.find((o: any) => o.isSelected) || workspace.outlines?.[0])?.structure || {}
              const selectedPointNodes = getOutlinePointNodes(selectedOutline)
              return (
                <InteractiveSermonFlowSculptor
                  bigIdea={workspace.theme || workspace.title}
                  points={selectedOutline?.points || []}
                  applications={selectedPointNodes.flatMap((point: any) => point.applications || []).length
                    ? selectedPointNodes.flatMap((point: any) => point.applications || [])
                    : (workspace.applications || []).map((app: any) => app.content)}
                  supportingVerses={{}}
                  illustrations={selectedPointNodes.flatMap((point: any) => point.illustrationIdeas || []).length
                    ? selectedPointNodes.flatMap((point: any) => point.illustrationIdeas || [])
                    : (workspace.illustrations || []).map((ill: any) => ill.content)}
                />
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
