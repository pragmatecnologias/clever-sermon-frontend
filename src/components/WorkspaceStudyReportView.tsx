'use client'

type WorkspaceStudyReportSections = {
  passageOverview?: string
  overview?: string
  summary?: string
  literaryContext?: string
  historicalContext?: string
  canonicalContext?: string
  canonicalConnections?: string
  canonicalThemes?: string
  mainTheologicalClaim?: string
  theologicalInsights?: string
  exegeticalSummary?: string
  summaryStatement?: string
  exegeticalFlow?: unknown[]
  argumentFlow?: unknown[]
  flow?: unknown[]
  theologicalThemes?: unknown[]
  keyThemes?: unknown[]
  themes?: unknown[]
  pastoralImplications?: unknown[] | Record<string, unknown>
  practicalApplications?: unknown[]
  applications?: unknown[]
  structureOfPassage?: unknown[]
  structuralAnalysis?: unknown[]
  crossReferences?: unknown[]
  interpretiveChallenges?: unknown[]
}

type Props = {
  report: { sections?: WorkspaceStudyReportSections } | null | undefined
  onJumpToWordStudy: (term: string) => void
}

export function WorkspaceStudyReportView({ report, onJumpToWordStudy }: Props) {
  const sections = report?.sections || {}
  if (!report) {
    return (
      <div className="rounded-xl border border-dashed border-cyan-400/30 bg-black/20 p-4">
        <p className="text-sm text-gray-100/90">No study notes yet.</p>
        <p className="mt-1 text-xs text-gray-400">
          Load the passage first, then generate study notes to see the main ideas, context, and themes.
        </p>
      </div>
    )
  }

  const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
  const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
  const thematicClaim = str(sections.mainTheologicalClaim || sections.theologicalInsights || '')
  const legacyThemes = arr(sections.theologicalThemes || sections.keyThemes || sections.themes)
  const legacyImplications = arr(sections.pastoralImplications || sections.practicalApplications || sections.applications)
  const exegeticalFlow = arr(sections.exegeticalFlow || sections.argumentFlow || sections.flow)
  const exegeticalSummary = str(sections.exegeticalSummary || sections.summaryStatement)

  const reportTextForTiming = [
    str(sections.passageOverview || sections.overview || sections.summary),
    str(sections.literaryContext),
    str(sections.historicalContext),
    str(sections.canonicalContext || sections.canonicalConnections || sections.canonicalThemes),
    thematicClaim,
    exegeticalSummary,
    ...exegeticalFlow.map(String),
    ...legacyThemes.map(String),
    ...legacyImplications.map(String),
  ]
    .join(' ')
    .trim()
  const readMinutes = Math.max(1, Math.ceil(reportTextForTiming.split(/\s+/).filter(Boolean).length / 180))

  const reportBlocks = [
    { key: 'passageOverview', title: 'Passage Overview', content: str(sections.passageOverview || sections.overview || sections.summary) },
    { key: 'literaryContext', title: 'Literary Context', content: str(sections.literaryContext) },
    { key: 'historicalContext', title: 'Historical Context', content: str(sections.historicalContext) },
    { key: 'canonicalContext', title: 'Canonical Context', content: str(sections.canonicalContext || sections.canonicalConnections || sections.canonicalThemes) },
    { key: 'mainTheologicalClaim', title: 'Main Theological Claim', content: thematicClaim, highlight: true },
  ]

  const nonEmptyBlocks = reportBlocks.filter((item) => item.content)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4 flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-cyan-200/80">Study Report</p>
        <p className="text-xs text-gray-300">{readMinutes} minute read</p>
      </div>

      {nonEmptyBlocks.map((block) => (
        <details
          key={block.key}
          open
          className={`rounded-xl border p-4 ${block.highlight ? 'border-cyan-400/40 bg-cyan-500/10' : 'border-white/10 bg-black/20'}`}
        >
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">{block.title}</summary>
          <p className="mt-2 text-sm text-gray-100/90 leading-relaxed">{block.content}</p>
        </details>
      ))}

      {exegeticalFlow.length ? (
        <details open className="rounded-xl border border-white/10 bg-black/20 p-4">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">Exegetical Flow</summary>
          <ol className="mt-3 list-decimal list-inside text-sm text-gray-100/90 space-y-1">
            {exegeticalFlow.map((step, idx: number) => (
              <li key={`flow-${idx}`}>{String(step)}</li>
            ))}
          </ol>
        </details>
      ) : null}

      {legacyThemes.length ? (
        <details open className="rounded-xl border border-white/10 bg-black/20 p-4">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">Key Themes</summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {legacyThemes.map((theme, idx: number) => {
              const value = String(theme || '').trim()
              if (!value) return null
              return (
                <button
                  key={`theme-${idx}`}
                  type="button"
                  onClick={() => onJumpToWordStudy(value)}
                  className="text-xs px-2 py-1 rounded-full border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/10"
                >
                  {value}
                </button>
              )
            })}
          </div>
        </details>
      ) : null}
    </div>
  )
}

export default WorkspaceStudyReportView
