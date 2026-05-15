import { getBibleBookChapterCount, getBibleBookMatches, matchBibleBookFromInput } from '@/utils/bibleBooks'
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

type ScriptureContextData = Record<string, unknown> | string | string[] | null

export type ScriptureLookupSnapshot = {
  scriptureResult: string | Record<string, unknown> | null
  scriptureLastLookup: string
  scriptureQuery: string
  scriptureTranslation: string
  parallelTranslations: string
  parallelResults: Array<Record<string, unknown>>
  contextData: ScriptureContextData
  structuralAnalysis: StructuralAnalysisData | null
  interpretiveChallenges: InterpretiveChallengeData | null
  perVerseContext: VerseContextData | null
  passageSummary: PassageSummaryData | null
  studySynthesis: StudySynthesisData | null
  canonicalThemes: CanonicalThemesData | null
  verseCommentary: VerseCommentaryData | null
  translationComparison: TranslationComparisonData | null
  cachedAt: string
}

export const getScriptureSuggestions = (value: string) => {
  const cleaned = value.trim()
  const suggestionSet = new Set<string>()
  let warning: string | null = null

  if (!cleaned) return { suggestions: [], warning: null }

  const bookMatch = matchBibleBookFromInput(cleaned)
  if (bookMatch) {
    const { book, remainder, isFuzzy } = bookMatch
    if (isFuzzy) warning = `Did you mean “${book.name}”?`
    const chapterCount = getBibleBookChapterCount(book.name)
    const chapterMatch = remainder.match(/^(\d+)(?::([\d\-–—,\s]+))?$/)

    if (!remainder) {
      suggestionSet.add(`${book.name} 1`)
      suggestionSet.add(`${book.name} 1:1`)
      suggestionSet.add(`${book.name} 1:1-5`)
    } else if (chapterMatch) {
      const chapterNum = Number.parseInt(chapterMatch[1], 10)
      if (chapterCount && chapterNum > chapterCount) {
        warning = `Chapter ${chapterNum} exceeds ${book.name} (${chapterCount} chapters).`
      }
      if (!chapterMatch[2]) {
        suggestionSet.add(`${book.name} ${chapterNum}`)
        suggestionSet.add(`${book.name} ${chapterNum}:1`)
        suggestionSet.add(`${book.name} ${chapterNum}:1-5`)
      } else {
        const normalizedVerses = chapterMatch[2].replace(/[–—]/g, '-').trim()
        suggestionSet.add(`${book.name} ${chapterNum}:${normalizedVerses}`)
      }
    }
  }

  const match = cleaned.match(/^([^\d]*)([\d:.,;\s-]*)$/)
  const bookPart = (match?.[1] || cleaned).trim()
  const rest = (match?.[2] || '').trim()
  const matches = getBibleBookMatches(bookPart)
  matches.forEach((book) => suggestionSet.add(rest ? `${book} ${rest}` : `${book} `))

  return { suggestions: Array.from(suggestionSet).slice(0, 8), warning }
}

export const getVerseValidationWarning = (reference: string, verses: Array<{ reference?: string }>) => {
  const match = reference.match(/^(.*?)\s+(\d+):(\d+)$/)
  if (!match) return null
  const chapter = match[2]
  const verseNumber = Number(match[3])
  if (!Number.isFinite(verseNumber)) return null

  const verseExists = verses.some((verse) => {
    const verseRef = typeof verse?.reference === 'string' ? verse.reference : ''
    const verseMatch = verseRef.match(/\b(\d+):(\d+)\b/)
    if (!verseMatch) return false
    return verseMatch[1] === chapter && Number(verseMatch[2]) === verseNumber
  })

  if (!verseExists) {
    return `Verse ${chapter}:${verseNumber} not found in this passage. Check the reference.`
  }

  return null
}

export const extractVerses = (result: unknown): Array<{ reference?: string; text?: string }> => {
  if (!result) return []
  const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
  const recordResult = isRecord(result) ? result : null
  const dataResult = isRecord(recordResult?.data) ? recordResult.data : null
  const passageResult = isRecord(recordResult?.passage) ? recordResult.passage : null
  const payloadResult = isRecord(recordResult?.payload) ? recordResult.payload : null

  const candidates = [recordResult?.verses, dataResult?.verses, passageResult?.verses, payloadResult?.verses]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
    if (candidate && typeof candidate === 'object') {
      const asArray = Object.values(candidate)
      if (asArray.length && asArray.every((item) => typeof item === 'object')) {
        return asArray as Array<{ reference?: string; text?: string }>
      }
    }
  }

  const textCandidate =
    (recordResult?.text as string | undefined) ||
    (recordResult?.content as string | undefined) ||
    (dataResult?.text as string | undefined) ||
    (dataResult?.content as string | undefined) ||
    (passageResult?.text as string | undefined) ||
    ''

  if (typeof textCandidate === 'string' && textCandidate.trim()) {
    return [
      {
        reference:
          (recordResult?.reference as string | undefined) ||
          (dataResult?.reference as string | undefined) ||
          '',
        text: textCandidate.trim(),
      },
    ]
  }

  return []
}

export const getReferenceStartVerse = (reference: string) => {
  const match = reference.match(/\b\d+:(\d+)(?:-(\d+))?$/)
  if (!match) return null
  const start = Number(match[1])
  return Number.isFinite(start) ? start : null
}

export const normalizeScriptureResult = (raw: unknown, reference: string, translation: string) => {
  const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
  const recordRaw = isRecord(raw) ? raw : null
  const dataRaw = isRecord(recordRaw?.data) ? recordRaw.data : null

  if (Array.isArray(recordRaw?.verses)) {
    return {
      ...recordRaw,
      reference: (recordRaw?.reference as string | undefined) || reference,
      translation: (recordRaw?.translation as string | undefined) || translation,
    }
  }

  if (Array.isArray(dataRaw?.verses)) {
    return {
      ...dataRaw,
      reference: (dataRaw?.reference as string | undefined) || reference,
      translation: (dataRaw?.translation as string | undefined) || translation,
    }
  }

  if (typeof raw === 'string' && raw.trim()) {
    return {
      reference,
      translation,
      verses: [{ reference, text: raw.trim() }],
    }
  }

  return null
}

export const buildScriptureSnapshot = (
  payload: Partial<ScriptureLookupSnapshot> & Pick<ScriptureLookupSnapshot, 'scriptureResult' | 'scriptureLastLookup' | 'scriptureQuery' | 'scriptureTranslation' | 'parallelTranslations'>,
): ScriptureLookupSnapshot => ({
  scriptureResult:
    normalizeScriptureResult(payload.scriptureResult, payload.scriptureLastLookup || payload.scriptureQuery, payload.scriptureTranslation) ||
    payload.scriptureResult,
  scriptureLastLookup: payload.scriptureLastLookup,
  scriptureQuery: payload.scriptureQuery,
  scriptureTranslation: payload.scriptureTranslation,
  parallelTranslations: payload.parallelTranslations,
  parallelResults: payload.parallelResults || [],
  contextData: payload.contextData || null,
  structuralAnalysis: payload.structuralAnalysis || null,
  interpretiveChallenges: payload.interpretiveChallenges || null,
  perVerseContext: payload.perVerseContext || null,
  passageSummary: payload.passageSummary || null,
  studySynthesis: payload.studySynthesis || null,
  canonicalThemes: payload.canonicalThemes || null,
  verseCommentary: payload.verseCommentary || null,
  translationComparison: payload.translationComparison || null,
  cachedAt: payload.cachedAt || new Date().toISOString(),
})

export const mergeScriptureLookupHistory = (snapshot: ScriptureLookupSnapshot, history: ScriptureLookupSnapshot[]) => {
  const snapshotKey = `${snapshot.scriptureLastLookup}::${snapshot.scriptureTranslation}::${snapshot.parallelTranslations}`.toLowerCase()
  const deduped = history.filter((entry) => {
    const entryKey = `${entry.scriptureLastLookup}::${entry.scriptureTranslation}::${entry.parallelTranslations}`.toLowerCase()
    return entryKey !== snapshotKey
  })
  return [snapshot, ...deduped].slice(0, 12)
}

export const compactSnapshotForPersistence = (snapshot: ScriptureLookupSnapshot): ScriptureLookupSnapshot => snapshot
