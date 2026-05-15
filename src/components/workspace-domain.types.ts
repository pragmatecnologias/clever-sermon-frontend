export type WorkspaceSupportLevel = 'supported' | 'partially_supported' | 'needs_review' | 'unsupported'

export type WorkspaceClaimReviewDecision = {
  claimId: string
  decision: string
  note?: string
  updatedAt: string
}

export type WorkspaceIntegrityIssueDecision = 'repair' | 'acknowledge' | 'cite'

export type WorkspaceIntegrityIssueEntry = {
  id: string
  severity?: 'critical' | 'warning' | 'info'
  category?: string
  message?: string
  affectedItem?: string
  decision?: WorkspaceIntegrityIssueDecision
  note?: string
  status?: 'open' | 'reviewed' | 'resolved'
  updatedAt?: string
}

export type WorkspaceIntegrityIssueReview = {
  issueId: string
  decision: WorkspaceIntegrityIssueDecision
  note?: string
  updatedAt: string
  issueMessage?: string
  severity?: 'critical' | 'warning' | 'info'
  category?: string
  affectedItem?: string
}

export type WorkspaceSourceLedgerEntry = {
  id: string
  label?: string
  sourceType?: string
  reference?: string
  verified?: boolean
}

export type WorkspaceClaimLedgerEntry = {
  id: string
  claimType?: string
  claimText?: string
  sourceType?: string
  sourceIds?: string[]
  supportLevel?: WorkspaceSupportLevel | string
  location?: string
  locationPath?: string
}

export type WorkspaceCitationDraft = {
  id: string
  statement: string
  verseReferences: string
}

export type WorkspaceCitationItem = {
  id: string
  statement?: string
  statementType?: string
  verseReferences?: string[]
  supportLevel?: WorkspaceSupportLevel | string
  isVerified?: boolean
}

export type WorkspacePassageSummary = {
  passage: string
  summary: string
  interpretiveCenter: string
  mainTension: string
  movement: string[]
  dataSource: 'llm-generated' | 'curated' | 'unavailable'
  mainIdea?: string
}

export type WorkspaceOutlinePoint = {
  id?: string
  title?: string
  text?: string
  content?: string
  summary?: string
  movement?: string
  notes?: string
  subpoints?: string[]
  supportingVerses?: string[]
  canonicalThemes?: string[]
  crossReferences?: string[]
  applications?: string[]
  discussionQuestions?: string[]
  illustrationIdeas?: string[]
  mediaSuggestions?: string[]
  egwSupport?: Array<{ citation?: string; reference?: string; quote?: string; text?: string; relevance?: string }>
  references?: string[]
}

export type WorkspaceOutlineCoachNote = {
  id?: string
  questionId?: string
  question?: string
  sourceAnchor?: string
  rewriteHint?: string
  improvementSuggestion?: string
  coachFeedback?: string
  answer?: string
  createdAt?: string
}

export type WorkspaceOutlineStructure = {
  introduction?: string
  conclusion?: string
  callToAction?: string
  points?: string[]
  pointNodes?: WorkspaceOutlinePoint[]
  sermonMovement?: unknown
  outlineType?: string
  coachNotes?: WorkspaceOutlineCoachNote[]
}

export type WorkspaceOutlineItem = {
  id: string
  title?: string
  structure?: WorkspaceOutlineStructure
  isSelected?: boolean
}

export type WorkspaceOutlineDraft = {
  id: string
  title: string
  introduction: string
  points: string[]
  pointNodes?: WorkspaceOutlinePoint[]
  conclusion: string
  callToAction: string
}

export type WorkspaceFlowNarrativeEntry = {
  id: string
  label: string
  title: string
  detail: string
}

export type WorkspaceCitationsState = {
  claimLedger?: WorkspaceClaimLedgerEntry[]
  sourceLedger?: WorkspaceSourceLedgerEntry[]
  claimReviewDecisions?: WorkspaceClaimReviewDecision[]
}

export type WorkspaceIntegrityState = {
  integrityIssueLedger?: WorkspaceIntegrityIssueEntry[]
  integrityIssueReviews?: WorkspaceIntegrityIssueReview[]
}

export type WorkspaceOutlineState = {
  activeOutline?: { id?: string } | null
}
