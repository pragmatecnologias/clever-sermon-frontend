'use client'

import type { SermonCoreData } from '@/components/SermonCore'
import { getLatestManuscriptRepairIssues } from '@/components/workspace-metadata.helpers'

type ManuscriptCues = {
  slide: string[]
  keyLine: string[]
  transition: string[]
  pause: string[]
  read: string[]
  quote: string[]
  cta: string[]
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

type WorkspaceRepairPlanItem = {
  issueId?: string
  questionId?: string
  question?: string
  sourceAnchor?: string
  rewriteHint?: string
  improvementSuggestion?: string
  coachFeedback?: string
}

type WorkspacePageData = {
  mainPassage?: string
  audienceProfile?: string
  egwEnabled?: boolean
  studyReports?: Array<{ id?: string; sections?: Record<string, unknown> }>
  manuscripts?: Array<{
    id?: string
    content?: {
      text?: string
      formatVersion?: string
      cues?: ManuscriptCues | null
      metadata?: Record<string, unknown>
    }
  }>
  outlines?: Array<{
    id?: string
    isSelected?: boolean
    structure?: Record<string, unknown>
  }>
}

type GenerationJob = {
  capability: string
  jobId: string
  status: string
  state: string
  message: string
}

type Props = {
  workspaceId: string
  workspace: any
  withToken: () => Record<string, unknown> | null
  getWorkspaceApiClient: () => any
  getAppApiClient: () => any
  refreshWorkspaceState: (config: Record<string, unknown>) => Promise<unknown>
  setActionLoading: (value: (prev: string[]) => string[]) => void
  setError: (value: string | null) => void
  setWorkspace: (value: any) => void
  setSermonCoreGenerating: any
  setGenerationJob: any
  setDnaIntegrityReport: (value: any) => void
  setDnaIntegrityLoading: any
  setDnaIntegrityExpanded: any
  setSocraticCoachSession: any
  setCoachFeedback: any
  setCoachAnswers: any
  setRepairLockedAnchors: any
  setRepairJob: any
  manuscriptTone: string
  manuscriptTargetMinutes: number
  manuscriptFormat: 'full' | 'notes'
  manuscriptAudienceMode: string
  manuscriptIncludeSlideCues: boolean
  manuscriptIncludeKeyLines: boolean
  coachMode: 'refine' | 'self_reflection'
  coachListenerProfile: string
  repairLockedAnchors: string[]
  coachAnswers: Record<string, string>
  socraticCoachSession: {
    repairPlan?: WorkspaceRepairPlanItem[]
    questions?: WorkspaceCoachQuestion[]
  } | null
  setActivePhase: any
  setActiveSection: any
  openReferencePreview: (reference: string, note?: string) => Promise<void>
  normalizeManuscriptCues: (value: ManuscriptCues | Record<string, unknown> | null | undefined) => ManuscriptCues
  buildCueAnchorsFromHtml: any
  evaluateCueCoverage: any
  setManuscriptCueHealth: any
  setEditingManuscriptId: any
  setLegacyConvertCandidateId: any
  setManuscriptDraft: any
  setManuscriptCueDraft: any
  emptyManuscriptCues: any
}

type StudyAssetType = 'applications' | 'questions' | 'illustrations' | 'media'

const unwrapJobPayload = (response: unknown) => {
  if (!response || typeof response !== 'object') return null
  const record = response as Record<string, unknown>
  const maybeData = record.data
  if (maybeData && typeof maybeData === 'object' && !Array.isArray(maybeData)) {
    return maybeData as Record<string, unknown>
  }
  return record
}

export function useWorkspaceGenerationActions({
  workspaceId,
  workspace,
  withToken,
  getWorkspaceApiClient,
  getAppApiClient,
  refreshWorkspaceState,
  setActionLoading,
  setError,
  setWorkspace,
  setSermonCoreGenerating,
  setGenerationJob,
  setDnaIntegrityReport,
  setDnaIntegrityLoading,
  setDnaIntegrityExpanded,
  setSocraticCoachSession,
  setCoachFeedback,
  setCoachAnswers,
  setRepairLockedAnchors,
  setRepairJob,
  manuscriptTone,
  manuscriptTargetMinutes,
  manuscriptFormat,
  manuscriptAudienceMode,
  manuscriptIncludeSlideCues,
  manuscriptIncludeKeyLines,
  coachMode,
  coachListenerProfile,
  repairLockedAnchors,
  coachAnswers,
  socraticCoachSession,
  setActivePhase,
  setActiveSection,
  openReferencePreview,
  normalizeManuscriptCues,
  buildCueAnchorsFromHtml,
  evaluateCueCoverage,
  setManuscriptCueHealth,
  setEditingManuscriptId,
  setLegacyConvertCandidateId,
  setManuscriptDraft,
  setManuscriptCueDraft,
  emptyManuscriptCues,
}: Props) {
  const repairedIssueIds = new Set<string>(getLatestManuscriptRepairIssues(workspace as any))
  const pendingCoachRepairPlan = (socraticCoachSession?.repairPlan || []).filter((item) => {
    const issueId = String(item?.issueId || '').trim()
    return issueId && !repairedIssueIds.has(issueId)
  })

  const getRepairIssueByQuestionId = (questionId: string) => {
    const plan = Array.isArray(socraticCoachSession?.repairPlan) ? socraticCoachSession.repairPlan : []
    return plan.find((item) => String(item?.questionId || '').trim() === String(questionId || '').trim())
  }

  const handleGenerateSermonCore = async (): Promise<SermonCoreData | null> => {
    const config = withToken()
    if (!config) return null
    const client = getWorkspaceApiClient()
    if (!client) return null
    setSermonCoreGenerating(true)
    try {
      const response = await client.generateSermonCore(workspaceId, {}, false)
      const sermonCoreData = unwrapJobPayload(response) as SermonCoreData | null
      if (!sermonCoreData || typeof sermonCoreData !== 'object') return null
      const normalizedCore: SermonCoreData = {
        bigIdea: String(sermonCoreData.bigIdea || '').trim(),
        fallenCondition: String(sermonCoreData.fallenCondition || '').trim(),
        centralTruth: String(sermonCoreData.centralTruth || '').trim(),
        sermonGoal: String(sermonCoreData.sermonGoal || '').trim(),
        audienceNeed: String(sermonCoreData.audienceNeed || '').trim(),
      }
      setWorkspace((prev: any) => (prev ? { ...prev, sermonCore: normalizedCore } : prev))
      await refreshWorkspaceState(config)
      return normalizedCore
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to generate sermon core')
      return null
    } finally {
      setSermonCoreGenerating(false)
    }
  }

  const handleSermonCoreChange = async (data: SermonCoreData) => {
    const config = withToken()
    if (!config) return
    const client = getWorkspaceApiClient()
    if (!client) return
    setWorkspace((prev: any) => (prev ? { ...prev, sermonCore: data } : prev))
    try {
      await client.updateWorkspace(workspaceId, { sermonCore: data })
    } catch (err) {
      console.error('Failed to save sermon core:', err)
    }
  }

  const fetchDnaIntegrityReport = async () => {
    const config = withToken()
    if (!config) return
    const client = getWorkspaceApiClient()
    if (!client) return
    setDnaIntegrityLoading(true)
    try {
      const response = await client.runIntegrityCheck(workspaceId, false)
      setDnaIntegrityReport((response as unknown) || null)
    } catch (err) {
      console.error('Failed to load DNA integrity report', err)
      setDnaIntegrityReport(null)
    } finally {
      setDnaIntegrityLoading(false)
    }
  }

  const handleGenerate = async (type: string, override?: string) => {
    const config = withToken()
    if (!config) return
    const client = getWorkspaceApiClient()
    if (!client) return
    let queuedGenerationType: string | null = null
    const studyAssetLabels: Record<StudyAssetType, string> = {
      applications: 'Applications',
      questions: 'Discussion Questions',
      illustrations: 'Illustrations',
      media: 'Media Suggestions',
    }
    const isStudyAssetType = (value: string): value is StudyAssetType =>
      value === 'applications' || value === 'questions' || value === 'illustrations' || value === 'media'

    setActionLoading((prev) => (prev.includes(type) ? prev : [...prev, type]))
    try {
      let generatedResponse: { data?: { id?: string; jobId?: string; status?: string; state?: string; message?: string } } | null = null
      if (isStudyAssetType(type)) {
        // WorkspaceStateResponse: studyReports at workspaceState.workspace.studyReports
        // WorkspacePageData: studyReports at top level
        const studyReports = (workspace as any)?.workspace?.studyReports ?? workspace?.studyReports
        if (!studyReports?.length) {
          setError('Generate the Study Report first before creating applications, questions, illustrations, or media suggestions.')
          return
        }
        try {
          if (type === 'applications') {
            generatedResponse = await client.generateApplications(workspaceId, { promptOverride: override, includeEGW: workspace?.egwEnabled || false } as Record<string, unknown>, false)
          } else if (type === 'questions') {
            generatedResponse = await client.generateDiscussionQuestions(workspaceId, { promptOverride: override } as Record<string, unknown>, false)
          } else if (type === 'illustrations') {
            generatedResponse = await client.generateIllustrations(workspaceId, { promptOverride: override } as Record<string, unknown>, false)
          } else if (type === 'media') {
            generatedResponse = await client.generateMediaSuggestions(workspaceId, { promptOverride: override } as Record<string, unknown>, false)
          }
          if (generatedResponse?.data?.jobId) {
            queuedGenerationType = type
            setGenerationJob({
              capability: type,
              jobId: String(generatedResponse.data.jobId),
              status: String(generatedResponse.data.status || 'queued'),
              state: String(generatedResponse.data.state || 'queued'),
              message: String(generatedResponse.data.message || ''),
            })
          }
        } catch (assetError) {
          console.error(`${type} generation failed`, assetError)
          setError(`${studyAssetLabels[type]} generation failed. Please retry.`)
          return
        }
      } else if (type === 'outlines') {
        generatedResponse = await client.generateOutlines(workspaceId, { promptOverride: override, includeEGW: workspace?.egwEnabled || false } as Record<string, unknown>, false)
        if (generatedResponse?.data?.jobId) {
          queuedGenerationType = type
          setGenerationJob({
            capability: type,
            jobId: String(generatedResponse.data.jobId),
            status: String(generatedResponse.data.status || 'queued'),
            state: String(generatedResponse.data.state || 'queued'),
            message: String(generatedResponse.data.message || ''),
          })
        }
      } else if (type === 'manuscript') {
        const selectedOutline = workspace?.outlines?.find((o: any) => o.isSelected) || workspace?.outlines?.[0]
        if (!selectedOutline) {
          setError('Create or generate an outline first.')
          return
        }
        const appClient = getAppApiClient()
        if (!appClient) return
        generatedResponse = await appClient.post(`/workspaces/${workspaceId}/manuscript`, {
          outlineId: selectedOutline.id,
          promptOverride: override,
          includeEGW: workspace?.egwEnabled || false,
          manuscriptOptions: {
            tone: manuscriptTone,
            targetMinutes: manuscriptTargetMinutes,
            format: manuscriptFormat,
            audienceMode: manuscriptAudienceMode === 'default' ? (workspace?.audienceProfile || 'general congregation') : manuscriptAudienceMode,
            includeSlideCues: manuscriptIncludeSlideCues,
            includeKeyLines: manuscriptIncludeKeyLines,
            includeStudyInsights: true,
          },
        })
      } else if (type === 'citations') {
        console.log('[handleGenerate] Calling generateCitations for type:', type)
        generatedResponse = await client.generateCitations(workspaceId, { promptOverride: override } as Record<string, unknown>, true)
        console.log('[handleGenerate] generateCitations response:', JSON.stringify(generatedResponse))
        const citationJob = unwrapJobPayload(generatedResponse)
        if (citationJob?.jobId) {
          console.log('[handleGenerate] Setting generationJob with jobId:', citationJob.jobId)
          queuedGenerationType = type
          setGenerationJob({
            capability: type,
            jobId: String(citationJob.jobId),
            status: String(citationJob.status || 'queued'),
            state: String(citationJob.state || 'queued'),
            message: String(citationJob.message || ''),
          })
        }
      } else if (type === 'study-report') {
        generatedResponse = await client.generateStudyReport(
          workspaceId,
          { promptOverride: override, includeEGW: workspace?.egwEnabled || false } as Record<string, unknown>,
          false,
        )
        const generatedStudyReport = unwrapJobPayload(generatedResponse) as { id?: string; sections?: Record<string, unknown> } | null
        if (generatedStudyReport) {
          setWorkspace((prev: any) =>
            prev
              ? ({
                  ...prev,
                  studyReports: [
                    generatedStudyReport,
                    ...(prev.studyReports || []).filter((item: any) => item.id !== generatedStudyReport.id),
                  ],
                } as WorkspacePageData)
              : prev,
          )
        }
        // Refresh workspace state to get latest data before clearing loading
        await refreshWorkspaceState(config)
        setActionLoading((prev) => prev.filter((item) => item !== 'study-report'))
        return
      } else if (type === 'integrity-check') {
        generatedResponse = await client.runIntegrityCheck(workspaceId, true)
        if (generatedResponse?.data?.jobId) {
          queuedGenerationType = type
          setGenerationJob({
            capability: type,
            jobId: String(generatedResponse.data.jobId),
            status: String(generatedResponse.data.status || 'queued'),
            state: String(generatedResponse.data.state || 'queued'),
            message: String(generatedResponse.data.message || ''),
          })
        }
      } else if (type === 'sermon-core') {
        await handleGenerateSermonCore()
      } else if (type === 'dna') {
        const appClient = getAppApiClient()
        if (!appClient) return
        generatedResponse = await appClient.sermonDnaAnalyze(workspaceId)
      }

      if (!queuedGenerationType) {
        await refreshWorkspaceState(config)
      }
      if (type === 'dna') {
        await fetchDnaIntegrityReport()
        setDnaIntegrityExpanded(true)
      }
    } catch (err) {
      console.error('Generation failed', err)
      setError('Action failed. Check backend logs.')
    } finally {
      if (!queuedGenerationType) {
        setActionLoading((prev) => prev.filter((item) => item !== type && item !== 'study-report'))
      }
    }
  }

  const handleSocraticCoachGenerate = async () => {
    const config = withToken()
    if (!config) return
    const client = getAppApiClient()
    if (!client) return
    const actionKey = 'coach'
    setActionLoading((prev) => (prev.includes(actionKey) ? prev : [...prev, actionKey]))
    try {
      const response = await client.post(`/workspaces/${workspaceId}/socratic-coach`, {
        mode: coachMode,
        listenerProfile: coachListenerProfile,
      })
      setSocraticCoachSession(response || null)
      setCoachFeedback({})
      setCoachAnswers({})
      setRepairLockedAnchors([])
      setRepairJob(null)
      await refreshWorkspaceState(config)
    } catch (err) {
      console.error('Failed to generate socratic coach session', err)
      setError('Unable to generate Socratic Coach questions.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== actionKey))
    }
  }

  const handleSocraticCoachAnswer = async (questionId: string) => {
    const answer = String(coachAnswers[questionId] || '').trim()
    if (!answer) return
    const config = withToken()
    if (!config) return
    const client = getAppApiClient()
    if (!client) return
    const actionKey = `coach-answer-${questionId}`
    setActionLoading((prev) => (prev.includes(actionKey) ? prev : [...prev, actionKey]))
    try {
      const response = await client.post(`/workspaces/${workspaceId}/socratic-coach`, {
        mode: coachMode,
        listenerProfile: coachListenerProfile,
        questionId,
        answer,
      })
      setCoachFeedback((prev: any) => ({ ...prev, [questionId]: response as WorkspaceCoachFeedbackDetail | null }))
    } catch (err) {
      console.error('Failed to submit socratic coach answer', err)
      setError('Unable to process coach answer.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== actionKey))
    }
  }

  const queueCoachRepairJob = async (issueIds: string[], conversationSummary: string) => {
    const config = withToken()
    if (!config) return
    const client = getAppApiClient()
    if (!client) return
    if (!Array.isArray(issueIds) || issueIds.length === 0) {
      setError('No mapped repair action was found.')
      return
    }
    const selectedManuscript = workspace?.manuscripts?.[0]
    if (!selectedManuscript?.id) {
      setError('No manuscript available to repair.')
      return
    }
    const actionKey = 'coach-repair-apply'
    setActionLoading((prev) => (prev.includes(actionKey) ? prev : [...prev, actionKey]))
    try {
      const data = await client.post(`/workspaces/${workspaceId}/manuscripts/${selectedManuscript.id}/repair/apply`, {
        selectedIssueIds: issueIds,
        doNotTouchAnchors: repairLockedAnchors,
        conversationSummary: String(conversationSummary || '').trim(),
        mode: 'targeted',
      })
      setRepairJob({
        manuscriptId: selectedManuscript.id,
        jobId: String((data as any).jobId || ''),
        status: String((data as any).status || 'queued'),
        state: 'queued',
        message: 'Repair queued.',
      })
      setError(null)
    } catch (err) {
      console.error('Failed to apply coach repair', err)
      setError('Unable to start targeted repair.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== actionKey))
    }
  }

  const handleApplyCoachRepair = async (questionId: string) => {
    const issue = getRepairIssueByQuestionId(questionId)
    const issueId = String(issue?.issueId || '').trim()
    if (!issueId) {
      setError('This question does not have a mapped manuscript repair action.')
      return
    }
    if (repairedIssueIds.has(issueId)) {
      setError('This repair action is already applied in the current manuscript.')
      return
    }
    await queueCoachRepairJob([issueId], String(coachAnswers?.[questionId] || '').trim())
  }

  const handleApplyAllCoachRepairs = async () => {
    const issueIds: string[] = Array.from(new Set(pendingCoachRepairPlan.map((item) => String(item?.issueId || '').trim()).filter(Boolean)))
    if (issueIds.length === 0) {
      setError('No repair actions are available for this session.')
      return
    }
    const combinedSummary = (socraticCoachSession?.questions || [])
      .map((question) => {
        const questionId = String(question?.id || '').trim()
        if (!questionId) return ''
        const answer = String(coachAnswers?.[questionId] || '').trim()
        return answer ? `[${questionId}] ${answer}` : ''
      })
      .filter(Boolean)
      .join('\n')
    await queueCoachRepairJob(issueIds, combinedSummary)
  }

  const buildCoachApplyText = (
    question: WorkspaceCoachQuestion | null | undefined,
    feedback: WorkspaceCoachFeedbackDetail | null | undefined,
    answerText: string,
  ) => [
    `[Coach] ${question?.id || 'Q'} · ${question?.dimension || 'refinement'}`,
    question?.question ? `Question: ${question.question}` : '',
    answerText ? `Pastor Answer: ${answerText}` : '',
    feedback?.coachFeedback ? `Coach Feedback: ${feedback.coachFeedback}` : '',
    feedback?.improvementSuggestion ? `Improvement: ${feedback.improvementSuggestion}` : '',
    feedback?.rewriteHint ? `Suggested Line: ${feedback.rewriteHint}` : '',
  ].filter(Boolean).join('\n')

  const coachBlockToHtml = (title: string, block: string) => {
    const lines = String(block || '').split('\n').map((line) => line.trim()).filter(Boolean)
    const paragraphs = lines.map((line) => `<p>${line}</p>`).join('')
    return `<h3>${title}</h3>${paragraphs}`
  }

  const handleApplyCoachToManuscript = async (
    question: WorkspaceCoachQuestion | null | undefined,
    feedback: WorkspaceCoachFeedbackDetail | null | undefined,
  ) => {
    const config = withToken()
    if (!config) return
    const selectedManuscript = workspace?.manuscripts?.[0]
    if (!selectedManuscript?.id) {
      setError('No manuscript available to apply coach suggestion.')
      return
    }
    const questionId = String(question?.id || 'Q')
    const actionKey = `coach-apply-manuscript-${questionId}`
    setActionLoading((prev) => (prev.includes(actionKey) ? prev : [...prev, actionKey]))
    try {
      const currentText = String(selectedManuscript?.content?.text || '')
      const answerText = String(coachAnswers?.[questionId] || '').trim()
      const block = buildCoachApplyText(question, feedback, answerText)
      const isV2 = String(selectedManuscript?.content?.formatVersion || '').toLowerCase() === 'v2'
      const updatedText = isV2
        ? `${currentText}${coachBlockToHtml(`Coach Refinement (${questionId})`, block)}`
        : `${currentText}\n\n## Coach Refinement (${questionId})\n${block}\n`
      const payloadContent = isV2
        ? { formatVersion: 'v2', text: updatedText, cues: normalizeManuscriptCues(selectedManuscript?.content?.cues) }
        : { text: updatedText }
      const client = getWorkspaceApiClient()
      const reader = getAppApiClient()
      if (!client || !reader) return
      await client.updateManuscript(selectedManuscript.id, { content: payloadContent })
      const refreshed = await reader.get(`/workspaces/${workspaceId}`)
      setWorkspace(() => refreshed)
      setError(null)
    } catch (err) {
      console.error('Failed to apply coach suggestion to manuscript', err)
      setError('Unable to apply suggestion to manuscript.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== actionKey))
    }
  }

  const handleApplyCoachToOutline = async (
    question: WorkspaceCoachQuestion | null | undefined,
    feedback: WorkspaceCoachFeedbackDetail | null | undefined,
  ) => {
    const config = withToken()
    if (!config) return
    const selectedOutline = workspace?.outlines?.find((o: any) => o.isSelected) || workspace?.outlines?.[0]
    if (!selectedOutline?.id) {
      setError('No outline available to apply coach suggestion.')
      return
    }
    const questionId = String(question?.id || 'Q')
    const actionKey = `coach-apply-outline-${questionId}`
    setActionLoading((prev) => (prev.includes(actionKey) ? prev : [...prev, actionKey]))
    try {
      const client = getWorkspaceApiClient()
      const reader = getAppApiClient()
      if (!client || !reader) return
      const structure: any = { ...(selectedOutline?.structure || {}) }
      const pointNodes = Array.isArray(structure.pointNodes) ? [...structure.pointNodes] : []
      const sourceAnchor = String(question?.sourceAnchor || '').toLowerCase()
      const targetIndex = pointNodes.findIndex((node: any) => {
        const title = String(node?.title || node?.text || node?.content || '').toLowerCase()
        return sourceAnchor && title && (title.includes(sourceAnchor) || sourceAnchor.includes(title))
      })
      const answerText = String(coachAnswers?.[questionId] || '').trim()
      const coachLine = feedback?.rewriteHint || feedback?.improvementSuggestion || feedback?.coachFeedback || ''
      const coachNote = buildCoachApplyText(question, feedback, answerText)
      if (targetIndex >= 0) {
        const existingNode = { ...pointNodes[targetIndex] }
        const existingSubpoints = Array.isArray(existingNode.subpoints) ? [...existingNode.subpoints] : []
        if (coachLine) existingSubpoints.push(`Coach (${questionId}): ${coachLine}`)
        existingNode.subpoints = existingSubpoints.slice(0, 20)
        existingNode.notes = [String(existingNode.notes || '').trim(), coachNote].filter(Boolean).join('\n\n')
        pointNodes[targetIndex] = existingNode
      } else {
        const coachNotes = Array.isArray(structure.coachNotes) ? [...structure.coachNotes] : []
        coachNotes.push({
          id: `coach-${Date.now()}-${questionId}`,
          questionId,
          question: question?.question || '',
          sourceAnchor: question?.sourceAnchor || '',
          rewriteHint: feedback?.rewriteHint || '',
          improvementSuggestion: feedback?.improvementSuggestion || '',
          coachFeedback: feedback?.coachFeedback || '',
          answer: answerText,
          createdAt: new Date().toISOString(),
        })
        structure.coachNotes = coachNotes.slice(-25)
      }
      structure.pointNodes = pointNodes
      await client.updateOutline(selectedOutline.id, { structure })
      const refreshed = await reader.get(`/workspaces/${workspaceId}`)
      setWorkspace(() => refreshed)
      setError(null)
    } catch (err) {
      console.error('Failed to apply coach suggestion to outline', err)
      setError('Unable to apply suggestion to outline.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== actionKey))
    }
  }

  return {
    handleGenerateSermonCore,
    handleSermonCoreChange,
    handleGenerate,
    fetchDnaIntegrityReport,
    handleSocraticCoachGenerate,
    handleSocraticCoachAnswer,
    handleApplyCoachRepair,
    handleApplyAllCoachRepairs,
    handleApplyCoachToManuscript,
    handleApplyCoachToOutline,
  }
}
