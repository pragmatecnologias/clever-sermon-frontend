import type { ReactNode } from 'react'
import type { WorkspaceStateResponse } from '@/lib/api/openapi-client'
import type { WorkspaceOutlineItem, WorkspaceOutlinePoint, WorkspaceOutlineStructure } from '@/components/workspace-domain.types'

type ManuscriptCues = {
  slide: string[]
  keyLine: string[]
  transition: string[]
  pause: string[]
  read: string[]
  quote: string[]
  cta: string[]
}

export type { ManuscriptCues }

type CueAnchor = {
  cueType: keyof ManuscriptCues
  cueIndex: number
  excerpt: string
  paragraphIndex: number
  paragraphHash: string
  confidence: number
}

type WorkspacePassageSummary = {
  passage?: string
  summary?: string
  interpretiveCenter?: string
  mainTension?: string
  movement?: string[]
  dataSource?: 'llm-generated' | 'curated' | 'unavailable'
  mainIdea?: string
}

type WorkspaceManuscriptRecord = {
  id?: string
  content?: {
    text?: string
    html?: string
    cues?: Record<string, unknown> | null
    metadata?: Record<string, unknown>
    repairAuditTrail?: Array<Record<string, unknown>>
    repairedSnippets?: Array<Record<string, unknown>>
  }
  metadata?: Record<string, unknown>
}

type WorkspaceOutlineNode = {
  id?: string
  title?: string
  text?: string
  content?: string
  summary?: string
  movement?: string
  supportingVerses?: string[]
  canonicalThemes?: string[]
  crossReferences?: string[]
  subpoints?: string[]
  applications?: string[]
  discussionQuestions?: string[]
  illustrationIdeas?: string[]
  mediaSuggestions?: string[]
  egwSupport?: Array<Record<string, unknown>>
  references?: string[]
  notes?: string
  coachNotes?: Array<Record<string, unknown>>
}

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
  keyTerms?: Array<Record<string, unknown>>
}

type WorkspaceStateLike = Partial<WorkspaceStateResponse> & {
  studyReports?: Array<{ sections?: WorkspaceStudyReportSections }>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export const normalizeManuscriptCues = (raw: Record<string, unknown> | null | undefined): ManuscriptCues => {
  const base: ManuscriptCues = {
    slide: [], keyLine: [], transition: [], pause: [], read: [], quote: [], cta: [],
  }
  const cues = isRecord(raw) ? raw : {}
  ;(['slide', 'keyLine', 'transition', 'pause', 'read', 'quote', 'cta'] as Array<keyof ManuscriptCues>).forEach((key) => {
    const values = cues[key]
    if (Array.isArray(values)) {
      base[key] = values.map((item) => String(item || '').trim()).filter(Boolean)
    }
  })
  return base
}

export const isManuscriptV2 = (manuscript: { content?: { formatVersion?: string; html?: string } | null } | null | undefined) =>
  Boolean(manuscript?.content?.formatVersion === 'v2' || manuscript?.content?.html)

export const sanitizeManuscriptForDisplay = (text: string) => {
  const cueLabelMap: Record<string, string> = {
    slide: 'Key Cue',
    keyline: 'Key Line',
    transition: 'Key Transition',
    pause: 'Key Pause',
    visual: 'Key Visual',
    read: 'Scripture Reading',
    quote: 'Key Quote',
    cta: 'Key Appeal',
    calltoaction: 'Key Appeal',
  }

  const normalizedCueLabel = (rawCue: string) => {
    const key = rawCue.toLowerCase().replace(/\s+/g, '')
    return cueLabelMap[key] || 'Key Cue'
  }

  const replaceCueTag = (_match: string, cueType: string, cueText?: string) => {
    const label = normalizedCueLabel(cueType)
    const cleanText = String(cueText || '').trim()
    return cleanText ? `${label}: ${cleanText}` : `${label}:`
  }

  return String(text || '')
    .replace(/\[(Slide|Key\s*Line|Transition|Pause|Visual|Read|Quote|CTA|Call\s*to\s*Action)\]\s*([^\n]*)/gi, replaceCueTag)
    .replace(/\*\*\s*\[(Slide|Key\s*Line|Transition|Pause|Visual|Read|Quote|CTA|Call\s*to\s*Action)\]\s*([^*]*)\*\*/gi, replaceCueTag)
    .replace(/^\s*\[[^\]]+\]\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export const cueIconMap: Record<keyof ManuscriptCues, string> = {
  slide: '🖼️',
  keyLine: '💬',
  transition: '➡️',
  pause: '⏸️',
  read: '📖',
  quote: '✨',
  cta: '🎯',
}

export const cueColorMap: Record<keyof ManuscriptCues, { border: string; bg: string; text: string }> = {
  slide: { border: 'border-purple-400/40', bg: 'bg-purple-500/10', text: 'text-purple-200' },
  keyLine: { border: 'border-cyan-400/40', bg: 'bg-cyan-500/10', text: 'text-cyan-200' },
  transition: { border: 'border-blue-400/40', bg: 'bg-blue-500/10', text: 'text-blue-200' },
  pause: { border: 'border-amber-400/40', bg: 'bg-amber-500/10', text: 'text-amber-200' },
  read: { border: 'border-emerald-400/40', bg: 'bg-emerald-500/10', text: 'text-emerald-200' },
  quote: { border: 'border-pink-400/40', bg: 'bg-pink-500/10', text: 'text-pink-200' },
  cta: { border: 'border-orange-400/40', bg: 'bg-orange-500/10', text: 'text-orange-200' },
}

export const cueLabelMap: Record<keyof ManuscriptCues, string> = {
  slide: 'Key Cue',
  keyLine: 'Key Line',
  transition: 'Key Transition',
  pause: 'Key Pause',
  read: 'Scripture Reading',
  quote: 'Key Quote',
  cta: 'Key Appeal',
}

export const getManuscriptQualityUi = (manuscript: WorkspaceManuscriptRecord | null | undefined) => {
  const content = manuscript?.content || {}
  const text = String(content.text || content.html || '')
  const wordCount = text.split(/\s+/).filter(Boolean).length
  if (wordCount >= 900) return { label: 'Long Draft', className: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' }
  if (wordCount >= 450) return { label: 'Draft', className: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100' }
  return { label: 'Short Draft', className: 'border-amber-400/30 bg-amber-500/10 text-amber-100' }
}

export const normalizeRepairSnippetRaw = (value: string) => String(value || '').replace(/\s+/g, ' ').trim()

export const summarizeRepairSnippet = (value: string, limit = 140) => {
  const normalized = normalizeRepairSnippetRaw(value)
  if (!normalized) return 'No repair snippet captured.'
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, limit - 1).trimEnd()}…`
}

export const getRepairAuditTrail = (manuscript: WorkspaceManuscriptRecord | null | undefined) =>
  Array.isArray(manuscript?.content?.repairAuditTrail) ? manuscript!.content!.repairAuditTrail! : []

export const getRepairedAuditItems = (manuscript: WorkspaceManuscriptRecord | null | undefined) =>
  Array.isArray(manuscript?.content?.repairedSnippets) ? manuscript!.content!.repairedSnippets! : []

export const getRepairItemMatchQuery = (entry: { afterSnippet?: string; beforeSnippet?: string; anchor?: string } | null | undefined) =>
  normalizeRepairSnippetRaw(String(entry?.afterSnippet || entry?.beforeSnippet || entry?.anchor || ''))

export const buildWordDiff = (before: string, after: string) => ({
  removedText: before,
  addedText: after,
})

export const buildInlineWordDiff = (before: string, after: string) => ({
  beforeHtml: before,
  afterHtml: after,
})

export const extractLegacyCues = (text: string) => String(text || '')

export const normalizeCueSearchText = (value: string) => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim()

export const hasCueContent = (cues: ManuscriptCues) =>
  (Object.values(cues || {}) as string[][]).some((items) => Array.isArray(items) && items.some((item) => String(item || '').trim()))

export const buildCueAnchorsFromHtml = (html: string, cues: ManuscriptCues): Record<string, CueAnchor> => {
  const anchors: Record<string, CueAnchor> = {}
  const segments = String(html || '')
    .split(/<[^>]+>/g)
    .map((item) => item.trim())
    .filter(Boolean)
  ;(['slide', 'keyLine', 'transition', 'pause', 'read', 'quote', 'cta'] as Array<keyof ManuscriptCues>).forEach((cueType) => {
    cues[cueType].forEach((cueText, cueIndex) => {
      const key = `${cueType}:${cueIndex}`
      anchors[key] = {
        cueType,
        cueIndex,
        excerpt: cueText,
        paragraphIndex: Math.max(0, segments.findIndex((segment) => normalizeCueSearchText(segment).includes(normalizeCueSearchText(cueText)))),
        paragraphHash: normalizeCueSearchText(cueText),
        confidence: 0.5,
      }
    })
  })
  return anchors
}

export const getOutlinePointLabel = (point: WorkspaceOutlineNode | string | null | undefined) => {
  if (typeof point === 'string') return point
  return point?.title || point?.content || point?.text || ''
}

export const getOutlinePointNodes = (structure: WorkspaceOutlineStructure | Record<string, unknown> | null | undefined) => {
  if (!structure || typeof structure !== 'object') return []
  const typedStructure = structure as WorkspaceOutlineStructure
  if (Array.isArray(typedStructure.pointNodes) && typedStructure.pointNodes.length > 0) {
    return typedStructure.pointNodes.map((point, index: number) => ({
      id: point?.id || `point-${index + 1}`,
      title: getOutlinePointLabel(point),
      summary: typeof point?.summary === 'string' ? point.summary : '',
      movement: typeof point?.movement === 'string' ? point.movement : '',
      supportingVerses: Array.isArray(point?.supportingVerses) ? point.supportingVerses : [],
      canonicalThemes: Array.isArray(point?.canonicalThemes) ? point.canonicalThemes : [],
      crossReferences: Array.isArray(point?.crossReferences) ? point.crossReferences : [],
      subpoints: Array.isArray(point?.subpoints) ? point.subpoints : [],
      applications: Array.isArray(point?.applications) ? point.applications : [],
      discussionQuestions: Array.isArray(point?.discussionQuestions) ? point.discussionQuestions : [],
      illustrationIdeas: Array.isArray(point?.illustrationIdeas) ? point.illustrationIdeas : [],
      mediaSuggestions: Array.isArray(point?.mediaSuggestions) ? point.mediaSuggestions : [],
      egwSupport: Array.isArray(point?.egwSupport) ? point.egwSupport : [],
      references: Array.isArray(point?.references) ? point.references : [],
    }))
  }
  const fallbackPoints = Array.isArray(typedStructure.points) ? typedStructure.points : []
  return fallbackPoints.map((point, index: number) => {
    const pointObj = typeof point === 'string' ? { title: point } : (point as WorkspaceOutlineNode)
    return {
      id: `point-${index + 1}`,
      title: getOutlinePointLabel(pointObj),
      summary: '',
      movement: '',
      supportingVerses: Array.isArray(pointObj?.supportingVerses) ? pointObj.supportingVerses : [],
      canonicalThemes: Array.isArray(pointObj?.canonicalThemes) ? pointObj.canonicalThemes : [],
      crossReferences: Array.isArray(pointObj?.crossReferences) ? pointObj.crossReferences : [],
      subpoints: Array.isArray(pointObj?.subpoints) ? pointObj.subpoints : [],
      applications: Array.isArray(pointObj?.applications) ? pointObj.applications : [],
      discussionQuestions: Array.isArray(pointObj?.discussionQuestions) ? pointObj.discussionQuestions : [],
      illustrationIdeas: Array.isArray(pointObj?.illustrationIdeas) ? pointObj.illustrationIdeas : [],
      mediaSuggestions: Array.isArray(pointObj?.mediaSuggestions) ? pointObj.mediaSuggestions : [],
      egwSupport: Array.isArray(pointObj?.egwSupport) ? pointObj.egwSupport : [],
      references: Array.isArray(pointObj?.references) ? pointObj.references : [],
    }
  })
}

export const normalizeReferenceList = (items: unknown[], mainPassage?: string) =>
  (Array.isArray(items) ? items : [])
    .map((item) => {
      const normalizeConnection = (value: string) => {
        const text = String(value || '').trim()
        if (!text) return ''
        if (/^Pasaje adicional seleccionado en el workspace para apoyar la exégesis\.?$/i.test(text)) {
          return mainPassage ? `Conecta con ${mainPassage} y amplía el tema central del estudio.` : 'Conecta con el pasaje principal y amplía el tema central del estudio.'
        }
        if (/^Additional passage selected in workspace to support exegesis\.?$/i.test(text)) {
          return mainPassage ? `Connects with ${mainPassage} and expands the study's central theme.` : 'Connects with the main passage and expands the study’s central theme.'
        }
        return text
      }
      if (typeof item === 'string') {
        return { reference: item.trim(), context: '' }
      }
      const itemObj = item as Record<string, unknown>
      return { reference: String(itemObj.reference || '').trim(), context: normalizeConnection(String(itemObj.context || itemObj.connection || '')) }
    })
    .filter((item): item is { reference: string; context: string } => Boolean((item as { reference?: string }).reference))

export const parsePassageForEgwPanel = (reference: string) => {
  const normalizedReference = String(reference || '')
    .trim()
    .replace(/:[A-Z0-9]{2,}$/i, '')
  const match = normalizedReference.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/)
  if (!match) return null
  return { book: match[1].trim(), chapter: Number(match[2]), verseStart: match[3] ? Number(match[3]) : undefined, verseEnd: match[4] ? Number(match[4]) : undefined }
}

export const isStudyAssetLoading = (asset: 'report' | 'applications' | 'questions' | 'illustrations' | 'media' | 'egw' | 'references', actionLoading: string[] = []) => {
  if (asset === 'report') return actionLoading.includes('study-report')
  if (asset === 'applications') return actionLoading.includes('applications')
  if (asset === 'questions') return actionLoading.includes('questions')
  if (asset === 'illustrations') return actionLoading.includes('illustrations')
  if (asset === 'media') return actionLoading.includes('media')
  return false
}

export const hasGeneratedStudyReport = (workspace: WorkspaceStateLike | null | undefined) => {
  // WorkspaceStateResponse has studyReports nested under .workspace
  // WorkspacePageData has it at the top level
  const reports = (workspace as any)?.workspace?.studyReports ?? workspace?.studyReports
  return Array.isArray(reports) && reports.length > 0 && !!reports[0]?.sections
}

export const getStudyAssetLoadingLabel = (asset: 'applications' | 'questions' | 'illustrations' | 'media' | 'references' | 'report' | 'egw') => {
  const labels: Record<'applications' | 'questions' | 'illustrations' | 'media' | 'references' | 'report' | 'egw', string> = {
    applications: 'Generating Applications...',
    questions: 'Generating Discussion Questions...',
    illustrations: 'Generating Illustration Ideas...',
    media: 'Generating Media Suggestions...',
    references: 'Generating References...',
    report: 'Generating Study Report...',
    egw: 'Generating EGW Support...',
  }
  return labels[asset]
}

export const getPassageFocusText = (passageSummary: WorkspacePassageSummary | null | undefined, workspace: WorkspaceStateLike | null | undefined) => {
  const reports = (workspace as any)?.workspace?.studyReports ?? workspace?.studyReports
  const primaryReport = reports?.[0]?.sections as WorkspaceStudyReportSections | undefined
  const passageSummaryObject = typeof passageSummary === 'object' && passageSummary ? passageSummary : null
  if (passageSummaryObject?.summary) return String(passageSummaryObject.summary)
  if (passageSummaryObject?.mainIdea) return String(passageSummaryObject.mainIdea)
  if (passageSummaryObject?.interpretiveCenter) return String(passageSummaryObject.interpretiveCenter)
  if (primaryReport?.mainTheologicalClaim) return String(primaryReport.mainTheologicalClaim).slice(0, 320)
  if (primaryReport?.passageOverview) return String(primaryReport.passageOverview).slice(0, 320)
  if (primaryReport?.theologicalInsights) return String(primaryReport.theologicalInsights).slice(0, 320)
  if (primaryReport?.keyThemes) return String(primaryReport.keyThemes).slice(0, 320)
  return ''
}

export const getOutlineBigIdea = (outline: WorkspaceOutlineItem | null | undefined, passageSummary: WorkspacePassageSummary | null | undefined, workspace: WorkspaceStateLike | null | undefined) => {
  const movement = outline?.structure?.sermonMovement
  if (typeof movement === 'string' && movement.trim()) return movement.trim()
  const focus = getPassageFocusText(passageSummary, workspace)
  if (focus) return focus
  return 'This sermon moves from biblical insight toward faithful response and transformed living.'
}

export const compactLabel = (value: string, limit = 72) => {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim()
  if (!normalized) return 'Point'
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, limit - 1).trimEnd()}…`
}

export const getFlowNarrativeEntries = (outline: WorkspaceOutlineItem | null | undefined, pointNodes: WorkspaceOutlinePoint[], passageSummary: WorkspacePassageSummary | null | undefined, workspace: WorkspaceStateLike | null | undefined) => {
  const introText = outline?.structure?.introduction || getPassageFocusText(passageSummary, workspace) || 'Opening movement for the sermon.'
  const conclusionText = outline?.structure?.conclusion || outline?.structure?.callToAction || 'Closing response and invitation.'
  const pointEntries = (Array.isArray(pointNodes) ? pointNodes : []).map((point, index: number) => {
    const detailParts = [point?.title || '', point?.summary || point?.movement || '', ...(Array.isArray(point?.subpoints) ? point.subpoints : [])].filter(Boolean)
    return { id: `point-${index + 1}`, label: `Point ${index + 1}`, title: point?.title || `Point ${index + 1}`, detail: detailParts.join('\n\n') }
  })
  return [{ id: 'intro', label: 'Intro', title: 'Introduction', detail: introText }, ...pointEntries, { id: 'conclusion', label: 'Conclusion', title: 'Conclusion', detail: conclusionText }]
}

export const estimatePointMinutes = (point: WorkspaceOutlinePoint) => {
  const composite = [point?.title || '', point?.summary || '', ...(Array.isArray(point?.subpoints) ? point.subpoints : [])].join(' ')
  const words = composite.split(/\s+/).filter(Boolean).length
  return Math.max(3, Math.min(8, Math.round(words / 18) || 5))
}

export const getVerseEvidenceText = (verseRef: string, scriptureResult: unknown, extractVerses: (value: unknown) => Array<{ reference?: string; text?: string }>) => {
  const verses = extractVerses(scriptureResult)
  const normalizedTarget = verseRef.replace(/\s+/g, ' ').toLowerCase()
  const match = verses.find((verse) => {
    const ref = String(verse?.reference || '').replace(/\s+/g, ' ').toLowerCase()
    return ref.includes(normalizedTarget) || normalizedTarget.includes(ref)
  })
  return match?.text || ''
}

export const getOutlineTitle = (outline: WorkspaceOutlineItem | null | undefined, getOutlinePointNodesFn: (structure: WorkspaceOutlineStructure | Record<string, unknown> | null | undefined) => Array<{ title?: string }>) => {
  const points = getOutlinePointNodesFn(outline?.structure)
  const rawTitle = points[0]?.title || outline?.structure?.introduction || outline?.title || 'Outline'
  const firstSentence = rawTitle.split(/\.|\?|\!/).slice(0, 1).join('').trim()
  const trimmed = (firstSentence || rawTitle).trim()
  if (trimmed.length > 120) return `${trimmed.slice(0, 117)}...`
  return trimmed
}
