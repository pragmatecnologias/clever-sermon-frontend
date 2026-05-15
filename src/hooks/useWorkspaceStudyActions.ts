'use client'

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

type WorkspacePageData = {
  mainPassage?: string
  language?: string
  defaultTranslation?: string
  audienceProfile?: string
  style?: string
  egwEnabled?: boolean
  manuscripts?: Array<{ id?: string; content?: { text?: string; formatVersion?: string; cues?: Record<string, unknown> | null; metadata?: Record<string, unknown> } }>
  outlines?: Array<{ id?: string; isSelected?: boolean; structure?: Record<string, unknown> }>
}

type ManuscriptCues = {
  slide: string[]
  keyLine: string[]
  transition: string[]
  pause: string[]
  read: string[]
  quote: string[]
  cta: string[]
}

type ScriptureLookupSnapshot = {
  scriptureResult: any
  scriptureLastLookup: string
  scriptureQuery: string
  scriptureTranslation: string
  parallelTranslations: string
  parallelResults: Array<Record<string, unknown>>
  contextData: Record<string, unknown> | string | string[] | null
  structuralAnalysis: StructuralAnalysisData | null
  interpretiveChallenges: InterpretiveChallengeData | null
  perVerseContext: VerseContextData | null
  passageSummary: PassageSummaryData | null
  studySynthesis: StudySynthesisData | null
  canonicalThemes: CanonicalThemesData | null
  verseCommentary: VerseCommentaryData | null
  translationComparison: TranslationComparisonData | null
  cachedAt: string
  lookupHistory?: ScriptureLookupSnapshot[]
  wordStudy?: Record<string, unknown>
  crossReferences?: Record<string, unknown>
}

type Props = {
  workspaceId: string
  workspace: WorkspacePageData | null
  withToken: () => Record<string, unknown> | null
  getAppApiClient: () => any
  getWorkspaceApiClient: () => any
  refreshWorkspaceState: (config: Record<string, unknown>) => Promise<unknown>
  setActionLoading: any
  setError: (value: string | null) => void
  setScriptureError: (value: string | null) => void
  setScriptureValidationWarning: (value: string | null) => void
  scriptureQuery: string
  setScriptureQuery: (value: string) => void
  scriptureTranslation: string
  setScriptureTranslation: (value: string) => void
  parallelTranslations: string
  setParallelTranslations: (value: string) => void
  scriptureLastLookup: string
  setScriptureLastLookup: (value: string) => void
  scriptureLookupHistory: ScriptureLookupSnapshot[]
  setScriptureResult: (value: any) => void
  setParallelResults: (value: Array<Record<string, unknown>>) => void
  setContextData: (value: any) => void
  setStructuralAnalysis: (value: StructuralAnalysisData | null) => void
  setInterpretiveChallenges: (value: InterpretiveChallengeData | null) => void
  setPerVerseContext: (value: VerseContextData | null) => void
  setPassageSummary: (value: PassageSummaryData | null) => void
  setStudySynthesis: (value: StudySynthesisData | null) => void
  setCanonicalThemes: (value: CanonicalThemesData | null) => void
  setVerseCommentary: (value: VerseCommentaryData | null) => void
  setTranslationComparison: (value: TranslationComparisonData | null) => void
  setGeneratedScriptureSections: any
  setScriptureSectionRefreshKey: any
  buildScriptureSnapshot: (value: any) => ScriptureLookupSnapshot
  persistScriptureSnapshot: (value: ScriptureLookupSnapshot) => Promise<void>
  persistSupplementalStudyCache: (value: Record<string, unknown>) => Promise<void>
  normalizeScriptureResult: (value: any, reference: string, translation: string) => any
  extractVerses: (value: any) => Array<{ reference?: string; text?: string }>
  getVerseValidationWarning: (reference: string, verses: Array<{ reference?: string }>) => string | null
  scriptureLookupRequestId: { current: number }
  scriptureSuggestions: string[]
  setScriptureSuggestions: (value: string[]) => void
  setScriptureInputWarning: (value: string | null) => void
  setShowScriptureSuggestions: (value: boolean) => void
  setScriptureSuggestionIndex: (value: number | ((prev: number) => number)) => void
  buildScriptureSuggestions: (value: string) => void
  wordStudyWord: string
  setWordStudyWord: (value: string) => void
  wordStudyLanguage: string
  setWordStudyLanguage: (value: string) => void
  setWordStudyLookupContext: (value: string) => void
  setWordStudyLastLookup: (value: string) => void
  setWordStudyError: (value: string | null) => void
  setWordStudyResult: (value: Record<string, unknown> | null) => void
  setWordStudyInsights: (value: Record<string, unknown> | null) => void
  setWordStudySuggestions: (value: Array<{ term: string; transliteration?: string; gloss?: string; reason?: string; language?: string }>) => void
  setWordStudySuggestionsLoading: (value: boolean) => void
  crossRefVerse: string
  setCrossRefVerse: (value: string) => void
  setCrossRefError: (value: string | null) => void
  setCrossRefLastLookup: (value: string) => void
  setCrossRefHasScriptureResults: (value: boolean) => void
  setCrossRefResults: (value: Array<{ reference: string; category?: string | null; relevanceScore?: number; explanation?: string; text?: string }>) => void
  searchQuery: string
  setSearchResults: (value: Array<{ workspaceId?: string; type?: string; id?: string; title?: string; snippet?: string }>) => void
  promptType: 'outline' | 'manuscript' | 'applications' | 'questions' | 'illustrations' | 'citations' | 'study-report' | null
  setPromptType: (value: Props['promptType']) => void
  promptText: string
  setPromptText: (value: string) => void
  setPromptModalOpen: (value: boolean) => void
  workspaceIdRef: string
  handleGenerate: (type: string, override?: string) => Promise<void>
}

export function useWorkspaceStudyActions({
  workspaceId,
  workspace,
  withToken,
  getAppApiClient,
  getWorkspaceApiClient,
  refreshWorkspaceState,
  setActionLoading,
  setError,
  setScriptureError,
  setScriptureValidationWarning,
  scriptureQuery,
  setScriptureQuery,
  scriptureTranslation,
  setScriptureTranslation,
  parallelTranslations,
  setParallelTranslations,
  scriptureLastLookup,
  setScriptureLastLookup,
  scriptureLookupHistory,
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
  buildScriptureSnapshot,
  persistScriptureSnapshot,
  persistSupplementalStudyCache,
  normalizeScriptureResult,
  extractVerses,
  getVerseValidationWarning,
  scriptureLookupRequestId,
  scriptureSuggestions,
  setScriptureSuggestions,
  setScriptureInputWarning,
  setShowScriptureSuggestions,
  setScriptureSuggestionIndex,
  buildScriptureSuggestions,
  wordStudyWord,
  setWordStudyWord,
  wordStudyLanguage,
  setWordStudyLanguage,
  setWordStudyLookupContext,
  setWordStudyLastLookup,
  setWordStudyError,
  setWordStudyResult,
  setWordStudyInsights,
  setWordStudySuggestions,
  setWordStudySuggestionsLoading,
  crossRefVerse,
  setCrossRefVerse,
  setCrossRefError,
  setCrossRefLastLookup,
  setCrossRefHasScriptureResults,
  setCrossRefResults,
  searchQuery,
  setSearchResults,
  promptType,
  setPromptType,
  promptText,
  setPromptText,
  setPromptModalOpen,
  workspaceIdRef,
  handleGenerate,
}: Props) {
  const handleScriptureLookup = async (overrides?: { reference?: string; translation?: string; parallelTranslation?: string }) => {
    const requestId = scriptureLookupRequestId.current + 1
    scriptureLookupRequestId.current = requestId
    const config = withToken()
    if (!config) return
    const normalizedReference = overrides?.reference?.trim() || scriptureQuery.trim() || workspace?.mainPassage?.trim() || ''
    if (!normalizedReference) {
      setScriptureError('Enter a passage (ex: John 3:16) or use the workspace main passage.')
      return
    }
    const normalizedTranslation = (overrides?.translation || scriptureTranslation).trim().toUpperCase() || 'KJV'
    const normalizedParallel = (overrides?.parallelTranslation || parallelTranslations).trim().toUpperCase() || normalizedTranslation
    setScriptureError(null)
    setScriptureValidationWarning(null)
    setScriptureQuery(normalizedReference)
    setScriptureTranslation(normalizedTranslation)
    setParallelTranslations(normalizedParallel)
    setScriptureLastLookup(normalizedReference)
    setScriptureResult(null)
    setParallelResults([])
    setContextData(null)
    setStructuralAnalysis(null)
    setInterpretiveChallenges(null)
    setPerVerseContext(null)
    setPassageSummary(null)
    setStudySynthesis(null)
    setCanonicalThemes(null)
    setVerseCommentary(null)
    setTranslationComparison(null)
    setGeneratedScriptureSections({
      passageSummary: false,
      verseContext: false,
      translationComparison: false,
      verseCommentary: false,
      structuralAnalysis: false,
      interpretiveChallenges: false,
      canonicalThemes: false,
      studySynthesis: false,
    })
    setScriptureSectionRefreshKey({
      passageSummary: 0,
      verseContext: 0,
      translationComparison: 0,
      verseCommentary: 0,
      structuralAnalysis: 0,
      interpretiveChallenges: 0,
      canonicalThemes: 0,
      studySynthesis: 0,
    })
    setActionLoading((prev: string[]) => (prev.includes('scripture') ? prev : [...prev, 'scripture']))
    try {
      const client = getAppApiClient()
      if (!client) return
      const passageRes = { data: await client.scripturalPassageWithContext(normalizedReference, normalizedTranslation) }
      if (requestId !== scriptureLookupRequestId.current) {
        setActionLoading((prev: string[]) => prev.filter((item) => item !== 'scripture'))
        return
      }
      const fallbackSnapshot = scriptureLookupHistory.find(
        (entry) =>
          entry.scriptureLastLookup.trim().toLowerCase() === normalizedReference.toLowerCase() &&
          entry.scriptureTranslation.trim().toUpperCase() === normalizedTranslation,
      )
      const normalizedPassageResult =
        normalizeScriptureResult(passageRes.data, normalizedReference, normalizedTranslation) ||
        fallbackSnapshot?.scriptureResult ||
        null
      if (normalizedPassageResult) {
        const verses = extractVerses(normalizedPassageResult)
        if (!verses.length) {
          const details =
            typeof (normalizedPassageResult as { error?: unknown })?.error === 'string' &&
              String((normalizedPassageResult as { error?: string }).error || '').trim()
              ? String((normalizedPassageResult as { error?: string }).error || '').trim()
              : 'Passage response returned no verses. Try Lookup again.'
          setScriptureError(details)
          setActionLoading((prev: string[]) => prev.filter((item) => item !== 'scripture'))
          return
        }
        setScriptureResult(normalizedPassageResult)
        setScriptureValidationWarning(getVerseValidationWarning(normalizedReference, verses))
        setGeneratedScriptureSections({
          passageSummary: true,
          verseContext: true,
          translationComparison: true,
          verseCommentary: true,
          structuralAnalysis: true,
          interpretiveChallenges: true,
          canonicalThemes: true,
          studySynthesis: true,
        })
      } else {
        const details =
          typeof passageRes?.data?.error === 'string' && passageRes.data.error.trim()
            ? passageRes.data.error.trim()
            : 'Passage response returned no verses. Try Lookup again.'
        setScriptureError(details)
        setActionLoading((prev: string[]) => prev.filter((item) => item !== 'scripture'))
        return
      }
      setActionLoading((prev: string[]) => prev.filter((item) => item !== 'scripture'))
      Promise.allSettled([
        client.scriptureParallel(normalizedReference, normalizedParallel),
        client.scriptureContext(normalizedReference),
      ]).then((results: any[]) => {
        if (requestId !== scriptureLookupRequestId.current) return
        const parallelData = results[0].status === 'fulfilled'
          ? ((results[0].value?.translations || []) as Record<string, unknown>[])
          : []
        const contextDataResult = results[1].status === 'fulfilled'
          ? (results[1].value as Record<string, unknown> | string | string[] | null)
          : null
        setParallelResults(parallelData)
        setContextData(contextDataResult)
        persistScriptureSnapshot(buildScriptureSnapshot({
          scriptureResult: normalizedPassageResult,
          scriptureLastLookup: normalizedReference,
          scriptureQuery: normalizedReference,
          scriptureTranslation: normalizedTranslation,
          parallelTranslations: normalizedParallel,
          parallelResults: parallelData,
          contextData: contextDataResult,
          structuralAnalysis: null,
          interpretiveChallenges: null,
          perVerseContext: null,
          passageSummary: null,
          studySynthesis: null,
          canonicalThemes: null,
          translationComparison: null,
          verseCommentary: null,
        }))
      }).catch((err: any) => {
        if (requestId !== scriptureLookupRequestId.current) return
        console.error('Secondary data load failed:', err)
      })
    } catch (err) {
      if (requestId !== scriptureLookupRequestId.current) return
      console.error('Failed to fetch passage', err)
      setScriptureError('Unable to load passage. Check backend logs.')
      setScriptureResult(null)
      setScriptureValidationWarning(null)
      setActionLoading((prev: string[]) => prev.filter((item) => item !== 'scripture'))
    }
  }

  const handleWordStudyLookup = async (override?: {
    word?: string
    language?: string
    context?: string
    metadata?: { strongs?: string; verseReference?: string; translatedWord?: string; original?: string; reference?: string }
  }) => {
    const config = withToken()
    if (!config) return
    const normalizedWord = (override?.word || wordStudyWord).trim()
    const normalizedLang = (override?.language || '').trim().toLowerCase() || wordStudyLanguage || 'greek'
    const contextualReference = String(override?.metadata?.verseReference || override?.metadata?.reference || scriptureLastLookup || '').trim()
    const contextualTranslation = String(override?.metadata?.translatedWord || '').trim()
    const contextualOriginal = String(override?.metadata?.original || '').trim()
    const contextualStrongs = String(override?.metadata?.strongs || '').trim().toUpperCase()
    const contextualHint =
      String(override?.context || '').trim() ||
      [contextualReference ? `Reference: ${contextualReference}` : '', contextualStrongs ? `Strong's: ${contextualStrongs}` : '', contextualOriginal ? `Original token: ${contextualOriginal}` : '', contextualTranslation ? `Translated token: ${contextualTranslation}` : ''].filter(Boolean).join(' | ')
    const workspaceLanguage = String(workspace?.language || '').toLowerCase()
    const responseLanguage = workspaceLanguage.startsWith('es') || workspaceLanguage.includes('spanish') || workspaceLanguage.includes('espanol') || workspaceLanguage.includes('español') ? 'es' : 'en'
    if (!normalizedWord) {
      setWordStudyError('Enter a word to analyze (ex: agape, logos).')
      return
    }
    setWordStudyError(null)
    setWordStudyWord(normalizedWord)
    setWordStudyLanguage(normalizedLang)
    setWordStudyLookupContext(contextualHint)
    setWordStudyLastLookup(normalizedWord)
    setActionLoading((prev: string[]) => (prev.includes('word-study') ? prev : [...prev, 'word-study']))
    try {
      let nextWordStudyResult: Record<string, unknown> | null = null
      let nextWordStudyInsights: Record<string, unknown> | null = null
      const client = getAppApiClient()
      if (!client) return
      const [studyRes, insightsRes] = await Promise.allSettled([
        client.scriptureWordStudy(normalizedWord, normalizedLang, responseLanguage),
        client.scriptureWordStudyInsights(normalizedWord, normalizedLang, contextualHint || undefined, responseLanguage),
      ])
      if (studyRes.status === 'fulfilled') {
        setWordStudyResult(studyRes.value)
        nextWordStudyResult = studyRes.value
      } else {
        setWordStudyResult(null)
        setWordStudyError('Unable to load word study results.')
      }
      if (insightsRes.status === 'fulfilled') {
        setWordStudyInsights(insightsRes.value)
        nextWordStudyInsights = insightsRes.value
      } else {
        setWordStudyInsights(null)
      }
      if (nextWordStudyResult || nextWordStudyInsights) {
        await persistSupplementalStudyCache({
          wordStudy: {
            word: normalizedWord,
            language: normalizedLang,
            responseLanguage,
            context: contextualHint || null,
            metadata: override?.metadata || null,
            result: nextWordStudyResult,
            insights: nextWordStudyInsights,
            cachedAt: new Date().toISOString(),
          },
        })
      }
    } catch (err) {
      console.error('Failed to fetch word study', err)
      setWordStudyError('Unable to load word study. Check backend logs.')
    } finally {
      setActionLoading((prev: string[]) => prev.filter((item) => item !== 'word-study'))
    }
  }

  const fetchWordStudySuggestions = async () => {
    const config = withToken()
    if (!config) return
    const reference = scriptureLastLookup || workspace?.mainPassage?.trim() || ''
    if (!reference) {
      setWordStudySuggestions([])
      return
    }
    setWordStudySuggestionsLoading(true)
    try {
      const client = getAppApiClient()
      if (!client) return
      const workspaceLanguage = String(workspace?.language || '').toLowerCase()
      const responseLanguage = workspaceLanguage.startsWith('es') || workspaceLanguage.includes('spanish') || workspaceLanguage.includes('espanol') || workspaceLanguage.includes('español') ? 'es' : 'en'
      const response = await client.scriptureWordStudySuggestions(reference, String(scriptureTranslation || workspace?.defaultTranslation || 'KJV'), wordStudyLanguage, responseLanguage)
      setWordStudySuggestions(Array.isArray(response) ? response : [])
    } catch (error) {
      console.error('Failed to fetch word study suggestions', error)
      setWordStudySuggestions([])
    } finally {
      setWordStudySuggestionsLoading(false)
    }
  }

  const handleCrossReferenceLookup = async () => {
    const config = withToken()
    if (!config) return
    const normalizedVerse = crossRefVerse.trim() || scriptureLastLookup || workspace?.mainPassage?.trim() || ''
    if (!normalizedVerse) {
      setCrossRefError('Enter a verse reference (ex: John 3:16) to explore cross references.')
      return
    }
    setCrossRefError(null)
    setCrossRefVerse(normalizedVerse)
    setCrossRefLastLookup(normalizedVerse)
    setCrossRefHasScriptureResults(false)
    setActionLoading((prev: string[]) => (prev.includes('cross-references') ? prev : [...prev, 'cross-references']))
    try {
      const client = getAppApiClient()
      if (!client) return
      const response = await client.scriptureCrossReferencesRanked(normalizedVerse)
      const ranked = Array.isArray(response) ? response : []
      setCrossRefResults(ranked)
      await persistSupplementalStudyCache({
        crossReferences: {
          verse: normalizedVerse,
          ranked,
          cachedAt: new Date().toISOString(),
        },
      })
    } catch (err) {
      console.error('Failed to fetch cross references', err)
      setCrossRefError('Unable to load cross references. Check backend logs.')
    } finally {
      setActionLoading((prev: string[]) => prev.filter((item) => item !== 'cross-references'))
    }
  }

  const openPromptEditor = async (type: 'outline' | 'manuscript' | 'applications' | 'questions' | 'illustrations' | 'citations' | 'study-report') => {
    const config = withToken()
    if (!config) return
    try {
      const client = getAppApiClient()
      if (!client) return
      const outlineId = type === 'manuscript'
        ? workspace?.outlines?.find((o: any) => o.isSelected)?.id || workspace?.outlines?.[0]?.id
        : undefined
      const response = await client.workspacePromptPreview(workspaceIdRef, type, outlineId)
      setPromptType(type)
      setPromptText(String(response || ''))
      setPromptModalOpen(true)
    } catch (err) {
      console.error('Failed to load prompt', err)
      setError('Unable to load prompt preview.')
    }
  }

  const runPrompt = async () => {
    if (!promptType) return
    const mapped = promptType === 'outline' ? 'outlines' : promptType === 'manuscript' ? 'manuscript' : promptType === 'applications' ? 'applications' : promptType === 'illustrations' ? 'illustrations' : promptType === 'citations' ? 'citations' : promptType === 'study-report' ? 'study-report' : 'questions'
    setPromptModalOpen(false)
    await handleGenerate(mapped, promptText)
  }

  return {
    handleScriptureLookup,
    handleWordStudyLookup,
    fetchWordStudySuggestions,
    handleCrossReferenceLookup,
    openPromptEditor,
    runPrompt,
  }
}
