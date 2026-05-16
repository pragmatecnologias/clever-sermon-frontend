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

const parseJsonResponse = async <T>(response: Response) => {
  const text = await response.text()
  if (!text) {
    return null as T
  }
  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

export interface AppApiClientOptions {
  baseUrl?: string
  token?: string
}

export const createAppApiClient = (options: AppApiClientOptions = {}) => {
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
    return parseJsonResponse<T>(response)
  }

  const requestText = async (path: string, requestOptions: RequestOptions = {}, method = 'GET') => {
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
    return response.text()
  }

  return {
    get: <T>(path: string, params?: RequestOptions['params']) => request<T>(path, { params }, 'GET'),
    post: <T>(path: string, body?: unknown, params?: RequestOptions['params']) => request<T>(path, { body, params }, 'POST'),
    patch: <T>(path: string, body?: unknown, params?: RequestOptions['params']) => request<T>(path, { body, params }, 'PATCH'),
    scripturalPassageWithContext: (reference: string, translation: string) =>
      request<JsonRecord>(`/scripture/passage-with-context`, { params: { reference, translation, _ts: Date.now() } }, 'GET'),
    scriptureParallel: (reference: string, translations: string) =>
      request<JsonRecord>(`/scripture/parallel`, { params: { reference, translations } }, 'GET'),
    scriptureContext: (reference: string) =>
      request<JsonRecord>(`/scripture/context`, { params: { reference } }, 'GET'),
    scriptureWordStudy: (word: string, language: string, responseLanguage: string) =>
      request<JsonRecord>(`/scripture/word-study`, { params: { word, language, responseLanguage } }, 'GET'),
    scriptureWordStudyInsights: (word: string, language: string, context: string | undefined, responseLanguage: string) =>
      request<JsonRecord>(`/scripture/word-study-insights`, { params: { word, language, context, responseLanguage } }, 'GET'),
    scriptureWordStudySuggestions: (reference: string, translation: string, language: string, responseLanguage: string) =>
      request<JsonRecord>(`/scripture/word-study-suggestions`, { params: { reference, translation, language, responseLanguage } }, 'GET'),
    scriptureCrossReferencesRanked: (verse: string) =>
      request<JsonRecord>(`/scripture/cross-references-ranked`, { params: { verse } }, 'GET'),
    scriptureValidateCitation: (statement: string, verseReference: string, translation: string) =>
      request<JsonRecord>(`/scripture/validate-citation`, { body: { statement, verseReference, translation } }, 'POST'),
    scriptureAudioBibles: () => request<JsonRecord>(`/scripture/audio-bibles`, {}, 'GET'),
    scriptureAudio: (reference: string, translation: string) =>
      request<JsonRecord>(`/scripture/audio`, { params: { reference, translation } }, 'GET'),
    search: (query: string) => request<JsonRecord>(`/search`, { params: { query } }, 'GET'),
    sermonDnaAnalyze: (workspaceId: string) => request<JsonRecord>(`/sermon-dna/analyze`, { body: { workspaceId } }, 'POST'),
    workspacePromptPreview: (workspaceId: string, type: string, outlineId?: string) =>
      requestText(`/workspaces/${workspaceId}/prompts`, { params: { type, outlineId } }, 'GET'),
  }
}

export const appApiClient = createAppApiClient()
