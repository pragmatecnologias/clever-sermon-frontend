import {
  APPEAL_STYLE_OPTIONS,
  BILINGUAL_SUPPORT_OPTIONS,
  LANGUAGE_OPTIONS,
  MINISTRY_MODE_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  SERMON_STYLE_OPTIONS,
  MESSAGE_FLOW_OPTIONS,
  labelForValue,
} from '@/constants/workspace-form-options'

type WorkspaceDeliverables = {
  hasSlides?: boolean
  hasMedia?: boolean
  hasSocial?: boolean
  hasMusic?: boolean
}

export type WorkspacePlanningProfile = {
  sermonDate?: string
  targetLengthMinutes?: number
  serviceType?: string
  appealStyle?: string
  ministryMode?: string
  bilingualMode?: string
}

export type WorkspaceGuardrailProfile = {
  active: boolean
  label: string
  mode?: 'prophetic_adventist'
  reason?: string
  message?: string
  focus?: string[]
  scriptureAnchors?: string[]
}

type WorkspaceMetadataLike = {
  language?: string
  additionalPassages?: string[]
  uiState?: WorkspaceUiState | null
  socraticCoachLastSession?: unknown
  socraticCoachLastFeedback?: WorkspaceCoachFeedback | null
  sermonDnaLastAnalysis?: unknown
  deliverables?: WorkspaceDeliverables
  claimReviews?: Array<{ claimId?: string; decision?: string; note?: string; updatedAt?: string }>
  planning?: WorkspacePlanningProfile
  guardrail?: WorkspaceGuardrailProfile
  guardrailMode?: string
  guardrailDetected?: boolean
}

export type WorkspaceUiState = {
  phase?: string
  section?: string
  [key: string]: unknown
}

export type WorkspaceCoachFeedback = {
  questionId?: string
  [key: string]: unknown
}

type WorkspaceLike = {
  language?: string
  mainPassage?: string
  planning?: WorkspacePlanningProfile
  guardrail?: WorkspaceGuardrailProfile
  guardrailMode?: string
  guardrailDetected?: boolean
  metadata?: WorkspaceMetadataLike
  manuscripts?: Array<{ content?: { metadata?: { quality?: { repairedIssues?: unknown[]; remainingIssues?: unknown[] }; repair?: { lastRepairedAt?: string } } } }>
}

export const getWorkspaceMetadata = (workspace?: WorkspaceLike | null): WorkspaceMetadataLike => workspace?.metadata || {}

export const getWorkspaceLanguage = (workspace?: WorkspaceLike | null): string =>
  String(workspace?.language || getWorkspaceMetadata(workspace).language || 'en').trim() || 'en'

export const getWorkspaceCoachSession = (workspace?: WorkspaceLike | null) =>
  getWorkspaceMetadata(workspace).socraticCoachLastSession || null

export const getWorkspaceCoachFeedback = (workspace?: WorkspaceLike | null) =>
  getWorkspaceMetadata(workspace).socraticCoachLastFeedback || null

export const getWorkspaceSermonDnaAnalysis = (workspace?: WorkspaceLike | null) =>
  getWorkspaceMetadata(workspace).sermonDnaLastAnalysis || null

export const getWorkspaceUiState = (workspace?: WorkspaceLike | null) =>
  (getWorkspaceMetadata(workspace).uiState || {}) as WorkspaceUiState

export const getWorkspaceDeliverables = (workspace?: WorkspaceLike | null): WorkspaceDeliverables =>
  getWorkspaceMetadata(workspace).deliverables || {}

export const workspaceHasDeliverables = (workspace?: WorkspaceLike | null, keys: Array<keyof WorkspaceDeliverables> = []) =>
  keys.some((key) => Boolean(getWorkspaceDeliverables(workspace)[key]))

export const getWorkspaceClaimReviews = (workspace?: WorkspaceLike | null) =>
  Array.isArray(getWorkspaceMetadata(workspace).claimReviews) ? getWorkspaceMetadata(workspace).claimReviews || [] : []

export const getWorkspacePlanningProfile = (workspace?: WorkspaceLike | null): WorkspacePlanningProfile => {
  const metadata = getWorkspaceMetadata(workspace)
  return (metadata.planning as WorkspacePlanningProfile) || workspace?.planning || {}
}

const propheticPassagePatterns = [
  /revelation\s*14(?::\s*6\s*-\s*12)?/i,
  /revelation\s*(?:12\s*-\s*14|12|13|18)/i,
  /daniel\s*(?:7|8)/i,
  /matthew\s*24/i,
  /exodus\s*20/i,
]

export const isPropheticAdventistPassage = (reference?: string | null) => {
  const value = String(reference || '').trim()
  if (!value) return false
  return propheticPassagePatterns.some((pattern) => pattern.test(value))
}

export const getWorkspaceGuardrailProfile = (workspace?: WorkspaceLike | null): WorkspaceGuardrailProfile => {
  const metadata = getWorkspaceMetadata(workspace)
  const planning = getWorkspacePlanningProfile(workspace)
  const manualMode = String(metadata.guardrailMode || workspace?.guardrailMode || '').toLowerCase()
  const active =
    Boolean(metadata.guardrailDetected || workspace?.guardrailDetected) ||
    manualMode.includes('prophetic') ||
    planning.ministryMode === 'prophetic' ||
    isPropheticAdventistPassage(workspace?.mainPassage)

  if (!active) {
    return { active: false, label: '' }
  }

  return (
    metadata.guardrail ||
    workspace?.guardrail ||
    {
      active: true,
      label: 'Prophetic / Adventist Guardrail Mode',
      reason: isPropheticAdventistPassage(workspace?.mainPassage)
        ? `${workspace?.mainPassage || 'This passage'} benefits from stronger prophetic guardrails.`
        : 'Prophetic ministry mode was selected in workspace planning.',
      message: 'Scripture first. Christ-centered. Non-sensational. Historical context matters.',
      focus: [
        'Scripture first',
        'Christ-centered',
        'historically responsible',
        'non-sensational',
        'hopeful and pastoral',
      ],
      scriptureAnchors: [],
    }
  )
}

export const getWorkspacePlanningSummary = (workspace?: WorkspaceLike | null) => {
  const planning = getWorkspacePlanningProfile(workspace)
  const items = [
    planning.sermonDate ? `Date: ${planning.sermonDate}` : '',
    planning.targetLengthMinutes ? `Length: ${planning.targetLengthMinutes} min` : '',
    planning.serviceType ? `Service: ${planning.serviceType}` : '',
    planning.appealStyle ? `Appeal: ${planning.appealStyle}` : '',
    planning.ministryMode ? `Mode: ${planning.ministryMode}` : '',
    planning.bilingualMode ? `Language mode: ${planning.bilingualMode}` : '',
  ].filter(Boolean)

  return items.join(' • ')
}

export type WorkspacePlanningDetail = {
  label: string
  value: string
}

export const getWorkspacePlanningDetails = (workspace?: WorkspaceLike | null): WorkspacePlanningDetail[] => {
  const planning = getWorkspacePlanningProfile(workspace)
  const metadata = getWorkspaceMetadata(workspace)
  const guardrail = getWorkspaceGuardrailProfile(workspace)
  const additionalPassages = Array.isArray((workspace as WorkspaceLike | null)?.metadata?.additionalPassages)
    ? ((workspace as WorkspaceLike | null)?.metadata?.additionalPassages as string[])
    : Array.isArray((workspace as any)?.additionalPassages)
      ? (workspace as any).additionalPassages
      : []

  const items: WorkspacePlanningDetail[] = [
    { label: 'Title', value: String((workspace as any)?.title || '').trim() },
    { label: 'Series', value: String((workspace as any)?.seriesTitle || '').trim() },
    { label: 'Main Passage', value: String((workspace as any)?.mainPassage || '').trim() },
    { label: 'Additional Passages', value: additionalPassages.filter(Boolean).join(', ') },
    { label: 'Language', value: labelForValue(LANGUAGE_OPTIONS, String((workspace as any)?.language || metadata.language || 'en')) },
    { label: 'Style', value: labelForValue(SERMON_STYLE_OPTIONS, String((workspace as any)?.style || '')) },
    { label: 'Message Flow', value: labelForValue(MESSAGE_FLOW_OPTIONS, String((workspace as any)?.storyArc || '')) },
    { label: 'Theme', value: String((workspace as any)?.theme || '').trim() },
    { label: 'Audience Profile', value: String((workspace as any)?.audienceProfile || '').trim() },
    { label: 'Sermon Goals', value: String((workspace as any)?.sermonGoals || '').trim() },
    { label: 'Service Type', value: labelForValue(SERVICE_TYPE_OPTIONS, String(planning.serviceType || '')) },
    { label: 'Ministry Mode', value: labelForValue(MINISTRY_MODE_OPTIONS, String(planning.ministryMode || '')) },
    { label: 'Appeal Style', value: labelForValue(APPEAL_STYLE_OPTIONS, String(planning.appealStyle || '')) },
    { label: 'Bilingual Support', value: labelForValue(BILINGUAL_SUPPORT_OPTIONS, String(planning.bilingualMode || '')) },
    { label: 'Sermon Date', value: String(planning.sermonDate || '').trim() },
    { label: 'Target Length', value: planning.targetLengthMinutes ? `${planning.targetLengthMinutes} min` : '' },
    { label: 'EGW Enabled', value: (workspace as any)?.egwEnabled === false ? 'No' : 'Yes' },
    { label: 'Guardrail Mode', value: guardrail.active ? guardrail.label : String(metadata.guardrailMode || '').trim() },
  ]

  return items.filter((item) => item.value)
}

export const getLatestManuscriptRepairIssues = (workspace?: WorkspaceLike | null): string[] =>
  Array.isArray(workspace?.manuscripts?.[0]?.content?.metadata?.quality?.repairedIssues)
    ? workspace?.manuscripts?.[0]?.content?.metadata?.quality?.repairedIssues.map((item: unknown) => String(item || '').trim()).filter(Boolean)
    : []

export const getLatestManuscriptRemainingIssues = (workspace?: WorkspaceLike | null): string[] =>
  Array.isArray(workspace?.manuscripts?.[0]?.content?.metadata?.quality?.remainingIssues)
    ? workspace?.manuscripts?.[0]?.content?.metadata?.quality?.remainingIssues.map((item: unknown) => String(item || '').trim()).filter(Boolean)
    : []

export const getLatestManuscriptRepairTimestamp = (workspace?: WorkspaceLike | null): string | undefined =>
  workspace?.manuscripts?.[0]?.content?.metadata?.repair?.lastRepairedAt
