import type { WorkspaceStateResponse } from '../../../../../shared/workspace-state.contract'

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1'

type JsonRecord = Record<string, unknown>

type RequestOptions = {
  token?: string
  params?: Record<string, string | number | boolean | undefined>
  body?: unknown
}

const buildUrl = (path: string, params?: RequestOptions['params']) => {
  const url = new URL(path.startsWith('http') ? path : `${DEFAULT_BASE_URL}${path}`)
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    url.searchParams.set(key, String(value))
  })
  return url.toString()
}

export interface WorkspaceApiClientOptions {
  baseUrl?: string
  token?: string
}

export const createWorkspaceApiClient = (options: WorkspaceApiClientOptions = {}) => {
  const baseUrl = options.baseUrl || DEFAULT_BASE_URL
  const request = async <T>(path: string, requestOptions: RequestOptions = {}, method = 'GET') => {
    const response = await fetch(
      buildUrl(path.startsWith('http') ? path : `${baseUrl}${path}`, requestOptions.params),
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(requestOptions.token || options.token ? { Authorization: `Bearer ${requestOptions.token || options.token}` } : {}),
        },
        body: requestOptions.body === undefined ? undefined : JSON.stringify(requestOptions.body),
      },
    )
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }
    return response.json() as Promise<T>
  }

  return {
    getWorkspace: (workspaceId: string) =>
      request<JsonRecord>(`/workspaces/${workspaceId}`, {}, 'GET'),
    getWorkspaceState: (workspaceId: string) =>
      request<WorkspaceStateResponse>(`/workspaces/${workspaceId}/state`, {}, 'GET'),
    getGenerationJobStatus: (workspaceId: string, jobId: string) =>
      request<JsonRecord>(`/workspaces/${workspaceId}/jobs/${jobId}`, {}, 'GET'),
    updateWorkspace: (workspaceId: string, payload: JsonRecord) =>
      request<JsonRecord>(`/workspaces/${workspaceId}`, { body: payload }, 'PATCH'),
    updateOutline: (outlineId: string, payload: JsonRecord) =>
      request<JsonRecord>(`/workspaces/outlines/${outlineId}`, { body: payload }, 'PATCH'),
    restoreOutlineHistory: (workspaceId: string, historyIndex: number) =>
      request<JsonRecord>(`/workspaces/${workspaceId}/outlines/history/${historyIndex}/restore`, {}, 'POST'),
    updateManuscript: (manuscriptId: string, payload: JsonRecord) =>
      request<JsonRecord>(`/workspaces/manuscripts/${manuscriptId}`, { body: payload }, 'PATCH'),
    restoreManuscriptHistory: (workspaceId: string, historyIndex: number) =>
      request<JsonRecord>(`/workspaces/${workspaceId}/manuscripts/history/${historyIndex}/restore`, {}, 'POST'),
    generateStudyReport: (workspaceId: string, payload: JsonRecord, asyncMode = true) =>
      request<JsonRecord>(`/workspaces/${workspaceId}/study-report`, {
        body: payload,
        params: asyncMode ? { async: 'true' } : undefined,
      }, 'POST'),
    generateOutlines: (workspaceId: string, payload: JsonRecord, asyncMode = true) =>
      request<JsonRecord>(`/workspaces/${workspaceId}/outlines`, {
        body: payload,
        params: asyncMode ? { async: 'true' } : undefined,
      }, 'POST'),
    generateSermonCore: (workspaceId: string, payload: JsonRecord, asyncMode = true) =>
      request<JsonRecord>(`/workspaces/${workspaceId}/sermon-core`, {
        body: payload,
        params: asyncMode ? { async: 'true' } : undefined,
      }, 'POST'),
    generateApplications: (workspaceId: string, payload: JsonRecord, asyncMode = true) =>
      request<JsonRecord>(`/workspaces/${workspaceId}/applications`, {
        body: payload,
        params: asyncMode ? { async: 'true' } : undefined,
      }, 'POST'),
    generateDiscussionQuestions: (workspaceId: string, payload: JsonRecord, asyncMode = true) =>
      request<JsonRecord>(`/workspaces/${workspaceId}/discussion-questions`, {
        body: payload,
        params: asyncMode ? { async: 'true' } : undefined,
      }, 'POST'),
    generateIllustrations: (workspaceId: string, payload: JsonRecord, asyncMode = true) =>
      request<JsonRecord>(`/workspaces/${workspaceId}/illustrations`, {
        body: payload,
        params: asyncMode ? { async: 'true' } : undefined,
      }, 'POST'),
    generateCitations: (workspaceId: string, payload: JsonRecord, asyncMode = true) =>
      request<JsonRecord>(`/workspaces/${workspaceId}/citations`, {
        body: payload,
        params: asyncMode ? { async: 'true' } : undefined,
      }, 'POST'),
    generateMediaSuggestions: (workspaceId: string, payload: JsonRecord, asyncMode = true) =>
      request<JsonRecord>(`/workspaces/${workspaceId}/media-suggestions`, {
        body: payload,
        params: asyncMode ? { async: 'true' } : undefined,
      }, 'POST'),
    runIntegrityCheck: (workspaceId: string, asyncMode = true) =>
      request<JsonRecord>(`/workspaces/${workspaceId}/integrity-check`, {
        params: asyncMode ? { async: 'true' } : undefined,
      }, 'POST'),
    validateCitations: (workspaceId: string, translation: string) =>
      request<JsonRecord>(`/workspaces/${workspaceId}/citations/validate`, {
        params: { translation },
      }, 'POST'),
    recordClaimReview: (workspaceId: string, payload: JsonRecord) =>
      request<JsonRecord>(`/workspaces/${workspaceId}/claim-reviews`, { body: payload }, 'POST'),
    recordIntegrityIssueReview: (workspaceId: string, payload: JsonRecord) =>
      request<JsonRecord>(`/workspaces/${workspaceId}/integrity-issue-reviews`, { body: payload }, 'POST'),
    updateApplication: (applicationId: string, payload: JsonRecord) =>
      request<JsonRecord>(`/workspaces/applications/${applicationId}`, { body: payload }, 'PATCH'),
    updateIllustration: (illustrationId: string, payload: JsonRecord) =>
      request<JsonRecord>(`/workspaces/illustrations/${illustrationId}`, { body: payload }, 'PATCH'),
    updateDiscussionQuestion: (questionId: string, payload: JsonRecord) =>
      request<JsonRecord>(`/workspaces/discussion-questions/${questionId}`, { body: payload }, 'PATCH'),
    updateCitation: (citationId: string, payload: JsonRecord) =>
      request<JsonRecord>(`/workspaces/citations/${citationId}`, { body: payload }, 'PATCH'),
    composeMediaPack: (workspaceId: string, payload: JsonRecord) =>
      request<JsonRecord>(`/workspaces/${workspaceId}/media-pack/compose`, { body: payload }, 'POST'),
  }
}

export const workspaceApiClient = createWorkspaceApiClient()
export type { WorkspaceStateResponse } from '../../../../../shared/workspace-state.contract'
export type { WorkspacePhase, WorkspaceSection } from '../../../../../shared/workspace-state.contract'
