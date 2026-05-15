'use client'

import type { SermonCoreData } from '@/components/SermonCore'
import type {
  WorkspaceCitationDraft,
  WorkspaceClaimLedgerEntry,
  WorkspaceClaimReviewDecision,
  WorkspaceOutlineDraft,
  WorkspaceOutlineItem,
  WorkspaceOutlinePoint,
  WorkspaceOutlineStructure,
} from '@/components/workspace-domain.types'
import type {
  CanonicalThemesData,
  InterpretiveChallengeData,
  PassageSummaryData,
  StructuralAnalysisData,
  StudySynthesisData,
  TranslationComparisonData,
  VerseCommentaryData,
  VerseContextData,
} from '@/components/workspace-scripture-analysis.types'
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

type CueAnchor = {
  cueType: keyof ManuscriptCues
  cueIndex: number
  excerpt: string
  paragraphIndex: number
  paragraphHash: string
  confidence: number
}

type WorkspaceSearchResult = {
  workspaceId?: string
  type?: string
  id?: string
  title?: string
  snippet?: string
}

type WorkspacePageData = {
  id?: string
  title?: string
  theme?: string
  language?: string
  mainPassage?: string
  audienceProfile?: string
  sermonGoals?: string
  style?: string
  storyArc?: string
  includeEGW?: boolean
  seriesTitle?: string
  additionalPassages?: string[]
  metadata?: Record<string, unknown>
  outlines?: WorkspaceOutlineItem[]
  manuscripts?: Array<{
    id?: string
    content?: {
      formatVersion?: string
      text?: string
      cues?: ManuscriptCues | null
      metadata?: {
        quality?: {
          status?: string
          repairedIssues?: unknown[]
          remainingIssues?: unknown[]
        }
        repair?: {
          lastRepairedAt?: string
        }
      }
    }
  }>
  studyReports?: Array<{ id?: string; sections?: Record<string, unknown> }>
  citations?: Array<{
    id?: string
    statement?: string
    verseReferences?: string[]
    isVerified?: boolean
  }>
  dnaAnalyses?: Array<Record<string, unknown>>
  applications?: Array<{ id?: string; text?: string; content?: string; title?: string; audienceType?: string }>
  discussionQuestions?: Array<{ id?: string; text?: string; question?: string }>
  illustrations?: Array<{ id?: string; text?: string; title?: string; content?: string; source?: string }>
}

type WorkspaceCoachFeedbackDetail = {
  coachFeedback?: string
  improvementSuggestion?: string
  rewriteHint?: string
}

type WorkspaceCoachQuestion = {
  id?: string
  dimension?: string
  question?: string
  sourceAnchor?: string
}

type WorkspaceCoachSessionData = {
  repairPlan?: Array<{
    issueId?: string
    questionId?: string
    issueType?: string
    severity?: 'high' | 'medium' | 'low'
    targetAnchor?: string
    proposedAction?: string
    expectedOutcome?: string
    selected?: boolean
  }>
  questions?: WorkspaceCoachQuestion[]
}

type WorkspaceIntegrityReport = {
  issues?: Array<{ severity?: 'critical' | 'warning' | 'info' }>
  pointAnalysis?: Array<{ supportScore?: number }>
  balanced?: boolean
}

type WorkspaceJobs = {
  generationJob: {
    capability: string
    jobId: string
    status: string
    state?: string
    message?: string
  } | null
  repairJob: {
    manuscriptId: string
    jobId: string
    status: string
    state?: string
    message?: string
  } | null
}

type WorkspaceActionsDeps = {
  workspaceId: string
  workspace: WorkspacePageData | null
  workspaceState: WorkspaceStateResponse | null
  workspaceDraft: WorkspacePageData | null
  workspaceApiClient: () => {
    getWorkspace?: (workspaceId: string) => Promise<WorkspacePageData>
    getWorkspaceState?: (workspaceId: string) => Promise<WorkspaceStateResponse>
    updateWorkspace?: (workspaceId: string, payload: Record<string, unknown>) => Promise<unknown>
    updateOutline?: (outlineId: string, payload: Record<string, unknown>) => Promise<unknown>
    updateManuscript?: (manuscriptId: string, payload: Record<string, unknown>) => Promise<unknown>
    updateApplication?: (applicationId: string, payload: Record<string, unknown>) => Promise<unknown>
    updateDiscussionQuestion?: (questionId: string, payload: Record<string, unknown>) => Promise<unknown>
    updateIllustration?: (illustrationId: string, payload: Record<string, unknown>) => Promise<unknown>
    updateCitation?: (citationId: string, payload: Record<string, unknown>) => Promise<unknown>
    restoreOutlineHistory?: (workspaceId: string, historyIndex: number) => Promise<unknown>
    restoreManuscriptHistory?: (workspaceId: string, historyIndex: number) => Promise<unknown>
    validateCitations?: (workspaceId: string, translation: string) => Promise<unknown>
    recordClaimReview?: (workspaceId: string, payload: Record<string, unknown>) => Promise<unknown>
    recordIntegrityIssueReview?: (workspaceId: string, payload: Record<string, unknown>) => Promise<unknown>
    generateSermonCore?: (workspaceId: string, payload: Record<string, unknown>, asyncMode?: boolean) => Promise<{ data?: { jobId?: string; status?: string; state?: string; message?: string } }>
    generateOutlines?: (workspaceId: string, payload: Record<string, unknown>, asyncMode?: boolean) => Promise<{ data?: { jobId?: string; status?: string; state?: string; message?: string } }>
    generateApplications?: (workspaceId: string, payload: Record<string, unknown>, asyncMode?: boolean) => Promise<{ data?: { jobId?: string; status?: string; state?: string; message?: string } }>
    generateDiscussionQuestions?: (workspaceId: string, payload: Record<string, unknown>, asyncMode?: boolean) => Promise<{ data?: { jobId?: string; status?: string; state?: string; message?: string } }>
    generateIllustrations?: (workspaceId: string, payload: Record<string, unknown>, asyncMode?: boolean) => Promise<{ data?: { jobId?: string; status?: string; state?: string; message?: string } }>
    generateCitations?: (workspaceId: string, payload: Record<string, unknown>, asyncMode?: boolean) => Promise<{ data?: { jobId?: string; status?: string; state?: string; message?: string } }>
    generateMediaSuggestions?: (workspaceId: string, payload: Record<string, unknown>, asyncMode?: boolean) => Promise<{ data?: { jobId?: string; status?: string; state?: string; message?: string } }>
    runIntegrityCheck?: (workspaceId: string, asyncMode?: boolean) => Promise<{ data?: { jobId?: string; status?: string; state?: string; message?: string } }>
    search?: (query: string) => Promise<WorkspaceSearchResult[]>
    scripturalPassageWithContext?: (reference: string, translation: string) => Promise<Record<string, unknown> | string>
    scriptureParallel?: (reference: string, translation: string) => Promise<{ translations?: Record<string, unknown>[] }>
    scriptureContext?: (reference: string) => Promise<Record<string, unknown>>
    scriptureWordStudy?: (word: string, language: string, responseLanguage: string) => Promise<Record<string, unknown>>
    scriptureWordStudyInsights?: (word: string, language: string, context?: string, responseLanguage?: string) => Promise<Record<string, unknown>>
    scriptureWordStudySuggestions?: (reference: string, translation: string, language: string, responseLanguage: string) => Promise<Array<{ term: string; transliteration?: string; gloss?: string; reason?: string; language?: string }>>
    scriptureCrossReferencesRanked?: (reference: string) => Promise<Array<Record<string, unknown>>>
    scriptureValidateCitation?: (statement: string, verseRef: string, translation: string) => Promise<Record<string, unknown>>
    scriptureAudioBibles?: () => Promise<Array<{ id?: string }>>
    sermonDnaAnalyze?: (workspaceId: string) => Promise<Record<string, unknown>>
    workspacePromptPreview?: (workspaceId: string, type: string, outlineId?: string) => Promise<string>
  } | null
  refreshWorkspaceState: (config: Record<string, unknown>) => Promise<WorkspaceStateResponse | null>
  withToken: () => Record<string, unknown> | null
  setError: (value: string | null) => void
  setActionLoading: (updater: (prev: string[]) => string[]) => void
  setGenerationJob: (value: WorkspaceJobs['generationJob'] | ((prev: WorkspaceJobs['generationJob']) => WorkspaceJobs['generationJob'])) => void
  setRepairJob: (value: WorkspaceJobs['repairJob'] | ((prev: WorkspaceJobs['repairJob']) => WorkspaceJobs['repairJob'])) => void
  setSermonCoreGenerating: (value: boolean) => void
  setWorkspace: (value: WorkspacePageData | ((prev: WorkspacePageData | null) => WorkspacePageData | null)) => void
  setEditingWorkspace: (value: boolean) => void
  setEditingOutlineId: (value: string | null) => void
  setOutlineDraft: (value: WorkspaceOutlineDraft | null) => void
  setEditingManuscriptId: (value: string | null) => void
  setManuscriptDraft: (value: string) => void
  setManuscriptCueDraft: (value: ManuscriptCues) => void
  setLegacyConvertCandidateId: (value: string | null) => void
  setEditingApplicationId: (value: string | null) => void
  setApplicationDraft: (value: string) => void
  setEditingQuestionId: (value: string | null) => void
  setQuestionDraft: (value: string) => void
  setEditingIllustrationId: (value: string | null) => void
  setIllustrationDraft: (value: Record<string, unknown> | null) => void
  setEditingCitationId: (value: string | null) => void
  setCitationDraft: (value: WorkspaceCitationDraft | null) => void
  setCitationTranslation: (value: string) => void
  setPromptModalOpen: (value: boolean) => void
  setPromptType: (value: 'outline' | 'manuscript' | 'applications' | 'questions' | 'illustrations' | 'citations' | 'study-report' | null) => void
  setPromptText: (value: string) => void
  setSocraticCoachSession: (value: WorkspaceCoachSessionData | null) => void
  setCoachAnswers: (value: Record<string, string>) => void
  setCoachFeedback: (value: Record<string, WorkspaceCoachFeedbackDetail | null>) => void
  setRepairLockedAnchors: (value: string[]) => void
  setDnaIntegrityLoading: (value: boolean) => void
  setDnaIntegrityReport: (value: WorkspaceIntegrityReport | null) => void
  setDnaIntegrityExpanded: (value: boolean) => void
  setActivePhase: (phase: string) => void
  setActiveSection: (section: string) => void
  setVisualizationMode: (value: 'passage' | 'refine') => void
  setScriptureQuery: (value: string) => void
  setScriptureTranslation: (value: string) => void
  setParallelTranslations: (value: string) => void
  setScriptureError: (value: string | null) => void
  setScriptureValidationWarning: (value: string | null) => void
  setScriptureLastLookup: (value: string) => void
  setScriptureResult: (value: unknown) => void
  setParallelResults: (value: Array<Record<string, unknown>>) => void
  setContextData: (value: unknown) => void
  setStructuralAnalysis: (value: StructuralAnalysisData | null) => void
  setInterpretiveChallenges: (value: InterpretiveChallengeData | null) => void
  setPerVerseContext: (value: VerseContextData | null) => void
  setPassageSummary: (value: PassageSummaryData | null) => void
  setStudySynthesis: (value: StudySynthesisData | null) => void
  setCanonicalThemes: (value: CanonicalThemesData | null) => void
  setVerseCommentary: (value: VerseCommentaryData | null) => void
  setTranslationComparison: (value: TranslationComparisonData | null) => void
  setGeneratedScriptureSections: (value: Record<string, boolean>) => void
  setScriptureSectionRefreshKey: (value: Record<string, number>) => void
  setScriptureLookupHistory: (value: any[]) => void
  setScriptureSuggestions: (value: string[]) => void
  setShowScriptureSuggestions: (value: boolean) => void
  setScriptureSuggestionIndex: (value: number) => void
  setScriptureInputWarning: (value: string | null) => void
  citationTranslation: string
  searchQuery: string
  setWordStudyWord: (value: string) => void
  setWordStudyLanguage: (value: string) => void
  setWordStudyLookupContext: (value: string) => void
  setWordStudyLastLookup: (value: string) => void
  setWordStudyResult: (value: Record<string, unknown> | null) => void
  setWordStudyInsights: (value: Record<string, unknown> | null) => void
  setWordStudyError: (value: string | null) => void
  setWordStudySuggestionsLoading: (value: boolean) => void
  setWordStudySuggestions: (value: Array<{ term: string; transliteration?: string; gloss?: string; reason?: string; language?: string }>) => void
  setCrossRefVerse: (value: string) => void
  setCrossRefLastLookup: (value: string) => void
  setCrossRefHasScriptureResults: (value: boolean) => void
  setCrossRefResults: (value: Array<Record<string, unknown>>) => void
  setCrossRefError: (value: string | null) => void
  setSearchResults: (value: WorkspaceSearchResult[]) => void
  setManuscriptCueHealth: (value: Record<string, { total: number; matched: number; stale: boolean }>) => void
  setLastRepairNotice: (value: { manuscriptId: string; repairedCount: number; remainingCount: number; lastRepairedAt: string } | null) => void
  setManuscriptQualityExpanded: (value: (prev: Record<string, boolean>) => Record<string, boolean>) => void
  setRepairHistoryExpanded: (value: (prev: Record<string, boolean>) => Record<string, boolean>) => void
  setAudioUrl: (value: string | null) => void
  setAudioError: (value: string | null) => void
  setIsAudioLoading: (value: boolean) => void
  setReferencePreview: (value: { reference: string; text: string; context?: string; loading: boolean } | null) => void
  setPendingSearchJump: (value: { manuscriptId: string | null; query: string } | null) => void
  setLoading: (value: boolean) => void
  openReferencePreview: (reference: string, context?: string) => Promise<void>
  buildScriptureSnapshot: (payload: any) => any
  mergeScriptureLookupHistory: (snapshot: any, history: any[]) => any[]
  persistScriptureSnapshot: (snapshot: any) => Promise<void>
  applyScriptureLookupSnapshot: (snapshot: any) => void
  regenerateScriptureSection: (section: string) => void
  handleGenerate: (type: string, override?: string) => Promise<void>
}

export function useWorkspaceActions(deps: WorkspaceActionsDeps) {
  const {
    workspaceId,
    workspace,
    workspaceState,
    workspaceDraft,
    workspaceApiClient,
    refreshWorkspaceState,
    withToken,
    setError,
    setActionLoading,
    setGenerationJob,
    setRepairJob,
    setSermonCoreGenerating,
    setWorkspace,
    setEditingWorkspace,
    setEditingOutlineId,
    setOutlineDraft,
    setEditingManuscriptId,
    setManuscriptDraft,
    setManuscriptCueDraft,
    setLegacyConvertCandidateId,
    setEditingApplicationId,
    setApplicationDraft,
    setEditingQuestionId,
    setQuestionDraft,
    setEditingIllustrationId,
    setIllustrationDraft,
    setEditingCitationId,
    setCitationDraft,
    setCitationTranslation,
    setPromptModalOpen,
    setPromptType,
    setPromptText,
    setSocraticCoachSession,
    setCoachAnswers,
    setCoachFeedback,
    setRepairLockedAnchors,
    setDnaIntegrityLoading,
    setDnaIntegrityReport,
    setDnaIntegrityExpanded,
    setActivePhase,
    setActiveSection,
    setVisualizationMode,
    setScriptureQuery,
    setScriptureTranslation,
    setParallelTranslations,
    setScriptureError,
    setScriptureValidationWarning,
    setScriptureLastLookup,
    setScriptureResult,
    setParallelResults,
    setContextData,
    setStructuralAnalysis,
    setInterpretiveChallenges,
    setPerVerseContext,
    setPassageSummary,
    setStudySynthesis,
    setCanonicalThemes,
    setVerseCommentary,
    setTranslationComparison,
    setGeneratedScriptureSections,
    setScriptureSectionRefreshKey,
    setScriptureLookupHistory,
    setScriptureSuggestions,
    setShowScriptureSuggestions,
    setScriptureSuggestionIndex,
    setScriptureInputWarning,
    citationTranslation,
    searchQuery,
    setWordStudyWord,
    setWordStudyLanguage,
    setWordStudyLookupContext,
    setWordStudyLastLookup,
    setWordStudyResult,
    setWordStudyInsights,
    setWordStudyError,
    setWordStudySuggestionsLoading,
    setWordStudySuggestions,
    setCrossRefVerse,
    setCrossRefLastLookup,
    setCrossRefHasScriptureResults,
    setCrossRefResults,
    setCrossRefError,
    setSearchResults,
    setManuscriptCueHealth,
    setLastRepairNotice,
    setManuscriptQualityExpanded,
    setRepairHistoryExpanded,
    setAudioUrl,
    setAudioError,
    setIsAudioLoading,
    setReferencePreview,
    setPendingSearchJump,
    setLoading,
    openReferencePreview,
    buildScriptureSnapshot,
    mergeScriptureLookupHistory,
    persistScriptureSnapshot,
    applyScriptureLookupSnapshot,
    regenerateScriptureSection,
    handleGenerate,
  } = deps

  const withClient = () => {
    const client = workspaceApiClient()
    if (!client) {
      setError('Unable to connect to the API.')
      return null
    }
    return client
  }

  const withAuth = () => {
    const token = withToken()
    if (!token) return null
    return token
  }

  const refreshAndReturn = async () => {
    const config = withAuth()
    if (!config) return null
    return refreshWorkspaceState(config)
  }

  const handleGenerateSermonCore = async (): Promise<SermonCoreData | null> => {
    const config = withAuth()
    if (!config) return null
    const client = withClient()
    if (!client || !client.generateSermonCore) return null

    setSermonCoreGenerating(true)
    let queuedGeneration = false
    try {
      const response = await client.generateSermonCore(workspaceId, {}, true)
      const responseData = response?.data as { jobId?: string; status?: string; state?: string; message?: string } | undefined
      if (responseData?.jobId) {
        queuedGeneration = true
        setGenerationJob({
          capability: 'sermon-core',
          jobId: String(responseData.jobId),
          status: String(responseData.status || 'queued'),
          state: String(responseData.state || 'queued'),
          message: String(responseData.message || ''),
        })
        return null
      }
      if (response?.data) {
        const sermonCoreData = response.data as SermonCoreData
        setWorkspace((prev) => (prev ? { ...prev, sermonCore: sermonCoreData } : prev))
        return sermonCoreData
      }
      return null
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to generate sermon core')
      return null
    } finally {
      if (!queuedGeneration) {
        setSermonCoreGenerating(false)
      }
    }
  }

  const handleGenerateWrapper = async (type: string, override?: string) => handleGenerate(type, override)

  const handleSermonCoreChange = async (data: SermonCoreData) => {
    const config = withAuth()
    if (!config) return
    const client = withClient()
    if (!client || !client.updateWorkspace) return
    setWorkspace((prev) => (prev ? { ...prev, sermonCore: data } : prev))
    try {
      await client.updateWorkspace(workspaceId, { sermonCore: data })
    } catch (err) {
      console.error('Failed to save sermon core:', err)
    }
  }

  const handleWorkspaceSave = async () => {
    const config = withAuth()
    if (!config || !workspace || !workspaceDraft) return
    const client = withClient()
    if (!client || !client.updateWorkspace) return
    setActionLoading((prev) => (prev.includes('workspace') ? prev : [...prev, 'workspace']))
    try {
      await client.updateWorkspace(workspaceId, {
        title: workspaceDraft.title,
        seriesTitle: (workspaceDraft as any).seriesTitle,
        mainPassage: workspaceDraft.mainPassage,
        additionalPassages: (workspaceDraft as any).additionalPassages,
        theme: workspaceDraft.theme,
        audienceProfile: workspaceDraft.audienceProfile,
        sermonGoals: workspaceDraft.sermonGoals,
        theologicalLens: 'adventist',
        style: workspaceDraft.style,
        storyArc: workspaceDraft.storyArc,
        language: workspaceDraft.language,
        includeEGW: (workspaceDraft as any).includeEGW,
      })
      await refreshWorkspaceState(config)
      setEditingWorkspace(false)
    } catch (err) {
      console.error('Failed to update workspace', err)
      setError('Unable to save workspace changes.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'workspace'))
    }
  }

  const handleOutlineSave = async () => {
    const config = withAuth()
    if (!config || !workspaceDraft) return
    const client = withClient()
    if (!client || !client.updateOutline) return
    setActionLoading((prev) => (prev.includes('outline-edit') ? prev : [...prev, 'outline-edit']))
    try {
      await client.updateOutline((workspaceDraft as any).id || '', {
        title: (workspaceDraft as any).title,
        structure: {
          introduction: (workspaceDraft as any).introduction,
          points: (workspaceDraft as any).points,
          pointNodes: Array.isArray((workspaceDraft as any).pointNodes) ? (workspaceDraft as any).pointNodes : [],
          conclusion: (workspaceDraft as any).conclusion,
          callToAction: (workspaceDraft as any).callToAction,
        },
      })
      await refreshWorkspaceState(config)
      setEditingOutlineId(null)
      setOutlineDraft(null)
    } catch (err) {
      console.error('Failed to update outline', err)
      setError('Unable to save outline changes.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'outline-edit'))
    }
  }

  const handleOutlineSelect = async (outlineId: string) => {
    const config = withAuth()
    if (!config) return
    const client = withClient()
    if (!client || !client.updateOutline) return
    const actionKey = `outline-select-${outlineId}`
    setActionLoading((prev) => (prev.includes(actionKey) ? prev : [...prev, actionKey]))
    try {
      await client.updateOutline(outlineId, { isSelected: true })
      await refreshWorkspaceState(config)
    } catch (err) {
      console.error('Failed to activate outline', err)
      setError('Unable to activate outline.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== actionKey))
    }
  }

  const handleCitationValidate = async () => {
    const config = withAuth()
    if (!config) return
    const client = withClient()
    if (!client || !client.validateCitations) return
    setActionLoading((prev) => (prev.includes('citations-validate') ? prev : [...prev, 'citations-validate']))
    try {
      await client.validateCitations(workspaceId, citationTranslation || 'KJV')
      await refreshWorkspaceState(config)
    } catch (err) {
      console.error('Citation validation failed', err)
      setError('Unable to validate citations.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'citations-validate'))
    }
  }

  const handleSearch = async () => {
    const config = withAuth()
    if (!config || !searchQuery) return
    setActionLoading((prev) => (prev.includes('search') ? prev : [...prev, 'search']))
    try {
      const client = withClient()
      if (!client || !client.search) return
      const response = await client.search(searchQuery)
      setSearchResults(Array.isArray(response) ? response : [])
    } catch (err) {
      console.error('Search failed', err)
      setError('Unable to search.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'search'))
    }
  }

  return {
    handleGenerateSermonCore,
    handleGenerate: handleGenerateWrapper,
    handleSermonCoreChange,
    handleWorkspaceSave,
    handleOutlineSave,
    handleOutlineSelect,
    handleCitationValidate,
    handleSearch,
  }
}
