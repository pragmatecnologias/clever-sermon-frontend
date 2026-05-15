'use client'

import type { Dispatch, SetStateAction } from 'react'
import type { Phase } from '@/components/PhaseNavigation'
import type { WorkspaceSection } from '@/components/workspace-shell.types'
import type { WorkspaceStateResponse } from '@/lib/api/openapi-client'

type ManuscriptCues = {
  slide: string[]
  keyLine: string[]
  transition: string[]
  pause: string[]
  read: string[]
  quote: string[]
  cta: string[]
}

type WorkspacePageData = {
  manuscripts?: Array<{ id?: string; content?: { text?: string; formatVersion?: string; cues?: Record<string, unknown> | null; metadata?: Record<string, unknown> } }>
  applications?: Array<{ id?: string; content?: string; text?: string; title?: string }>
  discussionQuestions?: Array<{ id?: string; question?: string; text?: string }>
  illustrations?: Array<{ id?: string; title?: string; content?: string; text?: string; source?: string }>
  citations?: Array<{ id?: string; statement?: string; verseReferences?: string[] }>
  claimLedger?: Array<Record<string, unknown>>
}

type ContentWorkspaceCitationDraft = {
  id: string
  statement: string
  verseReferences: string
}

type ContentWorkspaceIllustrationDraft = {
  id?: string
  title?: string
  content?: string
  source?: string
  [key: string]: unknown
}

type WorkspaceClaimLedgerEntry = {
  id?: string
  claimText?: string
  claimType?: string
  supportLevel?: string
  sourceType?: string
  sourceIds?: string[]
  location?: string
  locationPath?: string
}

type Props = {
  workspaceId: string
  workspace: WorkspacePageData | null
  withToken: () => Record<string, unknown> | null
  getWorkspaceApiClient: () => any
  getAppApiClient: () => any
  refreshWorkspaceState: (config: Record<string, unknown>) => Promise<WorkspaceStateResponse | null>
  setActionLoading: (value: (prev: string[]) => string[]) => void
  setError: (value: string | null) => void
  setActivePhase: Dispatch<SetStateAction<Phase>>
  setActiveSection: Dispatch<SetStateAction<WorkspaceSection>>
  setEditingManuscriptId: (value: string | null) => void
  setLegacyConvertCandidateId: (value: string | null) => void
  setManuscriptDraft: (value: string) => void
  setManuscriptCueDraft: (value: ManuscriptCues) => void
  emptyManuscriptCues: () => ManuscriptCues
  manuscriptDraft: string
  manuscriptCueDraft: ManuscriptCues
  normalizeManuscriptCues: (value: Record<string, unknown> | ManuscriptCues) => ManuscriptCues
  buildCueAnchorsFromHtml: (html: string, cues: ManuscriptCues) => unknown
  evaluateCueCoverage: (cues: ManuscriptCues, html: string, cueAnchors: any) => unknown
  setManuscriptCueHealth: Dispatch<SetStateAction<Record<string, { total: number; matched: number; stale: boolean }>>>
  applicationDraft: string
  setEditingApplicationId: (value: string | null) => void
  setApplicationDraft: (value: string) => void
  questionDraft: string
  setEditingQuestionId: (value: string | null) => void
  setQuestionDraft: (value: string) => void
  illustrationDraft: ContentWorkspaceIllustrationDraft | null
  setEditingIllustrationId: (value: string | null) => void
  setIllustrationDraft: (value: ContentWorkspaceIllustrationDraft | null) => void
  citationDraft: ContentWorkspaceCitationDraft | null
  setEditingCitationId: (value: string | null) => void
  setCitationDraft: (value: ContentWorkspaceCitationDraft | null) => void
}

export function useWorkspaceContentActions({
  workspaceId,
  workspace,
  withToken,
  getWorkspaceApiClient,
  getAppApiClient,
  refreshWorkspaceState,
  setActionLoading,
  setError,
  setActivePhase,
  setActiveSection,
  setEditingManuscriptId,
  setLegacyConvertCandidateId,
  setManuscriptDraft,
  setManuscriptCueDraft,
  emptyManuscriptCues,
  manuscriptDraft,
  manuscriptCueDraft,
  normalizeManuscriptCues,
  buildCueAnchorsFromHtml,
  evaluateCueCoverage,
  setManuscriptCueHealth,
  applicationDraft,
  setEditingApplicationId,
  setApplicationDraft,
  questionDraft,
  setEditingQuestionId,
  setQuestionDraft,
  illustrationDraft,
  setEditingIllustrationId,
  setIllustrationDraft,
  citationDraft,
  setEditingCitationId,
  setCitationDraft,
}: Props) {
  const handleManuscriptSave = async (id: string, inlineHtml?: string) => {
    const config = withToken()
    if (!config) return
    const client = getWorkspaceApiClient()
    if (!client) return
    setActionLoading((prev) => (prev.includes('manuscript-edit') ? prev : [...prev, 'manuscript-edit']))
    try {
      const textToSave = inlineHtml !== undefined ? inlineHtml : manuscriptDraft
      const existingManuscript = workspace?.manuscripts?.find((m) => m.id === id)
      const cuesToSaveRaw = inlineHtml !== undefined ? (existingManuscript?.content?.cues || {}) : manuscriptCueDraft
      const cuesToSave = normalizeManuscriptCues(cuesToSaveRaw)
      const cueAnchors = buildCueAnchorsFromHtml(textToSave, cuesToSave)
      const staleInfo = evaluateCueCoverage(cuesToSave, textToSave, cueAnchors) as {
        total: number
        matched: number
        stale: boolean
      }
      setManuscriptCueHealth((prev) => ({ ...prev, [id]: staleInfo }))
      await client.updateManuscript(id, {
        content: {
          formatVersion: 'v2',
          text: textToSave,
          cues: cuesToSave,
          metadata: {
            ...(existingManuscript?.content?.metadata || {}),
            cueAnchors,
            cueAnchorUpdatedAt: new Date().toISOString(),
          },
        },
      })
      await refreshWorkspaceState(config)
      if (!inlineHtml) {
        setEditingManuscriptId(null)
        setLegacyConvertCandidateId(null)
        setManuscriptDraft('')
        setManuscriptCueDraft(emptyManuscriptCues())
      }
    } catch (err) {
      console.error('Failed to update manuscript', err)
      setError('Unable to save manuscript changes.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'manuscript-edit'))
    }
  }

  const handleRegenerateManuscriptCues = async (manuscriptId: string) => {
    const config = withToken()
    if (!config) return
    const client = getAppApiClient()
    if (!client) return
    const actionKey = `manuscript-cues-${manuscriptId}`
    setActionLoading((prev) => (prev.includes(actionKey) ? prev : [...prev, actionKey]))
    try {
      await client.post(`/workspaces/${workspaceId}/manuscripts/${manuscriptId}/cues/regenerate`, {})
      await refreshWorkspaceState(config)
    } catch (err) {
      console.error('Failed to regenerate manuscript cues', err)
      setError('Unable to regenerate manuscript cues.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== actionKey))
    }
  }

  const handleApplicationSave = async (id: string) => {
    const config = withToken()
    if (!config) return
    const client = getWorkspaceApiClient()
    if (!client) return
    setActionLoading((prev) => (prev.includes('application-edit') ? prev : [...prev, 'application-edit']))
    try {
      await client.updateApplication(id, { content: applicationDraft })
      await refreshWorkspaceState(config)
      setEditingApplicationId(null)
      setApplicationDraft('')
    } catch (err) {
      console.error('Failed to update application', err)
      setError('Unable to save application changes.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'application-edit'))
    }
  }

  const handleQuestionSave = async (id: string) => {
    const config = withToken()
    if (!config) return
    const client = getWorkspaceApiClient()
    if (!client) return
    setActionLoading((prev) => (prev.includes('question-edit') ? prev : [...prev, 'question-edit']))
    try {
      await client.updateDiscussionQuestion(id, { question: questionDraft })
      await refreshWorkspaceState(config)
      setEditingQuestionId(null)
      setQuestionDraft('')
    } catch (err) {
      console.error('Failed to update question', err)
      setError('Unable to save question changes.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'question-edit'))
    }
  }

  const handleIllustrationSave = async () => {
    const config = withToken()
    if (!config || !illustrationDraft) return
    const client = getWorkspaceApiClient()
    if (!client) return
    setActionLoading((prev) => (prev.includes('illustration-edit') ? prev : [...prev, 'illustration-edit']))
    try {
      await client.updateIllustration(String(illustrationDraft.id), {
        title: illustrationDraft.title,
        content: illustrationDraft.content,
        source: illustrationDraft.source,
      })
      await refreshWorkspaceState(config)
      setEditingIllustrationId(null)
      setIllustrationDraft(null)
    } catch (err) {
      console.error('Failed to update illustration', err)
      setError('Unable to save illustration changes.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'illustration-edit'))
    }
  }

  const persistClaimReviewDecision = async (
    claim: WorkspaceClaimLedgerEntry | null | undefined,
    decision: 'repair' | 'acknowledge' | 'cite',
    note?: string,
  ) => {
    const config = withToken()
    if (!config || !claim?.id) return
    const client = getWorkspaceApiClient()
    if (!client) return
    await client.recordClaimReview(workspaceId, {
      claimId: String(claim.id),
      decision,
      note,
      claimText: claim.claimText,
      claimType: claim.claimType,
      supportLevel: claim.supportLevel,
      sourceType: claim.sourceType,
      sourceIds: claim.sourceIds,
      location: claim.location || claim.locationPath,
    })
    await refreshWorkspaceState(config)
  }

  const handleRepairClaim = async (claim: WorkspaceClaimLedgerEntry | null | undefined) => {
    try {
      await persistClaimReviewDecision(claim, 'repair', 'Needs repair')
      if (claim?.location === 'outline' || claim?.claimType === 'outline') {
        setActivePhase('OUTLINE')
        setActiveSection('outlines')
      } else if (claim?.location === 'study-report') {
        setActivePhase('STUDY')
        setActiveSection('study-report')
      } else {
        setActivePhase('REFINE')
        setActiveSection('citations')
      }
      if (claim?.id && workspace?.citations?.length) {
        const citation = workspace.citations.find((item) => item.id === claim.id)
        if (citation?.id) {
          setEditingCitationId(citation.id)
          setCitationDraft({
            id: citation.id,
            statement: citation.statement || '',
            verseReferences: (citation.verseReferences || []).join(', '),
          })
        }
      }
    } catch (err) {
      console.error('Failed to mark claim for repair', err)
      setError('Unable to mark claim for repair.')
    }
  }

  const handleAcknowledgeClaim = async (claim: WorkspaceClaimLedgerEntry | null | undefined) => {
    try {
      const config = withToken()
      if (!config) return
      const client = getWorkspaceApiClient()
      if (!client) return
      await persistClaimReviewDecision(claim, 'acknowledge', 'Reviewed and acknowledged')
      if (claim?.id && workspace?.citations?.length) {
        const citation = workspace.citations.find((item) => item.id === claim.id)
        if (citation) {
          await client.updateCitation(citation.id, { isVerified: true })
          await refreshWorkspaceState(config)
        }
      }
    } catch (err) {
      console.error('Failed to acknowledge claim', err)
      setError('Unable to acknowledge claim.')
    }
  }

  const handleCiteClaim = async (claim: WorkspaceClaimLedgerEntry | null | undefined) => {
    try {
      await persistClaimReviewDecision(claim, 'cite', 'Need stronger citation support')
      if (claim?.sourceIds?.length) {
        setActivePhase('PASSAGE')
        setActiveSection('scripture')
      } else if (claim?.location === 'outline') {
        setActivePhase('OUTLINE')
        setActiveSection('outlines')
      } else {
        setActivePhase('REFINE')
        setActiveSection('citations')
      }
    } catch (err) {
      console.error('Failed to cite claim', err)
      setError('Unable to route claim to citation support.')
    }
  }

  return {
    handleManuscriptSave,
    handleRegenerateManuscriptCues,
    handleApplicationSave,
    handleQuestionSave,
    handleIllustrationSave,
    persistClaimReviewDecision,
    handleRepairClaim,
    handleAcknowledgeClaim,
    handleCiteClaim,
  }
}
