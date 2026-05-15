type WorkspaceDeliverables = {
  hasSlides?: boolean
  hasMedia?: boolean
  hasSocial?: boolean
  hasMusic?: boolean
}

type WorkspaceMetadataLike = {
  language?: string
  uiState?: WorkspaceUiState | null
  socraticCoachLastSession?: unknown
  socraticCoachLastFeedback?: WorkspaceCoachFeedback | null
  sermonDnaLastAnalysis?: unknown
  deliverables?: WorkspaceDeliverables
  claimReviews?: Array<{ claimId?: string; decision?: string; note?: string; updatedAt?: string }>
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
