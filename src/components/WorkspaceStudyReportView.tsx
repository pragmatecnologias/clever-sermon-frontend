'use client'

import StudyReportEGWSection from '@/components/StudyReportEGWSection'

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
  preachingFocus?: string
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
  keyTerms?: Array<Record<string, unknown>>
  studyAssets?: {
    movementAssets?: unknown[]
    categoryAssets?: Record<string, unknown>
  }
  egw?: {
    thematicEmphasis?: string
    devotionalInsight?: string
    practicalCounsel?: string
    propheticExpansion?: string
    quotes?: Array<Record<string, unknown>>
  }
}

type Props = {
  report: { sections?: Record<string, unknown> } | null | undefined
  onJumpToWordStudy: (term: string) => void
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const stringValue = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const stringList = (value: unknown) => (Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : [])

const recordList = (value: unknown) => (Array.isArray(value) ? value.filter(isRecord) : [])

export function WorkspaceStudyReportView({ report, onJumpToWordStudy }: Props) {
  const sections = (report?.sections || {}) as WorkspaceStudyReportSections
  if (!report) {
    return (
      <div className="rounded-xl border border-dashed border-cyan-400/30 bg-black/20 p-4">
        <p className="text-sm text-gray-100/90">No study notes yet.</p>
        <p className="mt-1 text-xs text-gray-400">
          Load the passage first, then generate study notes to see the main ideas, context, themes, and support.
        </p>
      </div>
    )
  }

  const passageOverview = stringValue(sections.passageOverview || sections.overview || sections.summary)
  const literaryContext = stringValue(sections.literaryContext)
  const historicalContext = stringValue(sections.historicalContext)
  const canonicalContext = stringValue(sections.canonicalContext || sections.canonicalConnections || sections.canonicalThemes)
  const exegeticalSummary = stringValue(sections.exegeticalSummary || sections.summaryStatement)
  const mainTheologicalClaim = stringValue(sections.mainTheologicalClaim || sections.theologicalInsights)
  const preachingFocus = stringValue(sections.preachingFocus)

  const exegeticalFlow = stringList(sections.exegeticalFlow || sections.argumentFlow || sections.flow)
  const theologicalThemes = stringList(sections.theologicalThemes || sections.keyThemes || sections.themes)
  const implicationsSource = sections.pastoralImplications
  const pastoralImplications = Array.isArray(implicationsSource)
    ? stringList(implicationsSource)
    : isRecord(implicationsSource)
      ? Object.values(implicationsSource).flatMap((item) => stringList(item))
      : []
  const structure = recordList(sections.structureOfPassage || sections.structuralAnalysis)
  const crossReferences = recordList(sections.crossReferences)
  const interpretiveChallenges = recordList(sections.interpretiveChallenges)
  const keyTerms = recordList(sections.keyTerms)

  const studyAssets = sections.studyAssets || {}
  const categoryAssets = isRecord(studyAssets.categoryAssets) ? studyAssets.categoryAssets : {}
  const movementAssets = Array.isArray(studyAssets.movementAssets) ? studyAssets.movementAssets.filter(Boolean) : []
  const studyApplications = stringList(categoryAssets.applications).concat(
    stringList((categoryAssets as Record<string, unknown>).practicalApplications),
    stringList((categoryAssets as Record<string, unknown>).pastoralImplications),
    stringList((categoryAssets as Record<string, unknown>).missionApplications),
    stringList((categoryAssets as Record<string, unknown>).churchApplications),
  )
  const studyQuestions = stringList(categoryAssets.discussionQuestions)
  const studyIllustrations = stringList(categoryAssets.illustrationIdeas)
  const studyMedia = stringList(categoryAssets.mediaSuggestions)
  const studyReferences = stringList(categoryAssets.references)
  const studyEgwSupport = recordList(categoryAssets.egwSupport)
  const reportEgw = sections.egw || null

  const timingText = [
    passageOverview,
    literaryContext,
    historicalContext,
    canonicalContext,
    exegeticalSummary,
    mainTheologicalClaim,
    preachingFocus,
    ...exegeticalFlow,
    ...theologicalThemes,
    ...pastoralImplications,
    ...structure.flatMap((item) => [stringValue(item.movement), stringValue(item.verses), stringValue(item.summary)]),
    ...crossReferences.flatMap((item) => [stringValue(item.reference), stringValue(item.connection)]),
    ...interpretiveChallenges.flatMap((item) => [
      stringValue(item.question),
      stringList(item.interpretationOptions).join(' '),
      stringValue(item.preachingGuidance),
    ]),
    ...keyTerms.flatMap((item) => [stringValue(item.term), stringValue(item.definition), stringValue(item.nuance)]),
  ]
    .join(' ')
    .trim()
  const readMinutes = Math.max(1, Math.ceil(timingText.split(/\s+/).filter(Boolean).length / 180))

  const reportBlocks = [
    { key: 'passageOverview', title: 'Passage Overview', content: passageOverview },
    { key: 'literaryContext', title: 'Literary Context', content: literaryContext },
    { key: 'historicalContext', title: 'Historical Context', content: historicalContext },
    { key: 'canonicalContext', title: 'Canonical Context', content: canonicalContext },
    { key: 'exegeticalSummary', title: 'Exegetical Summary', content: exegeticalSummary },
    { key: 'mainTheologicalClaim', title: 'Main Theological Claim', content: mainTheologicalClaim, highlight: true },
    { key: 'preachingFocus', title: 'Preaching Focus', content: preachingFocus },
  ].filter((item) => item.content)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-cyan-200/80">Study Report</p>
          <p className="mt-1 text-xs text-gray-400">Read-only summary of the study step already generated in this workspace.</p>
        </div>
        <p className="text-xs text-gray-300">{readMinutes} minute read</p>
      </div>

      {reportBlocks.map((block) => (
        <details
          key={block.key}
          open
          className={`rounded-xl border p-4 ${block.highlight ? 'border-cyan-400/40 bg-cyan-500/10' : 'border-white/10 bg-black/20'}`}
        >
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">{block.title}</summary>
          <p className="mt-2 text-sm text-gray-100/90 leading-relaxed whitespace-pre-line">{block.content}</p>
        </details>
      ))}

      {exegeticalFlow.length ? (
        <details open className="rounded-xl border border-white/10 bg-black/20 p-4">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">Exegetical Flow</summary>
          <ol className="mt-3 list-decimal list-inside text-sm text-gray-100/90 space-y-1">
            {exegeticalFlow.map((step, idx: number) => (
              <li key={`flow-${idx}`}>{step}</li>
            ))}
          </ol>
        </details>
      ) : null}

      {structure.length ? (
        <details open className="rounded-xl border border-white/10 bg-black/20 p-4">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">Structure of Passage</summary>
          <div className="mt-3 space-y-3">
            {structure.map((item, idx) => (
              <div key={`structure-${idx}`} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-semibold text-cyan-100">
                  {stringValue(item.movement || item.title || item.label) || `Movement ${idx + 1}`}
                </p>
                {stringValue(item.verses) ? <p className="mt-1 text-xs uppercase tracking-widest text-gray-400">{stringValue(item.verses)}</p> : null}
                {stringValue(item.summary) ? <p className="mt-2 text-sm text-gray-100/90 leading-relaxed">{stringValue(item.summary)}</p> : null}
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {keyTerms.length ? (
        <details open className="rounded-xl border border-white/10 bg-black/20 p-4">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">Key Terms</summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {keyTerms.map((term, idx) => (
              <button
                key={`term-${idx}`}
                type="button"
                onClick={() => onJumpToWordStudy(stringValue(term.term))}
                className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-3 text-left hover:bg-cyan-500/10"
              >
                <p className="text-sm font-semibold text-cyan-100">{stringValue(term.term) || `Term ${idx + 1}`}</p>
                <p className="mt-1 text-xs text-gray-300">
                  {stringValue(term.definition)}
                  {stringValue(term.transliteration) ? ` · ${stringValue(term.transliteration)}` : ''}
                </p>
                {stringValue(term.nuance) ? <p className="mt-2 text-sm text-gray-100/90 leading-relaxed">{stringValue(term.nuance)}</p> : null}
              </button>
            ))}
          </div>
        </details>
      ) : null}

      {crossReferences.length ? (
        <details open className="rounded-xl border border-white/10 bg-black/20 p-4">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">Cross References</summary>
          <div className="mt-3 space-y-3">
            {crossReferences.map((item, idx) => (
              <div key={`xref-${idx}`} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-semibold text-cyan-100">{stringValue(item.reference || item.verse || `Reference ${idx + 1}`)}</p>
                {stringValue(item.connection || item.context) ? (
                  <p className="mt-2 text-sm text-gray-100/90 leading-relaxed">{stringValue(item.connection || item.context)}</p>
                ) : null}
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {interpretiveChallenges.length ? (
        <details open className="rounded-xl border border-white/10 bg-black/20 p-4">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">Interpretive Challenges</summary>
          <div className="mt-3 space-y-3">
            {interpretiveChallenges.map((item, idx) => (
              <div key={`challenge-${idx}`} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-semibold text-amber-100">{stringValue(item.question || item.challenge || `Challenge ${idx + 1}`)}</p>
                {stringList(item.interpretationOptions).length ? (
                  <ul className="mt-2 list-disc list-inside text-sm text-gray-100/90 space-y-1">
                    {stringList(item.interpretationOptions).map((option, optionIdx) => (
                      <li key={`challenge-${idx}-option-${optionIdx}`}>{option}</li>
                    ))}
                  </ul>
                ) : null}
                {stringValue(item.preachingGuidance) ? (
                  <p className="mt-2 text-sm text-gray-100/90 leading-relaxed">{stringValue(item.preachingGuidance)}</p>
                ) : null}
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {theologicalThemes.length ? (
        <details open className="rounded-xl border border-white/10 bg-black/20 p-4">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">Theological Themes</summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {theologicalThemes.map((theme, idx) => (
              <span key={`theme-${idx}`} className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100">
                {theme}
              </span>
            ))}
          </div>
        </details>
      ) : null}

      {pastoralImplications.length ? (
        <details open className="rounded-xl border border-white/10 bg-black/20 p-4">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">Pastoral Implications</summary>
          <ul className="mt-3 list-disc list-inside text-sm text-gray-100/90 space-y-1">
            {pastoralImplications.map((item, idx) => (
              <li key={`implication-${idx}`}>{item}</li>
            ))}
          </ul>
        </details>
      ) : null}

      {(studyApplications.length || studyQuestions.length || studyIllustrations.length || studyMedia.length || studyReferences.length || movementAssets.length || studyEgwSupport.length) ? (
        <details open className="rounded-xl border border-white/10 bg-black/20 p-4">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">Study Assets</summary>
          <div className="mt-3 space-y-4">
            {studyApplications.length ? (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Applications</p>
                <ul className="list-disc list-inside text-sm text-gray-100/90 space-y-1">
                  {studyApplications.map((item, idx) => <li key={`app-${idx}`}>{item}</li>)}
                </ul>
              </div>
            ) : null}
            {studyQuestions.length ? (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Discussion Questions</p>
                <ul className="list-disc list-inside text-sm text-gray-100/90 space-y-1">
                  {studyQuestions.map((item, idx) => <li key={`question-${idx}`}>{item}</li>)}
                </ul>
              </div>
            ) : null}
            {studyIllustrations.length ? (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Illustration Ideas</p>
                <ul className="list-disc list-inside text-sm text-gray-100/90 space-y-1">
                  {studyIllustrations.map((item, idx) => <li key={`illustration-${idx}`}>{item}</li>)}
                </ul>
              </div>
            ) : null}
            {studyMedia.length ? (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Media Suggestions</p>
                <ul className="list-disc list-inside text-sm text-gray-100/90 space-y-1">
                  {studyMedia.map((item, idx) => <li key={`media-${idx}`}>{item}</li>)}
                </ul>
              </div>
            ) : null}
            {studyReferences.length ? (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">References</p>
                <ul className="list-disc list-inside text-sm text-gray-100/90 space-y-1">
                  {studyReferences.map((item, idx) => <li key={`reference-${idx}`}>{item}</li>)}
                </ul>
              </div>
            ) : null}
            {movementAssets.length ? (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Movement Assets</p>
                <p className="text-sm text-gray-100/90 leading-relaxed">
                  {movementAssets.length} passage movement asset{movementAssets.length === 1 ? '' : 's'} stored in the report.
                </p>
              </div>
            ) : null}
            {studyEgwSupport.length ? (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">EGW Support Cards</p>
                <ul className="list-disc list-inside text-sm text-gray-100/90 space-y-1">
                  {studyEgwSupport.map((item, idx) => (
                    <li key={`egw-support-${idx}`}>
                      {stringValue(item.citation || item.reference || `Support ${idx + 1}`)}
                      {stringValue(item.quote) ? ` — ${stringValue(item.quote)}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </details>
      ) : null}

      {reportEgw ? <StudyReportEGWSection section={reportEgw as any} /> : null}
    </div>
  )
}

export default WorkspaceStudyReportView
