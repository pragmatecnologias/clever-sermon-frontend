'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { AlertCircle, Book, BookOpen, Clock, Layers, Lightbulb, MessageSquare, Network, Rows } from 'lucide-react'
import AudioPlayer from '@/components/AudioPlayer'
import StudyNotes from '@/components/StudyNotes'
import InteractiveCanonicalConstellation from '@/components/InteractiveCanonicalConstellation'
import InteractiveProphecyWeb from '@/components/InteractiveProphecyWeb'
import InteractiveSermonFlowSculptor from '@/components/InteractiveSermonFlowSculptor'
import EGWPassagePanel from '@/components/EGWPassagePanel'
import SDASmartBoostBanner from '@/components/SDASmartBoostBanner'
import WorkspaceEGWToggle from '@/components/WorkspaceEGWToggle'
import StudyReportEGWSection from '@/components/StudyReportEGWSection'
import OutlinePointEGWSupport from '@/components/OutlinePointEGWSupport'
import { getBibleBookMatches, getBibleBookChapterCount, matchBibleBookFromInput } from '@/utils/bibleBooks'
import PhaseNavigation, { Phase } from '@/components/PhaseNavigation'
import ProgressIndicator from '@/components/ProgressIndicator'
import NextStepSuggestion from '@/components/NextStepSuggestion'
import CollapsibleSection from '@/components/CollapsibleSection'
import LoadingOverlay from '@/components/LoadingOverlay'
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp'
import SermonMentorDashboard from '@/components/SermonMentorDashboard'
import SermonPatternDashboard from '@/components/SermonPatternDashboard'
import CitationValidationBadge from '@/components/CitationValidationBadge'
import CrossReferenceRanked from '@/components/CrossReferenceRanked'
import CrossReferenceSOPPanel from '@/components/CrossReferenceSOPPanel'
import StoryArcSelector from '@/components/StoryArcSelector'
import TranslationComparisonEnhanced from '@/components/TranslationComparisonEnhanced'
import PerVerseContextPanel from '@/components/PerVerseContextPanel'
import CanonicalThemeTracing from '@/components/CanonicalThemeTracing'
import VerseCommentaryPanel from '@/components/VerseCommentaryPanel'
import StructuralAnalysisPanel from '@/components/StructuralAnalysisPanel'
import InterpretiveChallengePanel from '@/components/InterpretiveChallengePanel'
import SanctuaryProphecyMapper from '@/components/SanctuaryProphecyMapper'
import PassageSummary from '@/components/PassageSummary'
import StudySynthesis from '@/components/StudySynthesis'
import SermonIntegrityDashboard from '@/components/SermonIntegrityDashboard'
import MediaProductionStudio from '@/components/MediaProductionStudio'
import BiblicalNarrativeMap from '@/components/BiblicalNarrativeMap'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { getLoadingMessage } from '@/utils/loadingMessages'

type ScriptureLookupSnapshot = {
  scriptureResult: any
  scriptureLastLookup: string
  scriptureQuery: string
  scriptureTranslation: string
  parallelTranslations: string
  parallelResults: any[]
  contextData: any
  structuralAnalysis: any
  interpretiveChallenges: any
  perVerseContext: any
  passageSummary: any
  studySynthesis: any
  canonicalThemes: any
  verseCommentary: any
  translationComparison: any
  cachedAt: string
}

type SermonIntegrityIssue = {
  severity: 'critical' | 'warning' | 'info'
  category: string
  message: string
  affectedItem?: string
}

type SermonIntegrityReport = {
  overallScore: number
  balanced: boolean
  issues: SermonIntegrityIssue[]
  strengths: string[]
  recommendations: string[]
  pointAnalysis?: Array<{ point: string; supportScore: number; textSupported: boolean }>
  applicationAnalysis?: Array<{ application: string; relevanceScore: number; tiedToPassage: boolean }>
  citationAnalysis?: Array<{ verseReference: string; supportLevel: 'supported' | 'weak' | 'not_supported' }>
}

export default function WorkspaceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const workspaceId = params?.id as string
  const [workspace, setWorkspace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string[]>([])
  const [editingWorkspace, setEditingWorkspace] = useState(false)
  const [workspaceDraft, setWorkspaceDraft] = useState<any>(null)
  const [editingOutlineId, setEditingOutlineId] = useState<string | null>(null)
  const [outlineDraft, setOutlineDraft] = useState<any>(null)
  const [editingManuscriptId, setEditingManuscriptId] = useState<string | null>(null)
  const [manuscriptDraft, setManuscriptDraft] = useState<string>('')
  const [manuscriptTone, setManuscriptTone] = useState('teaching')
  const [manuscriptTargetMinutes, setManuscriptTargetMinutes] = useState(22)
  const [manuscriptFormat, setManuscriptFormat] = useState<'full' | 'notes'>('full')
  const [manuscriptAudienceMode, setManuscriptAudienceMode] = useState('default')
  const [manuscriptIncludeSlideCues, setManuscriptIncludeSlideCues] = useState(true)
  const [manuscriptIncludeKeyLines, setManuscriptIncludeKeyLines] = useState(true)
  const [editingApplicationId, setEditingApplicationId] = useState<string | null>(null)
  const [applicationDraft, setApplicationDraft] = useState<string>('')
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [questionDraft, setQuestionDraft] = useState<string>('')
  const [editingIllustrationId, setEditingIllustrationId] = useState<string | null>(null)
  const [illustrationDraft, setIllustrationDraft] = useState<any>(null)
  const [editingCitationId, setEditingCitationId] = useState<string | null>(null)
  const [citationDraft, setCitationDraft] = useState<any>(null)
  const [citationTranslation, setCitationTranslation] = useState('KJV')
  const [promptModalOpen, setPromptModalOpen] = useState(false)
  const [railOpen, setRailOpen] = useState(false)
  const [promptType, setPromptType] = useState<
    'outline' | 'manuscript' | 'applications' | 'questions' | 'illustrations' | 'citations' | 'study-report' | null
  >(null)
  const [promptText, setPromptText] = useState('')
  const [activeSection, setActiveSection] = useState<
    | 'workspace'
    | 'outlines'
    | 'manuscript'
    | 'applications'
    | 'questions'
    | 'illustrations'
    | 'citations'
    | 'scripture'
    | 'word-study'
    | 'cross-references'
    | 'study-report'
    | 'coach'
    | 'dna'
    | 'visualizations'
    | 'media'
  >('workspace')
  const [activePhase, setActivePhase] = useState<Phase>('DISCOVER')
  const [citationValidations, setCitationValidations] = useState<Record<string, any>>({})
  const [dnaIntegrityReport, setDnaIntegrityReport] = useState<SermonIntegrityReport | null>(null)
  const [dnaIntegrityLoading, setDnaIntegrityLoading] = useState(false)
  const [coachMode, setCoachMode] = useState<'refine' | 'self_reflection'>('refine')
  const [coachListenerProfile, setCoachListenerProfile] = useState('general_congregation')
  const [socraticCoachSession, setSocraticCoachSession] = useState<any>(null)
  const [coachAnswers, setCoachAnswers] = useState<Record<string, string>>({})
  const [coachFeedback, setCoachFeedback] = useState<Record<string, any>>({})
  const [scriptureQuery, setScriptureQuery] = useState('')
  const [scriptureTranslation, setScriptureTranslation] = useState('KJV')
  const [scriptureResult, setScriptureResult] = useState<any>(null)
  const [parallelTranslations, setParallelTranslations] = useState('WEB')
  
  // Filter translations based on workspace language
  const availableTranslations = workspace?.language === 'es' 
    ? ['RVR1960', 'NVI', 'NBLA'] // Spanish Bibles only
    : ['KJV', 'WEB', 'NKJV', 'ESV', 'NIV', 'NASB', 'NLT'] // English Bibles only
  const [parallelResults, setParallelResults] = useState<any[]>([])
  const [contextData, setContextData] = useState<any>(null)
  const [structuralAnalysis, setStructuralAnalysis] = useState<any>(null)
  const [interpretiveChallenges, setInterpretiveChallenges] = useState<any>(null)
  const [perVerseContext, setPerVerseContext] = useState<any>(null)
  const [passageSummary, setPassageSummary] = useState<any>(null)
  const [studySynthesis, setStudySynthesis] = useState<any>(null)
  const [canonicalThemes, setCanonicalThemes] = useState<any>(null)
  const [verseCommentary, setVerseCommentary] = useState<any>(null)
  const [translationComparison, setTranslationComparison] = useState<any>(null)
  const [generatedScriptureSections, setGeneratedScriptureSections] = useState<Record<string, boolean>>({
    passageSummary: false,
    verseContext: false,
    translationComparison: false,
    verseCommentary: false,
    structuralAnalysis: false,
    interpretiveChallenges: false,
    canonicalThemes: false,
    studySynthesis: false,
  })
  const [scriptureSectionRefreshKey, setScriptureSectionRefreshKey] = useState<Record<string, number>>({
    passageSummary: 0,
    verseContext: 0,
    translationComparison: 0,
    verseCommentary: 0,
    structuralAnalysis: 0,
    interpretiveChallenges: 0,
    canonicalThemes: 0,
    studySynthesis: 0,
  })
  const [scriptureError, setScriptureError] = useState<string | null>(null)
  const [scriptureLastLookup, setScriptureLastLookup] = useState<string>('')
  const [scriptureSuggestions, setScriptureSuggestions] = useState<string[]>([])
  const [showScriptureSuggestions, setShowScriptureSuggestions] = useState(false)
  const [scriptureSuggestionIndex, setScriptureSuggestionIndex] = useState(-1)
  const [scriptureInputWarning, setScriptureInputWarning] = useState<string | null>(null)
  const [scriptureValidationWarning, setScriptureValidationWarning] = useState<string | null>(null)
  const [scriptureLookupHistory, setScriptureLookupHistory] = useState<ScriptureLookupSnapshot[]>([])
  const [wordStudyWord, setWordStudyWord] = useState('')
  const [wordStudyLanguage, setWordStudyLanguage] = useState('greek')
  const [availableLanguages] = useState([{value: 'greek', label: 'Greek'}, {value: 'hebrew', label: 'Hebrew'}, {value: 'aramaic', label: 'Aramaic'}])
  const [wordStudyResult, setWordStudyResult] = useState<any>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set())
  const [wordStudyInsights, setWordStudyInsights] = useState<any>(null)
  const [wordStudyError, setWordStudyError] = useState<string | null>(null)
  const [wordStudyLastLookup, setWordStudyLastLookup] = useState<string>('')
  const [wordStudySuggestions, setWordStudySuggestions] = useState<
    Array<{ term: string; transliteration?: string; gloss?: string; reason?: string; language?: string }>
  >([])
  const [wordStudySuggestionsLoading, setWordStudySuggestionsLoading] = useState(false)
  const [crossRefVerse, setCrossRefVerse] = useState('')
  const [crossRefResults, setCrossRefResults] = useState<{
    reference: string
    category?: string | null
    relevanceScore?: number
    explanation?: string
    text?: string
  }[]>([])
  const [crossRefCategory, setCrossRefCategory] = useState('')
  const [crossRefError, setCrossRefError] = useState<string | null>(null)
  const [crossRefLastLookup, setCrossRefLastLookup] = useState<string>('')
  const [crossRefHasScriptureResults, setCrossRefHasScriptureResults] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [expandedOutlineId, setExpandedOutlineId] = useState<string | null>(null)
  const [expandedPointSections, setExpandedPointSections] = useState<Record<string, boolean>>({})
  const [expandedTextBlocks, setExpandedTextBlocks] = useState<Record<string, boolean>>({})
  const [verseEvidencePanel, setVerseEvidencePanel] = useState<{
    outlineId: string
    pointTitle: string
    verse: string
    text: string
    reason: string
  } | null>(null)
  const autosaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const autosaveHashes = useRef<Record<string, string>>({})
  const scriptureLookupRequestId = useRef(0)

  const storyArcLabels: Record<string, string> = {
    problem_truth_response: 'Problem → Truth → Response',
    tension_turn_resolution: 'Tension → Turn → Resolution',
    question_discovery_answer: 'Question → Discovery → Answer',
    challenge_journey_transformation: 'Challenge → Journey → Transformation',
  }

  const buildScriptureSuggestions = (value: string) => {
    const cleaned = value.trim()
    if (!cleaned) {
      setScriptureSuggestions([])
      setScriptureInputWarning(null)
      return
    }
    const suggestionSet = new Set<string>()
    setScriptureInputWarning(null)

    const bookMatch = matchBibleBookFromInput(cleaned)
    if (bookMatch) {
      const { book, remainder, isFuzzy } = bookMatch
      if (isFuzzy) {
        setScriptureInputWarning(`Did you mean “${book.name}”?`)
      }
      const chapterCount = getBibleBookChapterCount(book.name)
      const chapterMatch = remainder.match(/^(\d+)(?::([\d\-–—,\s]+))?$/)

      if (!remainder) {
        suggestionSet.add(`${book.name} 1`)
        suggestionSet.add(`${book.name} 1:1`)
        suggestionSet.add(`${book.name} 1:1-5`)
      } else if (chapterMatch) {
        const chapterNum = Number.parseInt(chapterMatch[1], 10)
        if (chapterCount && chapterNum > chapterCount) {
          setScriptureInputWarning(`Chapter ${chapterNum} exceeds ${book.name} (${chapterCount} chapters).`)
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

    const suggestions = Array.from(suggestionSet).slice(0, 8)
    setScriptureSuggestions(suggestions)
    setScriptureSuggestionIndex(suggestions.length ? 0 : -1)
  }

  const getVerseValidationWarning = (reference: string, verses: any[]) => {
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

  const extractVerses = (result: any): any[] => {
    if (!result) return []

    const candidates = [
      result?.verses,
      result?.data?.verses,
      result?.passage?.verses,
      result?.payload?.verses,
    ]

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate
      if (candidate && typeof candidate === 'object') {
        const asArray = Object.values(candidate)
        if (asArray.length && asArray.every((item) => typeof item === 'object')) {
          return asArray as any[]
        }
      }
    }

    const textCandidate =
      result?.text ||
      result?.content ||
      result?.data?.text ||
      result?.data?.content ||
      result?.passage?.text ||
      ''

    if (typeof textCandidate === 'string' && textCandidate.trim()) {
      return [
        {
          reference: result?.reference || result?.data?.reference || '',
          text: textCandidate.trim(),
        },
      ]
    }

    return []
  }

  const getReferenceStartVerse = (reference: string) => {
    const match = reference.match(/\b\d+:(\d+)(?:-(\d+))?$/)
    if (!match) return null
    const start = Number(match[1])
    return Number.isFinite(start) ? start : null
  }

  const normalizeScriptureResult = (
    raw: any,
    reference: string,
    translation: string,
  ) => {
    if (raw?.verses && Array.isArray(raw.verses)) {
      return {
        ...raw,
        reference: raw.reference || reference,
        translation: raw.translation || translation,
      }
    }

    if (raw?.data?.verses && Array.isArray(raw.data.verses)) {
      return {
        ...raw.data,
        reference: raw.data.reference || reference,
        translation: raw.data.translation || translation,
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

  const buildScriptureSnapshot = (
    payload: Partial<ScriptureLookupSnapshot> & Pick<ScriptureLookupSnapshot, 'scriptureResult' | 'scriptureLastLookup' | 'scriptureQuery' | 'scriptureTranslation' | 'parallelTranslations'>,
  ): ScriptureLookupSnapshot => ({
    scriptureResult:
      normalizeScriptureResult(
        payload.scriptureResult,
        payload.scriptureLastLookup || payload.scriptureQuery,
        payload.scriptureTranslation,
      ) || payload.scriptureResult,
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

  const mergeScriptureLookupHistory = (
    snapshot: ScriptureLookupSnapshot,
    history: ScriptureLookupSnapshot[],
  ) => {
    const snapshotKey = `${snapshot.scriptureLastLookup}::${snapshot.scriptureTranslation}::${snapshot.parallelTranslations}`.toLowerCase()
    const deduped = history.filter((entry) => {
      const entryKey = `${entry.scriptureLastLookup}::${entry.scriptureTranslation}::${entry.parallelTranslations}`.toLowerCase()
      return entryKey !== snapshotKey
    })
    return [snapshot, ...deduped].slice(0, 12)
  }

  const applyScriptureLookupSnapshot = (snapshot: ScriptureLookupSnapshot) => {
    const verses = extractVerses(snapshot.scriptureResult)
    setScriptureResult(snapshot.scriptureResult || null)
    setScriptureLastLookup(snapshot.scriptureLastLookup || '')
    setScriptureQuery(snapshot.scriptureQuery || snapshot.scriptureLastLookup || '')
    setScriptureTranslation(snapshot.scriptureTranslation || 'KJV')
    setParallelTranslations(snapshot.parallelTranslations || snapshot.scriptureTranslation || 'KJV')
    setParallelResults(snapshot.parallelResults || [])
    setContextData(snapshot.contextData || null)
    setStructuralAnalysis(snapshot.structuralAnalysis || null)
    setInterpretiveChallenges(snapshot.interpretiveChallenges || null)
    setPerVerseContext(snapshot.perVerseContext || null)
    setPassageSummary(snapshot.passageSummary || null)
    setStudySynthesis(snapshot.studySynthesis || null)
    setCanonicalThemes(snapshot.canonicalThemes || null)
    setVerseCommentary(snapshot.verseCommentary || null)
    setTranslationComparison(snapshot.translationComparison || null)
    setGeneratedScriptureSections({
      passageSummary: !!snapshot.passageSummary,
      verseContext: !!snapshot.perVerseContext,
      translationComparison: !!snapshot.translationComparison,
      verseCommentary: !!snapshot.verseCommentary,
      structuralAnalysis: !!snapshot.structuralAnalysis,
      interpretiveChallenges: !!snapshot.interpretiveChallenges,
      canonicalThemes: !!snapshot.canonicalThemes,
      studySynthesis: !!snapshot.studySynthesis,
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
    const warning = getVerseValidationWarning(snapshot.scriptureLastLookup || '', verses)
    setScriptureValidationWarning(warning)
    setScriptureError(null)
  }

  const regenerateScriptureSection = (section: string) => {
    setGeneratedScriptureSections((prev) => ({ ...prev, [section]: true }))

    switch (section) {
      case 'passageSummary':
        setPassageSummary(null)
        break
      case 'verseContext':
        setPerVerseContext(null)
        break
      case 'translationComparison':
        setTranslationComparison(null)
        break
      case 'verseCommentary':
        setVerseCommentary(null)
        break
      case 'structuralAnalysis':
        setStructuralAnalysis(null)
        break
      case 'interpretiveChallenges':
        setInterpretiveChallenges(null)
        break
      case 'canonicalThemes':
        setCanonicalThemes(null)
        break
      case 'studySynthesis':
        setStudySynthesis(null)
        break
      default:
        break
    }

    setScriptureSectionRefreshKey((prev) => ({
      ...prev,
      [section]: (prev[section] || 0) + 1,
    }))
  }

  const persistScriptureSnapshot = async (snapshot: ScriptureLookupSnapshot) => {
    let nextHistory: ScriptureLookupSnapshot[] = []
    setScriptureLookupHistory((prev) => {
      nextHistory = mergeScriptureLookupHistory(snapshot, prev)
      return nextHistory
    })
    await saveScriptureLookupCache({
      ...snapshot,
      lookupHistory: nextHistory,
    })
  }

  const persistCurrentScriptureSection = (
    section:
      | 'passageSummary'
      | 'verseContext'
      | 'translationComparison'
      | 'verseCommentary'
      | 'structuralAnalysis'
      | 'interpretiveChallenges'
      | 'canonicalThemes'
      | 'studySynthesis',
    data: any,
  ) => {
    if (!scriptureResult || !scriptureLastLookup) return

    const snapshot = buildScriptureSnapshot({
      scriptureResult,
      scriptureLastLookup,
      scriptureQuery: scriptureQuery || scriptureLastLookup,
      scriptureTranslation,
      parallelTranslations,
      parallelResults,
      contextData,
      structuralAnalysis: section === 'structuralAnalysis' ? data : structuralAnalysis,
      interpretiveChallenges: section === 'interpretiveChallenges' ? data : interpretiveChallenges,
      perVerseContext: section === 'verseContext' ? data : perVerseContext,
      passageSummary: section === 'passageSummary' ? data : passageSummary,
      studySynthesis: section === 'studySynthesis' ? data : studySynthesis,
      canonicalThemes: section === 'canonicalThemes' ? data : canonicalThemes,
      verseCommentary: section === 'verseCommentary' ? data : verseCommentary,
      translationComparison: section === 'translationComparison' ? data : translationComparison,
    })

    persistScriptureSnapshot(snapshot)
  }

  // Map sections to phases
  const phaseContentMap: Record<Phase, (typeof activeSection)[]> = {
    DISCOVER: ['scripture', 'word-study', 'cross-references'],
    ANALYZE: ['study-report'],
    STRATEGIZE: ['workspace'],
    CREATE: ['outlines', 'manuscript', 'applications', 'questions', 'illustrations', 'citations'],
    REFINE: ['coach', 'dna', 'visualizations']
  }

  // Calculate progress
  const progress = {
    passageStudied: !!scriptureResult,
    themesIdentified: !!workspace?.studyReports?.length,
    strategySelected: !!workspace?.preachingStrategies?.length || !!workspace?.style,
    outlineCreated: !!workspace?.outlines?.length,
    manuscriptWritten: !!workspace?.manuscripts?.length
  }

  // Handle phase change
  const handlePhaseChange = (phase: Phase) => {
    setActivePhase(phase)
    const firstSection = phaseContentMap[phase][0]
    if (firstSection) {
      setActiveSection(firstSection)
    }
  }

  const handleScriptureSnapshotSelect = (snapshot: ScriptureLookupSnapshot) => {
    // Cancel/ignore any in-flight lookup responses so they can't overwrite restored cache state.
    scriptureLookupRequestId.current += 1
    setActionLoading((prev) => prev.filter((item) => item !== 'scripture'))

    const normalizedSnapshot = buildScriptureSnapshot(snapshot)
    applyScriptureLookupSnapshot(normalizedSnapshot)
  }

  const handleSearchResultSelect = (item: any) => {
    if (item?.workspaceId && item.workspaceId !== workspaceId) {
      router.push(`/workspace/${item.workspaceId}`)
      return
    }
    if (item?.type === 'workspace' && item.id && item.id !== workspaceId) {
      router.push(`/workspace/${item.id}`)
      return
    }

    if (item?.type === 'outline') setActiveSection('outlines')
    if (item?.type === 'manuscript') setActiveSection('manuscript')
    if (item?.type === 'note') setActiveSection('workspace')
  }

  // Handle next step suggestions
  const handleNextStepAction = (action: string) => {
    switch (action) {
      case 'lookup-passage':
        setActivePhase('DISCOVER')
        setActiveSection('scripture')
        break
      case 'generate-study-report':
        setActivePhase('ANALYZE')
        setActiveSection('study-report')
        handleGenerate('study-report', '')
        break
      case 'select-strategy':
        setActivePhase('STRATEGIZE')
        setActiveSection('workspace')
        break
      case 'create-outline':
        setActivePhase('CREATE')
        setActiveSection('outlines')
        break
      case 'write-manuscript':
        setActivePhase('CREATE')
        setActiveSection('manuscript')
        break
      case 'analyze-sermon':
        setActivePhase('REFINE')
        setActiveSection('dna')
        break
    }
  }

  // Validate citation
  const validateCitation = async (statement: string, verseRef: string) => {
    try {
      const config = withToken()
      if (!config) return { supportLevel: 'pending' }
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/scripture/validate-citation`,
        { statement, verseReference: verseRef, translation: scriptureTranslation || 'KJV' },
        config
      )
      return response.data
    } catch (error) {
      console.error('Citation validation failed:', error)
      return { supportLevel: 'pending' }
    }
  }

  const scheduleAutosave = (key: string, payload: any, endpoint: string) => {
    const serialized = JSON.stringify(payload)
    if (autosaveHashes.current[key] === serialized) return
    autosaveHashes.current[key] = serialized
    if (autosaveTimers.current[key]) {
      clearTimeout(autosaveTimers.current[key])
    }
    autosaveTimers.current[key] = setTimeout(async () => {
      const config = withToken()
      if (!config) return
      try {
        await axios.patch(endpoint, payload, config)
        const refreshed = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`, config)
        setWorkspace(refreshed.data)
      } catch (err) {
        console.error('Autosave failed', err)
      }
    }, 1200)
  }

  const restoreScriptureLookupCache = async (workspaceData?: any): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return false

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/scripture-cache`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const data = response.data
      if (data) {
        if (data.wordStudy) {
          setWordStudyWord(String(data.wordStudy.word || ''))
          setWordStudyLastLookup(String(data.wordStudy.word || ''))
          setWordStudyLanguage(String(data.wordStudy.language || 'greek'))
          setWordStudyResult(data.wordStudy.result || null)
          setWordStudyInsights(data.wordStudy.insights || null)
        }
        if (data.crossReferences) {
          setCrossRefVerse(String(data.crossReferences.verse || ''))
          setCrossRefLastLookup(String(data.crossReferences.verse || ''))
          const ranked = Array.isArray(data.crossReferences.ranked) ? data.crossReferences.ranked : []
          setCrossRefResults(ranked)
          setCrossRefHasScriptureResults(ranked.length > 0)
        }

        const history = Array.isArray(data.lookupHistory) ? data.lookupHistory : []
        const normalizedHistory = history
          .filter((entry: any) => entry?.scriptureLastLookup && entry?.scriptureResult)
          .map((entry: any) => buildScriptureSnapshot(entry))
          .sort((a: ScriptureLookupSnapshot, b: ScriptureLookupSnapshot) => {
            const aDate = new Date(a.cachedAt).getTime() || 0
            const bDate = new Date(b.cachedAt).getTime() || 0
            return bDate - aDate
          })

        const normalizeRef = (value: string) =>
          String(value || '')
            .toLowerCase()
            .replace(/\u2013|\u2014/g, '-')
            .replace(/\s+/g, ' ')
            .trim()

        const defaultReference = normalizeRef(workspaceData?.mainPassage || '')

        if (normalizedHistory.length) {
          setScriptureLookupHistory(normalizedHistory)
          if (!defaultReference) {
            applyScriptureLookupSnapshot(normalizedHistory[0])
            return true
          }
          const defaultSnapshot = normalizedHistory.find(
            (entry: ScriptureLookupSnapshot) =>
              normalizeRef(entry.scriptureLastLookup) === defaultReference,
          )
          if (defaultSnapshot) {
            applyScriptureLookupSnapshot(defaultSnapshot)
            return true
          }
          // Fallback: if exact reference match is missing, restore the latest cached snapshot
          // so previously generated sections remain visible instead of resetting to empty.
          applyScriptureLookupSnapshot(normalizedHistory[0])
          return true
        }

        if (data.scriptureResult && data.scriptureLastLookup) {
          const fallbackTranslation = workspaceData?.language === 'es' ? 'RVR1960' : 'KJV'
          const legacySnapshot = buildScriptureSnapshot({
            scriptureResult: data.scriptureResult,
            scriptureLastLookup: data.scriptureLastLookup,
            scriptureQuery: data.scriptureQuery || data.scriptureLastLookup,
            scriptureTranslation: data.scriptureTranslation || fallbackTranslation,
            parallelTranslations: data.parallelTranslations || data.scriptureTranslation || fallbackTranslation,
            parallelResults: data.parallelResults || [],
            contextData: data.contextData || null,
            structuralAnalysis: data.structuralAnalysis || null,
            interpretiveChallenges: data.interpretiveChallenges || null,
            perVerseContext: data.perVerseContext || null,
            passageSummary: data.passageSummary || null,
            studySynthesis: data.studySynthesis || null,
            canonicalThemes: data.canonicalThemes || null,
            verseCommentary: data.verseCommentary || null,
            translationComparison: data.translationComparison || null,
            cachedAt: data.cachedAt,
          })
          setScriptureLookupHistory([legacySnapshot])
          if (!defaultReference || normalizeRef(legacySnapshot.scriptureLastLookup) === defaultReference) {
            applyScriptureLookupSnapshot(legacySnapshot)
            return true
          }
          // Same fallback behavior for legacy cache payloads.
          applyScriptureLookupSnapshot(legacySnapshot)
          return true
        }
      }
      return false
    } catch (err) {
      console.error('Failed to restore scripture cache:', err)
      return false
    }
  }

  const saveScriptureLookupCache = async (data: any) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/scripture-cache`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
    } catch (err) {
      console.error('Failed to save scripture cache:', err)
    }
  }

  const persistSupplementalStudyCache = async (partial: any) => {
    await saveScriptureLookupCache({
      ...partial,
      cachedAt: new Date().toISOString(),
    })
  }

  useEffect(() => {
    if (!editingWorkspace || !workspaceDraft) return
    scheduleAutosave(
      'workspace',
      {
        title: workspaceDraft.title,
        seriesTitle: workspaceDraft.seriesTitle,
        mainPassage: workspaceDraft.mainPassage,
        additionalPassages: workspaceDraft.additionalPassages,
        theme: workspaceDraft.theme,
        audienceProfile: workspaceDraft.audienceProfile,
        sermonGoals: workspaceDraft.sermonGoals,
        theologicalLens: workspaceDraft.theologicalLens,
        style: workspaceDraft.style,
        storyArc: workspaceDraft.storyArc,
        language: workspaceDraft.language,
      },
      `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`,
    )
  }, [editingWorkspace, workspaceDraft])

  useEffect(() => {
    if (activeSection !== 'word-study') return
    const reference = scriptureLastLookup || workspace?.mainPassage?.trim() || ''
    if (!reference) return
    fetchWordStudySuggestions()
  }, [activeSection, scriptureLastLookup, workspace?.mainPassage, workspace?.language, wordStudyLanguage])

  useEffect(() => {
    if (!editingOutlineId || !outlineDraft) return
    scheduleAutosave(
      `outline-${outlineDraft.id}`,
      {
        title: outlineDraft.title,
        structure: {
          introduction: outlineDraft.introduction,
          points: outlineDraft.points,
          conclusion: outlineDraft.conclusion,
          callToAction: outlineDraft.callToAction,
        },
      },
      `${process.env.NEXT_PUBLIC_API_URL}/workspaces/outlines/${outlineDraft.id}`,
    )
  }, [editingOutlineId, outlineDraft])

  useEffect(() => {
    if (!editingManuscriptId || !manuscriptDraft) return
    scheduleAutosave(
      `manuscript-${editingManuscriptId}`,
      { content: { text: manuscriptDraft } },
      `${process.env.NEXT_PUBLIC_API_URL}/workspaces/manuscripts/${editingManuscriptId}`,
    )
  }, [editingManuscriptId, manuscriptDraft])

  useEffect(() => {
    if (!editingApplicationId || !applicationDraft) return
    scheduleAutosave(
      `application-${editingApplicationId}`,
      { content: applicationDraft },
      `${process.env.NEXT_PUBLIC_API_URL}/workspaces/applications/${editingApplicationId}`,
    )
  }, [editingApplicationId, applicationDraft])

  useEffect(() => {
    if (!editingQuestionId || !questionDraft) return
    scheduleAutosave(
      `question-${editingQuestionId}`,
      { question: questionDraft },
      `${process.env.NEXT_PUBLIC_API_URL}/workspaces/discussion-questions/${editingQuestionId}`,
    )
  }, [editingQuestionId, questionDraft])

  useEffect(() => {
    if (activeSection !== 'dna') return
    fetchDnaIntegrityReport()
  }, [activeSection, workspaceId])

  useEffect(() => {
    const metadataSession = workspace?.metadata?.socraticCoachLastSession
    if (metadataSession && !socraticCoachSession) {
      setSocraticCoachSession(metadataSession)
    }
    const metadataFeedback = workspace?.metadata?.socraticCoachLastFeedback
    if (metadataFeedback?.questionId) {
      setCoachFeedback((prev) => ({ ...prev, [metadataFeedback.questionId]: metadataFeedback }))
    }
  }, [workspace?.metadata, socraticCoachSession])

  useEffect(() => {
    if (!editingIllustrationId || !illustrationDraft) return
    scheduleAutosave(
      `illustration-${editingIllustrationId}`,
      { title: illustrationDraft.title, content: illustrationDraft.content, source: illustrationDraft.source },
      `${process.env.NEXT_PUBLIC_API_URL}/workspaces/illustrations/${editingIllustrationId}`,
    )
  }, [editingIllustrationId, illustrationDraft])

  useEffect(() => {
    if (!editingCitationId || !citationDraft) return
    scheduleAutosave(
      `citation-${editingCitationId}`,
      {
        statement: citationDraft.statement,
        verseReferences: citationDraft.verseReferences
          ? citationDraft.verseReferences.split(',').map((item: string) => item.trim()).filter(Boolean)
          : [],
      },
      `${process.env.NEXT_PUBLIC_API_URL}/workspaces/citations/${editingCitationId}`,
    )
  }, [editingCitationId, citationDraft])

  const styleLabels: Record<string, string> = {
    expository: 'Expository',
    topical: 'Topical',
    narrative: 'Narrative',
    apologetic: 'Apologetic',
    devotional: 'Devotional',
  }

  const renderMarkdown = (content: string) => (
    <div className="space-y-3 text-gray-100/90 leading-relaxed">
      <ReactMarkdown
        components={{
          h1: ({ children }: { children?: ReactNode }) => <h1 className="text-xl font-semibold text-white">{children}</h1>,
          h2: ({ children }: { children?: ReactNode }) => <h2 className="text-lg font-semibold text-white">{children}</h2>,
          h3: ({ children }: { children?: ReactNode }) => <h3 className="text-base font-semibold text-white">{children}</h3>,
          p: ({ children }: { children?: ReactNode }) => <p className="text-gray-100/90">{children}</p>,
          strong: ({ children }: { children?: ReactNode }) => <strong className="text-cyan-200">{children}</strong>,
          em: ({ children }: { children?: ReactNode }) => <em className="text-cyan-100">{children}</em>,
          ul: ({ children }: { children?: ReactNode }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
          ol: ({ children }: { children?: ReactNode }) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
          li: ({ children }: { children?: ReactNode }) => <li className="text-gray-100/90">{children}</li>,
          hr: () => <hr className="border-white/10" />,
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  )

  const handleVerseClick = (verseRef: string) => {
    setScriptureQuery(verseRef)
    setActiveSection('scripture')
    setTimeout(() => handleScriptureLookup(), 100)
  }

  const loadAudioForPassage = async (reference: string, translation: string) => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    setIsAudioLoading(true)
    setAudioError(null)
    
    try {
      // First, get available audio Bibles
      const audioBiblesRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scripture/audio-bibles`, {
        params: { language: translation === 'NBLA' ? 'es' : 'en' },
        headers: { Authorization: `Bearer ${token}` },
      })
      
      const audioBibles = audioBiblesRes.data
      if (!audioBibles || audioBibles.length === 0) {
        setAudioError('No audio Bibles available')
        setIsAudioLoading(false)
        return
      }
      
      // Use the first available audio Bible
      const audioBibleId = audioBibles[0].id
      
      // Parse reference to get chapter ID (e.g., "John 3:16" -> "JHN.3")
      const match = reference.match(/^(.*?)\s+(\d+)(?::(\d+))?/)
      if (!match) {
        setAudioError('Invalid reference format')
        setIsAudioLoading(false)
        return
      }
      
      const bookName = match[1].toLowerCase().replace(/\s+/g, '')
      const chapter = match[2]
      
      // Simple book name mapping (extend as needed)
      const bookMap: Record<string, string> = {
        'john': 'JHN', 'juan': 'JHN',
        'matthew': 'MAT', 'mateo': 'MAT',
        'mark': 'MRK', 'marcos': 'MRK',
        'luke': 'LUK', 'lucas': 'LUK',
        'genesis': 'GEN', 'génesis': 'GEN',
        'exodus': 'EXO', 'éxodo': 'EXO',
        'psalms': 'PSA', 'psalm': 'PSA', 'salmos': 'PSA',
        'romans': 'ROM', 'romanos': 'ROM',
        'ephesians': 'EPH', 'efesios': 'EPH',
      }
      
      const bookId = bookMap[bookName]
      if (!bookId) {
        setAudioError('Audio not available for this book')
        setIsAudioLoading(false)
        return
      }
      
      const chapterId = `${bookId}.${chapter}`
      
      // Get audio chapter
      const audioRes = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/scripture/audio-bibles/${audioBibleId}/chapters/${chapterId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (audioRes.data && audioRes.data.resourceUrl) {
        setAudioUrl(audioRes.data.resourceUrl)
      } else {
        setAudioError('Audio URL not available')
      }
    } catch (error: any) {
      console.error('Audio load error:', error)
      setAudioError(error.response?.data?.message || 'Failed to load audio')
    } finally {
      setIsAudioLoading(false)
    }
  }

  const renderVerseReference = (ref: string) => (
    <button
      onClick={() => handleVerseClick(ref)}
      className="text-cyan-300 hover:text-cyan-100 underline decoration-dotted hover:decoration-solid transition-colors"
    >
      {ref}
    </button>
  )

  const renderSmartValue = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-100/80">—</span>
    }
    if (Array.isArray(value)) {
      return (
        <ul className="mt-2 list-disc list-outside pl-5 space-y-2 text-gray-100/90">
          {value.map((item, index) => (
            <li key={`value-${index}`} className="leading-relaxed marker:text-cyan-200">
              {typeof item === 'string' ? (
                <span className="block">{item}</span>
              ) : (
                <pre className="text-xs text-gray-100/90 whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre>
              )}
            </li>
          ))}
        </ul>
      )
    }
    if (typeof value === 'string') {
      return <div className="mt-2">{renderMarkdown(value)}</div>
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return <span className="text-gray-100/90">{String(value)}</span>
    }
    return <pre className="text-xs text-gray-100/90 whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
  }

  const getOutlinePointLabel = (point: any) => {
    if (typeof point === 'string') return point
    return point?.title || point?.content || point?.text || ''
  }

  const getOutlinePointNodes = (structure: any) => {
    if (!structure || typeof structure !== 'object') return []
    if (Array.isArray(structure.pointNodes) && structure.pointNodes.length > 0) {
      return structure.pointNodes.map((point: any, index: number) => ({
        id: point?.id || `point-${index + 1}`,
        title: getOutlinePointLabel(point),
        summary: typeof point?.summary === 'string' ? point.summary : '',
        movement: typeof point?.movement === 'string' ? point.movement : '',
        supportingVerses: Array.isArray(point?.supportingVerses) ? point.supportingVerses : [],
        canonicalThemes: Array.isArray(point?.canonicalThemes) ? point.canonicalThemes : [],
        crossReferences: Array.isArray(point?.crossReferences) ? point.crossReferences : [],
        subpoints: Array.isArray(point?.subpoints) ? point.subpoints : [],
        illustrationIdeas: Array.isArray(point?.illustrationIdeas) ? point.illustrationIdeas : [],
        mediaSuggestions: Array.isArray(point?.mediaSuggestions) ? point.mediaSuggestions : [],
      }))
    }

    const fallbackPoints = Array.isArray(structure.points) ? structure.points : []
    return fallbackPoints.map((point: any, index: number) => ({
      id: `point-${index + 1}`,
      title: getOutlinePointLabel(point),
      summary: '',
      movement: '',
      supportingVerses: Array.isArray(point?.supportingVerses) ? point.supportingVerses : [],
      canonicalThemes: Array.isArray(point?.canonicalThemes) ? point.canonicalThemes : [],
      crossReferences: Array.isArray(point?.crossReferences) ? point.crossReferences : [],
      subpoints: Array.isArray(point?.subpoints) ? point.subpoints : [],
      illustrationIdeas: Array.isArray(point?.illustrationIdeas) ? point.illustrationIdeas : [],
      mediaSuggestions: Array.isArray(point?.mediaSuggestions) ? point.mediaSuggestions : [],
    }))
  }

  const pointTextTokens = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2)

  const scoreApplicationForPoint = (applicationText: string, point: any) => {
    const appTokens = new Set(pointTextTokens(applicationText))
    const pointTokens = new Set(pointTextTokens(point?.title || ''))
    const overlap = Array.from(pointTokens).filter((token) => appTokens.has(token)).length

    const verses = Array.isArray(point?.supportingVerses) ? point.supportingVerses : []
    const verseScore = verses.reduce((score: number, verse: string) => {
      const normalizedVerse = verse.toLowerCase()
      return applicationText.toLowerCase().includes(normalizedVerse) ? score + 2 : score
    }, 0)

    return overlap + verseScore
  }

  const getRelatedApplicationsForPoint = (point: any) => {
    const applications = Array.isArray(workspace?.applications) ? workspace.applications : []
    if (!applications.length) return []

    const ranked = applications
      .map((app: any): { app: any; score: number } => ({
        app,
        score: scoreApplicationForPoint(app?.content || '', point),
      }))
      .filter((item: { app: any; score: number }) => item.score > 0)
      .sort((a: { app: any; score: number }, b: { app: any; score: number }) => b.score - a.score)
      .slice(0, 3)
      .map((item: { app: any; score: number }) => item.app)

    return ranked
  }

  const togglePointSection = (outlineId: string, pointIndex: number, section: string) => {
    const key = `${outlineId}-${pointIndex}-${section}`
    setExpandedPointSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const isPointSectionExpanded = (outlineId: string, pointIndex: number, section: string) =>
    !!expandedPointSections[`${outlineId}-${pointIndex}-${section}`]

  const toggleTextBlock = (key: string) => {
    setExpandedTextBlocks((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const renderCollapsibleMarkdown = (text: string, key: string, collapsedHeight = 'max-h-24') => {
    const normalized = (text || '').trim()
    if (!normalized) return null
    const isLong = normalized.length > 260
    const expanded = !!expandedTextBlocks[key]

    return (
      <div>
        <div className={`${!expanded && isLong ? `${collapsedHeight} overflow-hidden` : ''} text-gray-100/95 leading-relaxed`}>
          {renderMarkdown(normalized)}
        </div>
        {isLong && (
          <button
            onClick={() => toggleTextBlock(key)}
            className="mt-2 cyber-outline text-[10px] px-2 py-1 rounded-full"
          >
            {expanded ? 'Show less' : 'Show full'}
          </button>
        )}
      </div>
    )
  }

  const renderCompactList = (
    items: any[],
    key: string,
    emptyText: string,
    colorClass = 'text-gray-100'
  ) => {
    const values = (Array.isArray(items) ? items : []).map((item) => String(item).trim()).filter(Boolean)
    if (!values.length) {
      return <p className="text-xs text-gray-300">{emptyText}</p>
    }

    const expanded = !!expandedTextBlocks[key]
    const visible = expanded ? values : values.slice(0, 4)

    return (
      <div>
        <ul className={`list-disc list-inside space-y-1 text-xs ${colorClass}`}>
          {visible.map((item, index) => (
            <li key={`${key}-${index}`} className="leading-relaxed">{item}</li>
          ))}
        </ul>
        {values.length > 4 && (
          <button
            onClick={() => toggleTextBlock(key)}
            className="mt-2 cyber-outline text-[10px] px-2 py-1 rounded-full"
          >
            {expanded ? 'Show fewer' : `Show ${values.length - 4} more`}
          </button>
        )}
      </div>
    )
  }

  const getPassageFocusText = () => {
    const primaryReport = workspace?.studyReports?.[0]?.sections
    if (typeof passageSummary === 'string' && passageSummary.trim()) return passageSummary.trim()
    if (passageSummary?.summary) return String(passageSummary.summary)
    if (passageSummary?.mainIdea) return String(passageSummary.mainIdea)
    if (passageSummary?.interpretiveCenter) return String(passageSummary.interpretiveCenter)
    if (primaryReport?.mainTheologicalClaim) return String(primaryReport.mainTheologicalClaim).slice(0, 320)
    if (primaryReport?.passageOverview) return String(primaryReport.passageOverview).slice(0, 320)
    if (primaryReport?.theologicalInsights) return String(primaryReport.theologicalInsights).slice(0, 320)
    if (primaryReport?.keyThemes) return String(primaryReport.keyThemes).slice(0, 320)
    return ''
  }

  const getOutlineBigIdea = (outline: any) => {
    const movement = outline?.structure?.sermonMovement
    if (typeof movement === 'string' && movement.trim()) return movement.trim()
    const focus = getPassageFocusText()
    if (focus) return focus
    return 'This sermon moves from biblical insight toward faithful response and transformed living.'
  }

  const compactLabel = (value: string, limit = 72) => {
    const normalized = String(value || '').replace(/\s+/g, ' ').trim()
    if (!normalized) return 'Point'
    if (normalized.length <= limit) return normalized
    return `${normalized.slice(0, limit - 1).trimEnd()}…`
  }

  const getFlowNarrativeEntries = (outline: any, pointNodes: any[]) => {
    const introText = outline?.structure?.introduction || getPassageFocusText() || 'Opening movement for the sermon.'
    const conclusionText = outline?.structure?.conclusion || outline?.structure?.callToAction || 'Closing response and invitation.'
    const pointEntries = (Array.isArray(pointNodes) ? pointNodes : []).map((point: any, index: number) => {
      const detailParts = [
        point?.title || '',
        point?.summary || point?.movement || '',
        ...(Array.isArray(point?.subpoints) ? point.subpoints : []),
      ].filter(Boolean)

      return {
        id: `point-${index + 1}`,
        label: `Point ${index + 1}`,
        title: point?.title || `Point ${index + 1}`,
        detail: detailParts.join('\n\n'),
      }
    })

    return [
      { id: 'intro', label: 'Intro', title: 'Introduction', detail: introText },
      ...pointEntries,
      { id: 'conclusion', label: 'Conclusion', title: 'Conclusion', detail: conclusionText },
    ]
  }

  const estimatePointMinutes = (point: any) => {
    const composite = [
      point?.title || '',
      point?.summary || '',
      ...(Array.isArray(point?.subpoints) ? point.subpoints : []),
    ].join(' ')
    const words = composite.split(/\s+/).filter(Boolean).length
    return Math.max(3, Math.min(8, Math.round(words / 18) || 5))
  }

  const getVerseEvidenceText = (verseRef: string) => {
    const verses = extractVerses(scriptureResult)
    const normalizedTarget = verseRef.replace(/\s+/g, ' ').toLowerCase()
    const match = verses.find((verse: any) => {
      const ref = String(verse?.reference || '').replace(/\s+/g, ' ').toLowerCase()
      return ref.includes(normalizedTarget) || normalizedTarget.includes(ref)
    })
    return match?.text || ''
  }

  const renderOutline = (structure: any) => {
    if (!structure || typeof structure !== 'object') {
      return <p className="cyber-muted text-sm">Outline unavailable.</p>
    }
    const points = getOutlinePointNodes(structure)
    return (
      <div className="space-y-3 text-sm">
        {structure.introduction && (
          <div>
            <p className="text-xs uppercase tracking-widest cyber-muted">Introduction</p>
            <div className="mt-1">{renderMarkdown(structure.introduction)}</div>
          </div>
        )}
        {points.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest cyber-muted">Main Points</p>
            <ol className="mt-2 list-decimal list-inside space-y-1 text-gray-100/90">
              {points.map((point: any, index: number) => (
                <li key={`${point.id}-${index}`}>{renderMarkdown(point.title)}</li>
              ))}
            </ol>
          </div>
        )}
        {structure.conclusion && (
          <div>
            <p className="text-xs uppercase tracking-widest cyber-muted">Conclusion</p>
            <div className="mt-1">{renderMarkdown(structure.conclusion)}</div>
          </div>
        )}
        {structure.callToAction && (
          <div>
            <p className="text-xs uppercase tracking-widest cyber-muted">Call To Action</p>
            <div className="mt-1">{renderMarkdown(structure.callToAction)}</div>
          </div>
        )}
      </div>
    )
  }

  const getOutlineTitle = (outline: any) => {
    const points = getOutlinePointNodes(outline?.structure)
    const rawTitle = points[0]?.title || outline?.structure?.introduction || outline?.title || 'Outline'
    const firstSentence = rawTitle.split(/\.|\?|\!/).slice(0, 1).join('').trim()
    const trimmed = (firstSentence || rawTitle).trim()
    if (trimmed.length > 120) {
      return `${trimmed.slice(0, 117)}...`
    }
    return trimmed
  }

  const renderManuscript = (content: any) => {
    if (!content) {
      return <p className="cyber-muted text-sm">No manuscript text yet.</p>
    }
    if (typeof content === 'string') {
      return content.split('\n').filter(Boolean).map((line: string, index: number) => (
        <p key={`${line}-${index}`} className="text-gray-100/90 leading-relaxed">
          {line}
        </p>
      ))
    }

    if (content.text) {
      return content.text.split('\n').filter(Boolean).map((line: string, index: number) => (
        <p key={`${line}-${index}`} className="text-gray-100/90 leading-relaxed">
          {line}
        </p>
      ))
    }

    if (content.sections) {
      return content.sections.map((section: any, index: number) => (
        <div key={`${section.heading}-${index}`} className="space-y-2">
          <p className="text-xs uppercase tracking-widest cyber-muted">{section.heading}</p>
          <p className="text-gray-100/90 leading-relaxed">{section.body}</p>
        </div>
      ))
    }

    return <p className="cyber-muted text-sm">Manuscript format not recognized.</p>
  }

  const renderStudyReport = (report: any) => {
    const sections = report?.sections || {}
    if (!report) {
      return <p className="cyber-muted text-sm">No study report generated yet.</p>
    }

    const str = (value: any) => (typeof value === 'string' ? value.trim() : '')
    const arr = (value: any): any[] => (Array.isArray(value) ? value : [])
    const thematicClaim = str(sections.mainTheologicalClaim || sections.theologicalInsights || '')
    const legacyThemes = arr(sections.theologicalThemes || sections.keyThemes || sections.themes)
    const legacyImplications = arr(sections.pastoralImplications || sections.practicalApplications || sections.applications)
    const legacyStructure = arr(sections.structureOfPassage || sections.structuralAnalysis || [])
    const legacyCrossRefs = arr(sections.crossReferences || [])
    const legacyChallenges = arr(sections.interpretiveChallenges || [])
    const exegeticalFlow = arr(sections.exegeticalFlow || sections.argumentFlow || sections.flow)
    const exegeticalSummary = str(sections.exegeticalSummary || sections.summaryStatement)

    const normalizedImplications =
      sections.pastoralImplications && typeof sections.pastoralImplications === 'object' && !Array.isArray(sections.pastoralImplications)
        ? {
            personalLife: arr(sections.pastoralImplications.personalLife),
            churchLife: arr(sections.pastoralImplications.churchLife),
            mission: arr(sections.pastoralImplications.mission),
          }
        : {
            personalLife: legacyImplications.slice(0, 4),
            churchLife: legacyImplications.slice(4, 8),
            mission: legacyImplications.slice(8, 12),
          }

    const reportTextForTiming = [
      str(sections.passageOverview || sections.overview || sections.summary),
      str(sections.literaryContext),
      str(sections.historicalContext),
      str(sections.canonicalContext || sections.canonicalConnections || sections.canonicalThemes),
      thematicClaim,
      exegeticalSummary,
      ...exegeticalFlow.map(String),
      ...legacyThemes.map(String),
      ...normalizedImplications.personalLife.map(String),
      ...normalizedImplications.churchLife.map(String),
      ...normalizedImplications.mission.map(String),
    ]
      .join(' ')
      .trim()
    const readMinutes = Math.max(1, Math.ceil(reportTextForTiming.split(/\s+/).filter(Boolean).length / 180))

    const jumpToWordStudy = (term: string) => {
      const clean = String(term || '').trim()
      if (!clean) return
      setWordStudyWord(clean)
      setWordStudyLastLookup(clean)
      setActiveSection('word-study')
      setTimeout(() => {
        handleWordStudyLookup()
      }, 60)
    }

    const reportBlocks = [
      { key: 'passageOverview', title: 'Passage Overview', content: str(sections.passageOverview || sections.overview || sections.summary) },
      { key: 'literaryContext', title: 'Literary Context', content: str(sections.literaryContext) },
      { key: 'historicalContext', title: 'Historical Context', content: str(sections.historicalContext) },
      { key: 'canonicalContext', title: 'Canonical Context', content: str(sections.canonicalContext || sections.canonicalConnections || sections.canonicalThemes) },
      { key: 'mainTheologicalClaim', title: 'Main Theological Claim', content: thematicClaim, highlight: true },
    ]

    const nonEmptyBlocks = reportBlocks.filter((item) => item.content)

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-cyan-200/80">Study Report</p>
          <p className="text-xs text-gray-300">{readMinutes} minute read</p>
        </div>

        {nonEmptyBlocks.map((block) => (
          <details
            key={block.key}
            open
            className={`rounded-xl border p-4 ${block.highlight ? 'border-cyan-400/40 bg-cyan-500/10' : 'border-white/10 bg-black/20'}`}
          >
            <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">
              {block.title}
            </summary>
            <p className="mt-2 text-sm text-gray-100/90 leading-relaxed">{block.content}</p>
          </details>
        ))}

        {exegeticalFlow.length ? (
          <details open className="rounded-xl border border-white/10 bg-black/20 p-4">
            <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">Exegetical Flow</summary>
            <ol className="mt-3 list-decimal list-inside text-sm text-gray-100/90 space-y-1">
              {exegeticalFlow.map((step: any, idx: number) => (
                <li key={`flow-${idx}`}>{String(step)}</li>
              ))}
            </ol>
          </details>
        ) : null}

        {exegeticalSummary ? (
          <details open className="rounded-xl border border-white/10 bg-black/20 p-4">
            <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">Exegetical Summary</summary>
            <p className="mt-2 text-sm text-gray-100/90 leading-relaxed">{exegeticalSummary}</p>
          </details>
        ) : null}

        {legacyStructure.length ? (
          <details open className="rounded-xl border border-white/10 bg-black/20 p-4">
            <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">Structure of the Passage</summary>
            <div className="mt-3 space-y-2">
              {legacyStructure.map((item: any, idx: number) => (
                <div key={`movement-${idx}`} className="border border-white/10 rounded-lg p-3">
                  <p className="text-sm text-cyan-100 font-medium">
                    {item?.movement || item?.title || `Movement ${idx + 1}`}
                    {item?.verses ? <span className="text-cyan-300 font-semibold"> • {item.verses}</span> : null}
                  </p>
                  <p className="text-xs text-gray-300 mt-1">{item?.summary || item?.description || String(item)}</p>
                </div>
              ))}
            </div>
          </details>
        ) : null}

        {arr(sections.keyTerms).length ? (
          <details open className="rounded-xl border border-white/10 bg-black/20 p-4">
            <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">Key Terms</summary>
            <div className="mt-3 grid md:grid-cols-2 gap-2">
              {arr(sections.keyTerms).map((term: any, idx: number) => (
                <button
                  type="button"
                  key={`term-${idx}`}
                  onClick={() => jumpToWordStudy(term?.term || '')}
                  className="text-left border border-white/10 rounded-lg p-3 hover:bg-black/40 transition-colors"
                >
                  <p className="text-sm text-cyan-100 font-medium flex items-center justify-between gap-2">
                    {term?.term || 'Term'} {term?.language ? <span className="text-gray-300">({term.language})</span> : null}
                    <span className="text-[10px] text-cyan-300 uppercase tracking-widest">Open Word Study</span>
                  </p>
                  {term?.transliteration ? <p className="text-xs text-gray-300 mt-1">Transliteration: {term.transliteration}</p> : null}
                  {term?.definition ? <p className="text-xs text-gray-300 mt-1">{term.definition}</p> : null}
                  {term?.nuance ? <p className="text-xs text-cyan-200 mt-1">{term.nuance}</p> : null}
                </button>
              ))}
            </div>
          </details>
        ) : null}

        {legacyCrossRefs.length ? (
          <details open className="rounded-xl border border-white/10 bg-black/20 p-4">
            <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">Cross References</summary>
            <div className="mt-3 space-y-2">
              {legacyCrossRefs.map((item: any, idx: number) => (
                <div key={`xref-${idx}`} className="border border-white/10 rounded-lg p-3">
                  <p className="text-sm text-cyan-100 font-medium">{item?.reference || item?.verse || String(item)}</p>
                  {item?.connection || item?.explanation ? (
                    <p className="text-xs text-gray-300 mt-1">{item.connection || item.explanation}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </details>
        ) : null}

        {legacyChallenges.length ? (
          <details open className="rounded-xl border border-white/10 bg-black/20 p-4">
            <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">Interpretive Challenges</summary>
            <div className="mt-3 space-y-2">
              {legacyChallenges.map((item: any, idx: number) => (
                <div key={`challenge-${idx}`} className="border border-white/10 rounded-lg p-3">
                  <p className="text-sm text-cyan-100 font-medium">{item?.question || item?.challenge || `Challenge ${idx + 1}`}</p>
                  {Array.isArray(item?.interpretationOptions) && item.interpretationOptions.length ? (
                    <ul className="list-disc list-inside text-xs text-gray-300 mt-1 space-y-1">
                      {item.interpretationOptions.map((option: string, optionIdx: number) => (
                        <li key={`option-${idx}-${optionIdx}`}>{option}</li>
                      ))}
                    </ul>
                  ) : null}
                  {item?.preachingGuidance ? <p className="text-xs text-cyan-200 mt-1">{item.preachingGuidance}</p> : null}
                </div>
              ))}
            </div>
          </details>
        ) : null}

        {legacyThemes.length ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-widest text-cyan-200/80">Theological Themes</p>
            <ul className="mt-2 list-disc list-inside text-sm text-gray-300 space-y-1">
              {legacyThemes.map((theme: any, idx: number) => (
                <li key={`theme-${idx}`}>{String(theme)}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {(normalizedImplications.personalLife.length || normalizedImplications.churchLife.length || normalizedImplications.mission.length) ? (
          <details open className="rounded-xl border border-white/10 bg-black/20 p-4">
            <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">Pastoral Implications</summary>
            <div className="mt-3 grid md:grid-cols-3 gap-3">
              <div className="border border-white/10 rounded-lg p-3">
                <p className="text-xs uppercase tracking-widest text-cyan-200/80">Personal Life</p>
                <ul className="mt-2 list-disc list-inside text-sm text-gray-300 space-y-1">
                  {normalizedImplications.personalLife.map((item: any, idx: number) => (
                    <li key={`implication-personal-${idx}`}>{String(item)}</li>
                  ))}
                </ul>
              </div>
              <div className="border border-white/10 rounded-lg p-3">
                <p className="text-xs uppercase tracking-widest text-cyan-200/80">Church Life</p>
                <ul className="mt-2 list-disc list-inside text-sm text-gray-300 space-y-1">
                  {normalizedImplications.churchLife.map((item: any, idx: number) => (
                    <li key={`implication-church-${idx}`}>{String(item)}</li>
                  ))}
                </ul>
              </div>
              <div className="border border-white/10 rounded-lg p-3">
                <p className="text-xs uppercase tracking-widest text-cyan-200/80">Mission</p>
                <ul className="mt-2 list-disc list-inside text-sm text-gray-300 space-y-1">
                  {normalizedImplications.mission.map((item: any, idx: number) => (
                    <li key={`implication-mission-${idx}`}>{String(item)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        ) : null}

        {/* EGW Section - Rendered separately at the end */}
        <StudyReportEGWSection section={sections.egw || sections.egwSection || null} />
      </div>
    )
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const fetchWorkspace = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
        const workspaceData = response.data
        setWorkspace(workspaceData)
        setWorkspaceDraft(workspaceData)

        const defaultReference = workspaceData?.mainPassage?.trim() || ''
        const defaultTranslation = workspaceData?.language === 'es' ? 'RVR1960' : 'KJV'
        if (defaultReference) {
          setScriptureQuery(defaultReference)
          setScriptureLastLookup(defaultReference)
          setCrossRefVerse(defaultReference)
          setCrossRefLastLookup(defaultReference)
        }
        setScriptureTranslation(defaultTranslation)
        setCitationTranslation(defaultTranslation)
        setParallelTranslations(defaultTranslation)

        const restored = await restoreScriptureLookupCache(workspaceData)
        if (!restored && defaultReference) {
          await handleScriptureLookup({
            reference: defaultReference,
            translation: defaultTranslation,
            parallelTranslation: defaultTranslation,
          })
        }
      } catch (err) {
        console.error('Failed to fetch workspace', err)
        setError('Unable to load workspace.')
      } finally {
        setLoading(false)
      }
    }

    if (workspaceId) {
      fetchWorkspace()
    }
  }, [router, workspaceId])

  const withToken = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return null
    }
    return { headers: { Authorization: `Bearer ${token}` } }
  }

  // Keyboard shortcuts
  useKeyboardShortcut('1', () => handlePhaseChange('DISCOVER'), { cmd: true })
  useKeyboardShortcut('2', () => handlePhaseChange('ANALYZE'), { cmd: true })
  useKeyboardShortcut('3', () => handlePhaseChange('STRATEGIZE'), { cmd: true })
  useKeyboardShortcut('4', () => handlePhaseChange('CREATE'), { cmd: true })
  useKeyboardShortcut('5', () => handlePhaseChange('REFINE'), { cmd: true })

  // Validate citations when outlines change
  useEffect(() => {
    const validateOutlineCitations = async () => {
      const selectedOutline = workspace?.outlines?.find((o: any) => o.isSelected) || workspace?.outlines?.[0]
      if (!selectedOutline?.structure) return
      const points = getOutlinePointNodes(selectedOutline.structure)
      if (!points.length) return
      
      const validations: Record<string, any> = {}
      for (const point of points) {
        if (point.supportingVerses && point.supportingVerses.length > 0) {
          for (const verse of point.supportingVerses) {
            if (!citationValidations[verse]) {
              const result = await validateCitation(point.content || point.title, verse)
              validations[verse] = result
            }
          }
        }
      }
      if (Object.keys(validations).length > 0) {
        setCitationValidations(prev => ({ ...prev, ...validations }))
      }
    }
    
    if (workspace?.outlines?.length) {
      validateOutlineCitations()
    }
  }, [workspace?.outlines])

  const handleGenerate = async (type: string, override?: string) => {
    const config = withToken()
    if (!config) return

    setActionLoading((prev) => (prev.includes(type) ? prev : [...prev, type]))
    try {
      if (type === 'outlines') {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/outlines`,
          { 
            promptOverride: override,
            includeEGW: workspace?.egwEnabled || false
          },
          config,
        )
      }
      if (type === 'manuscript') {
        const selectedOutline = workspace?.outlines?.find((o: any) => o.isSelected) || workspace?.outlines?.[0]
        if (!selectedOutline) {
          setError('Create or generate an outline first.')
          return
        }
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/manuscript`,
          { 
            outlineId: selectedOutline.id, 
            promptOverride: override,
            includeEGW: workspace?.egwEnabled || false,
            manuscriptOptions: {
              tone: manuscriptTone,
              targetMinutes: manuscriptTargetMinutes,
              format: manuscriptFormat,
              audienceMode: manuscriptAudienceMode === 'default'
                ? (workspace?.audienceProfile || 'general congregation')
                : manuscriptAudienceMode,
              includeSlideCues: manuscriptIncludeSlideCues,
              includeKeyLines: manuscriptIncludeKeyLines,
            },
          },
          config,
        )
      }
      if (type === 'applications') {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/applications`,
          { 
            promptOverride: override,
            includeEGW: workspace?.egwEnabled || false
          },
          config,
        )
      }
      if (type === 'questions') {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/discussion-questions`,
          { promptOverride: override },
          config,
        )
      }
      if (type === 'illustrations') {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/illustrations`,
          { promptOverride: override },
          config,
        )
      }
      if (type === 'citations') {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/citations`,
          { promptOverride: override },
          config,
        )
      }
      if (type === 'study-report') {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/study-report`,
          { 
            promptOverride: override,
            includeEGW: workspace?.egwEnabled || false
          },
          config,
        )
      }
      if (type === 'dna') {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/sermon-dna/analyze`, { workspaceId }, config)
      }

      const refreshed = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`,
        config,
      )
      setWorkspace(refreshed.data)
      if (type === 'dna') {
        await fetchDnaIntegrityReport()
      }
    } catch (err) {
      console.error('Generation failed', err)
      setError('Action failed. Check backend logs.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== type))
    }
  }

  const fetchDnaIntegrityReport = async () => {
    const config = withToken()
    if (!config) return
    setDnaIntegrityLoading(true)
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/integrity-check`,
        {},
        config,
      )
      setDnaIntegrityReport(response.data || null)
    } catch (err) {
      console.error('Failed to load DNA integrity report', err)
      setDnaIntegrityReport(null)
    } finally {
      setDnaIntegrityLoading(false)
    }
  }

  const handleSocraticCoachGenerate = async () => {
    const config = withToken()
    if (!config) return
    const actionKey = 'coach'
    setActionLoading((prev) => (prev.includes(actionKey) ? prev : [...prev, actionKey]))
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/socratic-coach`,
        {
          mode: coachMode,
          listenerProfile: coachListenerProfile,
        },
        config,
      )
      setSocraticCoachSession(response.data || null)
      setCoachFeedback({})
      setCoachAnswers({})
      const refreshed = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`, config)
      setWorkspace(refreshed.data)
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
    const actionKey = `coach-answer-${questionId}`
    setActionLoading((prev) => (prev.includes(actionKey) ? prev : [...prev, actionKey]))
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/socratic-coach`,
        {
          mode: coachMode,
          listenerProfile: coachListenerProfile,
          questionId,
          answer,
        },
        config,
      )
      setCoachFeedback((prev) => ({ ...prev, [questionId]: response.data || null }))
    } catch (err) {
      console.error('Failed to submit socratic coach answer', err)
      setError('Unable to process coach answer.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== actionKey))
    }
  }

  const buildCoachApplyText = (question: any, feedback: any, answerText: string) => {
    const parts = [
      `[Coach] ${question?.id || 'Q'} · ${question?.dimension || 'refinement'}`,
      question?.question ? `Question: ${question.question}` : '',
      answerText ? `Pastor Answer: ${answerText}` : '',
      feedback?.coachFeedback ? `Coach Feedback: ${feedback.coachFeedback}` : '',
      feedback?.improvementSuggestion ? `Improvement: ${feedback.improvementSuggestion}` : '',
      feedback?.rewriteHint ? `Suggested Line: ${feedback.rewriteHint}` : '',
    ].filter(Boolean)
    return parts.join('\n')
  }

  const handleApplyCoachToManuscript = async (question: any, feedback: any) => {
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
      const updatedText = `${currentText}\n\n## Coach Refinement (${questionId})\n${block}\n`
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/manuscripts/${selectedManuscript.id}`,
        { content: { text: updatedText } },
        config,
      )
      const refreshed = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`, config)
      setWorkspace(refreshed.data)
      setError(null)
    } catch (err) {
      console.error('Failed to apply coach suggestion to manuscript', err)
      setError('Unable to apply suggestion to manuscript.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== actionKey))
    }
  }

  const handleApplyCoachToOutline = async (question: any, feedback: any) => {
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
      const structure = { ...(selectedOutline?.structure || {}) }
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
        if (coachLine) {
          existingSubpoints.push(`Coach (${questionId}): ${coachLine}`)
        }
        existingNode.subpoints = existingSubpoints.slice(0, 20)
        existingNode.notes = [String(existingNode.notes || '').trim(), coachNote].filter(Boolean).join('\n\n')
        pointNodes[targetIndex] = existingNode
      } else {
        const coachNotes = Array.isArray((structure as any).coachNotes) ? [...(structure as any).coachNotes] : []
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
        ;(structure as any).coachNotes = coachNotes.slice(-25)
      }

      structure.pointNodes = pointNodes
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/outlines/${selectedOutline.id}`,
        { structure },
        config,
      )
      const refreshed = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`, config)
      setWorkspace(refreshed.data)
      setError(null)
    } catch (err) {
      console.error('Failed to apply coach suggestion to outline', err)
      setError('Unable to apply suggestion to outline.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== actionKey))
    }
  }

  const handleCitationValidate = async () => {
    const config = withToken()
    if (!config) return
    setActionLoading((prev) => (prev.includes('citations-validate') ? prev : [...prev, 'citations-validate']))
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/citations/validate?translation=${citationTranslation}`,
        {},
        config,
      )
      const refreshed = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`,
        config,
      )
      setWorkspace(refreshed.data)
    } catch (err) {
      console.error('Citation validation failed', err)
      setError('Unable to validate citations.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'citations-validate'))
    }
  }

  const handleScriptureLookup = async (overrides?: {
    reference?: string
    translation?: string
    parallelTranslation?: string
  }) => {
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
    
    // Clear all cached data when doing a new lookup
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
    
    setActionLoading((prev) => (prev.includes('scripture') ? prev : [...prev, 'scripture']))
    
    try {
      // Load critical passage text first (fast, non-LLM)
      const passageRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scripture/passage-with-context`, {
        ...config,
        params: {
          reference: normalizedReference,
          translation: normalizedTranslation,
          _ts: Date.now(),
        },
      })

      if (requestId !== scriptureLookupRequestId.current) {
        setActionLoading((prev) => prev.filter((item) => item !== 'scripture'))
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
            typeof normalizedPassageResult?.error === 'string' && normalizedPassageResult.error.trim()
              ? normalizedPassageResult.error.trim()
              : 'Passage response returned no verses. Try Lookup again.'
          setScriptureError(details)
          setActionLoading((prev) => prev.filter((item) => item !== 'scripture'))
          return
        }
        setScriptureResult(normalizedPassageResult)
        const warning = getVerseValidationWarning(normalizedReference, verses)
        setScriptureValidationWarning(warning)
        // Restore auto-generation behavior: mount all scripture section panels after
        // the base passage is loaded so each panel fetches asynchronously in parallel.
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
        setActionLoading((prev) => prev.filter((item) => item !== 'scripture'))
        return
      }
      
      // Remove loading state immediately after passage loads
      setActionLoading((prev) => prev.filter((item) => item !== 'scripture'))
      
      // Load secondary data asynchronously in background (these can take longer with LLM)
      // These will populate their own component panels as they complete
      Promise.allSettled([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scripture/parallel`, {
          ...config,
          params: { reference: normalizedReference, translations: normalizedParallel },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scripture/context`, {
          ...config,
          params: { reference: normalizedReference },
        }),
      ]).then(results => {
        if (requestId !== scriptureLookupRequestId.current) {
          return
        }
        // Extract and set all data after request-id guard
        const parallelData = results[0].status === 'fulfilled' ? results[0].value?.data?.translations || [] : []
        const contextDataResult = results[1].status === 'fulfilled' ? results[1].value?.data || null : null
        
        // Set all state updates together
        setParallelResults(parallelData)
        setContextData(contextDataResult)
        
        const snapshot = buildScriptureSnapshot({
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
        })
        persistScriptureSnapshot(snapshot)
      }).catch(err => {
        if (requestId !== scriptureLookupRequestId.current) {
          return
        }
        console.error('Secondary data load failed:', err)
      })
      
    } catch (err) {
      if (requestId !== scriptureLookupRequestId.current) {
        return
      }
      console.error('Failed to fetch passage', err)
      setScriptureError('Unable to load passage. Check backend logs.')
      setScriptureResult(null)
      setScriptureValidationWarning(null)
      setActionLoading((prev) => prev.filter((item) => item !== 'scripture'))
    }
  }

  const handleWordStudyLookup = async (override?: { word?: string; language?: string }) => {
    const config = withToken()
    if (!config) return
    const normalizedWord = (override?.word || wordStudyWord).trim()
    const normalizedLang = (override?.language || wordStudyLanguage).trim().toLowerCase() || 'greek'
    const workspaceLanguage = String(workspace?.language || '').toLowerCase()
    const responseLanguage =
      workspaceLanguage.startsWith('es') ||
      workspaceLanguage.includes('spanish') ||
      workspaceLanguage.includes('espanol') ||
      workspaceLanguage.includes('español')
        ? 'es'
        : 'en'
    if (!normalizedWord) {
      setWordStudyError('Enter a word to analyze (ex: agape, logos).')
      return
    }
    setWordStudyError(null)
    setWordStudyWord(normalizedWord)
    setWordStudyLanguage(normalizedLang)
    setWordStudyLastLookup(normalizedWord)
    setActionLoading((prev) => (prev.includes('word-study') ? prev : [...prev, 'word-study']))
    try {
      let nextWordStudyResult: any = null
      let nextWordStudyInsights: any = null
      const [studyRes, insightsRes] = await Promise.allSettled([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scripture/word-study`, {
          ...config,
          params: {
            word: normalizedWord,
            language: normalizedLang,
            responseLanguage,
          },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scripture/word-study-insights`, {
          ...config,
          params: {
            word: normalizedWord,
            language: normalizedLang,
            responseLanguage,
          },
        }),
      ])
      if (studyRes.status === 'fulfilled') {
        setWordStudyResult(studyRes.value.data)
        nextWordStudyResult = studyRes.value.data
      } else {
        setWordStudyResult(null)
        setWordStudyError('Unable to load word study results.')
      }
      if (insightsRes.status === 'fulfilled') {
        setWordStudyInsights(insightsRes.value.data)
        nextWordStudyInsights = insightsRes.value.data
      } else {
        setWordStudyInsights(null)
      }
      if (nextWordStudyResult || nextWordStudyInsights) {
        await persistSupplementalStudyCache({
          wordStudy: {
            word: normalizedWord,
            language: normalizedLang,
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
      setActionLoading((prev) => prev.filter((item) => item !== 'word-study'))
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
      const workspaceLanguage = String(workspace?.language || '').toLowerCase()
      const responseLanguage =
        workspaceLanguage.startsWith('es') ||
        workspaceLanguage.includes('spanish') ||
        workspaceLanguage.includes('espanol') ||
        workspaceLanguage.includes('español')
          ? 'es'
          : 'en'
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scripture/word-study-suggestions`, {
        ...config,
        params: {
          reference,
          translation: scriptureTranslation || workspace?.defaultTranslation || 'KJV',
          language: wordStudyLanguage,
          responseLanguage,
        },
      })
      setWordStudySuggestions(Array.isArray(response.data) ? response.data : [])
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
    setActionLoading((prev) => (prev.includes('cross-references') ? prev : [...prev, 'cross-references']))
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scripture/cross-references-ranked`, {
        ...config,
        params: { verse: normalizedVerse },
      })
      const ranked = Array.isArray(response.data) ? response.data : []
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
      setActionLoading((prev) => prev.filter((item) => item !== 'cross-references'))
    }
  }

  const handleSearch = async () => {
    const config = withToken()
    if (!config || !searchQuery) return
    setActionLoading((prev) => (prev.includes('search') ? prev : [...prev, 'search']))
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/search`, {
        ...config,
        params: { query: searchQuery },
      })
      setSearchResults(response.data || [])
    } catch (err) {
      console.error('Search failed', err)
      setError('Unable to search.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'search'))
    }
  }

  const openPromptEditor = async (
    type: 'outline' | 'manuscript' | 'applications' | 'questions' | 'illustrations' | 'citations' | 'study-report',
  ) => {
    const config = withToken()
    if (!config) return
    try {
      const outlineId = type === 'manuscript'
        ? workspace?.outlines?.find((o: any) => o.isSelected)?.id || workspace?.outlines?.[0]?.id
        : undefined
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/prompts`,
        {
          ...config,
          params: { type, outlineId },
        },
      )
      setPromptType(type)
      setPromptText(response.data || '')
      setPromptModalOpen(true)
    } catch (err) {
      console.error('Failed to load prompt', err)
      setError('Unable to load prompt preview.')
    }
  }

  const runPrompt = async () => {
    if (!promptType) return
    const mapped = promptType === 'outline'
      ? 'outlines'
      : promptType === 'manuscript'
        ? 'manuscript'
        : promptType === 'applications'
          ? 'applications'
          : promptType === 'illustrations'
            ? 'illustrations'
            : promptType === 'citations'
              ? 'citations'
              : promptType === 'study-report'
                ? 'study-report'
                : 'questions'
    setPromptModalOpen(false)
    await handleGenerate(mapped, promptText)
  }

  const sectionNavButton = (key: typeof activeSection, label: string) => (
    <button
      key={key}
      onClick={() => {
        setActiveSection(key)
        setRailOpen(false)
      }}
      className={
        activeSection === key
          ? 'cyber-button text-xs px-3 py-2 rounded-xl w-full text-left'
          : 'cyber-outline text-xs px-3 py-2 rounded-xl w-full text-left'
      }
    >
      {label}
    </button>
  )

  const latestDnaAnalysis = workspace?.dnaAnalyses?.[0] || null
  const latestManuscriptText = String(workspace?.manuscripts?.[0]?.content?.text || '')
  const latestOutline = workspace?.outlines?.find((o: any) => o.isSelected) || workspace?.outlines?.[0]
  const outlinePointsForDna = getOutlinePointNodes(latestOutline?.structure || {}).map((point: any) => String(point.title || '').trim()).filter(Boolean)
  const manuscriptWordCount = latestManuscriptText ? latestManuscriptText.split(/\s+/).filter(Boolean).length : 0
  const estimatedMinutesDna = manuscriptWordCount ? Math.max(1, Math.ceil(manuscriptWordCount / 145)) : 0
  const scriptureReferencesInManuscript = Array.from(
    new Set((latestManuscriptText.match(/\b(?:[1-3]\s*)?[A-Z][a-zA-Z]+\s+\d+:\d+(?:-\d+)?\b/g) || []).map((item) => item.trim())),
  )
  const paragraphCount = latestManuscriptText
    ? latestManuscriptText
        .split(/\n{2,}/)
        .map((item) => item.trim())
        .filter(Boolean).length
    : 0
  const explanationSignals = (latestManuscriptText.match(/\bporque\b|\bpor tanto\b|\btherefore\b|\bbecause\b|\besto significa\b/gi) || []).length
  const applicationSignals = (latestManuscriptText.match(/\bdebes\b|\bdebemos\b|\baplica\b|\bapplication\b|\byou should\b|\bvive\b/gi) || []).length
  const illustrationSignals = (latestManuscriptText.match(/\bilustraci[oó]n\b|\bhistoria\b|\bimagine\b|\bexample\b|\banalog[ií]a\b|\btestimonio\b/gi) || []).length
  const compositionTotal = Math.max(1, explanationSignals + applicationSignals + illustrationSignals)
  const explanationPct = Math.round((explanationSignals / compositionTotal) * 100)
  const applicationPct = Math.round((applicationSignals / compositionTotal) * 100)
  const illustrationPct = Math.max(0, 100 - explanationPct - applicationPct)
  const criticalIssuesCount = (dnaIntegrityReport?.issues || []).filter((item) => item.severity === 'critical').length
  const warningIssuesCount = (dnaIntegrityReport?.issues || []).filter((item) => item.severity === 'warning').length
  const passageAlignmentScore = dnaIntegrityReport?.pointAnalysis?.length
    ? Math.round(
        (dnaIntegrityReport.pointAnalysis.reduce(
          (sum, point) => sum + Math.max(0, Math.min(1, Number(point.supportScore) || 0)),
          0,
        ) /
          dnaIntegrityReport.pointAnalysis.length) *
          100,
      )
    : null
  const theologicalThemeCounts = (() => {
    const tags = Array.isArray(latestDnaAnalysis?.themes) ? latestDnaAnalysis.themes : []
    const counts: Record<string, number> = {}
    tags.forEach((theme: string) => {
      const key = String(theme || '').trim()
      if (!key) return
      counts[key] = (counts[key] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  })()
  const sermonType = (() => {
    const style = String(workspace?.style || '').toLowerCase()
    if (style.includes('narrative')) return 'Narrative'
    if (style.includes('topical')) return 'Topical'
    if (style.includes('devotional')) return 'Devotional'
    return 'Expository'
  })()

  const renderRail = () => (
    <div className="flex flex-col gap-4">
      {/* Progress Indicator */}
      <ProgressIndicator progress={progress} />
      
      {/* Next Step Suggestion */}
      <NextStepSuggestion 
        progress={progress}
        onAction={handleNextStepAction}
      />
      
      <div className="cyber-panel rounded-2xl p-4 space-y-3">
        <p className="text-xs uppercase tracking-widest cyber-muted">Workspace</p>
        <h2 className="text-xl font-semibold text-white">{workspace.title}</h2>
        <p className="text-sm text-cyan-200/80">{workspace.mainPassage}</p>
        <div className="flex items-center gap-2">
          <span className="cyber-tag">{workspace.status}</span>
          <button
            onClick={() => {
              setActiveSection('workspace')
              setRailOpen(false)
            }}
            className="cyber-outline text-xs px-3 py-1 rounded-full"
          >
            Details
          </button>
        </div>
        <p className="text-xs cyber-muted">Language: {workspace.language || 'en'}</p>
      </div>

      <div className="cyber-panel rounded-2xl p-4 space-y-2">
        {sectionNavButton('workspace', 'Workspace')}
        {sectionNavButton('outlines', 'Outlines')}
        {sectionNavButton('manuscript', 'Manuscript')}
        {sectionNavButton('applications', 'Applications')}
        {sectionNavButton('questions', 'Questions')}
        {sectionNavButton('illustrations', 'Illustrations')}
        {sectionNavButton('citations', 'Citations')}
        {sectionNavButton('scripture', 'Scripture')}
        {sectionNavButton('word-study', 'Word Study')}
        {sectionNavButton('cross-references', 'Cross References')}
        {sectionNavButton('study-report', 'Study Report')}
        {sectionNavButton('coach', 'Socratic Coach')}
        {sectionNavButton('dna', 'Sermon DNA')}
        {sectionNavButton('visualizations', 'Visualizations')}
        {sectionNavButton('media', 'Media')}
      </div>
    </div>
  )

  const handleWorkspaceSave = async () => {
    const config = withToken()
    if (!config || !workspaceDraft) return
    setActionLoading((prev) => (prev.includes('workspace') ? prev : [...prev, 'workspace']))
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`,
        {
          title: workspaceDraft.title,
          seriesTitle: workspaceDraft.seriesTitle,
          mainPassage: workspaceDraft.mainPassage,
          additionalPassages: workspaceDraft.additionalPassages,
          theme: workspaceDraft.theme,
          audienceProfile: workspaceDraft.audienceProfile,
          sermonGoals: workspaceDraft.sermonGoals,
          theologicalLens: workspaceDraft.theologicalLens,
          style: workspaceDraft.style,
          storyArc: workspaceDraft.storyArc,
          language: workspaceDraft.language,
          includeEGW: workspaceDraft.includeEGW,
        },
        config,
      )
      const refreshed = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`, config)
      setWorkspace(refreshed.data)
      setWorkspaceDraft(refreshed.data)
      setEditingWorkspace(false)
    } catch (err) {
      console.error('Failed to update workspace', err)
      setError('Unable to save workspace changes.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'workspace'))
    }
  }

  const handleOutlineSave = async () => {
    const config = withToken()
    if (!config || !outlineDraft) return
    setActionLoading((prev) => (prev.includes('outline-edit') ? prev : [...prev, 'outline-edit']))
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/outlines/${outlineDraft.id}`,
        {
          title: outlineDraft.title,
          structure: {
            introduction: outlineDraft.introduction,
            points: outlineDraft.points,
            conclusion: outlineDraft.conclusion,
            callToAction: outlineDraft.callToAction,
          },
        },
        config,
      )
      const refreshed = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`, config)
      setWorkspace(refreshed.data)
      setEditingOutlineId(null)
      setOutlineDraft(null)
    } catch (err) {
      console.error('Failed to update outline', err)
      setError('Unable to save outline changes.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'outline-edit'))
    }
  }

  const handleManuscriptSave = async (id: string) => {
    const config = withToken()
    if (!config) return
    setActionLoading((prev) => (prev.includes('manuscript-edit') ? prev : [...prev, 'manuscript-edit']))
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/manuscripts/${id}`,
        { content: { text: manuscriptDraft } },
        config,
      )
      const refreshed = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`, config)
      setWorkspace(refreshed.data)
      setEditingManuscriptId(null)
      setManuscriptDraft('')
    } catch (err) {
      console.error('Failed to update manuscript', err)
      setError('Unable to save manuscript changes.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'manuscript-edit'))
    }
  }

  const handleApplicationSave = async (id: string) => {
    const config = withToken()
    if (!config) return
    setActionLoading((prev) => (prev.includes('application-edit') ? prev : [...prev, 'application-edit']))
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/applications/${id}`,
        { content: applicationDraft },
        config,
      )
      const refreshed = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`, config)
      setWorkspace(refreshed.data)
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
    setActionLoading((prev) => (prev.includes('question-edit') ? prev : [...prev, 'question-edit']))
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/discussion-questions/${id}`,
        { question: questionDraft },
        config,
      )
      const refreshed = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`, config)
      setWorkspace(refreshed.data)
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
    setActionLoading((prev) => (prev.includes('illustration-edit') ? prev : [...prev, 'illustration-edit']))
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/illustrations/${illustrationDraft.id}`,
        {
          title: illustrationDraft.title,
          content: illustrationDraft.content,
          source: illustrationDraft.source,
        },
        config,
      )
      const refreshed = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`, config)
      setWorkspace(refreshed.data)
      setEditingIllustrationId(null)
      setIllustrationDraft(null)
    } catch (err) {
      console.error('Failed to update illustration', err)
      setError('Unable to save illustration changes.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'illustration-edit'))
    }
  }

  const handleCitationSave = async () => {
    const config = withToken()
    if (!config || !citationDraft) return
    setActionLoading((prev) => (prev.includes('citation-edit') ? prev : [...prev, 'citation-edit']))
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/citations/${citationDraft.id}`,
        {
          statement: citationDraft.statement,
          verseReferences: citationDraft.verseReferences
            ? citationDraft.verseReferences.split(',').map((item: string) => item.trim()).filter(Boolean)
            : [],
        },
        config,
      )
      const refreshed = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}`, config)
      setWorkspace(refreshed.data)
      setEditingCitationId(null)
      setCitationDraft(null)
    } catch (err) {
      console.error('Failed to update citation', err)
      setError('Unable to save citation changes.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'citation-edit'))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Workspace not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-black/40 backdrop-blur border-b border-white/10">
        <div className="container mx-auto px-1 py-4 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">Clever Sermon</p>
            <h1 className="text-2xl font-bold text-white">Workspace Core</h1>
          </div>
          <div className="w-full lg:w-auto lg:flex-1 lg:max-w-2xl">
            <div className="flex items-center gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
                placeholder="Global search (full text): notes, workspaces, outlines, manuscripts..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
              />
              <button
                onClick={handleSearch}
                disabled={actionLoading.includes('search')}
                className="cyber-outline text-xs px-3 py-2 rounded-full disabled:opacity-60"
              >
                {actionLoading.includes('search') ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs cyber-outline px-4 py-2 rounded-full"
          >
            Back to dashboard
          </button>
        </div>
      </nav>

      {/* Phase Navigation */}
      <PhaseNavigation 
        activePhase={activePhase}
        onPhaseChange={handlePhaseChange}
        progress={progress}
      />

      <div className="container mx-auto px-1 py-6">
        {searchQuery.trim().length > 0 && (
          <div className="cyber-panel rounded-2xl p-4 mb-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-cyan-200/90">Global results for “{searchQuery.trim()}”</p>
              {searchResults.length > 0 && (
                <span className="text-xs uppercase tracking-widest text-cyan-200/70">{searchResults.length} result(s)</span>
              )}
            </div>
            {searchResults.length ? (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {searchResults.map((item: any) => (
                  <button
                    type="button"
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSearchResultSelect(item)}
                    className="w-full text-left border border-white/10 rounded-xl p-3 bg-black/30 hover:border-cyan-400/40 transition-colors"
                  >
                    <p className="text-[10px] uppercase tracking-widest cyber-muted">{item.type}</p>
                    <p className="text-sm text-gray-100/90 font-semibold">{item.title}</p>
                    {item.snippet && <p className="text-xs text-gray-200/80 mt-1">{item.snippet}</p>}
                  </button>
                ))}
              </div>
            ) : (
              !actionLoading.includes('search') && <p className="text-xs text-gray-200/80">No search results yet.</p>
            )}
          </div>
        )}
        <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
          <aside className="hidden lg:block">{renderRail()}</aside>
          <div className="space-y-6">
            <div className="flex items-center justify-between lg:hidden">
              <button
                onClick={() => setRailOpen(true)}
                className="cyber-outline px-4 py-2 text-xs rounded-full"
              >
                Open Command Rail
              </button>
              <span className="cyber-tag">{workspace.status}</span>
            </div>

            <div className="cyber-panel rounded-2xl relative overflow-hidden">
              <div className="p-6">
              {activeSection === 'workspace' && (
                <div className="space-y-6 min-h-full">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      {editingWorkspace ? (
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-widest cyber-muted">Title</label>
                          <input
                            value={workspaceDraft?.title || ''}
                            onChange={(e) => setWorkspaceDraft({ ...workspaceDraft, title: e.target.value })}
                            className="w-full text-3xl font-bold mb-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                          />
                        </div>
                      ) : (
                        <h2 className="text-3xl font-bold mb-2">{workspace.title}</h2>
                      )}
                      {editingWorkspace ? (
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-widest cyber-muted">Main Passage</label>
                          <input
                            value={workspaceDraft?.mainPassage || ''}
                            onChange={(e) => setWorkspaceDraft({ ...workspaceDraft, mainPassage: e.target.value })}
                            className="w-full text-cyan-200/80 bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                          />
                        </div>
                      ) : (
                        <p className="text-cyan-200/80">{workspace.mainPassage}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="cyber-tag">{workspace.status}</span>
                      <button
                        onClick={() => {
                          if (editingWorkspace) {
                            setEditingWorkspace(false)
                            setWorkspaceDraft(workspace)
                          } else {
                            setEditingWorkspace(true)
                          }
                        }}
                        className="cyber-outline px-3 py-2 text-xs rounded-full"
                      >
                        {editingWorkspace ? 'Cancel' : 'Edit'}
                      </button>
                      {editingWorkspace && (
                        <button
                          onClick={handleWorkspaceSave}
                          className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60"
                          disabled={actionLoading.includes('workspace')}
                        >
                          {actionLoading.includes('workspace') ? 'Saving...' : 'Save'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm text-gray-200/80">
                    <div>
                      {editingWorkspace ? (
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-widest cyber-muted">Series Title</label>
                          <input
                            value={workspaceDraft?.seriesTitle || ''}
                            onChange={(e) => setWorkspaceDraft({ ...workspaceDraft, seriesTitle: e.target.value })}
                            placeholder="Series"
                            className="w-full mb-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                          />
                        </div>
                      ) : (
                        <p><span className="font-semibold text-cyan-300">Series:</span> {workspace.seriesTitle || '—'}</p>
                      )}
                      {editingWorkspace ? (
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-widest cyber-muted">Theme</label>
                          <input
                            value={workspaceDraft?.theme || ''}
                            onChange={(e) => setWorkspaceDraft({ ...workspaceDraft, theme: e.target.value })}
                            placeholder="Theme"
                            className="w-full mb-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                          />
                        </div>
                      ) : (
                        <p><span className="font-semibold text-cyan-300">Theme:</span> {workspace.theme || '—'}</p>
                      )}
                      {editingWorkspace ? (
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-widest cyber-muted">Audience Profile</label>
                          <input
                            value={workspaceDraft?.audienceProfile || ''}
                            onChange={(e) => setWorkspaceDraft({ ...workspaceDraft, audienceProfile: e.target.value })}
                            placeholder="Audience"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                          />
                        </div>
                      ) : (
                        <p><span className="font-semibold text-cyan-300">Audience:</span> {workspace.audienceProfile || '—'}</p>
                      )}
                      {editingWorkspace ? (
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-widest cyber-muted">Theological Lens</label>
                          <select
                            value={workspaceDraft?.theologicalLens || ''}
                            onChange={(e) => setWorkspaceDraft({ ...workspaceDraft, theologicalLens: e.target.value })}
                            className="w-full mb-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                          >
                            <option value="">Lens</option>
                            <option value="devotional">Devotional</option>
                            <option value="pastoral">Pastoral</option>
                            <option value="academic">Academic</option>
                            <option value="conservative">Conservative</option>
                            <option value="historical-critical">Historical-critical</option>
                          </select>
                        </div>
                      ) : (
                        <p><span className="font-semibold text-cyan-300">Lens:</span> {workspace.theologicalLens || '—'}</p>
                      )}
                      {editingWorkspace && (
                        <StoryArcSelector
                          value={workspaceDraft?.storyArc || ''}
                          onChange={(arc) => setWorkspaceDraft({ ...workspaceDraft, storyArc: arc })}
                          className="mt-4"
                        />
                      )}
                      {!editingWorkspace && workspace.storyArc && (
                        <p><span className="font-semibold text-cyan-300">Story Arc:</span> {storyArcLabels[workspace.storyArc] || workspace.storyArc}</p>
                      )}
                      {editingWorkspace && (
                        <div className="mt-4">
                          <WorkspaceEGWToggle
                            includeEGW={workspaceDraft?.includeEGW ?? true}
                            onToggle={(value: boolean) => setWorkspaceDraft({ ...workspaceDraft, includeEGW: value })}
                          />
                        </div>
                      )}
                      {!editingWorkspace && (
                        <p><span className="font-semibold text-cyan-300">Include EGW:</span> {workspace.includeEGW !== false ? 'Yes' : 'No'}</p>
                      )}
                    </div>
                    <div>
                      {editingWorkspace ? (
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-widest cyber-muted">Style</label>
                          <select
                            value={workspaceDraft?.style || ''}
                            onChange={(e) => setWorkspaceDraft({ ...workspaceDraft, style: e.target.value })}
                            className="w-full mb-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                          >
                            <option value="">Style</option>
                            <option value="expository">Expository</option>
                            <option value="topical">Topical</option>
                            <option value="narrative">Narrative</option>
                            <option value="apologetic">Apologetic</option>
                            <option value="devotional">Devotional</option>
                          </select>
                        </div>
                      ) : (
                        <p>
                          <span className="font-semibold text-cyan-300">Style:</span>{' '}
                          {styleLabels[workspace.style] || workspace.style || '—'}
                        </p>
                      )}
                      {editingWorkspace ? (
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-widest cyber-muted">Story Arc</label>
                          <select
                            value={workspaceDraft?.storyArc || ''}
                            onChange={(e) => setWorkspaceDraft({ ...workspaceDraft, storyArc: e.target.value })}
                            className="w-full mb-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                          >
                            <option value="">Story Arc</option>
                            <option value="problem_truth_response">Problem → Truth → Response</option>
                            <option value="tension_turn_resolution">Tension → Turn → Resolution</option>
                            <option value="question_discovery_answer">Question → Discovery → Answer</option>
                            <option value="challenge_journey_transformation">Challenge → Journey → Transformation</option>
                          </select>
                        </div>
                      ) : (
                        <p>
                          <span className="font-semibold text-cyan-300">Story Arc:</span>{' '}
                          {storyArcLabels[workspace.storyArc] || workspace.storyArc || '—'}
                        </p>
                      )}
                      {editingWorkspace ? (
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-widest cyber-muted">Language</label>
                          <select
                            value={workspaceDraft?.language || 'en'}
                            onChange={(e) => setWorkspaceDraft({ ...workspaceDraft, language: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                          >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                          </select>
                        </div>
                      ) : (
                        <p><span className="font-semibold text-cyan-300">Language:</span> {workspace.language || 'en'}</p>
                      )}
                      <p><span className="font-semibold text-cyan-300">Created:</span> {new Date(workspace.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                      <h3 className="text-xl font-semibold mb-3">Sermon Goals</h3>
                      {editingWorkspace ? (
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-widest cyber-muted">Sermon Goals</label>
                          <textarea
                            value={workspaceDraft?.sermonGoals || ''}
                            onChange={(e) => setWorkspaceDraft({ ...workspaceDraft, sermonGoals: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-gray-100/90"
                            rows={4}
                          />
                        </div>
                      ) : (
                        <p className="text-gray-100/90">{workspace.sermonGoals || 'No goals set yet.'}</p>
                      )}
                    </div>
                    <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                      <h3 className="text-xl font-semibold mb-3">Additional Passages</h3>
                      {editingWorkspace ? (
                        <div className="space-y-2">
                          <label className="text-xs uppercase tracking-widest cyber-muted">Additional Passages</label>
                          <textarea
                            value={(workspaceDraft?.additionalPassages || []).join('\n')}
                            onChange={(e) =>
                              setWorkspaceDraft({
                                ...workspaceDraft,
                                additionalPassages: e.target.value
                                  .split(/\n|,/)
                                  .map((item) => item.trim())
                                  .filter(Boolean),
                              })
                            }
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-gray-100/90"
                            rows={4}
                          />
                        </div>
                      ) : workspace.additionalPassages?.length ? (
                        <ul className="list-disc list-inside text-gray-100/90">
                          {workspace.additionalPassages.map((passage: string) => (
                            <li key={passage}>{passage}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-100/90">No additional passages.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'outlines' && (
                <div className="space-y-4 relative min-h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">Outlines</h3>
                      {workspace?.egwEnabled && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/40 flex items-center gap-1">
                          <Book className="w-3 h-3" />
                          EGW Enabled
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openPromptEditor('outline')}
                        className="cyber-outline text-xs px-4 py-2 rounded-full"
                      >
                        Prompt
                      </button>
                      <button
                        onClick={() => handleGenerate('outlines')}
                        className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60"
                        disabled={actionLoading.includes('outlines')}
                      >
                        {actionLoading.includes('outlines') ? 'Generating...' : 'Generate'}
                      </button>
                    </div>
                  </div>
                  {workspace.outlines?.length ? (
                    <div className="space-y-4">
                      <div className="border border-cyan-400/30 rounded-xl p-4 bg-cyan-500/10">
                        <p className="text-[11px] uppercase tracking-widest text-cyan-200/80">Passage Focus</p>
                        <p className="text-sm text-cyan-100/95 mt-1">
                          {getPassageFocusText() || `${workspace.mainPassage} is the controlling passage for this sermon movement.`}
                        </p>
                      </div>
                      {[...workspace.outlines]
                        .sort((a: any, b: any) => Number(b?.isSelected) - Number(a?.isSelected))
                        .map((outline: any) => {
                          const pointNodes = getOutlinePointNodes(outline.structure)
                          const isExpanded = expandedOutlineId === outline.id || outline.isSelected
                          const totalMinutes = pointNodes.reduce((sum: number, point: any) => sum + estimatePointMinutes(point), 6)
                          const flowNarrativeEntries = getFlowNarrativeEntries(outline, pointNodes)
                          return (
                            <div
                              key={outline.id}
                              className={`border rounded-xl p-4 transition-all ${
                                outline.isSelected
                                  ? 'border-cyan-300/70 bg-cyan-500/10 ring-1 ring-cyan-300/60 shadow-[0_0_24px_rgba(34,211,238,0.22)]'
                                  : 'border-white/10 bg-black/30'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <p className="font-semibold text-cyan-300">{getOutlineTitle(outline)}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {outline.isSelected && <span className="cyber-tag">Selected • Active Build</span>}
                                    {outline?.structure?.outlineType && (
                                      <span className="text-[10px] px-2 py-1 rounded-full border border-white/20 text-gray-200/90 uppercase">
                                        {outline.structure.outlineType}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setExpandedOutlineId((prev) => (prev === outline.id ? null : outline.id))}
                                    className="cyber-outline px-3 py-1 text-xs rounded-full"
                                  >
                                    {isExpanded ? 'Collapse' : 'Expand'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingOutlineId(outline.id)
                                      setOutlineDraft({
                                        id: outline.id,
                                        title: outline.title,
                                        introduction: outline.structure?.introduction || '',
                                        points: outline.structure?.points || [],
                                        conclusion: outline.structure?.conclusion || '',
                                        callToAction: outline.structure?.callToAction || '',
                                      })
                                    }}
                                    className="cyber-outline px-3 py-1 text-xs rounded-full"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-3 mb-3">
                                <div className="grid md:grid-cols-12 gap-3">
                                  <div className="md:col-span-8 border border-white/10 rounded-xl p-3 bg-black/20">
                                    <p className="text-[10px] uppercase tracking-widest cyber-muted">Big Idea</p>
                                    <div className="mt-1">
                                      {renderCollapsibleMarkdown(getOutlineBigIdea(outline), `${outline.id}-bigidea`, 'max-h-20')}
                                    </div>
                                  </div>
                                  <div className="md:col-span-4 border border-white/10 rounded-xl p-3 bg-black/20">
                                    <p className="text-[10px] uppercase tracking-widest cyber-muted">Estimated Timing</p>
                                    <p className="text-sm text-gray-100/95 mt-1">{totalMinutes} minutes</p>
                                    <p className="text-xs text-gray-300 mt-1">Intro 3 • Body {Math.max(1, totalMinutes - 6)} • Conclusion 3</p>
                                  </div>
                                </div>
                                <div className="border border-white/10 rounded-xl p-3 bg-black/20">
                                  <p className="text-[10px] uppercase tracking-widest cyber-muted">Flow</p>
                                  <div className="mt-3 overflow-x-auto pb-1">
                                    <div className="flex items-stretch gap-2 min-w-max pr-1">
                                      {flowNarrativeEntries.map((entry: any, index: number) => (
                                        <div key={`${outline.id}-flow-detail-${entry.id}`} className="flex items-stretch gap-2">
                                          <div className="w-72 border border-cyan-400/20 rounded-lg p-3 bg-cyan-500/5">
                                            <p className="text-[10px] uppercase tracking-widest text-cyan-300/90">{entry.label}</p>
                                            <p className="text-sm text-cyan-100 font-medium mt-1 leading-relaxed">{entry.title}</p>
                                            <div className="mt-2 text-xs">
                                              {renderCollapsibleMarkdown(
                                                entry.detail,
                                                `${outline.id}-flow-detail-${entry.id}`,
                                                'max-h-20'
                                              )}
                                            </div>
                                          </div>
                                          {index < flowNarrativeEntries.length - 1 && (
                                            <div className="flex items-center text-cyan-300/80 px-1 text-lg">→</div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {editingOutlineId === outline.id && outlineDraft ? (
                                <div className="space-y-3">
                                  <label className="text-xs uppercase tracking-widest cyber-muted">Outline Title</label>
                                  <input
                                    value={outlineDraft.title}
                                    onChange={(e) => setOutlineDraft({ ...outlineDraft, title: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                                  />
                                  <label className="text-xs uppercase tracking-widest cyber-muted">Introduction</label>
                                  <textarea
                                    value={outlineDraft.introduction}
                                    onChange={(e) => setOutlineDraft({ ...outlineDraft, introduction: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                                    rows={2}
                                  />
                                  <label className="text-xs uppercase tracking-widest cyber-muted">Main Points (one per line)</label>
                                  <textarea
                                    value={outlineDraft.points?.join('\n')}
                                    onChange={(e) => setOutlineDraft({ ...outlineDraft, points: e.target.value.split('\n').filter(Boolean) })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                                    rows={4}
                                  />
                                  <label className="text-xs uppercase tracking-widest cyber-muted">Conclusion</label>
                                  <textarea
                                    value={outlineDraft.conclusion}
                                    onChange={(e) => setOutlineDraft({ ...outlineDraft, conclusion: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                                    rows={2}
                                  />
                                  <label className="text-xs uppercase tracking-widest cyber-muted">Call To Action</label>
                                  <textarea
                                    value={outlineDraft.callToAction}
                                    onChange={(e) => setOutlineDraft({ ...outlineDraft, callToAction: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={handleOutlineSave}
                                      className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60"
                                      disabled={actionLoading.includes('outline-edit')}
                                    >
                                      {actionLoading.includes('outline-edit') ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingOutlineId(null)
                                        setOutlineDraft(null)
                                      }}
                                      className="cyber-outline text-xs px-4 py-2 rounded-full"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : isExpanded ? (
                                <div className="text-sm text-gray-100/90 space-y-3">
                                  {pointNodes.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-xs uppercase tracking-widest cyber-muted">Main Points</p>
                                      {pointNodes.map((point: any, index: number) => {
                                        const relatedApplications = getRelatedApplicationsForPoint(point)
                                        const supportingVerses = Array.isArray(point.supportingVerses) ? point.supportingVerses : []
                                        return (
                                          <div key={`${outline.id}-point-${index}`} className="border border-white/10 rounded-xl p-3 bg-black/20">
                                            <p className="font-semibold text-white leading-relaxed">
                                              {index + 1}. {point.title}
                                            </p>
                                            {(point.summary || point.movement) && (
                                              <div className="mt-2 border border-cyan-400/20 rounded-lg p-2 bg-cyan-500/5">
                                                <p className="text-[10px] uppercase tracking-widest text-cyan-300/90">Preaching Insight</p>
                                                {renderCollapsibleMarkdown(
                                                  point.summary || point.movement,
                                                  `${outline.id}-${index}-insight`,
                                                  'max-h-20'
                                                )}
                                              </div>
                                            )}

                                            <div className="flex flex-wrap gap-1 mt-2">
                                              <button onClick={() => togglePointSection(outline.id, index, 'subpoints')} className="cyber-outline text-[10px] px-2 py-1 rounded-full">Subpoints</button>
                                              <button onClick={() => togglePointSection(outline.id, index, 'verses')} className="cyber-outline text-[10px] px-2 py-1 rounded-full">Verses</button>
                                              <button onClick={() => togglePointSection(outline.id, index, 'themes')} className="cyber-outline text-[10px] px-2 py-1 rounded-full">Themes</button>
                                              <button onClick={() => togglePointSection(outline.id, index, 'apps')} className="cyber-outline text-[10px] px-2 py-1 rounded-full">Applications</button>
                                              <button onClick={() => togglePointSection(outline.id, index, 'media')} className="cyber-outline text-[10px] px-2 py-1 rounded-full">Media</button>
                                              <button onClick={() => togglePointSection(outline.id, index, 'egw')} className="cyber-outline text-[10px] px-2 py-1 rounded-full">EGW</button>
                                            </div>

                                            {isPointSectionExpanded(outline.id, index, 'subpoints') && (
                                              <div className="mt-3">
                                                {renderCompactList(
                                                  point.subpoints,
                                                  `${outline.id}-${index}-subpoints`,
                                                  'No subpoints available.',
                                                  'text-gray-200'
                                                )}
                                              </div>
                                            )}

                                            {isPointSectionExpanded(outline.id, index, 'verses') && (
                                              <div className="mt-2">
                                                {supportingVerses.length ? (
                                                  <div className="flex flex-wrap gap-2">
                                                    {supportingVerses.map((verse: string) => (
                                                      <button
                                                        key={`${outline.id}-${index}-${verse}`}
                                                        onClick={() => {
                                                          setVerseEvidencePanel({
                                                            outlineId: outline.id,
                                                            pointTitle: point.title,
                                                            verse,
                                                            text: getVerseEvidenceText(verse),
                                                            reason: point.summary || point.movement || 'This verse reinforces the point through direct thematic support.',
                                                          })
                                                          handleVerseClick(verse)
                                                        }}
                                                        className="text-xs px-2 py-1 rounded-full border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/10"
                                                      >
                                                        {verse}
                                                      </button>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  <p className="text-xs text-gray-300">No supporting verses attached.</p>
                                                )}
                                              </div>
                                            )}

                                            {isPointSectionExpanded(outline.id, index, 'themes') && (
                                              <div className="mt-3">
                                                {renderCompactList(
                                                  point.canonicalThemes,
                                                  `${outline.id}-${index}-themes`,
                                                  'No canonical themes attached.',
                                                  'text-emerald-200'
                                                )}
                                              </div>
                                            )}

                                            {isPointSectionExpanded(outline.id, index, 'apps') && (
                                              <div className="mt-3">
                                                {relatedApplications.length ? (
                                                  renderCompactList(
                                                    relatedApplications.map((app: any) => app?.content),
                                                    `${outline.id}-${index}-apps`,
                                                    'No related applications found in current Applications tab.',
                                                    'text-amber-200'
                                                  )
                                                ) : (
                                                  <p className="text-xs text-gray-300">No related applications found in current Applications tab.</p>
                                                )}
                                              </div>
                                            )}

                                            {isPointSectionExpanded(outline.id, index, 'media') && (
                                              <div className="mt-3">
                                                {renderCompactList(
                                                  point.mediaSuggestions,
                                                  `${outline.id}-${index}-media`,
                                                  'No media ideas available.',
                                                  'text-violet-200'
                                                )}
                                              </div>
                                            )}

                                            {isPointSectionExpanded(outline.id, index, 'egw') && (
                                              <div className="mt-2">
                                                <OutlinePointEGWSupport
                                                  point={point.title || point.content || point}
                                                  supportingVerses={supportingVerses}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-300">Collapsed. Expand to view full structure.</p>
                              )}
                            </div>
                          )
                        })}
                      {verseEvidencePanel && (
                        <div className="border border-cyan-400/30 rounded-xl p-4 bg-cyan-500/10">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-cyan-200">Verse Evidence</p>
                            <button onClick={() => setVerseEvidencePanel(null)} className="cyber-outline text-xs px-3 py-1 rounded-full">Close</button>
                          </div>
                          <p className="text-xs text-cyan-100/90 mt-1">{verseEvidencePanel.verse} • {verseEvidencePanel.pointTitle}</p>
                          <p className="text-sm text-gray-100/95 mt-2">
                            {verseEvidencePanel.text || 'Verse text not available in the current scripture cache.'}
                          </p>
                          <p className="text-xs text-cyan-200/85 mt-2">Why it supports this point: {verseEvidencePanel.reason}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-100/90">No outlines yet.</p>
                  )}
                </div>
              )}

          {activeSection === 'manuscript' && (
            <div className="space-y-4 relative min-h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">Manuscript</h3>
                  {workspace?.egwEnabled && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/40 flex items-center gap-1">
                      <Book className="w-3 h-3" />
                      EGW Enabled
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPromptEditor('manuscript')}
                    className="cyber-outline text-xs px-4 py-2 rounded-full"
                  >
                    Prompt
                  </button>
                  <button
                    onClick={() => handleGenerate('manuscript')}
                    className="cyber-button-secondary text-xs px-4 py-2 rounded-full disabled:opacity-60"
                    disabled={actionLoading.includes('manuscript')}
                  >
                    {actionLoading.includes('manuscript') ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
              <div className="border border-white/10 rounded-xl p-4 bg-black/30 space-y-3">
                <p className="text-xs uppercase tracking-widest cyber-muted">Generation Controls</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="text-xs cyber-muted space-y-1">
                    <span>Tone</span>
                    <select
                      value={manuscriptTone}
                      onChange={(e) => setManuscriptTone(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-100"
                    >
                      <option value="teaching">Teaching</option>
                      <option value="pastoral">Pastoral</option>
                      <option value="evangelistic">Evangelistic</option>
                      <option value="storytelling">Storytelling</option>
                      <option value="motivational">Motivational</option>
                    </select>
                  </label>
                  <label className="text-xs cyber-muted space-y-1">
                    <span>Length</span>
                    <select
                      value={manuscriptTargetMinutes}
                      onChange={(e) => setManuscriptTargetMinutes(Number(e.target.value) || 22)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-100"
                    >
                      <option value={10}>10 minutes</option>
                      <option value={20}>20 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={40}>40 minutes</option>
                    </select>
                  </label>
                  <label className="text-xs cyber-muted space-y-1">
                    <span>Format</span>
                    <select
                      value={manuscriptFormat}
                      onChange={(e) => setManuscriptFormat((e.target.value as 'full' | 'notes') || 'full')}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-100"
                    >
                      <option value="full">Full Manuscript</option>
                      <option value="notes">Preaching Notes</option>
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="text-xs cyber-muted space-y-1">
                    <span>Audience Focus</span>
                    <select
                      value={manuscriptAudienceMode}
                      onChange={(e) => setManuscriptAudienceMode(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-100"
                    >
                      <option value="default">Use Workspace Audience</option>
                      <option value="youth">Youth</option>
                      <option value="families">Families</option>
                      <option value="evangelistic meeting">Evangelistic Meeting</option>
                      <option value="bible study group">Bible Study Group</option>
                      <option value="conference congregation">Conference Sermon</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-xs cyber-muted">
                    <input
                      type="checkbox"
                      checked={manuscriptIncludeSlideCues}
                      onChange={(e) => setManuscriptIncludeSlideCues(e.target.checked)}
                    />
                    Include slide cues (`[Slide]`)
                  </label>
                  <label className="flex items-center gap-2 text-xs cyber-muted">
                    <input
                      type="checkbox"
                      checked={manuscriptIncludeKeyLines}
                      onChange={(e) => setManuscriptIncludeKeyLines(e.target.checked)}
                    />
                    Highlight key lines (`[Key Line]`)
                  </label>
                </div>
              </div>
              {workspace.manuscripts?.length ? (
                <div className="space-y-4">
                  {workspace.manuscripts.map((manuscript: any) => (
                    <div key={manuscript.id} className="border border-white/10 rounded-xl p-4 bg-black/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-widest cyber-muted">Word Count: {manuscript.wordCount || '—'}</p>
                          <p className="text-xs uppercase tracking-widest cyber-muted">Estimated Time: {manuscript.estimatedMinutes || '—'} min</p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingManuscriptId(manuscript.id)
                            setManuscriptDraft(manuscript.content?.text || '')
                          }}
                          className="cyber-outline px-3 py-1 text-xs rounded-full"
                        >
                          Edit
                        </button>
                      </div>
                      {editingManuscriptId === manuscript.id ? (
                        <div className="space-y-3">
                          <label className="text-xs uppercase tracking-widest cyber-muted">Manuscript Text</label>
                          <textarea
                            value={manuscriptDraft}
                            onChange={(e) => setManuscriptDraft(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                            rows={8}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleManuscriptSave(manuscript.id)}
                              className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60"
                              disabled={actionLoading.includes('manuscript-edit')}
                            >
                              {actionLoading.includes('manuscript-edit') ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingManuscriptId(null)
                                setManuscriptDraft('')
                              }}
                              className="cyber-outline text-xs px-4 py-2 rounded-full"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        renderMarkdown(manuscript.content?.text || '')
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-100/90">No manuscript yet.</p>
              )}
            </div>
          )}

          {activeSection === 'applications' && (
            <div className="space-y-4 relative min-h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">Applications</h3>
                  {workspace?.egwEnabled && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/40 flex items-center gap-1">
                      <Book className="w-3 h-3" />
                      EGW Enabled
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPromptEditor('applications')}
                    className="cyber-outline text-xs px-4 py-2 rounded-full"
                  >
                    Prompt
                  </button>
                  <button
                    onClick={() => handleGenerate('applications')}
                    className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60"
                    disabled={actionLoading.includes('applications')}
                  >
                    {actionLoading.includes('applications') ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
              {workspace.applications?.length ? (
                <ul className="space-y-3 text-gray-100/90">
                  {workspace.applications.map((app: any) => (
                    <li key={app.id} className="border border-white/10 rounded-xl p-4 bg-black/30">
                      <div className="flex items-center justify-between">
                        <span className="cyber-tag">{app.audienceType}</span>
                        <button
                          onClick={() => {
                            setEditingApplicationId(app.id)
                            setApplicationDraft(app.content)
                          }}
                          className="cyber-outline px-3 py-1 text-xs rounded-full"
                        >
                          Edit
                        </button>
                      </div>
                      {editingApplicationId === app.id ? (
                        <div className="space-y-3 mt-3">
                          <label className="text-xs uppercase tracking-widest cyber-muted">Application Text</label>
                          <textarea
                            value={applicationDraft}
                            onChange={(e) => setApplicationDraft(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApplicationSave(app.id)}
                              className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60"
                              disabled={actionLoading.includes('application-edit')}
                            >
                              {actionLoading.includes('application-edit') ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingApplicationId(null)
                                setApplicationDraft('')
                              }}
                              className="cyber-outline text-xs px-4 py-2 rounded-full"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2">{renderMarkdown(app.content)}</div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-100/90">No applications yet.</p>
              )}
            </div>
          )}

          {activeSection === 'questions' && (
            <div className="space-y-4 relative min-h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Discussion Questions</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPromptEditor('questions')}
                    className="cyber-outline text-xs px-4 py-2 rounded-full"
                  >
                    Prompt
                  </button>
                  <button
                    onClick={() => handleGenerate('questions')}
                    className="cyber-button-secondary text-xs px-4 py-2 rounded-full disabled:opacity-60"
                    disabled={actionLoading.includes('questions')}
                  >
                    {actionLoading.includes('questions') ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
              {workspace.discussionQuestions?.length ? (
                <ul className="space-y-3 text-gray-100/90">
                  {workspace.discussionQuestions.map((q: any) => (
                    <li key={q.id} className="border border-white/10 rounded-xl p-4 bg-black/30">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">{renderMarkdown(q.question)}</div>
                        <button
                          onClick={() => {
                            setEditingQuestionId(q.id)
                            setQuestionDraft(q.question)
                          }}
                          className="cyber-outline px-3 py-1 text-xs rounded-full"
                        >
                          Edit
                        </button>
                      </div>
                      {editingQuestionId === q.id && (
                        <div className="space-y-3 mt-3">
                          <label className="text-xs uppercase tracking-widest cyber-muted">Question</label>
                          <textarea
                            value={questionDraft}
                            onChange={(e) => setQuestionDraft(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleQuestionSave(q.id)}
                              className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60"
                              disabled={actionLoading.includes('question-edit')}
                            >
                              {actionLoading.includes('question-edit') ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingQuestionId(null)
                                setQuestionDraft('')
                              }}
                              className="cyber-outline text-xs px-4 py-2 rounded-full"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-100/90">No questions yet.</p>
              )}
            </div>
          )}

          {activeSection === 'illustrations' && (
            <div className="space-y-4 relative min-h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Illustrations</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPromptEditor('illustrations')}
                    className="cyber-outline text-xs px-4 py-2 rounded-full"
                  >
                    Prompt
                  </button>
                  <button
                    onClick={() => handleGenerate('illustrations')}
                    className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60"
                    disabled={actionLoading.includes('illustrations')}
                  >
                    {actionLoading.includes('illustrations') ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
              {workspace.illustrations?.length ? (
                <ul className="space-y-3 text-gray-100/90">
                  {workspace.illustrations.map((ill: any) => (
                    <li key={ill.id} className="border border-white/10 rounded-xl p-4 bg-black/30">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{ill.title || 'Illustration'}</p>
                        <button
                          onClick={() => {
                            setEditingIllustrationId(ill.id)
                            setIllustrationDraft({ id: ill.id, title: ill.title || '', content: ill.content || '', source: ill.source || '' })
                          }}
                          className="cyber-outline px-3 py-1 text-xs rounded-full"
                        >
                          Edit
                        </button>
                      </div>
                      {editingIllustrationId === ill.id && illustrationDraft ? (
                        <div className="space-y-3 mt-3">
                          <label className="text-xs uppercase tracking-widest cyber-muted">Illustration Title</label>
                          <input
                            value={illustrationDraft.title}
                            onChange={(e) => setIllustrationDraft({ ...illustrationDraft, title: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                          />
                          <label className="text-xs uppercase tracking-widest cyber-muted">Illustration Content</label>
                          <textarea
                            value={illustrationDraft.content}
                            onChange={(e) => setIllustrationDraft({ ...illustrationDraft, content: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                            rows={3}
                          />
                          <label className="text-xs uppercase tracking-widest cyber-muted">Source</label>
                          <input
                            value={illustrationDraft.source}
                            onChange={(e) => setIllustrationDraft({ ...illustrationDraft, source: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleIllustrationSave}
                              className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60"
                              disabled={actionLoading.includes('illustration-edit')}
                            >
                              {actionLoading.includes('illustration-edit') ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingIllustrationId(null)
                                setIllustrationDraft(null)
                              }}
                              className="cyber-outline text-xs px-4 py-2 rounded-full"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="mt-1">{renderMarkdown(ill.content)}</div>
                          {ill.source && (
                            <p className="text-xs cyber-muted mt-2">Source: {ill.source}</p>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-100/90">No illustrations yet.</p>
              )}
            </div>
          )}

          {activeSection === 'citations' && (
            <div className="space-y-4 relative min-h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Citations</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={citationTranslation}
                    onChange={(e) => setCitationTranslation(e.target.value.toUpperCase())}
                    className="cyber-outline text-xs px-3 py-2 rounded-full"
                  >
                    <option value="KJV">KJV</option>
                    <option value="WEB">WEB</option>
                  </select>
                  <button
                    onClick={() => openPromptEditor('citations')}
                    className="cyber-outline text-xs px-4 py-2 rounded-full"
                  >
                    Prompt
                  </button>
                  <button
                    onClick={() => handleGenerate('citations')}
                    className="cyber-button-secondary text-xs px-4 py-2 rounded-full disabled:opacity-60"
                    disabled={actionLoading.includes('citations')}
                  >
                    {actionLoading.includes('citations') ? 'Generating...' : 'Generate'}
                  </button>
                  <button
                    onClick={handleCitationValidate}
                    className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60"
                    disabled={actionLoading.includes('citations-validate')}
                  >
                    {actionLoading.includes('citations-validate') ? 'Validating...' : 'Validate'}
                  </button>
                </div>
              </div>
              {workspace.citations?.length ? (
                <ul className="space-y-3 text-gray-100/90">
                  {workspace.citations.map((citation: any) => (
                    <li key={citation.id} className="border border-white/10 rounded-xl p-4 bg-black/30">
                      <div className="flex items-center justify-between">
                        <span className="cyber-tag">{citation.statementType}</span>
                        <button
                          onClick={() => {
                            setEditingCitationId(citation.id)
                            setCitationDraft({
                              id: citation.id,
                              statement: citation.statement || '',
                              verseReferences: (citation.verseReferences || []).join(', '),
                            })
                          }}
                          className="cyber-outline px-3 py-1 text-xs rounded-full"
                        >
                          Edit
                        </button>
                      </div>
                      {editingCitationId === citation.id && citationDraft ? (
                        <div className="space-y-3 mt-3">
                          <label className="text-xs uppercase tracking-widest cyber-muted">Statement</label>
                          <textarea
                            value={citationDraft.statement}
                            onChange={(e) => setCitationDraft({ ...citationDraft, statement: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                            rows={3}
                          />
                          <label className="text-xs uppercase tracking-widest cyber-muted">Verse References (comma separated)</label>
                          <input
                            value={citationDraft.verseReferences}
                            onChange={(e) => setCitationDraft({ ...citationDraft, verseReferences: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleCitationSave}
                              className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60"
                              disabled={actionLoading.includes('citation-edit')}
                            >
                              {actionLoading.includes('citation-edit') ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingCitationId(null)
                                setCitationDraft(null)
                              }}
                              className="cyber-outline text-xs px-4 py-2 rounded-full"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="mt-1 flex-1">{renderMarkdown(citation.statement)}</div>
                            <span
                              className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border ${
                                citation.isVerified
                                  ? 'border-cyan-400/60 text-cyan-200'
                                  : 'border-red-400/50 text-red-200'
                              }`}
                            >
                              {citation.isVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                          {citation.verseReferences?.length > 0 && (
                            <p className="text-xs cyber-muted mt-2">
                              Verses: {citation.verseReferences.join(', ')}
                            </p>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-100/90">No citations yet.</p>
              )}
            </div>
          )}
          {activeSection === 'scripture' && (
            <div className="space-y-4 relative min-h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Scripture</h3>
                <button
                  onClick={() => handleScriptureLookup()}
                  disabled={actionLoading.includes('scripture')}
                  className="cyber-outline text-xs px-3 py-2 rounded-full disabled:opacity-60"
                >
                  {actionLoading.includes('scripture') ? 'Looking up...' : 'Lookup'}
                </button>
              </div>
              <div className="cyber-panel rounded-2xl p-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr] items-end">
                  <div className="relative">
                    <label className="text-xs uppercase tracking-widest cyber-muted mb-2 block">Scripture Reference</label>
                    <input
                      type="text"
                      value={scriptureQuery}
                      onChange={(e) => {
                        const value = e.target.value
                        setScriptureQuery(value)
                        buildScriptureSuggestions(value)
                        setShowScriptureSuggestions(true)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault()
                          setShowScriptureSuggestions(true)
                          setScriptureSuggestionIndex((prev) => {
                            const next = Math.min(prev + 1, scriptureSuggestions.length - 1)
                            return Number.isFinite(next) ? next : -1
                          })
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault()
                          setScriptureSuggestionIndex((prev) => Math.max(prev - 1, 0))
                        }
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (showScriptureSuggestions && scriptureSuggestionIndex >= 0) {
                            const selected = scriptureSuggestions[scriptureSuggestionIndex]
                            if (selected) {
                              setScriptureQuery(selected.trim())
                              setShowScriptureSuggestions(false)
                              return
                            }
                          }
                          setShowScriptureSuggestions(false)
                          handleScriptureLookup()
                        }
                        if (e.key === 'Escape') {
                          setShowScriptureSuggestions(false)
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowScriptureSuggestions(false), 150)}
                      onFocus={() => {
                        buildScriptureSuggestions(scriptureQuery)
                        setShowScriptureSuggestions(true)
                      }}
                      placeholder="John 3:16"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                    />
                    {showScriptureSuggestions && scriptureSuggestions.length > 0 && (
                      <div className="absolute z-20 mt-2 w-full rounded-xl border border-cyan-500/30 bg-black/90 shadow-lg">
                        {scriptureSuggestions.map((suggestion, index) => (
                          <button
                            key={suggestion}
                            type="button"
                            onMouseDown={() => {
                              setScriptureQuery(suggestion.trim())
                              setShowScriptureSuggestions(false)
                            }}
                            onMouseEnter={() => setScriptureSuggestionIndex(index)}
                            className={`w-full text-left px-3 py-2 text-sm text-gray-100 hover:bg-cyan-500/10 ${
                              index === scriptureSuggestionIndex ? 'bg-cyan-500/10' : ''
                            }`}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                    {scriptureInputWarning && (
                      <p className="mt-2 text-xs text-amber-300/90">
                        {scriptureInputWarning}
                      </p>
                    )}
                    {scriptureValidationWarning && (
                      <p className="mt-2 text-xs text-amber-300/90">
                        {scriptureValidationWarning}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest cyber-muted mb-2 block">Translation</label>
                    <select
                      value={scriptureTranslation}
                      onChange={(e) => setScriptureTranslation(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                    >
                      {availableTranslations.map(trans => (
                        <option key={trans} value={trans}>{trans}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {scriptureError ? (
                  <div className="border border-red-400/40 bg-red-500/10 text-red-100 text-sm rounded-xl px-4 py-3">
                    {scriptureError}
                  </div>
                ) : scriptureLastLookup ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-cyan-200/80">
                    <span>Last lookup: {scriptureLastLookup}</span>
                    <span className="text-cyan-200/40">•</span>
                    <span>{scriptureTranslation}</span>
                  </div>
                ) : null}

                {scriptureLookupHistory.length > 0 && (
                  <div className="border border-white/10 rounded-xl p-3 bg-black/20 space-y-2">
                    <p className="text-xs uppercase tracking-widest cyber-muted">Saved Scripture Snapshots</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {scriptureLookupHistory.map((entry, index) => (
                        <button
                          type="button"
                          key={`${entry.scriptureLastLookup}-${entry.scriptureTranslation}-${index}`}
                          onClick={() => handleScriptureSnapshotSelect(entry)}
                          className="w-full text-left border border-white/10 rounded-lg px-3 py-2 hover:border-cyan-400/40 transition-colors"
                        >
                          <p className="text-sm text-gray-100/90 font-medium">{entry.scriptureLastLookup}</p>
                          <p className="text-[11px] text-cyan-200/80 uppercase tracking-widest">
                            {entry.scriptureTranslation}
                            <span className="text-cyan-200/40 mx-2">•</span>
                            saved {new Date(entry.cachedAt).toLocaleString()}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* SDA Smart Boost Banner */}
                {scriptureLastLookup && (
                  <SDASmartBoostBanner passage={scriptureLastLookup} />
                )}
                
                {extractVerses(scriptureResult).length ? (
                  <div className="space-y-4">
                    <div className="space-y-3 text-sm text-gray-100/90">
                      {extractVerses(scriptureResult).map((verse: any, index: number) => {
                        const reference = typeof verse?.reference === 'string' ? verse.reference : ''
                        const match = reference.match(/\b(\d+):(\d+)\b/)
                        const fallbackStart = getReferenceStartVerse(scriptureLastLookup)
                        const verseNumber = match?.[2] || (fallbackStart ? `${fallbackStart + index}` : `${index + 1}`)
                        return (
                          <div key={`${reference}-${index}`} className="border-l-2 border-cyan-400/40 pl-3 py-1 hover:border-cyan-400 transition-colors">
                            <span className="text-cyan-200 font-semibold text-xs align-super">{verseNumber}</span>
                            <span className="ml-2">{verse.text}</span>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Audio Player */}
                    {isAudioLoading && (
                      <div className="text-sm text-cyan-300 animate-pulse">Loading audio...</div>
                    )}
                    {audioError && (
                      <div className="text-sm text-amber-300">{audioError}</div>
                    )}
                    {audioUrl && (
                      <AudioPlayer 
                        audioUrl={audioUrl} 
                        title={`${scriptureResult.reference} - ${scriptureTranslation}`}
                        onError={(error) => setAudioError(error)}
                      />
                    )}
                    
                    {/* Passage Summary - Interpretive Framing */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => regenerateScriptureSection('passageSummary')}
                        className="absolute top-4 right-4 z-20 cyber-outline text-xs px-3 py-1.5 rounded-full"
                      >
                        Generate
                      </button>
                      {generatedScriptureSections.passageSummary ? (
                        <PassageSummary 
                          key={`${scriptureLastLookup}-passageSummary-${scriptureSectionRefreshKey.passageSummary}`}
                          reference={scriptureLastLookup}
                          token={localStorage.getItem('token') || ''}
                          language={workspace?.language || 'en'}
                          cachedData={passageSummary}
                          onDataLoad={(data: any) => {
                            setPassageSummary(data)
                            persistCurrentScriptureSection('passageSummary', data)
                          }}
                        />
                      ) : (
                        <div className="cyber-panel rounded-2xl p-6">
                          <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-lg font-semibold">Passage Summary</h3>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Per-Verse Context Panel */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => regenerateScriptureSection('verseContext')}
                        className="absolute top-4 right-4 z-20 cyber-outline text-xs px-3 py-1.5 rounded-full"
                      >
                        Generate
                      </button>
                      {generatedScriptureSections.verseContext ? (
                        <PerVerseContextPanel 
                          key={`${scriptureLastLookup}-verseContext-${scriptureSectionRefreshKey.verseContext}`}
                          reference={scriptureLastLookup}
                          token={localStorage.getItem('token') || ''}
                          language={workspace?.language || 'en'}
                          cachedData={perVerseContext}
                          onDataLoad={(data: any) => {
                            setPerVerseContext(data)
                            persistCurrentScriptureSection('verseContext', data)
                          }}
                        />
                      ) : (
                        <div className="cyber-panel rounded-2xl p-6">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-lg font-semibold">Historical Context</h3>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Translation Comparison */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => regenerateScriptureSection('translationComparison')}
                        className="absolute top-4 right-4 z-20 cyber-outline text-xs px-3 py-1.5 rounded-full"
                      >
                        Generate
                      </button>
                      {generatedScriptureSections.translationComparison ? (
                        <TranslationComparisonEnhanced 
                          key={`${scriptureLastLookup}-translationComparison-${scriptureSectionRefreshKey.translationComparison}`}
                          reference={scriptureLastLookup}
                          token={localStorage.getItem('token') || ''}
                          language={workspace?.language || 'en'}
                          cachedData={translationComparison}
                          onDataLoad={(data: any) => {
                            setTranslationComparison(data)
                            persistCurrentScriptureSection('translationComparison', data)
                          }}
                        />
                      ) : (
                        <div className="cyber-panel rounded-2xl p-6">
                          <div className="flex items-center gap-2 mb-1">
                            <Rows className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-lg font-semibold">Verse-by-Verse Comparison</h3>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Verse Commentary */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => regenerateScriptureSection('verseCommentary')}
                        className="absolute top-4 right-4 z-20 cyber-outline text-xs px-3 py-1.5 rounded-full"
                      >
                        Generate
                      </button>
                      {generatedScriptureSections.verseCommentary ? (
                        <VerseCommentaryPanel 
                          key={`${scriptureLastLookup}-verseCommentary-${scriptureSectionRefreshKey.verseCommentary}`}
                          reference={scriptureLastLookup}
                          token={localStorage.getItem('token') || ''}
                          language={workspace?.language || 'en'}
                          cachedData={verseCommentary}
                          onDataLoad={(data: any) => {
                            setVerseCommentary(data)
                            persistCurrentScriptureSection('verseCommentary', data)
                          }}
                        />
                      ) : (
                        <div className="cyber-panel rounded-2xl p-6">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-lg font-semibold">Verse Commentary</h3>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Structural Analysis */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => regenerateScriptureSection('structuralAnalysis')}
                        className="absolute top-4 right-4 z-20 cyber-outline text-xs px-3 py-1.5 rounded-full"
                      >
                        Generate
                      </button>
                      {generatedScriptureSections.structuralAnalysis ? (
                        <StructuralAnalysisPanel 
                          key={`${scriptureLastLookup}-structuralAnalysis-${scriptureSectionRefreshKey.structuralAnalysis}`}
                          passage={scriptureLastLookup}
                          token={localStorage.getItem('token') || ''}
                          language={workspace?.language || 'en'}
                          cachedData={structuralAnalysis}
                          onDataLoad={(data: any) => {
                            setStructuralAnalysis(data)
                            persistCurrentScriptureSection('structuralAnalysis', data)
                          }}
                        />
                      ) : (
                        <div className="cyber-panel rounded-2xl p-6">
                          <div className="flex items-center gap-2 mb-1">
                            <Layers className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-lg font-semibold">Structural Analysis</h3>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Interpretive Challenges */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => regenerateScriptureSection('interpretiveChallenges')}
                        className="absolute top-4 right-4 z-20 cyber-outline text-xs px-3 py-1.5 rounded-full"
                      >
                        Generate
                      </button>
                      {generatedScriptureSections.interpretiveChallenges ? (
                        <InterpretiveChallengePanel 
                          key={`${scriptureLastLookup}-interpretiveChallenges-${scriptureSectionRefreshKey.interpretiveChallenges}`}
                          passage={scriptureLastLookup}
                          token={localStorage.getItem('token') || ''}
                          language={workspace?.language || 'en'}
                          cachedData={interpretiveChallenges}
                          onDataLoad={(data: any) => {
                            setInterpretiveChallenges(data)
                            persistCurrentScriptureSection('interpretiveChallenges', data)
                          }}
                        />
                      ) : (
                        <div className="cyber-panel rounded-2xl p-6">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-lg font-semibold">Interpretive Challenges</h3>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Canonical Theme Tracing */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => regenerateScriptureSection('canonicalThemes')}
                        className="absolute top-4 right-4 z-20 cyber-outline text-xs px-3 py-1.5 rounded-full"
                      >
                        Generate
                      </button>
                      {generatedScriptureSections.canonicalThemes ? (
                        <CanonicalThemeTracing 
                          key={`${scriptureLastLookup}-canonicalThemes-${scriptureSectionRefreshKey.canonicalThemes}`}
                          reference={scriptureLastLookup}
                          token={localStorage.getItem('token') || ''}
                          workspaceId={workspaceId}
                          language={workspace?.language || 'en'}
                          cachedData={canonicalThemes}
                          onDataLoad={(data: any) => {
                            setCanonicalThemes(data)
                            persistCurrentScriptureSection('canonicalThemes', data)
                          }}
                          onAddToOutline={async (theme, verses) => {
                        // Add theme to the selected outline or first outline
                        const selectedOutline = workspace.outlines?.find((o: any) => o.isSelected) || workspace.outlines?.[0]
                        
                        if (!selectedOutline) {
                          console.error('No outline found to add theme to')
                          return
                        }
                        
                        // Create new point
                        const newPoint = {
                          id: Date.now().toString(),
                          text: theme,
                          level: 1,
                          supportingVerses: verses,
                          notes: `Canonical theme: ${verses.join(', ')}`
                        }
                        
                        // Update outline structure
                        const updatedPoints = [...(selectedOutline.structure?.points || []), newPoint]
                        const updatedOutline = {
                          ...selectedOutline,
                          structure: {
                            ...selectedOutline.structure,
                            points: updatedPoints
                          }
                        }
                        
                        // Update workspace
                        const updatedOutlines = workspace.outlines.map((o: any) => 
                          o.id === selectedOutline.id ? updatedOutline : o
                        )
                        
                        setWorkspace({ ...workspace, outlines: updatedOutlines })
                        
                        // Save to backend
                        try {
                          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/outlines/${selectedOutline.id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify(updatedOutline)
                          })
                          console.log('Theme added to outline successfully')
                        } catch (error) {
                          console.error('Failed to save outline:', error)
                        }
                          }}
                        />
                      ) : (
                        <div className="cyber-panel rounded-2xl p-6">
                          <div className="flex items-center gap-2 mb-1">
                            <Network className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-lg font-semibold">Canonical Theme Tracing</h3>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Study Notes */}
                    {scriptureResult.studyNotes && scriptureResult.studyNotes.length > 0 && (
                      <StudyNotes 
                        notes={scriptureResult.studyNotes}
                        onVerseClick={handleVerseClick}
                      />
                    )}

                    {/* EGW insights within Scripture section */}
                    {workspace?.includeEGW !== false && scriptureLastLookup && (() => {
                      const match = scriptureLastLookup.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/)
                      const parsedBook = match?.[1]?.trim() || scriptureLastLookup.split(' ')[0]
                      const parsedChapter = Number(match?.[2] || '1')
                      const parsedVerseStart = match?.[3] ? Number(match[3]) : undefined
                      const parsedVerseEnd = match?.[4] ? Number(match[4]) : undefined

                      return (
                        <EGWPassagePanel
                          passage={scriptureLastLookup}
                          book={parsedBook}
                          chapter={parsedChapter}
                          verseStart={parsedVerseStart}
                          verseEnd={parsedVerseEnd}
                          language={workspace?.language || 'en'}
                        />
                      )
                    })()}
                    
                    {/* Study Synthesis - Final Theological Takeaway */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => regenerateScriptureSection('studySynthesis')}
                        className="absolute top-4 right-4 z-20 cyber-outline text-xs px-3 py-1.5 rounded-full"
                      >
                        Generate
                      </button>
                      {generatedScriptureSections.studySynthesis ? (
                        <StudySynthesis 
                          key={`${scriptureLastLookup}-studySynthesis-${scriptureSectionRefreshKey.studySynthesis}`}
                          reference={scriptureLastLookup}
                          token={localStorage.getItem('token') || ''}
                          language={workspace?.language || 'en'}
                          cachedData={studySynthesis}
                          onDataLoad={(data: any) => {
                            setStudySynthesis(data)
                            persistCurrentScriptureSection('studySynthesis', data)
                          }}
                        />
                      ) : (
                        <div className="cyber-panel rounded-2xl p-6">
                          <div className="flex items-center gap-2 mb-1">
                            <Lightbulb className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-lg font-semibold">Study Synthesis</h3>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <p className="text-gray-200/80">No passage loaded yet.</p>
                )}
              </div>
            </div>
          )}
          {activeSection === 'word-study' && (
            <div className="space-y-4 relative min-h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Word Study</h3>
                <button
                  onClick={() => handleWordStudyLookup()}
                  disabled={actionLoading.includes('word-study')}
                  className="cyber-outline text-xs px-3 py-2 rounded-full disabled:opacity-60"
                >
                  {actionLoading.includes('word-study') ? 'Looking up...' : 'Lookup'}
                </button>
              </div>
              <div className="cyber-panel rounded-2xl p-6 space-y-4">
                <div className="grid md:grid-cols-3 gap-3">
                  <input
                    value={wordStudyWord}
                    onChange={(e) => setWordStudyWord(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleWordStudyLookup()
                      }
                    }}
                    placeholder="agape"
                    className="md:col-span-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                  />
                  <select
                    value={wordStudyLanguage}
                    onChange={(e) => setWordStudyLanguage(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                  >
                    {availableLanguages.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-widest text-cyan-200/80">
                      Suggested From {scriptureLastLookup || workspace?.mainPassage || 'Passage'}
                    </p>
                    {wordStudySuggestionsLoading ? (
                      <span className="text-[11px] text-gray-400">Loading...</span>
                    ) : null}
                  </div>
                  {wordStudySuggestions.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {wordStudySuggestions.map((item, index) => (
                        <button
                          key={`${item.term}-${index}`}
                          type="button"
                          onClick={() => {
                            setWordStudyWord(item.term)
                            if (item.language) setWordStudyLanguage(item.language)
                            handleWordStudyLookup({ word: item.term, language: item.language || wordStudyLanguage })
                          }}
                          className="cyber-outline text-xs px-3 py-1.5 rounded-full text-left"
                          title={item.reason || item.gloss || ''}
                        >
                          {item.term}
                          {item.transliteration ? (
                            <span className="text-cyan-200/70"> · {item.transliteration}</span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-300 mt-2">
                      {wordStudySuggestionsLoading
                        ? 'Analyzing passage terms...'
                        : 'No suggested terms yet. Open Scripture first, then return here.'}
                    </p>
                  )}
                </div>
                {wordStudyError ? (
                  <div className="border border-red-400/40 bg-red-500/10 text-red-100 text-sm rounded-xl px-4 py-3">
                    {wordStudyError}
                  </div>
                ) : wordStudyLastLookup ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-cyan-200/80">
                    <span>Last lookup: {wordStudyLastLookup}</span>
                    <span className="text-cyan-200/40">•</span>
                    <span>{wordStudyLanguage}</span>
                  </div>
                ) : null}
                {wordStudyResult ? (
                  <div className="text-sm text-gray-100/90 space-y-2">
                    <p><span className="text-cyan-200">Lemma:</span> {wordStudyResult.lemma}</p>
                    {wordStudyResult.originalScript && (
                      <p><span className="text-cyan-200">Original Script:</span> {wordStudyResult.originalScript}</p>
                    )}
                    <p><span className="text-cyan-200">Transliteration:</span> {wordStudyResult.transliteration}</p>
                    <div>
                      <span className="text-cyan-200">Definition:</span>
                      <div className="mt-1">{renderSmartValue(wordStudyResult.definition || 'N/A')}</div>
                    </div>
                    <p><span className="text-cyan-200">Strong's:</span> {wordStudyResult.strongs || 'N/A'}</p>
                    <p><span className="text-cyan-200">Part of Speech:</span> {wordStudyResult.partOfSpeech || 'N/A'}</p>
                    <p><span className="text-cyan-200">Occurrences:</span> {wordStudyResult.usageCount || 'N/A'}</p>
                    {wordStudyResult.examples?.length ? (
                      <ul className="list-disc list-inside space-y-1">
                        {wordStudyResult.examples.map((example: string, index: number) => (
                          <li key={`${example}-${index}`}>{example}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-200/80">No examples loaded.</p>
                    )}
                    {wordStudyResult.verseOccurrences?.length ? (
                      <div>
                        <p className="text-xs uppercase tracking-widest cyber-muted">Other occurrences</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {wordStudyResult.verseOccurrences.slice(0, 12).map((verse: string) => (
                            <span key={verse} className="px-2 py-1 rounded-full text-xs border border-white/10 text-gray-100/90">
                              {verse}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {wordStudyResult.distributionByBook?.length ? (
                      <div>
                        <p className="text-xs uppercase tracking-widest cyber-muted">Distribution by book</p>
                        <div className="mt-2 grid md:grid-cols-2 gap-2 text-xs">
                          {wordStudyResult.distributionByBook.slice(0, 10).map((entry: any) => (
                            <div key={entry.book} className="flex items-center justify-between border border-white/10 rounded-lg px-2 py-1">
                              <span className="text-gray-100/90">{entry.book}</span>
                              <span className="text-cyan-200">{entry.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {wordStudyInsights ? (
                      <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                        <p className="text-xs uppercase tracking-widest cyber-muted">Advanced Insights</p>
                        <div className="mt-2 space-y-2">
                          <div>
                            <p className="text-xs cyber-muted uppercase tracking-widest">Root</p>
                            {renderSmartValue(wordStudyInsights.rootWord || 'N/A')}
                          </div>
                          <div>
                            <p className="text-xs cyber-muted uppercase tracking-widest">Semantic Range</p>
                            {renderSmartValue(wordStudyInsights.semanticRange || [])}
                          </div>
                          <div>
                            <p className="text-xs cyber-muted uppercase tracking-widest">Nuance</p>
                            {renderSmartValue(wordStudyInsights.nuanceNotes || [])}
                          </div>
                          {wordStudyInsights.grammarInsights ? (
                            <div className="mt-2 grid md:grid-cols-2 gap-2 text-xs">
                              {['tense', 'voice', 'mood', 'case', 'number', 'gender', 'notes'].map((key) => {
                                const value = wordStudyInsights.grammarInsights?.[key]
                                return (
                                  <div key={key} className="flex items-center justify-between border border-white/10 rounded-lg px-2 py-1">
                                    <span className="text-gray-100/90 capitalize">{key}</span>
                                    <span className="text-cyan-200">{String(value || 'N/A')}</span>
                                  </div>
                                )
                              })}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-gray-200/80">No word study loaded yet.</p>
                )}
              </div>
            </div>
          )}
          {activeSection === 'cross-references' && (
            <div className="space-y-4 relative min-h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Cross References</h3>
                <button
                  onClick={handleCrossReferenceLookup}
                  disabled={actionLoading.includes('cross-references')}
                  className="cyber-outline text-xs px-3 py-2 rounded-full disabled:opacity-60"
                >
                  {actionLoading.includes('cross-references') ? 'Looking up...' : 'Lookup'}
                </button>
              </div>
              <div className="cyber-panel rounded-2xl p-6 space-y-4">
                <input
                  value={crossRefVerse}
                  onChange={(e) => setCrossRefVerse(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCrossReferenceLookup()
                    }
                  }}
                  placeholder="John 3:16"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                />
                {crossRefError ? (
                  <div className="border border-red-400/40 bg-red-500/10 text-red-100 text-sm rounded-xl px-4 py-3">
                    {crossRefError}
                  </div>
                ) : crossRefLastLookup ? (
                  <div className="space-y-4">
                    <CrossReferenceRanked
                      verse={crossRefLastLookup}
                      token={localStorage.getItem('token') || ''}
                      onReferencesLoaded={(count) => setCrossRefHasScriptureResults(count > 0)}
                    />
                    {crossRefHasScriptureResults ? (
                      <CrossReferenceSOPPanel
                        verse={crossRefLastLookup}
                        token={localStorage.getItem('token') || ''}
                        language={workspace?.language || 'en'}
                      />
                    ) : null}
                  </div>
                ) : (
                  <p className="text-gray-200/80">Enter a verse reference above to explore cross references.</p>
                )}
              </div>
            </div>
          )}
          {activeSection === 'study-report' && (
            <div className="space-y-4 relative min-h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">Study Report</h3>
                  {workspace?.egwEnabled && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/40 flex items-center gap-1">
                      <Book className="w-3 h-3" />
                      EGW Enabled
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleGenerate('study-report')}
                  className="cyber-outline text-xs px-3 py-2 rounded-full"
                >
                  Generate
                </button>
              </div>
              {workspace?.studyReports?.length ? (
                <div className="cyber-panel rounded-2xl p-6">
                  {renderStudyReport(workspace.studyReports[0])}
                </div>
              ) : (
                <div className="cyber-panel rounded-2xl p-6">
                  <p className="text-gray-200/80">No study report yet.</p>
                </div>
              )}
            </div>
          )}
          {activeSection === 'coach' && (
            <div className="space-y-4 relative min-h-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Socratic Sermon Coach</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Seminary-style refinement questions after Study Report, Outline, and Manuscript.
                  </p>
                </div>
                <button
                  onClick={handleSocraticCoachGenerate}
                  className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60"
                  disabled={actionLoading.includes('coach')}
                >
                  {actionLoading.includes('coach') ? 'Generating...' : 'Generate Questions'}
                </button>
              </div>

              <div className="cyber-panel rounded-2xl p-5 grid md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest cyber-muted mb-2">Mode</p>
                  <select
                    value={coachMode}
                    onChange={(e) => setCoachMode(e.target.value as 'refine' | 'self_reflection')}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                  >
                    <option value="refine">Refine Sermon</option>
                    <option value="self_reflection">Pastor Self-Reflection</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest cyber-muted mb-2">Listener Simulation</p>
                  <select
                    value={coachListenerProfile}
                    onChange={(e) => setCoachListenerProfile(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                  >
                    <option value="general_congregation">General Congregation</option>
                    <option value="new_believer">New Believer</option>
                    <option value="skeptic">Skeptic</option>
                    <option value="teenager">Teenager</option>
                    <option value="bible_scholar">Bible Scholar</option>
                    <option value="family_church">Family Church</option>
                  </select>
                </div>
              </div>

              {socraticCoachSession ? (
                <div className="space-y-4">
                  <div className="cyber-panel rounded-2xl p-5">
                    <p className="text-xs uppercase tracking-widest cyber-muted mb-2">Coaching Summary</p>
                    <p className="text-sm text-gray-200">{socraticCoachSession.summary || 'No summary available.'}</p>
                    {Array.isArray(socraticCoachSession.weakAreas) && socraticCoachSession.weakAreas.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {socraticCoachSession.weakAreas.map((item: string, idx: number) => (
                          <span
                            key={`${item}-${idx}`}
                            className="px-2 py-1 rounded-md text-[10px] uppercase tracking-widest bg-red-500/10 text-red-200 border border-red-500/20"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    {(socraticCoachSession.questions || []).map((question: any, index: number) => {
                      const feedback = coachFeedback?.[question.id]
                      const answerLoading = actionLoading.includes(`coach-answer-${question.id}`)
                      const applyOutlineLoading = actionLoading.includes(`coach-apply-outline-${question.id}`)
                      const applyManuscriptLoading = actionLoading.includes(`coach-apply-manuscript-${question.id}`)
                      return (
                        <div key={question.id || index} className="cyber-panel rounded-2xl p-5 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs uppercase tracking-widest text-cyan-300">
                                {(question.id || `Q${index + 1}`)} · {question.dimension || 'text_fidelity'}
                              </p>
                              <h4 className="text-base font-semibold mt-1">{question.question}</h4>
                            </div>
                            <span className="px-2 py-1 rounded-full text-[10px] uppercase tracking-widest bg-black/30 border border-white/10">
                              {question.severity || 'medium'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300">
                            <span className="text-cyan-200">Purpose:</span> {question.purpose || 'Clarify sermon logic and text fidelity.'}
                          </p>
                          <p className="text-xs text-gray-300">
                            <span className="text-cyan-200">Anchor:</span> {question.sourceAnchor || workspace.mainPassage}
                          </p>
                          {question.listenerAngle ? (
                            <p className="text-xs text-gray-300">
                              <span className="text-cyan-200">Listener Challenge:</span> {question.listenerAngle}
                            </p>
                          ) : null}

                          <textarea
                            value={coachAnswers[question.id] || ''}
                            onChange={(e) =>
                              setCoachAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                            }
                            placeholder="Type your answer here..."
                            className="w-full min-h-[90px] bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                          />
                          <button
                            onClick={() => handleSocraticCoachAnswer(question.id)}
                            className="cyber-outline text-xs px-3 py-2 rounded-full disabled:opacity-60"
                            disabled={answerLoading || !String(coachAnswers[question.id] || '').trim()}
                          >
                            {answerLoading ? 'Reviewing...' : 'Get Coach Feedback'}
                          </button>

                          {feedback ? (
                            <div className="border border-cyan-400/25 bg-cyan-500/5 rounded-xl p-4 space-y-2">
                              {feedback.affirmation ? (
                                <p className="text-sm text-cyan-100">
                                  <span className="text-cyan-300">Affirmation:</span> {feedback.affirmation}
                                </p>
                              ) : null}
                              {feedback.coachFeedback ? (
                                <p className="text-sm text-gray-200">
                                  <span className="text-cyan-300">Feedback:</span> {feedback.coachFeedback}
                                </p>
                              ) : null}
                              {feedback.improvementSuggestion ? (
                                <p className="text-sm text-gray-200">
                                  <span className="text-cyan-300">Improvement:</span> {feedback.improvementSuggestion}
                                </p>
                              ) : null}
                              {feedback.rewriteHint ? (
                                <p className="text-sm text-gray-200">
                                  <span className="text-cyan-300">Rewrite Hint:</span> {feedback.rewriteHint}
                                </p>
                              ) : null}
                              {feedback.nextQuestion ? (
                                <p className="text-sm text-gray-200">
                                  <span className="text-cyan-300">Next Question:</span> {feedback.nextQuestion}
                                </p>
                              ) : null}

                              <div className="pt-2 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleApplyCoachToOutline(question, feedback)}
                                  disabled={applyOutlineLoading}
                                  className="cyber-outline text-xs px-3 py-2 rounded-full disabled:opacity-60"
                                >
                                  {applyOutlineLoading ? 'Applying...' : 'Push To Outline'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApplyCoachToManuscript(question, feedback)}
                                  disabled={applyManuscriptLoading}
                                  className="cyber-outline text-xs px-3 py-2 rounded-full disabled:opacity-60"
                                >
                                  {applyManuscriptLoading ? 'Applying...' : 'Push To Manuscript'}
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>

                  {socraticCoachSession.nextStepSuggestion ? (
                    <div className="cyber-panel rounded-2xl p-4">
                      <p className="text-xs uppercase tracking-widest cyber-muted mb-2">Next Step</p>
                      <p className="text-sm text-gray-200">{socraticCoachSession.nextStepSuggestion}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="cyber-panel rounded-2xl p-6">
                  <p className="text-gray-200/80">
                    Generate Socratic questions to challenge your interpretation, strengthen exposition, and tighten applications.
                  </p>
                </div>
              )}
            </div>
          )}
          {activeSection === 'dna' && (
            <div className="space-y-4 relative min-h-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Sermon DNA</h3>
                  <p className="text-xs text-gray-400 mt-1">Integrity, composition, and theological profile</p>
                </div>
                <button
                  onClick={() => handleGenerate('dna')}
                  className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60"
                >
                  {actionLoading.includes('dna') ? 'Analyzing...' : 'Run Full DNA'}
                </button>
              </div>

              <div className="cyber-panel rounded-2xl p-5 space-y-4">
                <p className="text-xs uppercase tracking-widest cyber-muted">Layer 1 · Sermon Integrity</p>
                {dnaIntegrityLoading ? (
                  <p className="text-sm text-gray-300">Running integrity checks...</p>
                ) : dnaIntegrityReport ? (
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                      <p className="text-xs uppercase tracking-widest cyber-muted">Integrity Score</p>
                      <p className="text-2xl font-semibold text-cyan-200 mt-2">{dnaIntegrityReport.overallScore}%</p>
                    </div>
                    <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                      <p className="text-xs uppercase tracking-widest cyber-muted">Passage Alignment</p>
                      <p className="text-2xl font-semibold text-cyan-200 mt-2">
                        {passageAlignmentScore !== null ? `${passageAlignmentScore}%` : '—'}
                      </p>
                    </div>
                    <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                      <p className="text-xs uppercase tracking-widest cyber-muted">Issue Mix</p>
                      <p className="text-sm text-gray-200 mt-2">
                        Critical {criticalIssuesCount} · Warning {warningIssuesCount}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-300">No integrity report yet.</p>
                )}
              </div>

              <div className="cyber-panel rounded-2xl p-5 space-y-4">
                <p className="text-xs uppercase tracking-widest cyber-muted">Layer 2 · Sermon Composition</p>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                    <p className="text-xs uppercase tracking-widest cyber-muted">Sermon Type</p>
                    <p className="text-lg font-semibold text-gray-100 mt-2">{sermonType}</p>
                  </div>
                  <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                    <p className="text-xs uppercase tracking-widest cyber-muted">Outline Points</p>
                    <p className="text-lg font-semibold text-gray-100 mt-2">{outlinePointsForDna.length || 0}</p>
                  </div>
                  <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                    <p className="text-xs uppercase tracking-widest cyber-muted">Estimated Delivery</p>
                    <p className="text-lg font-semibold text-gray-100 mt-2">{estimatedMinutesDna ? `${estimatedMinutesDna} min` : '—'}</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                    <p className="text-xs uppercase tracking-widest cyber-muted">Explanation</p>
                    <p className="text-xl font-semibold text-cyan-200 mt-2">{explanationPct}%</p>
                  </div>
                  <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                    <p className="text-xs uppercase tracking-widest cyber-muted">Application</p>
                    <p className="text-xl font-semibold text-cyan-200 mt-2">{applicationPct}%</p>
                  </div>
                  <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                    <p className="text-xs uppercase tracking-widest cyber-muted">Illustration</p>
                    <p className="text-xl font-semibold text-cyan-200 mt-2">{illustrationPct}%</p>
                  </div>
                </div>
                <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                  <p className="text-xs uppercase tracking-widest cyber-muted">Scripture Usage</p>
                  <p className="text-sm text-gray-200 mt-2">
                    References in manuscript: {scriptureReferencesInManuscript.length} · Paragraphs: {paragraphCount}
                  </p>
                </div>
              </div>

              <div className="cyber-panel rounded-2xl p-5 space-y-4">
                <p className="text-xs uppercase tracking-widest cyber-muted">Layer 3 · Theological Profile</p>
                {latestDnaAnalysis ? (
                  <div className="space-y-4">
                    <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                      <p className="text-xs uppercase tracking-widest cyber-muted mb-2">DNA Summary</p>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{latestDnaAnalysis.summary}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                        <p className="text-xs uppercase tracking-widest cyber-muted mb-2">Theological Emphasis</p>
                        {theologicalThemeCounts.length ? (
                          <div className="flex flex-wrap gap-2">
                            {theologicalThemeCounts.map(([theme, count]) => (
                              <span
                                key={theme}
                                className="px-2 py-1 rounded-md text-[10px] uppercase tracking-widest bg-cyan-500/10 text-cyan-200 border border-cyan-500/20"
                              >
                                {theme} {count > 1 ? `(${count})` : ''}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-300">No themes detected yet.</p>
                        )}
                      </div>
                      <div className="border border-white/10 rounded-xl p-4 bg-black/30 space-y-3">
                        <p className="text-xs uppercase tracking-widest cyber-muted">Core Scores</p>
                        {latestDnaAnalysis.scores && Object.entries(latestDnaAnalysis.scores).map(([key, value]) => (
                          <div key={key}>
                            <div className="flex justify-between text-xs uppercase tracking-widest cyber-muted mb-1">
                              <span>{String(key)}</span>
                              <span>{Number(value)}/10</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-2 rounded-full bg-cyan-400"
                                style={{ width: `${Math.min(100, Number(value) * 10)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs cyber-muted">
                      {new Date(latestDnaAnalysis.createdAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-100/90">No DNA analysis yet. Run Full DNA.</p>
                )}
              </div>

              {dnaIntegrityReport?.issues?.length ? (
                <div className="cyber-panel rounded-2xl p-5 space-y-3">
                  <p className="text-xs uppercase tracking-widest cyber-muted">Integrity Findings</p>
                  <div className="space-y-2">
                    {dnaIntegrityReport.issues.slice(0, 8).map((issue, index) => (
                      <div key={`${issue.category}-${index}`} className="border border-white/10 rounded-lg p-3 bg-black/30">
                        <p className="text-sm text-gray-200">{issue.message}</p>
                        <p className="text-[11px] uppercase tracking-widest text-cyan-200/70 mt-1">
                          {issue.severity} · {issue.category}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Keep existing detailed checker available */}
              <div className="pt-2">
                <details className="border border-white/10 rounded-xl p-4 bg-black/20">
                  <summary className="cursor-pointer text-sm text-cyan-200">Open Detailed Integrity Checker</summary>
                  <div className="mt-4">
                    <SermonIntegrityDashboard workspaceId={workspaceId} />
                  </div>
                </details>
              </div>
            </div>
          )}
          {activeSection === 'visualizations' && (
            <div className="space-y-6 relative min-h-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">Visualizations</p>
                  <h3 className="text-2xl font-semibold">3D Insight Tools</h3>
                </div>
              </div>
              <div className="cyber-panel rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-2">Legend</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full border border-cyan-400/40 bg-cyan-500/10 text-cyan-200">solid = quotation / fulfillment</span>
                  <span className="px-2 py-1 rounded-full border border-green-400/40 bg-green-500/10 text-green-200">dashed = thematic</span>
                  <span className="px-2 py-1 rounded-full border border-purple-400/40 bg-purple-500/10 text-purple-200">dotted = typology / lexical</span>
                  <span className="px-2 py-1 rounded-full border border-red-400/40 bg-red-500/10 text-red-200">red warnings = weak grounding</span>
                </div>
              </div>
              <div className="space-y-6">
                <div className="cyber-panel rounded-2xl p-6">
                  <h4 className="text-lg font-semibold mb-2">Canonical Constellation</h4>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-2">What This Answers</p>
                  <p className="text-base text-cyan-100 mb-2">Where does this passage connect across Scripture?</p>
                  <p className="text-sm text-gray-200/80 mb-4">
                    Visualize cross-testament connections for {workspace.mainPassage}.
                  </p>
                  <InteractiveCanonicalConstellation focusPassage={workspace.mainPassage} />
                </div>
                
                {/* Sanctuary/Prophecy Mapper for relevant passages */}
                {workspace.mainPassage && (
                  /Daniel|Revelation|Hebrews|Leviticus|Exodus 25/.test(workspace.mainPassage) && (
                    <div className="cyber-panel rounded-2xl p-6">
                      <h4 className="text-lg font-semibold mb-2">Sanctuary & Prophecy Connections</h4>
                      <p className="text-sm text-gray-200/80 mb-4">
                        Trace sanctuary and prophetic connections for {workspace.mainPassage}.
                      </p>
                      <SanctuaryProphecyMapper 
                        passage={workspace.mainPassage}
                        mode={/Daniel|Revelation/.test(workspace.mainPassage) ? 'prophecy' : 'sanctuary'}
                      />
                    </div>
                  )
                )}
                
                <div className="cyber-panel rounded-2xl p-6">
                  <h4 className="text-lg font-semibold mb-2">Prophecy Fulfillment Web</h4>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-2">What This Answers</p>
                  <p className="text-base text-cyan-100 mb-2">How do prophecy and fulfillment relate?</p>
                  <p className="text-sm text-gray-200/80 mb-4">
                    Explore Daniel/Revelation connections and thematic threads.
                  </p>
                  <InteractiveProphecyWeb theme="all" />
                </div>
                <div className="cyber-panel rounded-2xl p-6">
                  <h4 className="text-lg font-semibold mb-2">Sermon Flow Sculptor</h4>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-2">What This Answers</p>
                  <p className="text-base text-cyan-100 mb-2">Is my sermon structurally and biblically grounded?</p>
                  <p className="text-sm text-gray-200/80 mb-4">
                    Map your outline into a spatial integrity model.
                  </p>
                  <InteractiveSermonFlowSculptor
                    bigIdea={workspace.theme || workspace.title}
                    points={(workspace.outlines?.find((o: any) => o.isSelected) || workspace.outlines?.[0])?.structure?.points || []}
                    applications={(workspace.applications || []).map((app: any) => app.content)}
                    supportingVerses={{}}
                    illustrations={(workspace.illustrations || []).map((ill: any) => ill.content)}
                  />
                </div>
                <div className="cyber-panel rounded-2xl p-6">
                  <h4 className="text-lg font-semibold mb-2">Biblical Narrative Map</h4>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-2">What This Answers</p>
                  <p className="text-base text-cyan-100 mb-2">Where does this passage sit in the redemptive storyline?</p>
                  <p className="text-sm text-gray-200/80 mb-4">
                    Timeline map from Creation to New Creation with canonical links around {workspace.mainPassage}.
                  </p>
                  <BiblicalNarrativeMap focusPassage={workspace.mainPassage} />
                </div>
              </div>
            </div>
          )}
          {activeSection === 'media' && (
            <MediaProductionStudio 
              workspace={workspace} 
              token={localStorage.getItem('token') || ''} 
            />
          )}
          </div>
          {actionLoading.includes('outlines') && activeSection === 'outlines' && (
            <LoadingOverlay {...getLoadingMessage('outlines')} />
          )}
          {actionLoading.includes('manuscript') && activeSection === 'manuscript' && (
            <LoadingOverlay {...getLoadingMessage('manuscript')} />
          )}
          {actionLoading.includes('study-report') && activeSection === 'study-report' && (
            <LoadingOverlay {...getLoadingMessage('study-report')} />
          )}
          {actionLoading.includes('applications') && activeSection === 'applications' && (
            <LoadingOverlay {...getLoadingMessage('applications')} />
          )}
          {actionLoading.includes('questions') && activeSection === 'questions' && (
            <LoadingOverlay {...getLoadingMessage('questions')} />
          )}
          {actionLoading.includes('illustrations') && activeSection === 'illustrations' && (
            <LoadingOverlay {...getLoadingMessage('illustrations')} />
          )}
          {actionLoading.includes('citations') && activeSection === 'citations' && (
            <LoadingOverlay {...getLoadingMessage('citations')} />
          )}
          {actionLoading.includes('scripture') && activeSection === 'scripture' && (
            <LoadingOverlay {...getLoadingMessage('scripture')} />
          )}
          {actionLoading.includes('word-study') && activeSection === 'word-study' && (
            <LoadingOverlay {...getLoadingMessage('word-study')} />
          )}
          {actionLoading.includes('cross-references') && activeSection === 'cross-references' && (
            <LoadingOverlay {...getLoadingMessage('cross-references')} />
          )}
          {actionLoading.includes('study-report') && activeSection === 'study-report' && (
            <LoadingOverlay {...getLoadingMessage('study-report')} />
          )}
          {actionLoading.includes('coach') && activeSection === 'coach' && (
            <LoadingOverlay {...getLoadingMessage('dna')} />
          )}
          {actionLoading.includes('dna') && activeSection === 'dna' && (
            <LoadingOverlay {...getLoadingMessage('dna')} />
          )}
            </div>
          </div>
        </div>
      </div>

      {railOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setRailOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-black/90 border-r border-white/10 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">Command Rail</p>
              <button
                onClick={() => setRailOpen(false)}
                className="cyber-outline px-3 py-1 text-xs rounded-full"
              >
                Close
              </button>
            </div>
            {renderRail()}
          </div>
        </div>
      )}

      {promptModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="cyber-panel rounded-2xl p-6 max-w-3xl w-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Prompt Preview</p>
                <h3 className="text-2xl font-semibold capitalize">{promptType}</h3>
              </div>
              <button
                onClick={() => setPromptModalOpen(false)}
                className="cyber-outline px-3 py-2 text-xs rounded-full"
              >
                Close
              </button>
            </div>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-100/90"
              rows={12}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setPromptModalOpen(false)}
                className="cyber-outline px-4 py-2 text-xs rounded-full"
              >
                Cancel
              </button>
              <button
                onClick={runPrompt}
                className="cyber-button px-4 py-2 text-xs rounded-full"
              >
                Run Prompt
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Keyboard Shortcuts Help - Floating Button */}
      <KeyboardShortcutsHelp />
    </div>
  )
}
