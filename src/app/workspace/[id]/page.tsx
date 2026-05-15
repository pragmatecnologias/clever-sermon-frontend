'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { Book } from 'lucide-react'
import AudioPlayer from '@/components/AudioPlayer'
import StudyNotes from '@/components/StudyNotes'
import EGWPassagePanel from '@/components/EGWPassagePanel'
import SDASmartBoostBanner from '@/components/SDASmartBoostBanner'
import StudyReportEGWSection from '@/components/StudyReportEGWSection'
import { getBibleBookMatches, getBibleBookChapterCount, matchBibleBookFromInput } from '@/utils/bibleBooks'
import { Phase } from '@/components/PhaseNavigation'
import CollapsibleSection from '@/components/CollapsibleSection'
import LoadingOverlay from '@/components/LoadingOverlay'
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp'
import SermonMentorDashboard from '@/components/SermonMentorDashboard'
import SermonPatternDashboard from '@/components/SermonPatternDashboard'
import CitationValidationBadge from '@/components/CitationValidationBadge'
import MediaProductionStudio from '@/components/MediaProductionStudio'
import ChurchSettingsPanel from '@/components/ChurchSettingsPanel'
import WorkspaceFlowShell from '@/components/WorkspaceFlowShell'
import WorkspaceOutlinePhase from '@/components/WorkspaceOutlinePhase'
import WorkspaceCitationReview from '@/components/WorkspaceCitationReview'
import WorkspaceManuscriptPhase from '@/components/WorkspaceManuscriptPhase'
import WorkspaceScripturePhase from '@/components/WorkspaceScripturePhase'
import WorkspaceManuscriptCard from '@/components/WorkspaceManuscriptCard'
import WorkspaceScriptureAnalysisPanels from '@/components/WorkspaceScriptureAnalysisPanels'
import WorkspaceStudyReportSection from '@/components/WorkspaceStudyReportSection'
import WorkspaceVisualizationsSection from '@/components/WorkspaceVisualizationsSection'
import WorkspaceRefineSection from '@/components/WorkspaceRefineSection'
import WorkspaceWordStudySection from '@/components/WorkspaceWordStudySection'
import WorkspaceCrossReferencesSection from '@/components/WorkspaceCrossReferencesSection'
import WorkspaceOverviewSection from '@/components/WorkspaceOverviewSection'
import WorkspaceCommandRail from '@/components/WorkspaceCommandRail'
import WorkspaceManuscriptControls from '@/components/WorkspaceManuscriptControls'
import WorkspaceExportPanel from '@/components/WorkspaceExportPanel'
import { createWorkspaceApiClient } from '@/lib/api/openapi-client'
import { createAppApiClient } from '@/lib/api/app-api-client'
import { WorkspaceSection, sectionPhaseMap } from '@/components/workspace-shell.types'
import type {
  WorkspaceCitationDraft,
  WorkspaceCitationItem,
  WorkspaceClaimLedgerEntry,
  WorkspaceClaimReviewDecision,
  WorkspaceOutlineDraft,
  WorkspaceOutlineItem,
  WorkspaceOutlinePoint,
  WorkspaceOutlineStructure,
  WorkspaceSourceLedgerEntry,
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
import {
  getLatestManuscriptRepairIssues,
  getWorkspaceCoachFeedback,
  getWorkspaceCoachSession,
  getWorkspaceMetadata,
  getWorkspaceSermonDnaAnalysis,
  getWorkspaceUiState,
  workspaceHasDeliverables,
} from '@/components/workspace-metadata.helpers'
import type { WorkspaceCoachFeedback } from '@/components/workspace-metadata.helpers'
import { SermonCoreData } from '@/components/SermonCore'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { getLoadingMessage } from '@/utils/loadingMessages'
import {
  ensureManuscriptRichHtml,
  sanitizeManuscriptHtml,
  stripModelArtifacts,
} from '@/utils/manuscriptFormatting'

type ScriptureLookupSnapshot = {
  scriptureResult: WorkspaceScriptureResult | Record<string, unknown> | string | null
  scriptureLastLookup: string
  scriptureQuery: string
  scriptureTranslation: string
  parallelTranslations: string
  parallelResults: Array<Record<string, unknown>>
  contextData: WorkspaceSectionData
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

type WorkspaceSectionData = Record<string, unknown> | string | string[] | null
type WorkspaceShellState = Record<string, any>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

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

type WorkspaceOutlineNode = {
  id?: string
  title?: string
  text?: string
  content?: string
  summary?: string
  movement?: string
  supportingVerses?: string[]
  canonicalThemes?: string[]
  crossReferences?: string[]
  subpoints?: string[]
  applications?: string[]
  discussionQuestions?: string[]
  illustrationIdeas?: string[]
  mediaSuggestions?: string[]
  egwSupport?: Array<Record<string, unknown>>
  references?: string[]
  notes?: string
  coachNotes?: Array<Record<string, unknown>>
}

type WorkspaceStudyReportSection = {
  passageOverview?: string
  overview?: string
  summary?: string
  literaryContext?: string
  historicalContext?: string
  canonicalContext?: string
  canonicalConnections?: string
  canonicalThemes?: string
  mainTheologicalClaim?: string
  theologicalInsights?: string
  exegeticalSummary?: string
  summaryStatement?: string
  exegeticalFlow?: unknown[]
  argumentFlow?: unknown[]
  flow?: unknown[]
  theologicalThemes?: unknown[]
  keyThemes?: unknown[]
  themes?: unknown[]
  pastoralImplications?: unknown[] | Record<string, unknown>
  practicalApplications?: unknown[]
  applications?: unknown[]
  structureOfPassage?: unknown[]
  structuralAnalysis?: unknown[]
  crossReferences?: unknown[]
  interpretiveChallenges?: unknown[]
  keyTerms?: Array<Record<string, unknown>>
  egw?: unknown
  egwSection?: unknown
}

type WorkspacePassageSummary = {
  passage: string
  summary: string
  interpretiveCenter: string
  mainTension: string
  movement: string[]
  dataSource: 'llm-generated' | 'curated' | 'unavailable'
  mainIdea?: string
}

type WorkspacePassageMovement = {
  movement?: string
  title?: string
  verses?: string
  summary?: string
  description?: string
}

type WorkspaceKeyTerm = {
  term?: string
  language?: string
  transliteration?: string
  definition?: string
  nuance?: string
}

type WorkspaceCrossReference = {
  reference?: string
  verse?: string
  connection?: string
  explanation?: string
}

type WorkspaceInterpretiveChallenge = {
  question?: string
  challenge?: string
  interpretationOptions?: string[]
  preachingGuidance?: string
}

type WorkspaceSearchResult = {
  workspaceId?: string
  type?: string
  id?: string
  title?: string
  snippet?: string
}

type WorkspaceCoachQuestion = {
  id?: string
  dimension?: string
  question?: string
  sourceAnchor?: string
}

type WorkspaceCoachFeedbackDetail = WorkspaceCoachFeedback & {
  coachFeedback?: string
  improvementSuggestion?: string
  rewriteHint?: string
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

type WorkspaceIllustrationDraft = {
  title?: string
  content?: string
  prompt?: string
  description?: string
  source?: string
  references?: string[]
  [key: string]: unknown
}

type WorkspaceCoachSessionData = {
  repairPlan?: WorkspaceRepairPlanItem[]
  questions?: WorkspaceCoachQuestion[]
}

type WorkspaceManuscriptRecord = {
  id?: string
    content?: WorkspaceManuscriptContent & {
      metadata?: {
        quality?: {
          status?: string
          repairedIssues?: unknown[]
          remainingIssues?: unknown[]
        }
        repair?: {
          lastRepairedAt?: string
          auditTrail?: unknown[]
        }
    }
  }
}

type WorkspaceManuscriptContent = {
  text?: string
  formatVersion?: string
  cues?: ManuscriptCues | null
  sections?: Array<{ heading?: string; body?: string }>
}

type WorkspacePageData = {
  id?: string
  title?: string
  language?: string
  mainPassage?: string
  theme?: string
  audienceProfile?: string
  status?: string
  egwEnabled?: boolean
  metadata?: Record<string, unknown>
  outlines?: WorkspaceOutlineItem[]
  manuscripts?: WorkspaceManuscriptRecord[]
  studyReports?: Array<{ id?: string; sections?: WorkspaceStudyReportSection }>
  citations?: WorkspaceCitationItem[]
  dnaAnalyses?: Array<Record<string, unknown>>
  applications?: Array<{ id?: string; text?: string; content?: string; title?: string; audienceType?: string }>
  discussionQuestions?: Array<{ id?: string; text?: string; question?: string }>
  illustrations?: Array<{ id?: string; text?: string; title?: string; content?: string; prompt?: string; source?: string }>
  manifesto?: unknown
  wordStudy?: unknown
  externalReferences?: unknown
  [key: string]: unknown
}

type WorkspaceScriptureResult = {
  reference?: string
  error?: string
  studyNotes?: Array<{
    id: string
    type: string
    text: string
    verseReference: string
    category: string
  }>
  [key: string]: unknown
}

type WorkspaceStateSnapshot = {
  activePhase?: Phase
  activeSection?: WorkspaceSection
  activeOutline?: { id?: string } | null
  latestIntegrityReport?: {
    overallScore?: number
    balanced?: boolean
    issueCount?: number
    strengthCount?: number
    criticalIssueCount?: number
    warningIssueCount?: number
    reviewedIssueCount?: number
  } | null
  integrityIssueLedger?: Array<{
    id: string
    severity?: string
    category?: string
    message?: string
    affectedItem?: string
    decision?: string
    note?: string
    status?: string
    updatedAt?: string
  }>
  integrityIssueReviews?: Array<{
    issueId: string
    decision: string
    note?: string
    updatedAt: string
    issueMessage?: string
    severity?: string
    category?: string
    affectedItem?: string
  }>
  claimLedger?: WorkspaceClaimLedgerEntry[]
  sourceLedger?: WorkspaceSourceLedgerEntry[]
  claimReviewDecisions?: WorkspaceClaimReviewDecision[]
  workspace?: WorkspacePageData
  [key: string]: unknown
}

const emptyManuscriptCues = (): ManuscriptCues => ({
  slide: [],
  keyLine: [],
  transition: [],
  pause: [],
  read: [],
  quote: [],
  cta: [],
})

const formatTheologicalLens = (): string => {
  return 'Adventist'
}

type StudyAssetType = 'applications' | 'questions' | 'illustrations' | 'media' | 'egw' | 'references' | 'report'

const VALID_PHASES: Phase[] = ['THEME', 'PASSAGE', 'STUDY', 'OUTLINE', 'WRITE', 'REFINE', 'DELIVER']
const VALID_SECTIONS: WorkspaceSection[] = [
  'workspace',
  'church-settings',
  'outlines',
  'manuscript',
  'citations',
  'scripture',
  'word-study',
  'cross-references',
  'study-report',
  'coach',
  'dna',
  'visualizations',
  'media',
]

const WorkspaceScriptureAnalysisPanelsBridge = WorkspaceScriptureAnalysisPanels

export default function WorkspaceDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const workspaceId = params?.id as string
  const [workspace, setWorkspace] = useState<WorkspacePageData | null>(null)
  const [workspaceState, setWorkspaceState] = useState<WorkspaceStateSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string[]>([])
  const [editingWorkspace, setEditingWorkspace] = useState(false)
  const [workspaceDraft, setWorkspaceDraft] = useState<WorkspacePageData | null>(null)
  const [editingOutlineId, setEditingOutlineId] = useState<string | null>(null)
  const [outlineDraft, setOutlineDraft] = useState<WorkspaceOutlineDraft | null>(null)
  const [editingManuscriptId, setEditingManuscriptId] = useState<string | null>(null)
  const [manuscriptDraft, setManuscriptDraft] = useState<string>('')
  const [manuscriptCueDraft, setManuscriptCueDraft] = useState<ManuscriptCues>(emptyManuscriptCues())
  const [legacyConvertCandidateId, setLegacyConvertCandidateId] = useState<string | null>(null)
  const [manuscriptTone, setManuscriptTone] = useState('teaching')
  const [manuscriptTargetMinutes, setManuscriptTargetMinutes] = useState(22)
  const [manuscriptFormat, setManuscriptFormat] = useState<'full' | 'notes'>('full')
  const [manuscriptAudienceMode, setManuscriptAudienceMode] = useState('default')
  const [manuscriptIncludeSlideCues, setManuscriptIncludeSlideCues] = useState(true)
  const [manuscriptIncludeKeyLines, setManuscriptIncludeKeyLines] = useState(true)
  const [manuscriptCuesCollapsed, setManuscriptCuesCollapsed] = useState(false)
  const [sermonCoreGenerating, setSermonCoreGenerating] = useState(false)
  const [editingApplicationId, setEditingApplicationId] = useState<string | null>(null)
  const [applicationDraft, setApplicationDraft] = useState<string>('')
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [questionDraft, setQuestionDraft] = useState<string>('')
  const [editingIllustrationId, setEditingIllustrationId] = useState<string | null>(null)
  const [illustrationDraft, setIllustrationDraft] = useState<WorkspaceIllustrationDraft | null>(null)
  const [editingCitationId, setEditingCitationId] = useState<string | null>(null)
  const [citationDraft, setCitationDraft] = useState<WorkspaceCitationDraft | null>(null)
  const [citationTranslation, setCitationTranslation] = useState('KJV')
  const [promptModalOpen, setPromptModalOpen] = useState(false)
  const [railOpen, setRailOpen] = useState(false)
  const [promptType, setPromptType] = useState<
    'outline' | 'manuscript' | 'applications' | 'questions' | 'illustrations' | 'citations' | 'study-report' | null
  >(null)
  const [promptText, setPromptText] = useState('')
  const [studyAssetEditor, setStudyAssetEditor] = useState<'applications' | 'questions' | 'illustrations' | null>(null)
  const [visualizationMode, setVisualizationMode] = useState<'passage' | 'refine'>('passage')
  const [advancedMode, setAdvancedMode] = useState(false)
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('workspace')
  const [activePhase, setActivePhase] = useState<Phase>('THEME')
  const [citationValidations, setCitationValidations] = useState<Record<string, Record<string, unknown>>>({})
  const [dnaIntegrityReport, setDnaIntegrityReport] = useState<SermonIntegrityReport | null>(null)
  const [dnaIntegrityLoading, setDnaIntegrityLoading] = useState(false)
  const [dnaIntegrityExpanded, setDnaIntegrityExpanded] = useState(false)
  const [dnaFlowExpanded, setDnaFlowExpanded] = useState(false)
  const [coachMode, setCoachMode] = useState<'refine' | 'self_reflection'>('refine')
  const [coachListenerProfile, setCoachListenerProfile] = useState('general_congregation')
  const [socraticCoachSession, setSocraticCoachSession] = useState<WorkspaceCoachSessionData | null>(null)
  const [coachAnswers, setCoachAnswers] = useState<Record<string, string>>({})
  const [coachFeedback, setCoachFeedback] = useState<Record<string, WorkspaceCoachFeedbackDetail | null>>({})
  const [repairLockedAnchors, setRepairLockedAnchors] = useState<string[]>([])
  const [repairJob, setRepairJob] = useState<{
    manuscriptId: string
    jobId: string
    status: string
    state?: string
    message?: string
  } | null>(null)
  const [generationJob, setGenerationJob] = useState<{
    capability: string
    jobId: string
    status: string
    state?: string
    message?: string
  } | null>(null)
  const [lastRepairNotice, setLastRepairNotice] = useState<{
    manuscriptId: string
    repairedCount: number
    remainingCount: number
    lastRepairedAt: string
  } | null>(null)
  const [showRepairMarkers, setShowRepairMarkers] = useState(true)
  const [manuscriptQualityExpanded, setManuscriptQualityExpanded] = useState<Record<string, boolean>>({})
  const [repairHistoryExpanded, setRepairHistoryExpanded] = useState<Record<string, boolean>>({})
  const [scriptureQuery, setScriptureQuery] = useState('')
  const [scriptureTranslation, setScriptureTranslation] = useState('KJV')
  const [scriptureResult, setScriptureResult] = useState<WorkspaceScriptureResult | Record<string, unknown> | string | null>(null)
  const [parallelTranslations, setParallelTranslations] = useState('WEB')
  
  // Filter translations based on workspace language
  const availableTranslations = workspace?.language === 'es' 
    ? ['RVR1960', 'NVI', 'NBLA'] // Spanish Bibles only
    : ['KJV', 'WEB', 'NKJV', 'ESV', 'NIV', 'NASB', 'NLT'] // English Bibles only
  const [parallelResults, setParallelResults] = useState<Array<Record<string, unknown>>>([])
  const [contextData, setContextData] = useState<WorkspaceSectionData>(null)
  const [structuralAnalysis, setStructuralAnalysis] = useState<StructuralAnalysisData | null>(null)
  const [interpretiveChallenges, setInterpretiveChallenges] = useState<InterpretiveChallengeData | null>(null)
  const [perVerseContext, setPerVerseContext] = useState<VerseContextData | null>(null)
  const [passageSummary, setPassageSummary] = useState<PassageSummaryData | null>(null)
  const [studySynthesis, setStudySynthesis] = useState<StudySynthesisData | null>(null)
  const [canonicalThemes, setCanonicalThemes] = useState<CanonicalThemesData | null>(null)
  const [verseCommentary, setVerseCommentary] = useState<VerseCommentaryData | null>(null)
  const [translationComparison, setTranslationComparison] = useState<TranslationComparisonData | null>(null)
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
  const [manuscriptCueHealth, setManuscriptCueHealth] = useState<Record<string, { total: number; matched: number; stale: boolean }>>({})
  const [pendingSearchJump, setPendingSearchJump] = useState<{ manuscriptId: string | null; query: string } | null>(null)
  const manuscriptContentRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const highlightedCueElementRef = useRef<{
    element: HTMLElement | null
    backgroundColor: string
    transition: string
  }>({ element: null, backgroundColor: '', transition: '' })
  const [wordStudyWord, setWordStudyWord] = useState('')
  const [wordStudyLanguage, setWordStudyLanguage] = useState('greek')
  const [availableLanguages] = useState([{value: 'greek', label: 'Greek'}, {value: 'hebrew', label: 'Hebrew'}, {value: 'aramaic', label: 'Aramaic'}])
  const [wordStudyResult, setWordStudyResult] = useState<Record<string, unknown> | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set())
  const [wordStudyInsights, setWordStudyInsights] = useState<Record<string, unknown> | null>(null)
  const [wordStudyError, setWordStudyError] = useState<string | null>(null)
  const [wordStudyLastLookup, setWordStudyLastLookup] = useState<string>('')
  const [wordStudySuggestions, setWordStudySuggestions] = useState<
    Array<{ term: string; transliteration?: string; gloss?: string; reason?: string; language?: string }>
  >([])
  const [wordStudySuggestionsLoading, setWordStudySuggestionsLoading] = useState(false)
  const [wordStudyLookupContext, setWordStudyLookupContext] = useState<string>('')
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
  const [searchResults, setSearchResults] = useState<WorkspaceSearchResult[]>([])
  const [expandedOutlineId, setExpandedOutlineId] = useState<string | null>(null)
  const [expandedTextBlocks, setExpandedTextBlocks] = useState<Record<string, boolean>>({})
  const [referencePreview, setReferencePreview] = useState<{
    reference: string
    text: string
    context?: string
    loading: boolean
  } | null>(null)
  const autosaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const autosaveHashes = useRef<Record<string, string>>({})
  const scriptureLookupRequestId = useRef(0)
  const navStateRestored = useRef(false)
  const navStatePersistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navStatePersistHash = useRef<string>('')
  const navStateStorageKey = workspaceId ? `workspace-ui-nav:${workspaceId}` : null

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

  const getVerseValidationWarning = (reference: string, verses: Array<{ reference?: string }>) => {
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


  const extractVerses = (
    result: WorkspaceScriptureResult | Record<string, unknown> | string | null,
  ): Array<{ reference?: string; text?: string }> => {
    if (!result) return []

    const recordResult = isRecord(result) ? result : null
    const dataResult = isRecord(recordResult?.data) ? recordResult.data : null
    const passageResult = isRecord(recordResult?.passage) ? recordResult.passage : null
    const payloadResult = isRecord(recordResult?.payload) ? recordResult.payload : null

    const candidates = [
      recordResult?.['verses'],
      dataResult?.['verses'],
      passageResult?.['verses'],
      payloadResult?.['verses'],
    ]

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
      (recordResult?.['text'] as string | undefined) ||
      (recordResult?.['content'] as string | undefined) ||
      (dataResult?.['text'] as string | undefined) ||
      (dataResult?.['content'] as string | undefined) ||
      (passageResult?.['text'] as string | undefined) ||
      ''

    if (typeof textCandidate === 'string' && textCandidate.trim()) {
      return [
        {
          reference:
            (recordResult?.['reference'] as string | undefined) ||
            (dataResult?.['reference'] as string | undefined) ||
            '',
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
    raw: WorkspaceScriptureResult | Record<string, unknown> | string | null,
    reference: string,
    translation: string,
  ) => {
    const recordRaw = isRecord(raw) ? raw : null
    const dataRaw = isRecord(recordRaw?.data) ? recordRaw.data : null

    if (Array.isArray(recordRaw?.['verses'])) {
      return {
        ...recordRaw,
        reference: (recordRaw?.['reference'] as string | undefined) || reference,
        translation: (recordRaw?.['translation'] as string | undefined) || translation,
      }
    }

    if (Array.isArray(dataRaw?.['verses'])) {
      return {
        ...dataRaw,
        reference: (dataRaw?.['reference'] as string | undefined) || reference,
        translation: (dataRaw?.['translation'] as string | undefined) || translation,
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
  ): ScriptureLookupSnapshot => {
    return {
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
    }
  }

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

  const compactSnapshotForPersistence = (snapshot: ScriptureLookupSnapshot): ScriptureLookupSnapshot => snapshot

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
    const compactCurrent = compactSnapshotForPersistence(snapshot)
    const compactHistory = nextHistory.map((entry) => compactSnapshotForPersistence(entry))
    await saveScriptureLookupCache({
      ...compactCurrent,
      lookupHistory: compactHistory,
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
    data: unknown,
  ) => {
    if (!scriptureResult || !scriptureLastLookup) return

    let nextPassageSummary = passageSummary
    let nextPerVerseContext = perVerseContext
    let nextTranslationComparison = translationComparison
    let nextVerseCommentary = verseCommentary
    let nextStructuralAnalysis = structuralAnalysis
    let nextInterpretiveChallenges = interpretiveChallenges
    let nextCanonicalThemes = canonicalThemes
    let nextStudySynthesis = studySynthesis

    switch (section) {
      case 'passageSummary':
        nextPassageSummary = data as PassageSummaryData
        break
      case 'verseContext':
        nextPerVerseContext = data as VerseContextData
        break
      case 'translationComparison':
        nextTranslationComparison = data as TranslationComparisonData
        break
      case 'verseCommentary':
        nextVerseCommentary = data as VerseCommentaryData
        break
      case 'structuralAnalysis':
        nextStructuralAnalysis = data as StructuralAnalysisData
        break
      case 'interpretiveChallenges':
        nextInterpretiveChallenges = data as InterpretiveChallengeData
        break
      case 'canonicalThemes':
        nextCanonicalThemes = data as CanonicalThemesData
        break
      case 'studySynthesis':
        nextStudySynthesis = data as StudySynthesisData
        break
      default:
        break
    }

    const snapshot = buildScriptureSnapshot({
      scriptureResult,
      scriptureLastLookup,
      scriptureQuery: scriptureQuery || scriptureLastLookup,
      scriptureTranslation,
      parallelTranslations,
      parallelResults,
      contextData,
      structuralAnalysis: nextStructuralAnalysis,
      interpretiveChallenges: nextInterpretiveChallenges,
      perVerseContext: nextPerVerseContext,
      passageSummary: nextPassageSummary,
      studySynthesis: nextStudySynthesis,
      canonicalThemes: nextCanonicalThemes,
      verseCommentary: nextVerseCommentary,
      translationComparison: nextTranslationComparison,
    })

    persistScriptureSnapshot(snapshot)
  }

  const handleAddCanonicalThemeToOutline = async (theme: string, verses: string[]) => {
    const selectedOutline = workspace?.outlines?.find((o) => o.isSelected) || workspace?.outlines?.[0]
    if (!selectedOutline) return

    const newPoint = {
      id: Date.now().toString(),
      text: theme,
      level: 1,
      supportingVerses: verses,
      notes: `Canonical theme: ${verses.join(', ')}`,
    }

    const updatedPoints = [...(selectedOutline.structure?.points || []), newPoint]
    const updatedOutline = {
      ...selectedOutline,
      structure: {
        ...selectedOutline.structure,
        points: updatedPoints,
      },
    }

    const updatedOutlines = (workspace?.outlines || []).map((o) =>
      o.id === selectedOutline.id ? updatedOutline : o,
    )
    setWorkspace(workspace ? ({ ...workspace, outlines: updatedOutlines } as WorkspacePageData) : workspace)

    try {
      const client = getWorkspaceApiClient()
      if (!client) return
      await client.updateOutline(selectedOutline.id, updatedOutline as Record<string, unknown>)
    } catch (error) {
      console.error('Failed to save outline:', error)
    }
  }

  // Map sections to phases
  // PASSAGE = "What does the text say?" (reading tools)
  // STUDY = "What does the text mean?" (analysis tools)
  const phaseContentMap: Record<Phase, WorkspaceSection[]> = {
    THEME: ['workspace'],
    PASSAGE: ['scripture'],  // Text-focused: scripture display, translations, audio
    STUDY: ['study-report', 'word-study', 'cross-references', 'visualizations'],  // Analysis: word studies, cross-refs, themes, visualizations
    OUTLINE: ['outlines'],
    WRITE: ['manuscript', 'citations'],
    REFINE: ['coach', 'dna'],
    DELIVER: ['media', 'church-settings']
  }

  const resolvePhaseForSection = (section: WorkspaceSection, preferredPhase?: Phase): Phase => {
    return (
      ({
        workspace: 'THEME',
        scripture: 'PASSAGE',
        'word-study': 'STUDY',
        'cross-references': 'STUDY',
        visualizations: 'STUDY',
        'study-report': 'STUDY',
        outlines: 'OUTLINE',
        manuscript: 'WRITE',
        citations: 'WRITE',
        coach: 'REFINE',
        dna: 'REFINE',
        media: 'DELIVER',
        'church-settings': 'DELIVER',
      } as Record<WorkspaceSection, Phase>)[section] || 'THEME'
    )
  }

  // Calculate progress
  const latestStudyReport = workspace?.studyReports?.[0]
  const latestManuscript = workspace?.manuscripts?.[0]
  const workspaceMetadata = getWorkspaceMetadata(workspace)
  const repairedIssueIds = new Set<string>(getLatestManuscriptRepairIssues(workspace))
  const coachRepairPlan = Array.isArray(socraticCoachSession?.repairPlan) ? socraticCoachSession.repairPlan : []
  const pendingCoachRepairPlan = coachRepairPlan.filter((item: WorkspaceRepairPlanItem) => {
    const issueId = String(item?.issueId || '').trim()
    return issueId && !repairedIssueIds.has(issueId)
  })
  const themeConfigured =
    Boolean(String(workspace?.title || '').trim()) &&
    Boolean(String(workspace?.mainPassage || '').trim()) &&
    Boolean(String(workspace?.language || workspaceMetadata.language || '').trim())
  const refineCompleted =
    Boolean(dnaIntegrityReport) ||
    Boolean(socraticCoachSession) ||
    Boolean(getWorkspaceSermonDnaAnalysis(workspace)) ||
    Boolean(getWorkspaceCoachSession(workspace))
  const deliverPrepared =
    workspaceHasDeliverables(workspace, ['hasSlides', 'hasMedia', 'hasSocial', 'hasMusic'])

  const progress = {
    themeConfigured,
    passageExplored: !!scriptureResult,
    studyGenerated: !!latestStudyReport,
    outlineCreated: !!workspace?.outlines?.length,
    manuscriptWritten: !!latestManuscript,
    refineCompleted,
    deliverPrepared,
  }

  // Handle phase change
  const handlePhaseChange = (phase: Phase) => {
    setActivePhase(phase)
    if (phase === 'PASSAGE') {
      setVisualizationMode('passage')
    }
    if (phase === 'REFINE') {
      setVisualizationMode('refine')
    }
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

  const handleSearchResultSelect = (item: WorkspaceSearchResult) => {
    if (item?.workspaceId && item.workspaceId !== workspaceId) {
      router.push(`/workspace/${item.workspaceId}`)
      return
    }
    if (item?.type === 'workspace' && item.id && item.id !== workspaceId) {
      router.push(`/workspace/${item.id}`)
      return
    }

    if (item?.type === 'outline') {
      setActiveSection('outlines')
      setActivePhase('OUTLINE')
    }
    if (item?.type === 'manuscript') {
      setActiveSection('manuscript')
      setActivePhase('WRITE')
      setPendingSearchJump({
        manuscriptId: item?.id || null,
        query: String(searchQuery || '').trim(),
      })
    }
    if (item?.type === 'note') {
      setActiveSection('workspace')
      setActivePhase('THEME')
    }
  }

  // Handle next step suggestions
  const handleNextStepAction = (action: string) => {
    switch (action) {
      case 'open-theme':
        setActivePhase('THEME')
        setActiveSection('workspace')
        break
      case 'open-passage':
        setActivePhase('PASSAGE')
        setActiveSection('scripture')
        break
      case 'generate-study-report':
        setActivePhase('STUDY')
        setActiveSection('study-report')
        handleGenerate('study-report', '')
        break
      case 'open-outline':
        setActivePhase('OUTLINE')
        setActiveSection('outlines')
        break
      case 'open-write':
        setActivePhase('WRITE')
        setActiveSection('manuscript')
        break
      case 'open-refine':
        setActivePhase('REFINE')
        setActiveSection('dna')
        break
      case 'open-deliver':
        setActivePhase('DELIVER')
        setActiveSection('media')
        break
    }
  }

  // Validate citation
  const validateCitation = async (statement: string, verseRef: string) => {
    try {
      const client = getAppApiClient()
      if (!client) return { supportLevel: 'pending' }
      return await client.scriptureValidateCitation(statement, verseRef, scriptureTranslation || 'KJV')
    } catch (error) {
      console.error('Citation validation failed:', error)
      return { supportLevel: 'pending' }
    }
  }

  const scheduleAutosave = (key: string, payload: unknown, endpoint: string) => {
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
        const client = getAppApiClient()
        if (!client) return
        const relativePath = endpoint.replace(process.env.NEXT_PUBLIC_API_URL || '', '').replace(/^\/api\/v1/, '')
        await client.patch(relativePath, payload as Record<string, unknown>)
        const refreshed = await client.get<WorkspacePageData>(`/workspaces/${workspaceId}`)
        setWorkspace(refreshed)
      } catch (err) {
        console.error('Autosave failed', err)
      }
    }, 1200)
  }

  const restoreScriptureLookupCache = async (workspaceData?: WorkspacePageData | null): Promise<boolean> => {
    try {
      const client = getAppApiClient()
      if (!client) return false
      const data = await client.get<Record<string, unknown>>(`/workspaces/${workspaceId}/scripture-cache`)
      if (data) {
        if (data.wordStudy) {
          const cachedWordStudy = data.wordStudy as Record<string, unknown>
          const workspaceLanguage = String((workspaceData || workspace)?.language || '').toLowerCase()
          const currentResponseLanguage =
            workspaceLanguage.startsWith('es') ||
            workspaceLanguage.includes('spanish') ||
            workspaceLanguage.includes('espanol') ||
            workspaceLanguage.includes('español')
              ? 'es'
              : 'en'
          const cachedResponseLanguage = String(cachedWordStudy.responseLanguage || 'en').toLowerCase()
          const canReuseWordStudyPayload = cachedResponseLanguage === currentResponseLanguage
          setWordStudyWord(String(cachedWordStudy.word || ''))
          setWordStudyLastLookup(String(cachedWordStudy.word || ''))
          setWordStudyLanguage(String(cachedWordStudy.language || 'greek'))
          setWordStudyResult(
            canReuseWordStudyPayload ? ((cachedWordStudy.result as Record<string, unknown>) || null) : null,
          )
          setWordStudyInsights(
            canReuseWordStudyPayload ? ((cachedWordStudy.insights as Record<string, unknown>) || null) : null,
          )
        }
        if (data.crossReferences) {
          const cachedCrossReferences = data.crossReferences as Record<string, unknown>
          setCrossRefVerse(String(cachedCrossReferences.verse || ''))
          setCrossRefLastLookup(String(cachedCrossReferences.verse || ''))
          const ranked = Array.isArray(cachedCrossReferences.ranked) ? cachedCrossReferences.ranked : []
          setCrossRefResults(ranked)
          setCrossRefHasScriptureResults(ranked.length > 0)
        }

        const history: ScriptureLookupSnapshot[] = Array.isArray(data.lookupHistory) ? data.lookupHistory : []
        const normalizedHistory = history
          .filter((entry) => entry?.scriptureLastLookup && entry?.scriptureResult)
          .map((entry) => buildScriptureSnapshot(entry))
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
          const cachedScripture = data as Record<string, unknown>
          const legacySnapshot = buildScriptureSnapshot({
            scriptureResult: cachedScripture.scriptureResult as WorkspaceScriptureResult | Record<string, unknown> | string | null,
            scriptureLastLookup: String(cachedScripture.scriptureLastLookup || ''),
            scriptureQuery: String(cachedScripture.scriptureQuery || cachedScripture.scriptureLastLookup || ''),
            scriptureTranslation: String(cachedScripture.scriptureTranslation || fallbackTranslation),
            parallelTranslations: String(cachedScripture.parallelTranslations || cachedScripture.scriptureTranslation || fallbackTranslation),
            parallelResults: Array.isArray(cachedScripture.parallelResults) ? cachedScripture.parallelResults : [],
            contextData: (cachedScripture.contextData as WorkspaceSectionData) || null,
            structuralAnalysis: (cachedScripture.structuralAnalysis as StructuralAnalysisData | null) || null,
            interpretiveChallenges: (cachedScripture.interpretiveChallenges as InterpretiveChallengeData | null) || null,
            perVerseContext: (cachedScripture.perVerseContext as VerseContextData | null) || null,
            passageSummary: (cachedScripture.passageSummary as PassageSummaryData | null) || null,
            studySynthesis: (cachedScripture.studySynthesis as StudySynthesisData | null) || null,
            canonicalThemes: (cachedScripture.canonicalThemes as CanonicalThemesData | null) || null,
            verseCommentary: (cachedScripture.verseCommentary as VerseCommentaryData | null) || null,
            translationComparison: (cachedScripture.translationComparison as TranslationComparisonData | null) || null,
            cachedAt: String(cachedScripture.cachedAt || ''),
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

  const saveScriptureLookupCache = async (data: Partial<ScriptureLookupSnapshot> & { cachedAt: string }) => {
    try {
      const client = getAppApiClient()
      if (!client) return
      await client.patch(`/workspaces/${workspaceId}/scripture-cache`, data)
    } catch (err) {
      console.error('Failed to save scripture cache:', err)
    }
  }

  const persistSupplementalStudyCache = async (partial: Partial<ScriptureLookupSnapshot>) => {
    await saveScriptureLookupCache({
      ...partial,
      cachedAt: new Date().toISOString(),
    } as Partial<ScriptureLookupSnapshot> & { cachedAt: string })
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
        theologicalLens: 'adventist',
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
    if (!editingManuscriptId) return
    scheduleAutosave(
      `manuscript-${editingManuscriptId}`,
      { content: { formatVersion: 'v2', text: manuscriptDraft, cues: manuscriptCueDraft } },
      `${process.env.NEXT_PUBLIC_API_URL}/workspaces/manuscripts/${editingManuscriptId}`,
    )
  }, [editingManuscriptId, manuscriptDraft, manuscriptCueDraft])

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
    const metadataSession = getWorkspaceCoachSession(workspace)
    if (metadataSession && !socraticCoachSession) {
      setSocraticCoachSession(metadataSession)
    }
    const metadataFeedback = getWorkspaceCoachFeedback(workspace)
    const metadataFeedbackId = String(metadataFeedback?.questionId || '').trim()
    if (metadataFeedbackId) {
      setCoachFeedback((prev) => ({ ...prev, [metadataFeedbackId]: metadataFeedback }))
    }
  }, [workspace, socraticCoachSession])

  useEffect(() => {
    if (!repairJob?.jobId || !repairJob?.manuscriptId) return
    const config = withToken()
    if (!config) return

    const poll = async () => {
      try {
        const client = getAppApiClient()
        if (!client) return
        const data = await client.get<Record<string, unknown>>(
          `/workspaces/${workspaceId}/manuscripts/${repairJob.manuscriptId}/repair/jobs/${repairJob.jobId}`,
        )
        const nextStatus = String(data.status || data.state || '').toLowerCase()
        setRepairJob((prev) =>
          prev
            ? {
                ...prev,
                status: nextStatus || prev.status,
                state: String(data.state || prev.state || ''),
                message: String(data.message || ''),
              }
            : prev,
        )

        if (nextStatus === 'completed') {
          const refreshedWorkspace = await client.get<WorkspacePageData>(`/workspaces/${workspaceId}`)
          setWorkspace(refreshedWorkspace)
          const refreshedManuscript = (refreshedWorkspace?.manuscripts || []).find(
            (item: WorkspaceManuscriptRecord) => String(item?.id || '') === String(repairJob.manuscriptId || ''),
          )
          if (refreshedManuscript?.id) {
            const repairedCount = Array.isArray(refreshedManuscript?.content?.metadata?.quality?.repairedIssues)
              ? refreshedManuscript.content.metadata.quality.repairedIssues.length
              : 0
            const remainingCount = Array.isArray(refreshedManuscript?.content?.metadata?.quality?.remainingIssues)
              ? refreshedManuscript.content.metadata.quality.remainingIssues.length
              : 0
            const lastRepairedAt = String(
              refreshedManuscript?.content?.metadata?.repair?.lastRepairedAt || new Date().toISOString(),
            )
            setLastRepairNotice({
              manuscriptId: refreshedManuscript.id,
              repairedCount,
              remainingCount,
              lastRepairedAt,
            })
            setManuscriptQualityExpanded((prev) => ({
              ...prev,
              [String(refreshedManuscript.id)]: true,
            }))
          }
          setError(null)
          setRepairJob(null)
        } else if (nextStatus === 'failed') {
          setError(String(data.error || 'Repair job failed.'))
          setRepairJob(null)
        }
      } catch (err) {
        console.error('Failed to poll repair job status', err)
        setError('Unable to track repair progress.')
        setRepairJob(null)
      }
    }

    poll()
    const timer = window.setInterval(poll, 2000)
    return () => window.clearInterval(timer)
  }, [repairJob?.jobId, repairJob?.manuscriptId, workspaceId])

  useEffect(() => {
    if (!generationJob?.jobId) return
    const config = withToken()
    if (!config) return
    const capability = generationJob.capability

    const poll = async () => {
      try {
        const client = getAppApiClient()
        if (!client) return
        const data = await client.get<Record<string, unknown>>(`/workspaces/${workspaceId}/jobs/${generationJob.jobId}`)
        const nextStatus = String(data.status || data.state || '').toLowerCase()
        setGenerationJob((prev) =>
          prev
            ? {
                ...prev,
                status: nextStatus || prev.status,
                state: String(data.state || prev.state || ''),
                message: String(data.message || ''),
              }
            : prev,
        )

        if (nextStatus === 'completed') {
          await refreshWorkspaceState(config)
          if (capability === 'sermon-core') {
            setSermonCoreGenerating(false)
          }
          setGenerationJob(null)
          setActionLoading((prev) => prev.filter((item) => item !== capability))
        } else if (nextStatus === 'failed') {
          setError(String(data.error || 'Generation job failed.'))
          if (capability === 'sermon-core') {
            setSermonCoreGenerating(false)
          }
          setGenerationJob(null)
          setActionLoading((prev) => prev.filter((item) => item !== capability))
        }
      } catch (err) {
        console.error('Failed to poll generation job status', err)
        setError('Unable to track generation progress.')
        if (capability === 'sermon-core') {
          setSermonCoreGenerating(false)
        }
        setGenerationJob(null)
        setActionLoading((prev) => prev.filter((item) => item !== capability))
      }
    }

    poll()
    const timer = window.setInterval(poll, 2000)
    return () => window.clearInterval(timer)
  }, [generationJob?.jobId, generationJob?.capability, workspaceId])

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

  const escapeManuscriptHtml = (value: string) =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const formatManuscriptInline = (value: string) =>
    escapeManuscriptHtml(value)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s>])\*(.*?)\*/g, '$1<em>$2</em>')

  const normalizeManuscriptCues = (raw: Record<string, unknown> | null | undefined): ManuscriptCues => {
    const cues = emptyManuscriptCues()
    if (!raw || typeof raw !== 'object') return cues
    const mapping: Record<string, keyof ManuscriptCues> = {
      slide: 'slide',
      keyline: 'keyLine',
      key_line: 'keyLine',
      transition: 'transition',
      pause: 'pause',
      read: 'read',
      quote: 'quote',
      cta: 'cta',
      calltoaction: 'cta',
      call_to_action: 'cta',
    }
    Object.entries(raw).forEach(([key, value]) => {
      const normalizedKey = String(key).toLowerCase().replace(/\s+/g, '')
      const bucket = mapping[normalizedKey] || mapping[String(key).toLowerCase()]
      if (!bucket || !Array.isArray(value)) return
      cues[bucket] = value.map((item) => String(item || '').trim()).filter(Boolean)
    })
    return cues
  }

  const isManuscriptV2 = (manuscript: WorkspaceManuscriptRecord | null | undefined) =>
    String(manuscript?.content?.formatVersion || '').toLowerCase() === 'v2'

  const hasCueContent = (cues: ManuscriptCues) =>
    Object.values(cues).some((list) => Array.isArray(list) && list.length > 0)

  const manuscriptOptionsDrifted = (options: Record<string, unknown> | null | undefined) => {
    if (!options || typeof options !== 'object') return false
    const generatedTone = String(options.tone || 'teaching').toLowerCase()
    const generatedFormat = String(options.format || 'full').toLowerCase() === 'notes' ? 'notes' : 'full'
    const generatedTargetMinutes = Number(options.targetMinutes || 22)
    const generatedSlideCues = options.includeSlideCues !== false
    const generatedKeyLines = options.includeKeyLines !== false
    const currentAudience =
      manuscriptAudienceMode === 'default'
        ? String(workspace?.audienceProfile || 'general congregation')
        : String(manuscriptAudienceMode || 'general congregation')
    const generatedAudience = String(options.audienceMode || '')

    return (
      generatedTone !== String(manuscriptTone || 'teaching').toLowerCase() ||
      generatedFormat !== manuscriptFormat ||
      generatedTargetMinutes !== manuscriptTargetMinutes ||
      generatedSlideCues !== manuscriptIncludeSlideCues ||
      generatedKeyLines !== manuscriptIncludeKeyLines ||
      generatedAudience !== currentAudience
    )
  }

  const getManuscriptQualityUi = (manuscript: WorkspaceManuscriptRecord | null | undefined) => {
    const quality = manuscript?.content?.metadata?.quality || {}
    const status = String(quality?.status || '').toLowerCase()
    const repairedIssues = Array.isArray(quality?.repairedIssues) ? quality.repairedIssues : []
    if (repairedIssues.length > 0) {
      return { label: 'Auto-Repaired', className: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40' }
    }
    if (status === 'ok') {
      return { label: 'OK', className: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/40' }
    }
    return { label: 'Needs Review', className: 'bg-amber-500/15 text-amber-200 border-amber-400/40' }
  }

  const getRepairAuditTrail = (manuscript: WorkspaceManuscriptRecord | null | undefined) => {
    const entries = manuscript?.content?.metadata?.repair?.auditTrail
    return Array.isArray(entries) ? entries : []
  }

  const summarizeRepairSnippet = (value: string, max = 220) => {
    const clean = String(value || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (!clean) return 'No snippet was captured for this repair action.'
    return clean.length > max ? `${clean.slice(0, max)}…` : clean
  }

  const normalizeRepairSnippetRaw = (value: string) =>
    String(value || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  const getRepairedAuditItems = (manuscript: WorkspaceManuscriptRecord | null | undefined) =>
    getRepairAuditTrail(manuscript).filter(
      (item) => isRecord(item) && String(item['result'] || '').toLowerCase() === 'repaired',
    ) as Array<{
      issueId?: string
      afterSnippet?: string
      beforeSnippet?: string
      anchor?: string
      result?: string
    }>

  const getRepairItemMatchQuery = (entry: { afterSnippet?: string; beforeSnippet?: string; anchor?: string } | null | undefined) => {
    const primary = String(entry?.afterSnippet || entry?.beforeSnippet || '').trim()
    const clean = primary
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (!clean) return String(entry?.anchor || '').trim()
    const shortProbe = clean.slice(0, Math.min(120, clean.length)).trim()
    return shortProbe || clean
  }

  const tokenizeDiffText = (value: string) =>
    String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)

  const buildWordDiff = (before: string, after: string) => {
    const left = tokenizeDiffText(before)
    const right = tokenizeDiffText(after)
    const m = left.length
    const n = right.length
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

    for (let i = m - 1; i >= 0; i -= 1) {
      for (let j = n - 1; j >= 0; j -= 1) {
        dp[i][j] = left[i] === right[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }

    const removed: string[] = []
    const added: string[] = []
    let i = 0
    let j = 0
    while (i < m && j < n) {
      if (left[i] === right[j]) {
        i += 1
        j += 1
        continue
      }
      if (dp[i + 1][j] >= dp[i][j + 1]) {
        removed.push(left[i])
        i += 1
      } else {
        added.push(right[j])
        j += 1
      }
    }
    while (i < m) {
      removed.push(left[i])
      i += 1
    }
    while (j < n) {
      added.push(right[j])
      j += 1
    }

    return {
      removedText: removed.join(' ').trim(),
      addedText: added.join(' ').trim(),
    }
  }

  const escapeHtml = (value: string) =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const buildInlineWordDiff = (before: string, after: string) => {
    const left = tokenizeDiffText(before)
    const right = tokenizeDiffText(after)
    const m = left.length
    const n = right.length
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

    for (let i = m - 1; i >= 0; i -= 1) {
      for (let j = n - 1; j >= 0; j -= 1) {
        dp[i][j] = left[i] === right[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }

    const beforeTokens: Array<{ text: string; kind: 'same' | 'removed' }> = []
    const afterTokens: Array<{ text: string; kind: 'same' | 'added' }> = []
    let i = 0
    let j = 0
    while (i < m && j < n) {
      if (left[i] === right[j]) {
        beforeTokens.push({ text: left[i], kind: 'same' })
        afterTokens.push({ text: right[j], kind: 'same' })
        i += 1
        j += 1
        continue
      }
      if (dp[i + 1][j] >= dp[i][j + 1]) {
        beforeTokens.push({ text: left[i], kind: 'removed' })
        i += 1
      } else {
        afterTokens.push({ text: right[j], kind: 'added' })
        j += 1
      }
    }
    while (i < m) {
      beforeTokens.push({ text: left[i], kind: 'removed' })
      i += 1
    }
    while (j < n) {
      afterTokens.push({ text: right[j], kind: 'added' })
      j += 1
    }

    const toHtml = (
      tokens: Array<{ text: string; kind: 'same' | 'removed' | 'added' }>,
      highlight: 'removed' | 'added',
    ) =>
      tokens
        .map((token) => {
          const safe = escapeHtml(token.text)
          if (token.kind === highlight) {
            const cls =
              highlight === 'removed'
                ? 'bg-rose-500/15 text-rose-200 line-through rounded px-0.5'
                : 'bg-emerald-500/15 text-emerald-200 rounded px-0.5'
            return `<span class="${cls}">${safe}</span>`
          }
          return safe
        })
        .join(' ')

    return {
      beforeHtml: toHtml(beforeTokens as Array<{ text: string; kind: 'same' | 'removed' | 'added' }>, 'removed'),
      afterHtml: toHtml(afterTokens as Array<{ text: string; kind: 'same' | 'removed' | 'added' }>, 'added'),
    }
  }

  const cueLabelMap: Record<keyof ManuscriptCues, string> = {
    slide: 'Slide Cues',
    keyLine: 'Key Lines',
    transition: 'Transitions',
    pause: 'Pauses',
    read: 'Scripture Readings',
    quote: 'Key Quotes',
    cta: 'Appeals / CTA',
  }

  const extractLegacyCues = (text: string) => {
    const cues = emptyManuscriptCues()
    const cueMapping: Record<string, keyof ManuscriptCues> = {
      slide: 'slide',
      keyline: 'keyLine',
      transition: 'transition',
      pause: 'pause',
      read: 'read',
      quote: 'quote',
      cta: 'cta',
      calltoaction: 'cta',
    }

    const stripped = String(text || '').replace(
      /\[(Slide|Key\s*Line|Transition|Pause|Read|Quote|CTA|Call\s*to\s*Action)\]\s*([^\n]*)/gi,
      (_match, rawType, rawCue) => {
        const normalized = String(rawType || '').toLowerCase().replace(/\s+/g, '')
        const bucket = cueMapping[normalized]
        const cueText = String(rawCue || '').trim()
        if (bucket && cueText) cues[bucket].push(cueText)
        return cueText
      },
    )

    return { cues, strippedText: stripped }
  }

  const markdownLikeToHtml = (rawText: string) => {
    const normalized = String(rawText || '').replace(/\r\n/g, '\n').trim()
    if (!normalized) return '<p></p>'

    const lines = normalized.split('\n')
    const htmlBlocks: string[] = []
    let paragraphLines: string[] = []

    const flushParagraph = () => {
      if (!paragraphLines.length) return
      htmlBlocks.push(`<p>${formatManuscriptInline(paragraphLines.join(' '))}</p>`)
      paragraphLines = []
    }

    const flushList = (items: string[], ordered: boolean) => {
      if (!items.length) return
      const tag = ordered ? 'ol' : 'ul'
      htmlBlocks.push(
        `<${tag}>${items.map((item) => `<li>${formatManuscriptInline(item)}</li>`).join('')}</${tag}>`,
      )
    }

    const isSectionTitle = (line: string) =>
      /^(Introducción|Introduction|Lectura(?: del pasaje principal)?|Reading|Contexto(?: literario y histórico)?|Context|Aplicación(?: práctica)?|Application|Ilustración|Illustration|Conclusión|Conclusion|Llamado|Appeal|Transición|Transition|Oración final|Closing prayer)\b/i.test(
        line,
      )

    const isMajorSectionTitle = (line: string) =>
      /^(Introducción|Introduction|Lectura(?: del pasaje principal)?|Reading|Contexto(?: literario y histórico)?|Context|Aplicación(?: práctica)?|Application|Ilustración|Illustration|Conclusión|Conclusion|Llamado|Appeal|Oración final|Closing prayer)\b/i.test(
        line,
      )

    const isMinorSectionTitle = (line: string) =>
      /^(Transición|Transition|Explicación|Explanation|Ilustración|Illustration|Pregunta|Question|Respuesta|Response|Invitación|Invitation)\b/i.test(
        line,
      )

    const isShortTitleCaseLine = (line: string) =>
      line.length <= 90 &&
      !/[.!?]$/.test(line) &&
      !/^[-*•]/.test(line) &&
      !/^\d+\s/.test(line) &&
      /^[A-ZÁÉÍÓÚÑÜ].*/.test(line)

    const isScriptureReference = (line: string) =>
      /^(<em>)?[A-Za-zÁÉÍÓÚÑÜáéíóúñü0-9 .:-]+\(([^)]+)\)(<\/em>)?$/.test(line) ||
      /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü. ]+\d+:\d+(?:-\d+)?(?:\s*\([^)]+\))?$/.test(line)

    const isVerseBlockLine = (line: string) =>
      /^\d+\s/.test(line) || /^[“"'\(]?\d+[:.]/.test(line)

    const isLabeledCallout = (line: string) =>
      /^(Explicación|Aplicación|Ilustración|Transición|Pregunta|Oración|Llamado|Contexto|Idea clave|Verdad central)\s*:/i.test(
        line,
      )

    for (let index = 0; index < lines.length; index += 1) {
      const rawLine = lines[index]
      const line = rawLine.trim()

      if (!line) {
        flushParagraph()
        continue
      }

      const markdownHeading = line.match(/^(#{1,3})\s+(.+)$/)
      if (markdownHeading) {
        flushParagraph()
        const level = Math.min(3, Math.max(1, markdownHeading[1].length))
        const tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4'
        htmlBlocks.push(`<${tag}>${formatManuscriptInline(markdownHeading[2].trim())}</${tag}>`)
        continue
      }

      const boldHeading = line.match(/^\*\*([^*]+)\*\*$/)
      if (boldHeading) {
        flushParagraph()
        htmlBlocks.push(`<h3>${formatManuscriptInline(boldHeading[1].trim())}</h3>`)
        continue
      }

      const numberedPoint = line.match(/^(\d+)[\.\)]\s+(.+)/)
      if (numberedPoint && numberedPoint[2].length <= 120) {
        flushParagraph()
        htmlBlocks.push(`<h3>${formatManuscriptInline(`${numberedPoint[1]}. ${numberedPoint[2].trim()}`)}</h3>`)
        continue
      }

      if (isSectionTitle(line) || (isShortTitleCaseLine(line) && lines[index + 1]?.trim().length > 90)) {
        flushParagraph()
        const cleanedTitle = formatManuscriptInline(line.replace(/[:.]$/, ''))
        if (isMajorSectionTitle(line)) {
          htmlBlocks.push(`<h2 class="manuscript-section-title">${cleanedTitle}</h2>`)
        } else if (isMinorSectionTitle(line)) {
          htmlBlocks.push(`<h3 class="manuscript-subsection-title">${cleanedTitle}</h3>`)
        } else {
          htmlBlocks.push(`<h3 class="manuscript-subsection-title">${cleanedTitle}</h3>`)
        }
        continue
      }

      if (isScriptureReference(line)) {
        flushParagraph()
        htmlBlocks.push(`<p class="manuscript-scripture-ref"><em>${formatManuscriptInline(line)}</em></p>`)
        continue
      }

      if (isLabeledCallout(line)) {
        flushParagraph()
        const [label, ...rest] = line.split(':')
        htmlBlocks.push(
          `<p class="manuscript-callout"><strong>${formatManuscriptInline(label)}:</strong>${rest.length ? ` ${formatManuscriptInline(rest.join(':').trim())}` : ''}</p>`,
        )
        continue
      }

      if (/^[-*•]\s+/.test(line)) {
        flushParagraph()
        const items: string[] = [line.replace(/^[-*•]\s+/, '').trim()]
        while (index + 1 < lines.length && /^[-*•]\s+/.test(lines[index + 1].trim())) {
          index += 1
          items.push(lines[index].trim().replace(/^[-*•]\s+/, '').trim())
        }
        flushList(items, false)
        continue
      }

      if (/^\d+[\.\)]\s+/.test(line)) {
        flushParagraph()
        const items: string[] = [line.replace(/^\d+[\.\)]\s+/, '').trim()]
        while (index + 1 < lines.length && /^\d+[\.\)]\s+/.test(lines[index + 1].trim())) {
          index += 1
          items.push(lines[index].trim().replace(/^\d+[\.\)]\s+/, '').trim())
        }
        flushList(items, true)
        continue
      }

      if (isVerseBlockLine(line)) {
        flushParagraph()
        const verseLines = [line]
        while (index + 1 < lines.length) {
          const next = lines[index + 1].trim()
          if (!next || isSectionTitle(next) || isScriptureReference(next) || /^#{1,3}\s+/.test(next)) break
          if (isVerseBlockLine(next) || paragraphLines.length === 0) {
            index += 1
            verseLines.push(next)
            continue
          }
          break
        }
        htmlBlocks.push(
          `<blockquote class="manuscript-scripture-block">${verseLines
            .map((verseLine) => `<p>${formatManuscriptInline(verseLine)}</p>`)
            .join('')}</blockquote>`,
        )
        continue
      }

      paragraphLines.push(line)
    }

    flushParagraph()

    return htmlBlocks.join('\n')
  }

  const toV2ManuscriptDraft = (manuscript: WorkspaceManuscriptRecord | null | undefined) => {
    if (isManuscriptV2(manuscript)) {
      return {
        html: ensureManuscriptRichHtml(String(manuscript?.content?.text || ''), markdownLikeToHtml),
        cues: normalizeManuscriptCues(manuscript?.content?.cues),
      }
    }
    const legacyText = String(manuscript?.content?.text || '')
    const extracted = extractLegacyCues(legacyText)
    return {
      html: markdownLikeToHtml(extracted.strippedText),
      cues: extracted.cues,
    }
  }

  const sanitizeManuscriptForDisplay = (text: string) => {
    const cueLabelMap: Record<string, string> = {
      slide: 'Key Cue',
      keyline: 'Key Line',
      transition: 'Key Transition',
      pause: 'Key Pause',
      visual: 'Key Visual',
      read: 'Scripture Reading',
      quote: 'Key Quote',
      cta: 'Key Appeal',
      calltoaction: 'Key Appeal',
    }

    const normalizedCueLabel = (rawCue: string) => {
      const key = rawCue.toLowerCase().replace(/\s+/g, '')
      return cueLabelMap[key] || 'Key Cue'
    }

    const replaceCueTag = (_match: string, cueType: string, cueText?: string) => {
      const label = normalizedCueLabel(cueType)
      const cleanText = String(cueText || '').trim()
      return cleanText ? `${label}: ${cleanText}` : `${label}:`
    }

    return String(text || '')
      // Replace explicit cue tags with readable labels.
      .replace(/\[(Slide|Key\s*Line|Transition|Pause|Visual|Read|Quote|CTA|Call\s*to\s*Action)\]\s*([^\n]*)/gi, replaceCueTag)
      // Handle markdown-bold wrapped cue tags like **[Slide] text** to avoid leftover asterisks.
      .replace(/\*\*\s*\[(Slide|Key\s*Line|Transition|Pause|Visual|Read|Quote|CTA|Call\s*to\s*Action)\]\s*([^*]*)\*\*/gi, replaceCueTag)
      // Remove any remaining unknown standalone bracket cues.
      .replace(/^\s*\[[^\]]+\]\s*/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  const cueIconMap: Record<keyof ManuscriptCues, string> = {
    slide: '🖼️',
    keyLine: '💬',
    transition: '➡️',
    pause: '⏸️',
    read: '📖',
    quote: '✨',
    cta: '🎯',
  }

  const cueColorMap: Record<keyof ManuscriptCues, { border: string; bg: string; text: string }> = {
    slide: { border: 'border-purple-400/40', bg: 'bg-purple-500/10', text: 'text-purple-200' },
    keyLine: { border: 'border-cyan-400/40', bg: 'bg-cyan-500/10', text: 'text-cyan-200' },
    transition: { border: 'border-blue-400/40', bg: 'bg-blue-500/10', text: 'text-blue-200' },
    pause: { border: 'border-amber-400/40', bg: 'bg-amber-500/10', text: 'text-amber-200' },
    read: { border: 'border-emerald-400/40', bg: 'bg-emerald-500/10', text: 'text-emerald-200' },
    quote: { border: 'border-pink-400/40', bg: 'bg-pink-500/10', text: 'text-pink-200' },
    cta: { border: 'border-orange-400/40', bg: 'bg-orange-500/10', text: 'text-orange-200' },
  }

  const normalizeCueSearchText = (value: string) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()

  const applyManuscriptHighlight = (element: HTMLElement, tone: 'exact' | 'approximate' = 'exact') => {
    const previous = highlightedCueElementRef.current
    if (previous.element) {
      previous.element.style.backgroundColor = previous.backgroundColor
      previous.element.style.transition = previous.transition
    }
    highlightedCueElementRef.current = {
      element,
      backgroundColor: element.style.backgroundColor,
      transition: element.style.transition,
    }
    element.style.transition = 'background-color 0.2s ease'
    element.style.backgroundColor = tone === 'exact' ? 'rgba(250, 204, 21, 0.45)' : 'rgba(251, 191, 36, 0.38)'
  }

  const cueAnchorKey = (cueType: keyof ManuscriptCues, cueIndex: number) => `${cueType}:${cueIndex}`

  const cueParagraphHash = (value: string) => {
    const normalized = normalizeCueSearchText(value)
    if (!normalized) return ''
    let hash = 0
    for (let i = 0; i < normalized.length; i += 1) {
      hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0
    }
    return `h${hash.toString(16)}`
  }

  const scoreCueMatch = (cueText: string, candidateText: string) => {
    const cueNorm = normalizeCueSearchText(cueText)
    const candNorm = normalizeCueSearchText(candidateText)
    if (!cueNorm || !candNorm) return 0
    if (candNorm.includes(cueNorm)) return 1
    const probe = cueNorm.slice(0, Math.min(90, cueNorm.length))
    if (probe && candNorm.includes(probe)) return 0.92
    const cueTokens = cueNorm.split(' ').filter(Boolean)
    const candTokens = new Set(candNorm.split(' ').filter(Boolean))
    if (!cueTokens.length || !candTokens.size) return 0
    const overlap = cueTokens.filter((token) => candTokens.has(token)).length
    return overlap / cueTokens.length
  }

  const buildCueAnchorsFromHtml = (html: string, cues: ManuscriptCues): Record<string, CueAnchor> => {
    if (typeof window === 'undefined') return {}
    const parser = new DOMParser()
    const doc = parser.parseFromString(String(html || ''), 'text/html')
    const blocks = Array.from(doc.body.querySelectorAll<HTMLElement>('h1,h2,h3,h4,p,li,blockquote'))
      .map((element, index) => ({
        index,
        text: String(element.textContent || '').trim(),
      }))
      .filter((item) => item.text)

    const anchors: Record<string, CueAnchor> = {}
    ;(['slide', 'keyLine', 'transition', 'pause', 'read', 'quote', 'cta'] as Array<keyof ManuscriptCues>).forEach((cueType) => {
      cues[cueType].forEach((cueText, cueIndex) => {
        let bestIndex = -1
        let bestText = ''
        let bestScore = 0
        blocks.forEach((block) => {
          const score = scoreCueMatch(cueText, block.text)
          if (score > bestScore) {
            bestScore = score
            bestIndex = block.index
            bestText = block.text
          }
        })
        if (bestIndex >= 0 && bestScore >= 0.35) {
          anchors[cueAnchorKey(cueType, cueIndex)] = {
            cueType,
            cueIndex,
            excerpt: bestText.slice(0, 240),
            paragraphIndex: bestIndex,
            paragraphHash: cueParagraphHash(bestText),
            confidence: Number(bestScore.toFixed(3)),
          }
        }
      })
    })
    return anchors
  }

  const evaluateCueCoverage = (
    cues: ManuscriptCues,
    html: string,
    anchors?: Record<string, CueAnchor>,
  ): { total: number; matched: number; stale: boolean } => {
    if (typeof window === 'undefined') return { total: 0, matched: 0, stale: false }
    const parser = new DOMParser()
    const doc = parser.parseFromString(String(html || ''), 'text/html')
    const blocks = Array.from(doc.body.querySelectorAll<HTMLElement>('h1,h2,h3,h4,p,li,blockquote'))
      .map((element) => String(element.textContent || '').trim())
      .filter(Boolean)

    let total = 0
    let matched = 0
    ;(['slide', 'keyLine', 'transition', 'pause', 'read', 'quote', 'cta'] as Array<keyof ManuscriptCues>).forEach((cueType) => {
      cues[cueType].forEach((cueText, cueIndex) => {
        total += 1
        const key = cueAnchorKey(cueType, cueIndex)
        const anchor = anchors?.[key]
        if (anchor && blocks[anchor.paragraphIndex] && cueParagraphHash(blocks[anchor.paragraphIndex]) === anchor.paragraphHash) {
          matched += 1
          return
        }
        const bestScore = blocks.reduce((max, blockText) => Math.max(max, scoreCueMatch(cueText, blockText)), 0)
        if (bestScore >= 0.55) matched += 1
      })
    })

    const stale = total > 0 ? matched / total < 0.7 : false
    return { total, matched, stale }
  }

  const focusCueInManuscript = (
    manuscriptId: string,
    cueText: string,
    cueType: keyof ManuscriptCues,
    cueIndex: number,
    cueAnchors?: Record<string, CueAnchor>,
  ) => {
    const container = manuscriptContentRefs.current[manuscriptId]
    if (!container) return

    const candidates = Array.from(container.querySelectorAll<HTMLElement>('h1,h2,h3,h4,p,li,blockquote'))
    const anchor = cueAnchors?.[cueAnchorKey(cueType, cueIndex)]
    if (anchor && candidates[anchor.paragraphIndex]) {
      const direct = candidates[anchor.paragraphIndex]
      const directHash = cueParagraphHash(direct.textContent || '')
      if (directHash === anchor.paragraphHash) {
        direct.scrollIntoView({ behavior: 'smooth', block: 'center' })
        applyManuscriptHighlight(direct, 'exact')
        return
      }
    }

    const normalizedCue = normalizeCueSearchText(cueText)
    if (!normalizedCue) return
    const probe = normalizedCue.slice(0, Math.min(90, normalizedCue.length))
    const target = candidates.find((element) => {
      const normalizedElementText = normalizeCueSearchText(element.textContent || '')
      return normalizedElementText.includes(probe)
    })

    if (!target) {
      const fuzzy = candidates
        .map((element) => ({
          element,
          score: scoreCueMatch(cueText, element.textContent || ''),
        }))
        .sort((a, b) => b.score - a.score)[0]
      if (fuzzy && fuzzy.score >= 0.45) {
        fuzzy.element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        applyManuscriptHighlight(fuzzy.element, 'approximate')
        setError('Approximate cue match used after manual edits.')
        return
      }
      setError('No matching manuscript section found for that cue yet.')
      return
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    applyManuscriptHighlight(target, 'exact')
  }

  const focusSearchQueryInManuscript = (manuscriptId: string | null, query: string) => {
    const normalizedQuery = normalizeCueSearchText(query)
    if (!normalizedQuery) return false

    const ids = manuscriptId ? [manuscriptId] : Object.keys(manuscriptContentRefs.current)
    for (const id of ids) {
      const container = manuscriptContentRefs.current[id]
      if (!container) continue
      const candidates = Array.from(container.querySelectorAll<HTMLElement>('h1,h2,h3,h4,p,li,blockquote'))
      const exactTarget = candidates.find((element) =>
        normalizeCueSearchText(element.textContent || '').includes(normalizedQuery),
      )
      if (exactTarget) {
        exactTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })
        applyManuscriptHighlight(exactTarget, 'exact')
        return true
      }
      const fuzzy = candidates
        .map((element) => ({
          element,
          score: scoreCueMatch(query, element.textContent || ''),
        }))
        .sort((a, b) => b.score - a.score)[0]
      if (fuzzy && fuzzy.score >= 0.5) {
        fuzzy.element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        applyManuscriptHighlight(fuzzy.element, 'approximate')
        return true
      }
    }
    return false
  }

  const focusRepairAuditChange = (
    manuscriptId: string,
    auditItem: { afterSnippet?: string; beforeSnippet?: string; anchor?: string } | null | undefined,
  ) => {
    const query = getRepairItemMatchQuery(auditItem)
    if (!query) {
      setError('No searchable content found for this repair action.')
      return
    }
    const found = focusSearchQueryInManuscript(manuscriptId, query)
    if (!found) {
      setError('Could not locate that repaired section in the current manuscript view.')
    }
  }

  const clearRepairMarkers = (manuscriptId: string) => {
    const container = manuscriptContentRefs.current[manuscriptId]
    if (!container) return
    const marked = Array.from(container.querySelectorAll<HTMLElement>('[data-repair-marker="true"]'))
    marked.forEach((element) => {
      element.removeAttribute('data-repair-marker')
      element.removeAttribute('data-repair-label')
      element.removeAttribute('title')
      element.style.boxShadow = ''
      element.style.backgroundColor = ''
      element.style.borderRadius = ''
      element.style.transition = ''
    })
  }

  const applyRepairMarkers = (manuscriptId: string, manuscript: WorkspaceManuscriptRecord | null | undefined) => {
    const container = manuscriptContentRefs.current[manuscriptId]
    if (!container) return
    clearRepairMarkers(manuscriptId)
    const repairedItems = getRepairedAuditItems(manuscript)
    if (!repairedItems.length) return

    const candidates = Array.from(container.querySelectorAll<HTMLElement>('h1,h2,h3,h4,p,li,blockquote'))
    repairedItems.forEach((entry: { issueId?: string; afterSnippet?: string; beforeSnippet?: string; anchor?: string }) => {
      const query = getRepairItemMatchQuery(entry)
      if (!query) return
      const normalizedQuery = normalizeCueSearchText(query)
      if (!normalizedQuery) return
      const probe = normalizedQuery.slice(0, Math.min(80, normalizedQuery.length))
      const exact = candidates.find((element) => {
        const text = normalizeCueSearchText(String(element.textContent || ''))
        return text.includes(normalizedQuery) || (probe.length >= 20 && text.includes(probe))
      })
      const target =
        exact ||
        candidates
          .map((element) => ({
            element,
            score: scoreCueMatch(query, String(element.textContent || '')),
          }))
          .sort((a, b) => b.score - a.score)
          .find((item) => item.score >= 0.5)?.element
      if (!target) return
      const issueShort = String(entry?.issueId || '').trim().slice(0, 18)
      target.setAttribute('data-repair-marker', 'true')
      target.setAttribute('data-repair-label', issueShort ? `Repaired ${issueShort}` : 'Repaired')
      target.setAttribute('title', `Repaired · ${String(entry?.issueId || 'issue')}`)
      target.style.transition = 'box-shadow 0.2s ease, background-color 0.2s ease'
      target.style.borderRadius = '0.35rem'
      target.style.boxShadow = 'inset 0 0 0 2px rgba(245, 158, 11, 0.55)'
      target.style.backgroundColor = 'rgba(245, 158, 11, 0.12)'
    })
  }

  useEffect(() => {
    if (!pendingSearchJump) return
    if (activeSection !== 'manuscript') return
    const run = window.setTimeout(() => {
      const found = focusSearchQueryInManuscript(pendingSearchJump.manuscriptId, pendingSearchJump.query)
      if (!found) {
        setError('Search result selected, but exact manuscript match is not available in current content.')
      }
      setPendingSearchJump(null)
    }, 220)
    return () => window.clearTimeout(run)
  }, [pendingSearchJump, activeSection, workspace?.manuscripts])

  useEffect(() => {
    if (activeSection !== 'manuscript') return
    const timer = window.setTimeout(() => {
      const manuscripts = workspace?.manuscripts || []
      manuscripts.forEach((manuscript) => {
        const manuscriptId = String(manuscript?.id || '')
        if (!manuscriptId) return
        if (!showRepairMarkers) {
          clearRepairMarkers(manuscriptId)
          return
        }
        applyRepairMarkers(manuscriptId, manuscript)
      })
    }, 180)
    return () => window.clearTimeout(timer)
  }, [activeSection, workspace?.manuscripts, showRepairMarkers])

  const renderManuscriptCuesPanel = (
    cues: ManuscriptCues,
    editable: boolean,
    onCueClick?: (cue: string, cueType: keyof ManuscriptCues, cueIndex: number) => void,
    options?: {
      staleInfo?: { total: number; matched: number; stale: boolean } | null
      onRegenerateCues?: () => void
      regenerating?: boolean
    },
  ) => {
    if (!hasCueContent(cues) && !editable) return null
    
    const priorityCues: Array<keyof ManuscriptCues> = ['keyLine', 'cta', 'read', 'quote']
    const secondaryCues: Array<keyof ManuscriptCues> = ['transition', 'pause', 'slide']
    
    const renderCueSection = (keys: Array<keyof ManuscriptCues>, title: string) => {
      const hasContent = keys.some(key => cues[key]?.length > 0)
      if (!hasContent && !editable) return null
      
      return (
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">{title}</p>
          {keys.map((key) => {
            const values = cues[key]
            if (!editable && values.length === 0) return null
            const colors = cueColorMap[key]
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{cueIconMap[key]}</span>
                  <p className={`text-xs font-medium ${colors.text}`}>{cueLabelMap[key]}</p>
                  {values.length > 0 && (
                    <span className="text-[10px] text-gray-500">({values.length})</span>
                  )}
                </div>
                <div className="space-y-1.5 pl-6">
                  {values.length ? values.map((item, index) => (
                    onCueClick && !editable ? (
                      <button
                        key={`${key}-${index}`}
                        type="button"
                        onClick={() => onCueClick(item, key, index)}
                        className={`w-full text-left px-3 py-2 rounded-lg border ${colors.border} ${colors.bg} text-sm leading-relaxed hover:brightness-110 transition`}
                        title="Jump to this cue in manuscript"
                      >
                        {item}
                      </button>
                    ) : (
                      <div
                        key={`${key}-${index}`}
                        className={`px-3 py-2 rounded-lg border ${colors.border} ${colors.bg} text-sm leading-relaxed`}
                      >
                        {item}
                      </div>
                    )
                  )) : editable ? (
                    <span className="text-[11px] text-gray-500 italic">None generated</span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )
    }
    
    const totalCueCount = Object.values(cues).reduce((sum, items) => sum + items.length, 0)

    return (
      <div
        className={`rounded-2xl border border-white/10 bg-gradient-to-b from-black/30 to-black/10 sticky top-4 self-start max-h-[calc(100vh-1.5rem)] overflow-y-auto transition-all duration-300 ${
          manuscriptCuesCollapsed ? 'p-2 w-16' : 'p-4 space-y-5'
        }`}
      >
        <div className={`flex ${manuscriptCuesCollapsed ? 'flex-col items-center gap-2' : 'items-center justify-between'}`}>
          {!manuscriptCuesCollapsed ? (
            <>
              <p className="text-sm font-semibold text-white">Preaching Cues</p>
              <span className="text-[10px] uppercase tracking-widest text-gray-500">Sidebar</span>
            </>
          ) : (
            <span className="text-[10px] uppercase tracking-widest text-gray-500 [writing-mode:vertical-rl] rotate-180">Cues</span>
          )}
          <button
            type="button"
            onClick={() => setManuscriptCuesCollapsed((prev) => !prev)}
            className="cyber-outline text-[10px] px-2 py-1 rounded-full"
            title={manuscriptCuesCollapsed ? 'Expand preaching cues' : 'Collapse preaching cues'}
          >
            {manuscriptCuesCollapsed ? '›' : '‹'}
          </button>
          {manuscriptCuesCollapsed ? (
            <span className="text-[10px] text-cyan-300/80">{totalCueCount}</span>
          ) : null}
        </div>
        {!manuscriptCuesCollapsed && editable && (
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Cues are generated with the manuscript based on your settings. Regenerate to update.
          </p>
        )}
        {!manuscriptCuesCollapsed && options?.staleInfo?.stale ? (
          <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 space-y-2">
            <p className="text-xs text-amber-100">
              Cues may be outdated after manual edits ({options.staleInfo.matched}/{options.staleInfo.total} matched).
            </p>
            {options.onRegenerateCues ? (
              <button
                type="button"
                onClick={options.onRegenerateCues}
                disabled={options.regenerating}
                className="cyber-outline text-xs px-3 py-1.5 rounded-full disabled:opacity-60"
              >
                {options.regenerating ? 'Regenerating Cues...' : 'Regenerate Cues'}
              </button>
            ) : null}
          </div>
        ) : null}
        {!manuscriptCuesCollapsed && (
          <>
            {renderCueSection(priorityCues, 'Key Moments')}
            {renderCueSection(secondaryCues, 'Delivery Notes')}
          </>
        )}
      </div>
    )
  }

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
      const client = getAppApiClient()
      if (!client) return
      const audioBibles = (await client.scriptureAudioBibles()) as unknown as Array<{ id?: string }>
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
      const audioRes = await client.get<Record<string, unknown>>(
        `/scripture/audio-bibles/${audioBibleId}/chapters/${chapterId}`,
      )
      
      const audioPayload = audioRes as { resourceUrl?: string }
      if (audioPayload.resourceUrl) {
        setAudioUrl(audioPayload.resourceUrl)
      } else {
        setAudioError('Audio URL not available')
      }
    } catch (error) {
      console.error('Audio load error:', error)
      setAudioError((error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load audio')
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

  const renderSmartValue = (value: unknown) => {
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

  const getOutlinePointLabel = (point: WorkspaceOutlineNode | string | null | undefined) => {
    if (typeof point === 'string') return point
    return point?.title || point?.content || point?.text || ''
  }

  const getOutlinePointNodes = (structure: WorkspaceOutlineStructure | Record<string, unknown> | null | undefined) => {
    if (!structure || typeof structure !== 'object') return []
    const typedStructure = structure as WorkspaceOutlineStructure
    if (Array.isArray(typedStructure.pointNodes) && typedStructure.pointNodes.length > 0) {
      return typedStructure.pointNodes.map((point, index: number) => ({
        id: point?.id || `point-${index + 1}`,
        title: getOutlinePointLabel(point),
        summary: typeof point?.summary === 'string' ? point.summary : '',
        movement: typeof point?.movement === 'string' ? point.movement : '',
        supportingVerses: Array.isArray(point?.supportingVerses) ? point.supportingVerses : [],
        canonicalThemes: Array.isArray(point?.canonicalThemes) ? point.canonicalThemes : [],
        crossReferences: Array.isArray(point?.crossReferences) ? point.crossReferences : [],
        subpoints: Array.isArray(point?.subpoints) ? point.subpoints : [],
        applications: Array.isArray(point?.applications) ? point.applications : [],
        discussionQuestions: Array.isArray(point?.discussionQuestions) ? point.discussionQuestions : [],
        illustrationIdeas: Array.isArray(point?.illustrationIdeas) ? point.illustrationIdeas : [],
        mediaSuggestions: Array.isArray(point?.mediaSuggestions) ? point.mediaSuggestions : [],
        egwSupport: Array.isArray(point?.egwSupport) ? point.egwSupport : [],
        references: Array.isArray(point?.references) ? point.references : [],
      }))
    }

    const fallbackPoints = Array.isArray(typedStructure.points) ? typedStructure.points : []
    return fallbackPoints.map((point, index: number) => {
      const pointObj = typeof point === 'string' ? { title: point } : (point as WorkspaceOutlineNode)
      return {
        id: `point-${index + 1}`,
        title: getOutlinePointLabel(pointObj),
        summary: '',
        movement: '',
        supportingVerses: Array.isArray(pointObj?.supportingVerses) ? pointObj.supportingVerses : [],
        canonicalThemes: Array.isArray(pointObj?.canonicalThemes) ? pointObj.canonicalThemes : [],
        crossReferences: Array.isArray(pointObj?.crossReferences) ? pointObj.crossReferences : [],
        subpoints: Array.isArray(pointObj?.subpoints) ? pointObj.subpoints : [],
        applications: Array.isArray(pointObj?.applications) ? pointObj.applications : [],
        discussionQuestions: Array.isArray(pointObj?.discussionQuestions) ? pointObj.discussionQuestions : [],
        illustrationIdeas: Array.isArray(pointObj?.illustrationIdeas) ? pointObj.illustrationIdeas : [],
        mediaSuggestions: Array.isArray(pointObj?.mediaSuggestions) ? pointObj.mediaSuggestions : [],
        egwSupport: Array.isArray(pointObj?.egwSupport) ? pointObj.egwSupport : [],
        references: Array.isArray(pointObj?.references) ? pointObj.references : [],
      }
    })
  }

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
    items: string[],
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

  const normalizeReferenceList = (items: unknown[]) =>
    (Array.isArray(items) ? items : [])
      .map((item) => {
        const normalizeConnection = (value: string) => {
          const text = String(value || '').trim()
          if (!text) return ''
          if (/^Pasaje adicional seleccionado en el workspace para apoyar la exégesis\.?$/i.test(text)) {
            return workspace?.mainPassage
              ? `Conecta con ${workspace.mainPassage} y amplía el tema central del estudio.`
              : 'Conecta con el pasaje principal y amplía el tema central del estudio.'
          }
          if (/^Additional passage selected in workspace to support exegesis\.?$/i.test(text)) {
            return workspace?.mainPassage
              ? `Connects with ${workspace.mainPassage} and expands the study's central theme.`
              : 'Connects with the main passage and expands the study’s central theme.'
          }
          return text
        }
        if (typeof item === 'string') {
          return { reference: item.trim(), context: '' }
        }
        const itemObj = item as Record<string, unknown>
        return {
          reference: String(itemObj.reference || '').trim(),
          context: normalizeConnection(String(itemObj.context || itemObj.connection || '')),
        }
      })
      .filter((item): item is { reference: string; context: string } => Boolean((item as { reference?: string }).reference))

  const parsePassageForEgwPanel = (reference: string) => {
    const match = String(reference || '').trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/)
    if (!match) return null
    return {
      book: match[1].trim(),
      chapter: Number(match[2]),
      verseStart: match[3] ? Number(match[3]) : undefined,
      verseEnd: match[4] ? Number(match[4]) : undefined,
    }
  }

  const openReferencePreview = async (reference: string, context?: string) => {
    const normalized = String(reference || '')
      .replace(/[–—]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
    if (!normalized) return
    setReferencePreview({ reference: normalized, text: '', context, loading: true })

    const config = withToken()
    if (!config) {
      setReferencePreview(null)
      return
    }

    try {
      const translation = workspace?.language === 'es' ? 'RVR1960' : 'KJV'
      const client = getAppApiClient()
      if (!client) return
      const response = await client.scripturalPassageWithContext(normalized, translation)
      const normalizedResult = normalizeScriptureResult(response, normalized, translation)
      const verses = extractVerses(normalizedResult || response)
      const text = verses
        .map((item) => item?.text || '')
        .filter(Boolean)
        .join(' ')
      setReferencePreview({ reference: normalized, text: text || 'Passage text not available.', context, loading: false })
    } catch (error) {
      console.error('Failed to load reference preview', error)
      setReferencePreview({ reference: normalized, text: 'Unable to load passage text.', context, loading: false })
    }
  }

  const renderOutlinePointSection = (
    label: string,
    items: string[] | undefined,
    key: string,
    colorClass = 'text-gray-200',
    onItemClick?: (value: string) => void,
  ) => {
    const values = (Array.isArray(items) ? items : []).map((item: string) => String(item).trim()).filter(Boolean)
    if (!values.length) return null

    return (
      <div className="mt-3">
        <p className="text-[10px] uppercase tracking-widest text-cyan-300/90 mb-2">{label}</p>
        {onItemClick ? (
          <div className="flex flex-wrap gap-2">
            {values.map((item, index) => (
              <button
                key={`${key}-${index}`}
                onClick={() => onItemClick(item)}
                className="text-xs px-2 py-1 rounded-full border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/10"
              >
                {item}
              </button>
            ))}
          </div>
        ) : (
          renderCompactList(values, key, '', colorClass)
        )}
      </div>
    )
  }

  const isStudyAssetLoading = (asset: 'report' | 'applications' | 'questions' | 'illustrations' | 'media' | 'egw' | 'references') => {
    if (asset === 'report') return actionLoading.includes('study-report')
    if (asset === 'applications') return actionLoading.includes('applications')
    if (asset === 'questions') return actionLoading.includes('questions')
    if (asset === 'illustrations') return actionLoading.includes('illustrations')
    if (asset === 'media') return actionLoading.includes('media')
    return false
  }

  const hasGeneratedStudyReport = () =>
    Array.isArray(workspace?.studyReports) &&
    workspace.studyReports.length > 0 &&
    !!workspace.studyReports[0]?.sections

  const getStudyAssetLoadingLabel = (asset: 'applications' | 'questions' | 'illustrations' | 'media' | 'references' | 'report' | 'egw') => {
    const labels: Record<'applications' | 'questions' | 'illustrations' | 'media' | 'references' | 'report' | 'egw', string> = {
      applications: 'Generating Applications...',
      questions: 'Generating Discussion Questions...',
      illustrations: 'Generating Illustration Ideas...',
      media: 'Generating Media Suggestions...',
      references: 'Generating References...',
      report: 'Generating Study Report...',
      egw: 'Generating EGW Support...',
    }
    return labels[asset]
  }

  const getPassageFocusText = () => {
    const primaryReport = workspace?.studyReports?.[0]?.sections
    const passageSummaryObject = typeof passageSummary === 'object' && passageSummary ? passageSummary : null
    if (passageSummaryObject?.summary) return String(passageSummaryObject.summary)
    if (passageSummaryObject?.mainIdea) return String(passageSummaryObject.mainIdea)
    if (passageSummaryObject?.interpretiveCenter) return String(passageSummaryObject.interpretiveCenter)
    if (primaryReport?.mainTheologicalClaim) return String(primaryReport.mainTheologicalClaim).slice(0, 320)
    if (primaryReport?.passageOverview) return String(primaryReport.passageOverview).slice(0, 320)
    if (primaryReport?.theologicalInsights) return String(primaryReport.theologicalInsights).slice(0, 320)
    if (primaryReport?.keyThemes) return String(primaryReport.keyThemes).slice(0, 320)
    return ''
  }

  const getOutlineBigIdea = (outline: WorkspaceOutlineItem | null | undefined) => {
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

  const getFlowNarrativeEntries = (outline: WorkspaceOutlineItem | null | undefined, pointNodes: WorkspaceOutlinePoint[]) => {
    const introText = outline?.structure?.introduction || getPassageFocusText() || 'Opening movement for the sermon.'
    const conclusionText = outline?.structure?.conclusion || outline?.structure?.callToAction || 'Closing response and invitation.'
    const pointEntries = (Array.isArray(pointNodes) ? pointNodes : []).map((point, index: number) => {
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

  const estimatePointMinutes = (point: WorkspaceOutlinePoint) => {
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
    const match = verses.find((verse) => {
      const ref = String(verse?.reference || '').replace(/\s+/g, ' ').toLowerCase()
      return ref.includes(normalizedTarget) || normalizedTarget.includes(ref)
    })
    return match?.text || ''
  }

  const renderOutline = (structure: WorkspaceOutlineStructure | Record<string, unknown> | null | undefined) => {
    if (!structure || typeof structure !== 'object') {
      return <p className="cyber-muted text-sm">Outline unavailable.</p>
    }
    const typedStructure = structure as WorkspaceOutlineStructure
    const points = getOutlinePointNodes(typedStructure)
    return (
      <div className="space-y-3 text-sm">
        {typeof typedStructure.introduction === 'string' && typedStructure.introduction.trim() && (
          <div>
            <p className="text-xs uppercase tracking-widest cyber-muted">Introduction</p>
            <div className="mt-1">{renderMarkdown(typedStructure.introduction)}</div>
          </div>
        )}
        {points.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest cyber-muted">Main Points</p>
            <ol className="mt-2 list-decimal list-inside space-y-1 text-gray-100/90">
              {points.map((point, index: number) => (
                <li key={`${point.id}-${index}`}>{renderMarkdown(point.title)}</li>
              ))}
            </ol>
          </div>
        )}
        {typeof typedStructure.conclusion === 'string' && typedStructure.conclusion.trim() && (
          <div>
            <p className="text-xs uppercase tracking-widest cyber-muted">Conclusion</p>
            <div className="mt-1">{renderMarkdown(typedStructure.conclusion)}</div>
          </div>
        )}
        {typeof typedStructure.callToAction === 'string' && typedStructure.callToAction.trim() && (
          <div>
            <p className="text-xs uppercase tracking-widest cyber-muted">Call To Action</p>
            <div className="mt-1">{renderMarkdown(typedStructure.callToAction)}</div>
          </div>
        )}
      </div>
    )
  }

  const getOutlineTitle = (outline: WorkspaceOutlineItem | null | undefined) => {
    const points = getOutlinePointNodes(outline?.structure)
    const rawTitle = points[0]?.title || outline?.structure?.introduction || outline?.title || 'Outline'
    const firstSentence = rawTitle.split(/\.|\?|\!/).slice(0, 1).join('').trim()
    const trimmed = (firstSentence || rawTitle).trim()
    if (trimmed.length > 120) {
      return `${trimmed.slice(0, 117)}...`
    }
    return trimmed
  }

  const renderManuscript = (content: WorkspaceManuscriptContent | string | null | undefined) => {
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
      return content.sections.map((section, index: number) => (
        <div key={`${section.heading}-${index}`} className="space-y-2">
          <p className="text-xs uppercase tracking-widest cyber-muted">{section.heading}</p>
          <p className="text-gray-100/90 leading-relaxed">{section.body}</p>
        </div>
      ))
    }

    return <p className="cyber-muted text-sm">Manuscript format not recognized.</p>
  }

  const renderStudyReport = (report: { sections?: WorkspaceStudyReportSection } | null | undefined) => {
    const sections = report?.sections || {}
    if (!report) {
      return <p className="cyber-muted text-sm">No study report generated yet.</p>
    }

    const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
    const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
    const thematicClaim = str(sections.mainTheologicalClaim || sections.theologicalInsights || '')
    const legacyThemes = arr(sections.theologicalThemes || sections.keyThemes || sections.themes)
    const legacyImplications = arr(sections.pastoralImplications || sections.practicalApplications || sections.applications)
    const legacyStructure = arr(sections.structureOfPassage || sections.structuralAnalysis || []) as WorkspacePassageMovement[]
    const legacyCrossRefs = arr(sections.crossReferences || []) as WorkspaceCrossReference[]
    const legacyChallenges = arr(sections.interpretiveChallenges || []) as WorkspaceInterpretiveChallenge[]
    const exegeticalFlow = arr(sections.exegeticalFlow || sections.argumentFlow || sections.flow) as unknown[]
    const exegeticalSummary = str(sections.exegeticalSummary || sections.summaryStatement)

    const normalizedImplications = (() => {
      const source = sections.pastoralImplications && typeof sections.pastoralImplications === 'object' && !Array.isArray(sections.pastoralImplications)
        ? sections.pastoralImplications
        : null

      const toCleanList = (value: unknown): string[] =>
        arr(value)
          .map((item) => String(item || '').trim())
          .filter(Boolean)

      if (!source) {
        return {
          personalLife: legacyImplications.slice(0, 4),
          churchLife: legacyImplications.slice(4, 8),
          mission: legacyImplications.slice(8, 12),
        }
      }

      const pickFirst = (...candidates: unknown[]): string[] => {
        for (const candidate of candidates) {
          const values = toCleanList(candidate)
          if (values.length) return values
        }
        return []
      }

      const personalLife = pickFirst(
        source.personalLife,
        source.personal,
        source.vidaPersonal,
        source.individualLife,
      )
      const churchLife = pickFirst(
        source.churchLife,
        source.churchApplication,
        source.communityLife,
        source.congregationalLife,
        source.communalLife,
        source.vidaIglesia,
        source.iglesia,
      )
      const mission = pickFirst(
        source.mission,
        source.missional,
        source.missionApplication,
        source.outreach,
        source.evangelism,
        source.mision,
      )

      const combined = Array.from(
        new Set([
          ...toCleanList(source.implications),
          ...toCleanList(source.applications),
          ...personalLife,
          ...churchLife,
          ...mission,
        ]),
      )

      const fillMissing = (items: string[], used: Set<string>, limit = 4): string[] => {
        if (items.length) {
          items.forEach((item) => used.add(item))
          return items.slice(0, limit)
        }
        let fill = combined.filter((item) => !used.has(item)).slice(0, limit)
        if (!fill.length && combined.length) {
          fill = combined.slice(0, limit)
        }
        fill.forEach((item) => used.add(item))
        return fill
      }

      const used = new Set<string>()
      return {
        personalLife: fillMissing(personalLife, used),
        churchLife: fillMissing(churchLife, used),
        mission: fillMissing(mission, used),
      }
    })()

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
              {exegeticalFlow.map((step, idx: number) => (
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
              {legacyStructure.map((item, idx: number) => (
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
              {((arr(sections.keyTerms) as WorkspaceKeyTerm[])).map((term, idx: number) => (
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
              {legacyCrossRefs.map((item, idx: number) => (
                <button
                  type="button"
                  key={`xref-${idx}`}
                  onClick={() => openReferencePreview(item?.reference || item?.verse || String(item), item?.connection || item?.explanation || '')}
                  className="w-full text-left border border-white/10 rounded-lg p-3 hover:border-cyan-400/40 hover:bg-black/40 transition-colors"
                >
                  <p className="text-sm text-cyan-100 font-medium">{item?.reference || item?.verse || String(item)}</p>
                  {item?.connection || item?.explanation ? (
                    <p className="text-xs text-gray-300 mt-1">{item.connection || item.explanation}</p>
                  ) : null}
                </button>
              ))}
            </div>
          </details>
        ) : null}

        {legacyChallenges.length ? (
          <details open className="rounded-xl border border-white/10 bg-black/20 p-4">
            <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">Interpretive Challenges</summary>
            <div className="mt-3 space-y-2">
              {legacyChallenges.map((item, idx: number) => (
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
              {legacyThemes.map((theme: unknown, idx: number) => (
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
                  {normalizedImplications.personalLife.map((item: unknown, idx: number) => (
                    <li key={`implication-personal-${idx}`}>{String(item)}</li>
                  ))}
                </ul>
              </div>
              <div className="border border-white/10 rounded-lg p-3">
                <p className="text-xs uppercase tracking-widest text-cyan-200/80">Church Life</p>
                <ul className="mt-2 list-disc list-inside text-sm text-gray-300 space-y-1">
                  {normalizedImplications.churchLife.map((item: unknown, idx: number) => (
                    <li key={`implication-church-${idx}`}>{String(item)}</li>
                  ))}
                </ul>
              </div>
              <div className="border border-white/10 rounded-lg p-3">
                <p className="text-xs uppercase tracking-widest text-cyan-200/80">Mission</p>
                <ul className="mt-2 list-disc list-inside text-sm text-gray-300 space-y-1">
                  {normalizedImplications.mission.map((item: unknown, idx: number) => (
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
    navStateRestored.current = false
    navStatePersistHash.current = ''
    if (navStatePersistTimer.current) {
      clearTimeout(navStatePersistTimer.current)
      navStatePersistTimer.current = null
    }
  }, [workspaceId])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const fetchWorkspace = async () => {
      try {
        const client = getAppApiClient()
        if (!client) return
        const stateData = await client.get<WorkspaceShellState>(`/workspaces/${workspaceId}/state`)
        setWorkspaceState(stateData)
        const workspaceData = stateData?.workspace
          ? {
              ...(stateData.workspace as WorkspacePageData),
              metadata: {
                ...(((stateData.workspace as WorkspacePageData)?.metadata || {}) as Record<string, unknown>),
                uiState: {
                  phase: stateData.activePhase,
                  section: stateData.activeSection,
                },
              },
            }
          : null
        setWorkspace(workspaceData)
        setWorkspaceDraft(workspaceData)

        if (stateData?.activePhase) {
          setActivePhase(stateData.activePhase)
        }
        if (stateData?.activeSection) {
          setActiveSection(stateData.activeSection)
        }

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

  useEffect(() => {
    if (!workspace || navStateRestored.current) return

    const queryPhaseRaw = searchParams.get('phase')
    const querySectionRaw = searchParams.get('section')

    const queryPhase = VALID_PHASES.includes((queryPhaseRaw || '').toUpperCase() as Phase)
      ? ((queryPhaseRaw || '').toUpperCase() as Phase)
      : null
    const querySection = VALID_SECTIONS.includes((querySectionRaw || '') as WorkspaceSection)
      ? ((querySectionRaw || '') as WorkspaceSection)
      : null

    const metadataUiState = getWorkspaceUiState(workspace)
    let localUiState: Record<string, unknown> = {}
    if (typeof window !== 'undefined' && navStateStorageKey) {
      try {
        localUiState = JSON.parse(localStorage.getItem(navStateStorageKey) || '{}') || {}
      } catch {
        localUiState = {}
      }
    }
    const metadataPhase = VALID_PHASES.includes(String(metadataUiState.phase || '').toUpperCase() as Phase)
      ? (String(metadataUiState.phase).toUpperCase() as Phase)
      : null
    const metadataSection = VALID_SECTIONS.includes(String(metadataUiState.section || '') as WorkspaceSection)
      ? (String(metadataUiState.section) as WorkspaceSection)
      : null
    const localPhase = VALID_PHASES.includes(String(localUiState.phase || '').toUpperCase() as Phase)
      ? (String(localUiState.phase).toUpperCase() as Phase)
      : null
    const localSection = VALID_SECTIONS.includes(String(localUiState.section || '') as WorkspaceSection)
      ? (String(localUiState.section) as WorkspaceSection)
      : null

    const restoredSection = querySection || metadataSection || localSection || 'workspace'
    const restoredPhase = resolvePhaseForSection(restoredSection, queryPhase || metadataPhase || localPhase || undefined)

    setActiveSection(restoredSection)
    setActivePhase(restoredPhase)
    setVisualizationMode(restoredPhase === 'REFINE' ? 'refine' : 'passage')
    navStateRestored.current = true
  }, [workspace, searchParams, navStateStorageKey])

  useEffect(() => {
    if (!workspaceId || !workspace || loading || !navStateRestored.current) return

    const params = new URLSearchParams(searchParams.toString())
    const currentPhase = params.get('phase')
    const currentSection = params.get('section')
    if (currentPhase !== activePhase || currentSection !== activeSection) {
      params.set('phase', activePhase)
      params.set('section', activeSection)
      router.replace(`/workspace/${workspaceId}?${params.toString()}`, { scroll: false })
    }

    const navHash = `${activePhase}:${activeSection}`
    if (navStatePersistHash.current === navHash) return
    navStatePersistHash.current = navHash
    if (typeof window !== 'undefined' && navStateStorageKey) {
      try {
        localStorage.setItem(
          navStateStorageKey,
          JSON.stringify({
            phase: activePhase,
            section: activeSection,
            updatedAt: new Date().toISOString(),
          }),
        )
      } catch {
        // Ignore storage quota/private browsing failures.
      }
    }
    if (navStatePersistTimer.current) {
      clearTimeout(navStatePersistTimer.current)
    }
    navStatePersistTimer.current = setTimeout(async () => {
      const token = localStorage.getItem('token')
      if (!token) return
      try {
        const nextMetadata = {
          ...(workspace?.metadata || {}),
          uiState: {
            phase: activePhase,
            section: activeSection,
            updatedAt: new Date().toISOString(),
          },
        }
        const client = getWorkspaceApiClient()
        if (!client) return
        await client.updateWorkspace(workspaceId, { metadata: nextMetadata })
        setWorkspace((prev) => (prev ? { ...prev, metadata: nextMetadata } : prev))
      } catch (err) {
        console.error('Failed to persist workspace navigation state', err)
      }
    }, 500)
  }, [activePhase, activeSection, workspace, workspaceId, loading, searchParams, router, navStateStorageKey])

  useEffect(() => {
    return () => {
      if (navStatePersistTimer.current) {
        clearTimeout(navStatePersistTimer.current)
      }
    }
  }, [])

  const withToken = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return null
    }
    return { headers: { Authorization: `Bearer ${token}` } }
  }

  const getWorkspaceApiClient = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return null
    }
    return createWorkspaceApiClient({ token })
  }

  const getAppApiClient = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return null
    }
    return createAppApiClient({ token })
  }

  const refreshWorkspaceState = async (config: Record<string, unknown>) => {
    const client = getWorkspaceApiClient()
    if (!client) return null
    const stateData = await client.getWorkspaceState(workspaceId)
    setWorkspaceState(stateData)
    const workspaceData = stateData?.workspace
      ? {
          ...(stateData.workspace as WorkspacePageData),
          metadata: {
            ...(((stateData.workspace as WorkspacePageData)?.metadata || {}) as Record<string, unknown>),
            uiState: {
              phase: stateData.activePhase,
              section: stateData.activeSection,
            },
          },
        }
      : null
    if (workspaceData) {
      setWorkspace(workspaceData)
      setWorkspaceDraft(workspaceData)
    }
    return stateData
  }

  const saveWorkspaceMetadata = async (
    config: Record<string, unknown>,
    updater: (metadata: Record<string, unknown>) => Record<string, unknown>,
  ) => {
    const client = getWorkspaceApiClient()
    if (!client) return
    const currentMetadata = (workspace?.metadata || {}) as Record<string, unknown>
    await client.updateWorkspace(workspaceId, { metadata: updater(currentMetadata) })
    await refreshWorkspaceState(config)
  }

  useEffect(() => {
    const nextAdvancedMode = Boolean(getWorkspaceUiState(workspace)?.advancedMode)
    setAdvancedMode(nextAdvancedMode)
  }, [workspace?.metadata])

  const handleToggleAdvancedMode = async (enabled: boolean) => {
    const config = withToken()
    if (!config) return
    setAdvancedMode(enabled)
    await saveWorkspaceMetadata(config, (metadata) => ({
      ...metadata,
      uiState: {
        ...((metadata.uiState as Record<string, unknown>) || {}),
        advancedMode: enabled,
      },
    }))
    if (!enabled && activeSection === 'visualizations') {
      setActiveSection('study-report')
      setActivePhase('STUDY')
    }
  }

  // Keyboard shortcuts
  useKeyboardShortcut('1', () => handlePhaseChange('THEME'), { cmd: true })
  useKeyboardShortcut('2', () => handlePhaseChange('PASSAGE'), { cmd: true })
  useKeyboardShortcut('3', () => handlePhaseChange('STUDY'), { cmd: true })
  useKeyboardShortcut('4', () => handlePhaseChange('OUTLINE'), { cmd: true })
  useKeyboardShortcut('5', () => handlePhaseChange('WRITE'), { cmd: true })
  useKeyboardShortcut('6', () => handlePhaseChange('REFINE'), { cmd: true })
  useKeyboardShortcut('7', () => handlePhaseChange('DELIVER'), { cmd: true })

  const handleGenerateSermonCore = async (): Promise<SermonCoreData | null> => {
    const config = withToken()
    if (!config) return null
    const client = getWorkspaceApiClient()
    if (!client) return null
    
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

  const handleSermonCoreChange = async (data: SermonCoreData) => {
    const config = withToken()
    if (!config) return
    const client = getWorkspaceApiClient()
    if (!client) return
    
    setWorkspace((prev) => (prev ? { ...prev, sermonCore: data } : prev))
    try {
      await client.updateWorkspace(workspaceId, { sermonCore: data })
    } catch (err) {
      console.error('Failed to save sermon core:', err)
    }
  }

  const handleGenerate = async (type: string, override?: string) => {
    const config = withToken()
    if (!config) return
    const client = getWorkspaceApiClient()
    if (!client) return
    let queuedGenerationType: string | null = null

    const studyAssetLabels: Record<'applications' | 'questions' | 'illustrations' | 'media', string> = {
      applications: 'Applications',
      questions: 'Discussion Questions',
      illustrations: 'Illustrations',
      media: 'Media Suggestions',
    }
    const isStudyAssetType = (value: string): value is StudyAssetType =>
      value === 'applications' || value === 'questions' || value === 'illustrations' || value === 'media'

    if (actionLoading.includes(type)) {
      return
    }

    setActionLoading((prev) => (prev.includes(type) ? prev : [...prev, type]))
    try {
      let generatedResponse: { data?: { id?: string; jobId?: string; status?: string; state?: string; message?: string } } | null = null
      if (isStudyAssetType(type)) {
        if (!hasGeneratedStudyReport()) {
          setError('Generate the Study Report first before creating applications, questions, illustrations, or media suggestions.')
          return
        }
      try {
          if (type === 'applications') {
            generatedResponse = await client.generateApplications(
              workspaceId,
              {
                promptOverride: override,
                includeEGW: workspace?.egwEnabled || false,
              } as Record<string, unknown>,
              true,
            )
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
          }
          if (type === 'questions') {
            generatedResponse = await client.generateDiscussionQuestions(
              workspaceId,
              { promptOverride: override } as Record<string, unknown>,
              true,
            )
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
          }
          if (type === 'illustrations') {
            generatedResponse = await client.generateIllustrations(
              workspaceId,
              { promptOverride: override } as Record<string, unknown>,
              true,
            )
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
          }
          if (type === 'media') {
            generatedResponse = await client.generateMediaSuggestions(
              workspaceId,
              { promptOverride: override } as Record<string, unknown>,
              true,
            )
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
          }
        } catch (assetError) {
          console.error(`${type} generation failed`, assetError)
          const assetLabel = isStudyAssetType(type)
            ? studyAssetLabels[type as keyof typeof studyAssetLabels]
            : type
          setError(`${assetLabel} generation failed. Please retry.`)
          return
        }
      } else if (type === 'outlines') {
        generatedResponse = await client.generateOutlines(
          workspaceId,
          {
            promptOverride: override,
            includeEGW: workspace?.egwEnabled || false,
          } as Record<string, unknown>,
          true,
        )
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
        const selectedOutline = workspace?.outlines?.find((o) => o.isSelected) || workspace?.outlines?.[0]
        if (!selectedOutline) {
          setError('Create or generate an outline first.')
          return
        }
        const client = getAppApiClient()
        if (!client) return
        generatedResponse = await client.post(`/workspaces/${workspaceId}/manuscript`, {
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
        })
      } else if (type === 'citations') {
        generatedResponse = await client.generateCitations(
          workspaceId,
          { promptOverride: override } as Record<string, unknown>,
          true,
        )
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
      } else if (type === 'study-report') {
        generatedResponse = await client.generateStudyReport(
          workspaceId,
          {
            promptOverride: override,
            includeEGW: workspace?.egwEnabled || false,
          } as Record<string, unknown>,
          true,
        )
        if (generatedResponse?.data?.jobId) {
          queuedGenerationType = type
          setGenerationJob({
            capability: type,
            jobId: String(generatedResponse.data.jobId),
            status: String(generatedResponse.data.status || 'queued'),
            state: String(generatedResponse.data.state || 'queued'),
            message: String(generatedResponse.data.message || ''),
          })
        } else if (generatedResponse?.data) {
          const generatedStudyReport = generatedResponse.data as { id?: string; sections?: WorkspaceStudyReportSection }
          setWorkspace((prev) =>
            prev
              ? ({
                  ...prev,
                  studyReports: [
                    generatedStudyReport,
                    ...(prev.studyReports || []).filter((item) => item.id !== generatedStudyReport.id),
                  ],
                } as WorkspacePageData)
              : prev,
          )
        }
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
        generatedResponse = await client.generateSermonCore(
          workspaceId,
          { promptOverride: override } as Record<string, unknown>,
          true,
        )
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
      } else if (type === 'dna') {
        const client = getAppApiClient()
        if (!client) return
        generatedResponse = await client.sermonDnaAnalyze(workspaceId)
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

  const fetchDnaIntegrityReport = async () => {
    const config = withToken()
    if (!config) return
    const client = getWorkspaceApiClient()
    if (!client) return
    setDnaIntegrityLoading(true)
    try {
      const response = await client.runIntegrityCheck(workspaceId, false)
      setDnaIntegrityReport((response as SermonIntegrityReport) || null)
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
      setCoachFeedback((prev) => ({ ...prev, [questionId]: response as WorkspaceCoachFeedbackDetail | null }))
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
      const data = await client.post<Record<string, unknown>>(
        `/workspaces/${workspaceId}/manuscripts/${selectedManuscript.id}/repair/apply`,
        {
          selectedIssueIds: issueIds,
          doNotTouchAnchors: repairLockedAnchors,
          conversationSummary: String(conversationSummary || '').trim(),
          mode: 'targeted',
        },
      )
      setRepairJob({
        manuscriptId: selectedManuscript.id,
        jobId: String(data.jobId || ''),
        status: String(data.status || 'queued'),
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
    const issueIds: string[] = Array.from(
      new Set(
        pendingCoachRepairPlan
          .map((item) => String(item?.issueId || '').trim())
          .filter((value: string) => value.length > 0),
      ),
    )
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

  const getRepairIssueByQuestionId = (questionId: string) => {
    const plan = Array.isArray(socraticCoachSession?.repairPlan) ? socraticCoachSession.repairPlan : []
    return plan.find((item) => String(item?.questionId || '').trim() === String(questionId || '').trim())
  }

  const buildCoachApplyText = (
    question: WorkspaceCoachQuestion | null | undefined,
    feedback: WorkspaceCoachFeedbackDetail | null | undefined,
    answerText: string,
  ) => {
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

  const coachBlockToHtml = (title: string, block: string) => {
    const lines = String(block || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
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
        ? {
            formatVersion: 'v2',
            text: updatedText,
            cues: normalizeManuscriptCues(selectedManuscript?.content?.cues),
          }
        : { text: updatedText }
      const client = getWorkspaceApiClient()
      const reader = getAppApiClient()
      if (!client || !reader) return
      await client.updateManuscript(selectedManuscript.id, { content: payloadContent })
      const refreshed = await reader.get<WorkspacePageData>(`/workspaces/${workspaceId}`)
      setWorkspace(refreshed)
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
    const selectedOutline = workspace?.outlines?.find((o) => o.isSelected) || workspace?.outlines?.[0]
    if (!selectedOutline?.id) {
      setError('No outline available to apply coach suggestion.')
      return
    }
    const questionId = String(question?.id || 'Q')
    const actionKey = `coach-apply-outline-${questionId}`
    setActionLoading((prev) => (prev.includes(actionKey) ? prev : [...prev, actionKey]))
    try {
      const structure: WorkspaceOutlineStructure = { ...(selectedOutline?.structure || {}) }
      const pointNodes = Array.isArray(structure.pointNodes) ? [...structure.pointNodes] : []
      const sourceAnchor = String(question?.sourceAnchor || '').toLowerCase()
      const targetIndex = pointNodes.findIndex((node) => {
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
      const client = getWorkspaceApiClient()
      const reader = getAppApiClient()
      if (!client || !reader) return
      await client.updateOutline(selectedOutline.id, { structure })
      const refreshed = await reader.get<WorkspacePageData>(`/workspaces/${workspaceId}`)
      setWorkspace(refreshed)
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
    const client = getWorkspaceApiClient()
    if (!client) return
    setActionLoading((prev) => (prev.includes('citations-validate') ? prev : [...prev, 'citations-validate']))
    try {
      await client.validateCitations(workspaceId, citationTranslation)
      await refreshWorkspaceState(config)
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
      const client = getAppApiClient()
      if (!client) return
      const passageRes = { data: await client.scripturalPassageWithContext(normalizedReference, normalizedTranslation) }

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
          typeof (normalizedPassageResult as { error?: unknown })?.error === 'string' &&
            String((normalizedPassageResult as { error?: string }).error || '').trim()
            ? String((normalizedPassageResult as { error?: string }).error || '').trim()
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
        client.scriptureParallel(normalizedReference, normalizedParallel),
        client.scriptureContext(normalizedReference),
      ]).then(results => {
        if (requestId !== scriptureLookupRequestId.current) {
          return
        }
        // Extract and set all data after request-id guard
        const parallelData = results[0].status === 'fulfilled'
          ? ((results[0].value?.translations || []) as Record<string, unknown>[])
          : []
        const contextDataResult = results[1].status === 'fulfilled'
          ? (results[1].value as WorkspaceSectionData)
          : null
        
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

  const handleWordStudyLookup = async (override?: {
    word?: string
    language?: string
    context?: string
    metadata?: {
      strongs?: string
      verseReference?: string
      translatedWord?: string
      original?: string
      reference?: string
    }
  }) => {
    const config = withToken()
    if (!config) return
    const normalizedWord = (override?.word || wordStudyWord).trim()
    const normalizedLang = (override?.language || wordStudyLanguage).trim().toLowerCase() || 'greek'
    const contextualReference = String(
      override?.metadata?.verseReference || override?.metadata?.reference || scriptureLastLookup || '',
    ).trim()
    const contextualTranslation = String(override?.metadata?.translatedWord || '').trim()
    const contextualOriginal = String(override?.metadata?.original || '').trim()
    const contextualStrongs = String(override?.metadata?.strongs || '').trim().toUpperCase()
    const contextualHint =
      String(override?.context || '').trim() ||
      [
        contextualReference ? `Reference: ${contextualReference}` : '',
        contextualStrongs ? `Strong's: ${contextualStrongs}` : '',
        contextualOriginal ? `Original token: ${contextualOriginal}` : '',
        contextualTranslation ? `Translated token: ${contextualTranslation}` : '',
      ]
        .filter(Boolean)
        .join(' | ')
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
    setWordStudyLookupContext(contextualHint)
    setWordStudyLastLookup(normalizedWord)
    setActionLoading((prev) => (prev.includes('word-study') ? prev : [...prev, 'word-study']))
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
      const client = getAppApiClient()
      if (!client) return
      const workspaceLanguage = String(workspace?.language || '').toLowerCase()
      const responseLanguage =
        workspaceLanguage.startsWith('es') ||
        workspaceLanguage.includes('spanish') ||
        workspaceLanguage.includes('espanol') ||
        workspaceLanguage.includes('español')
          ? 'es'
          : 'en'
      const response = await client.scriptureWordStudySuggestions(
        reference,
        String(scriptureTranslation || workspace?.defaultTranslation || 'KJV'),
        wordStudyLanguage,
        responseLanguage,
      )
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
    setActionLoading((prev) => (prev.includes('cross-references') ? prev : [...prev, 'cross-references']))
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
      setActionLoading((prev) => prev.filter((item) => item !== 'cross-references'))
    }
  }

  const handleSearch = async () => {
    const config = withToken()
    if (!config || !searchQuery) return
    setActionLoading((prev) => (prev.includes('search') ? prev : [...prev, 'search']))
    try {
      const client = getAppApiClient()
      if (!client) return
      const response = await client.search(searchQuery)
      setSearchResults((response as unknown as WorkspaceSearchResult[]) || [])
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
      const client = getAppApiClient()
      if (!client) return
      const outlineId = type === 'manuscript'
        ? workspace?.outlines?.find((o) => o.isSelected)?.id || workspace?.outlines?.[0]?.id
        : undefined
      const response = await client.workspacePromptPreview(workspaceId, type, outlineId)
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

  const latestDnaAnalysis = workspace?.dnaAnalyses?.[0] || null
  const isSpanishWorkspace = workspace?.language === 'es'
  const dnaText = (en: string, es: string) => (isSpanishWorkspace ? es : en)
  const latestManuscriptText = String(workspace?.manuscripts?.[0]?.content?.text || '')
  const latestOutline = workspace?.outlines?.find((o) => o.isSelected) || workspace?.outlines?.[0]
  const outlinePointsForDna = getOutlinePointNodes(latestOutline?.structure || {}).map((point) => String(point.title || '').trim()).filter(Boolean)
  const manuscriptWordCount = latestManuscriptText ? latestManuscriptText.split(/\s+/).filter(Boolean).length : 0
  const estimatedMinutesDna = manuscriptWordCount ? Math.max(1, Math.ceil(manuscriptWordCount / 110)) : 0
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
    if (style.includes('narrative')) return dnaText('Narrative', 'Narrativo')
    if (style.includes('topical')) return dnaText('Topical', 'Temático')
    if (style.includes('devotional')) return dnaText('Devotional', 'Devocional')
    return dnaText('Expository', 'Expositivo')
  })()

  const renderStudyAssetEditor = () => {
    if (studyAssetEditor === 'applications') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-xl font-semibold">Applications</h3>
                <p className="text-xs text-gray-400 mt-1">Study asset editor</p>
              </div>
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
          {workspace?.applications?.length ? (
            <ul className="space-y-3 text-gray-100/90 max-h-[60vh] overflow-y-auto pr-1">
              {workspace?.applications?.map((app) => (
                <li key={app.id} className="border border-white/10 rounded-xl p-4 bg-black/30">
                  <div className="flex items-center justify-between">
                    <span className="cyber-tag">{app.audienceType}</span>
                    <button
                      onClick={() => {
                        setEditingApplicationId(app.id || null)
                        setApplicationDraft(app.content || app.text || app.title || '')
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
                          onClick={() => handleApplicationSave(app.id || '')}
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
                    <div className="mt-2">{renderMarkdown(app.content || app.text || app.title || '')}</div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-100/90">No applications yet.</p>
          )}
        </div>
      )
    }

    if (studyAssetEditor === 'questions') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xl font-semibold">Discussion Questions</h3>
              <p className="text-xs text-gray-400 mt-1">Study asset editor</p>
            </div>
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
          {workspace?.discussionQuestions?.length ? (
            <ul className="space-y-3 text-gray-100/90 max-h-[60vh] overflow-y-auto pr-1">
              {workspace?.discussionQuestions?.map((q) => (
                <li key={q.id} className="border border-white/10 rounded-xl p-4 bg-black/30">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">{renderMarkdown(q.question || q.text || '')}</div>
                    <button
                      onClick={() => {
                        setEditingQuestionId(q.id || null)
                        setQuestionDraft(q.question || q.text || '')
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
                          onClick={() => handleQuestionSave(q.id || '')}
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
      )
    }

    if (studyAssetEditor === 'illustrations') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xl font-semibold">Illustrations</h3>
              <p className="text-xs text-gray-400 mt-1">Study asset editor</p>
            </div>
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
          {workspace?.illustrations?.length ? (
            <ul className="space-y-3 text-gray-100/90 max-h-[60vh] overflow-y-auto pr-1">
              {workspace?.illustrations?.map((ill) => (
                <li key={ill.id} className="border border-white/10 rounded-xl p-4 bg-black/30">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{ill.title || 'Illustration'}</p>
                    <button
                      onClick={() => {
                        setEditingIllustrationId(ill.id || null)
                        setIllustrationDraft({ id: String(ill.id || ''), title: ill.title || '', content: ill.content || '', source: ill.source || '' })
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
                        value={String(illustrationDraft.title || '')}
                        onChange={(e) => setIllustrationDraft({ ...illustrationDraft, title: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                      />
                      <label className="text-xs uppercase tracking-widest cyber-muted">Illustration Content</label>
                      <textarea
                        value={String(illustrationDraft.content || '')}
                        onChange={(e) => setIllustrationDraft({ ...illustrationDraft, content: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                        rows={4}
                      />
                      <label className="text-xs uppercase tracking-widest cyber-muted">Source</label>
                      <input
                        value={String(illustrationDraft.source || '')}
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
                      <div className="mt-1">{renderMarkdown(ill.content || ill.text || ill.title || '')}</div>
                      {ill.source && <p className="text-xs cyber-muted mt-2">Source: {ill.source}</p>}
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-100/90">No illustrations yet.</p>
          )}
        </div>
      )
    }

    return null
  }

  const handleWorkspaceSave = async () => {
    const config = withToken()
    if (!config || !workspaceDraft) return
    const client = getWorkspaceApiClient()
    if (!client) return
    setActionLoading((prev) => (prev.includes('workspace') ? prev : [...prev, 'workspace']))
    try {
      await client.updateWorkspace(workspaceId, {
          title: workspaceDraft.title,
          seriesTitle: workspaceDraft.seriesTitle,
          mainPassage: workspaceDraft.mainPassage,
          additionalPassages: workspaceDraft.additionalPassages,
          theme: workspaceDraft.theme,
          audienceProfile: workspaceDraft.audienceProfile,
          sermonGoals: workspaceDraft.sermonGoals,
          theologicalLens: 'adventist',
          style: workspaceDraft.style,
          storyArc: workspaceDraft.storyArc,
          language: workspaceDraft.language,
          includeEGW: workspaceDraft.includeEGW,
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
    const config = withToken()
    if (!config || !outlineDraft) return
    const client = getWorkspaceApiClient()
    if (!client) return
    setActionLoading((prev) => (prev.includes('outline-edit') ? prev : [...prev, 'outline-edit']))
    try {
      await client.updateOutline(outlineDraft.id, {
          title: outlineDraft.title,
          structure: {
            introduction: outlineDraft.introduction,
            points: outlineDraft.points,
            pointNodes: Array.isArray(outlineDraft.pointNodes) ? outlineDraft.pointNodes : [],
            conclusion: outlineDraft.conclusion,
            callToAction: outlineDraft.callToAction,
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
    const config = withToken()
    if (!config) return
    const client = getWorkspaceApiClient()
    if (!client) return
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
      const staleInfo = evaluateCueCoverage(cuesToSave, textToSave, cueAnchors)
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

  const handleCitationSave = async () => {
    const config = withToken()
    if (!config || !citationDraft) return
    const client = getWorkspaceApiClient()
    if (!client) return
    setActionLoading((prev) => (prev.includes('citation-edit') ? prev : [...prev, 'citation-edit']))
    try {
      await client.updateCitation(citationDraft.id, {
          statement: citationDraft.statement,
          verseReferences: citationDraft.verseReferences
            ? citationDraft.verseReferences.split(',').map((item: string) => item.trim()).filter(Boolean)
            : [],
        })
      await refreshWorkspaceState(config)
      setEditingCitationId(null)
      setCitationDraft(null)
    } catch (err) {
      console.error('Failed to update citation', err)
      setError('Unable to save citation changes.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'citation-edit'))
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
        if (citation) {
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
        await openReferencePreview(String(claim.sourceIds[0]), claim.claimText)
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
      <div className="container mx-auto px-1 pt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur">
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
        <WorkspaceFlowShell
          workspaceId={workspaceId}
          state={workspaceState}
          onPhaseChange={handlePhaseChange}
          onSectionChange={setActiveSection}
        />
      </div>

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
                {searchResults.map((item) => (
                  <button
                    type="button"
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSearchResultSelect(item)}
                    className="w-full text-left border border-white/10 rounded-xl p-3 bg-black/30 hover:border-cyan-400/40 transition-colors cursor-pointer"
                  >
                    <p className="text-[10px] uppercase tracking-widest cyber-muted">{item.type}</p>
                    <p className="text-sm text-gray-100/90 font-semibold">{item.title}</p>
                    {item.snippet && <p className="text-xs text-gray-200/80 mt-1">{String(item.snippet).replace(/<[^>]+>/g, '')}</p>}
                  </button>
                ))}
              </div>
            ) : (
              !actionLoading.includes('search') && <p className="text-xs text-gray-200/80">No search results yet.</p>
            )}
          </div>
        )}
        <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
          <aside className="hidden lg:block">
            <WorkspaceCommandRail
              workspace={workspace}
              advancedMode={advancedMode}
              progress={progress}
              activeSection={activeSection}
              activePhase={activePhase}
              onSectionChange={(section) => {
                if (section === 'visualizations' && !advancedMode) {
                  setError('Enable Advanced Mode to access visualizations.')
                  setActiveSection('study-report')
                  setActivePhase('STUDY')
                  return
                }
                setActiveSection(section)
                const nextPhase = sectionPhaseMap[section]
                if (nextPhase) setActivePhase(nextPhase)
                if (section === 'visualizations') {
                  setVisualizationMode(nextPhase === 'REFINE' ? 'refine' : 'passage')
                }
              }}
              onPhaseChange={setActivePhase}
              onVisualizationModeChange={setVisualizationMode}
              onToggleAdvancedMode={handleToggleAdvancedMode}
              onCloseRail={() => setRailOpen(false)}
              onNextStepAction={handleNextStepAction}
            />
          </aside>
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

            <div className={`cyber-panel rounded-2xl relative ${activeSection === 'manuscript' ? 'overflow-visible' : 'overflow-hidden'}`}>
              <div className="p-6">
              {activeSection === 'workspace' && (
                <WorkspaceOverviewSection
                  workspace={workspace}
                  workspaceDraft={workspaceDraft}
                  editingWorkspace={editingWorkspace}
                  setEditingWorkspace={setEditingWorkspace}
                  setWorkspaceDraft={setWorkspaceDraft}
                  handleWorkspaceSave={handleWorkspaceSave}
                  actionLoading={actionLoading}
                  styleLabels={styleLabels}
                  formatTheologicalLens={formatTheologicalLens}
                />
              )}

              {activeSection === 'outlines' && (
                <WorkspaceOutlinePhase
                  workspace={workspace}
                  workspaceState={workspaceState}
                  actionLoading={actionLoading}
                  sermonCoreGenerating={sermonCoreGenerating}
                  getPassageFocusText={getPassageFocusText}
                  getOutlinePointNodes={getOutlinePointNodes}
                  estimatePointMinutes={estimatePointMinutes}
                  getFlowNarrativeEntries={getFlowNarrativeEntries}
                  getOutlineTitle={getOutlineTitle}
                  getOutlineBigIdea={getOutlineBigIdea}
                  renderCollapsibleMarkdown={renderCollapsibleMarkdown}
                  renderOutlinePointSection={renderOutlinePointSection}
                  openReferencePreview={openReferencePreview}
                  onOpenPromptEditor={openPromptEditor}
                  onGenerateOutlines={() => handleGenerate('outlines')}
                  onGenerateSermonCore={handleGenerateSermonCore}
                  onSermonCoreChange={handleSermonCoreChange}
                  onSelectOutline={handleOutlineSelect}
                  editingOutlineId={editingOutlineId}
                  outlineDraft={outlineDraft}
                  setEditingOutlineId={setEditingOutlineId}
                  setOutlineDraft={setOutlineDraft}
                  handleOutlineSave={handleOutlineSave}
                  expandedOutlineId={expandedOutlineId}
                  setExpandedOutlineId={setExpandedOutlineId}
                />
              )}

          {activeSection === 'manuscript' && (
            <WorkspaceManuscriptPhase workspace={workspace}>
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
              <div className="border border-white/10 rounded-2xl p-5 bg-gradient-to-br from-black/40 to-black/20 space-y-4">
                <WorkspaceManuscriptControls
                  actionLoading={actionLoading}
                  manuscriptTone={manuscriptTone}
                  setManuscriptTone={setManuscriptTone}
                  manuscriptTargetMinutes={manuscriptTargetMinutes}
                  setManuscriptTargetMinutes={setManuscriptTargetMinutes}
                  manuscriptFormat={manuscriptFormat}
                  setManuscriptFormat={setManuscriptFormat}
                  manuscriptAudienceMode={manuscriptAudienceMode}
                  setManuscriptAudienceMode={setManuscriptAudienceMode}
                  manuscriptIncludeSlideCues={manuscriptIncludeSlideCues}
                  setManuscriptIncludeSlideCues={setManuscriptIncludeSlideCues}
                  manuscriptIncludeKeyLines={manuscriptIncludeKeyLines}
                  setManuscriptIncludeKeyLines={setManuscriptIncludeKeyLines}
                  openPromptEditor={openPromptEditor}
                  handleGenerate={handleGenerate}
                />
              </div>
              {latestManuscript ? (
                <WorkspaceManuscriptCard
                  manuscript={latestManuscript}
                  actionLoading={actionLoading}
                  lastRepairNotice={lastRepairNotice}
                  showRepairMarkers={showRepairMarkers}
                  setShowRepairMarkers={setShowRepairMarkers}
                  manuscriptQualityExpanded={manuscriptQualityExpanded}
                  setManuscriptQualityExpanded={setManuscriptQualityExpanded}
                  repairHistoryExpanded={repairHistoryExpanded}
                  setRepairHistoryExpanded={setRepairHistoryExpanded}
                  legacyConvertCandidateId={legacyConvertCandidateId}
                  setLegacyConvertCandidateId={setLegacyConvertCandidateId}
                  editingManuscriptId={editingManuscriptId}
                  setEditingManuscriptId={setEditingManuscriptId}
                  manuscriptDraft={manuscriptDraft}
                  setManuscriptDraft={setManuscriptDraft}
                  manuscriptCueDraft={manuscriptCueDraft}
                  setManuscriptCueDraft={setManuscriptCueDraft}
                  getManuscriptQualityUi={getManuscriptQualityUi}
                  manuscriptOptionsDrifted={manuscriptOptionsDrifted}
                  getRepairAuditTrail={getRepairAuditTrail}
                  normalizeRepairSnippetRaw={normalizeRepairSnippetRaw}
                  buildInlineWordDiff={buildInlineWordDiff}
                  buildWordDiff={buildWordDiff}
                  focusRepairAuditChange={focusRepairAuditChange}
                  getRepairedAuditItems={getRepairedAuditItems}
                  summarizeRepairSnippet={summarizeRepairSnippet}
                  isManuscriptV2={isManuscriptV2}
                  toV2ManuscriptDraft={toV2ManuscriptDraft}
                  renderManuscriptCuesPanel={renderManuscriptCuesPanel}
                  focusCueInManuscript={focusCueInManuscript}
                  ensureManuscriptRichHtml={ensureManuscriptRichHtml}
                  markdownLikeToHtml={markdownLikeToHtml}
                  sanitizeManuscriptForDisplay={sanitizeManuscriptForDisplay}
                  emptyManuscriptCues={emptyManuscriptCues}
                  handleManuscriptSave={handleManuscriptSave}
                  handleRegenerateManuscriptCues={handleRegenerateManuscriptCues}
                />
              ) : (
                <p className="text-gray-100/90">No manuscript yet.</p>
              )}
            </WorkspaceManuscriptPhase>
          )}

          {activeSection === 'citations' && (
            <WorkspaceCitationReview
              workspace={workspace}
              workspaceState={workspaceState}
              actionLoading={actionLoading}
              citationTranslation={citationTranslation}
              setCitationTranslation={setCitationTranslation}
              onOpenPromptEditor={openPromptEditor}
              onGenerateCitations={() => handleGenerate('citations')}
              onValidateCitations={handleCitationValidate}
              editingCitationId={editingCitationId}
              citationDraft={citationDraft}
              setEditingCitationId={setEditingCitationId}
              setCitationDraft={setCitationDraft}
              handleCitationSave={handleCitationSave}
              renderMarkdown={renderMarkdown}
              onOpenRefine={() => {
                setActivePhase('REFINE')
                setActiveSection('dna')
              }}
              onRepairClaim={handleRepairClaim}
              onAcknowledgeClaim={handleAcknowledgeClaim}
              onCiteClaim={handleCiteClaim}
            />
          )}
          {activeSection === 'scripture' && (
            <WorkspaceScripturePhase>
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
              <div className="space-y-4">
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
                      {extractVerses(scriptureResult).map((verse, index: number) => {
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
                        title={`${String((scriptureResult as Record<string, unknown> | null)?.reference || scriptureLastLookup || workspace?.mainPassage || 'Passage')} - ${scriptureTranslation}`}
                        onError={(error) => setAudioError(error)}
                      />
                    )}
                    
                    {WorkspaceScriptureAnalysisPanelsBridge({
                      workspaceId,
                      language: String(workspace?.language || 'en'),
                      token: localStorage.getItem('token') || '',
                      scriptureLastLookup,
                      generatedScriptureSections,
                      sectionRefreshKey: scriptureSectionRefreshKey,
                      passageSummary,
                      setPassageSummary,
                      perVerseContext,
                      setPerVerseContext,
                      translationComparison,
                      setTranslationComparison,
                      verseCommentary,
                      setVerseCommentary,
                      structuralAnalysis,
                      setStructuralAnalysis,
                      interpretiveChallenges,
                      setInterpretiveChallenges,
                      canonicalThemes,
                      setCanonicalThemes,
                      studySynthesis,
                      setStudySynthesis,
                      regenerateScriptureSection,
                      persistCurrentScriptureSection,
                      onAddToOutline: handleAddCanonicalThemeToOutline,
                    })}

                    {/* Study Notes */}
                    {isRecord(scriptureResult) &&
                      Array.isArray((scriptureResult as WorkspaceScriptureResult).studyNotes) &&
                      ((scriptureResult as WorkspaceScriptureResult).studyNotes || []).length > 0 && (
                      <StudyNotes
                        notes={(scriptureResult as WorkspaceScriptureResult).studyNotes || []}
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
                    
                  </div>
                ) : (
                  <p className="text-gray-200/80">No passage loaded yet.</p>
                )}
              </div>
            </WorkspaceScripturePhase>
          )}
          {activeSection === 'word-study' && (
            <WorkspaceWordStudySection
              isSpanishWorkspace={isSpanishWorkspace}
              actionLoading={actionLoading}
              wordStudyWord={wordStudyWord}
              setWordStudyWord={setWordStudyWord}
              wordStudyLanguage={wordStudyLanguage}
              setWordStudyLanguage={setWordStudyLanguage}
              availableLanguages={availableLanguages}
              scriptureLastLookup={scriptureLastLookup}
              wordStudySuggestionsLoading={wordStudySuggestionsLoading}
              wordStudySuggestions={wordStudySuggestions}
              wordStudyError={wordStudyError}
              wordStudyLastLookup={wordStudyLastLookup}
              wordStudyResult={wordStudyResult}
              wordStudyInsights={wordStudyInsights}
              handleWordStudyLookup={handleWordStudyLookup}
              renderSmartValue={renderSmartValue}
            />
          )}
          {activeSection === 'cross-references' && (
            <WorkspaceCrossReferencesSection
              actionLoading={actionLoading}
              crossRefVerse={crossRefVerse}
              setCrossRefVerse={setCrossRefVerse}
              crossRefError={crossRefError}
              crossRefLastLookup={crossRefLastLookup}
              crossRefHasScriptureResults={crossRefHasScriptureResults}
              setCrossRefHasScriptureResults={setCrossRefHasScriptureResults}
              handleCrossReferenceLookup={handleCrossReferenceLookup}
              workspaceLanguage={workspace?.language || 'en'}
              token={localStorage.getItem('token') || ''}
            />
          )}
          {activeSection === 'study-report' && (
            <div className="space-y-4 relative min-h-full">
              {scriptureLastLookup && (
                <div className="mb-6">
                  <CollapsibleSection title="Scripture Analysis" defaultOpen={false}>
                    <WorkspaceScriptureAnalysisPanels
                      workspaceId={workspaceId}
                      language={workspace?.language || 'en'}
                      token={localStorage.getItem('token') || ''}
                      scriptureLastLookup={scriptureLastLookup}
                      generatedScriptureSections={generatedScriptureSections}
                      sectionRefreshKey={scriptureSectionRefreshKey}
                      passageSummary={passageSummary}
                      setPassageSummary={setPassageSummary}
                      perVerseContext={perVerseContext}
                      setPerVerseContext={setPerVerseContext}
                      translationComparison={translationComparison}
                      setTranslationComparison={setTranslationComparison}
                      verseCommentary={verseCommentary}
                      setVerseCommentary={setVerseCommentary}
                      structuralAnalysis={structuralAnalysis}
                      setStructuralAnalysis={setStructuralAnalysis}
                      interpretiveChallenges={interpretiveChallenges}
                      setInterpretiveChallenges={setInterpretiveChallenges}
                      canonicalThemes={canonicalThemes}
                      setCanonicalThemes={setCanonicalThemes}
                      studySynthesis={studySynthesis}
                      setStudySynthesis={setStudySynthesis}
                      regenerateScriptureSection={regenerateScriptureSection}
                      persistCurrentScriptureSection={persistCurrentScriptureSection}
                      onAddToOutline={handleAddCanonicalThemeToOutline}
                    />
                  </CollapsibleSection>
                </div>
              )}

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
                  disabled={actionLoading.includes('study-report')}
                  className="cyber-outline text-xs px-3 py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {isStudyAssetLoading('report') ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-cyan-200/80">
                        <span>Generating Study Report</span>
                        <span>Compiling passage intelligence</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full w-2/3 bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-500 animate-pulse rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 rounded bg-white/10 animate-pulse w-5/6" />
                        <div className="h-3 rounded bg-white/10 animate-pulse w-4/6" />
                        <div className="h-3 rounded bg-white/10 animate-pulse w-3/6" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-200/80">No study report yet.</p>
                  )}
                </div>
              )}
              <WorkspaceStudyReportSection
                workspace={workspace}
                hasGeneratedStudyReport={hasGeneratedStudyReport()}
                onGenerate={(asset) => handleGenerate(asset)}
                onEditAsset={(asset) => setStudyAssetEditor(asset)}
                isStudyAssetLoading={isStudyAssetLoading}
                getStudyAssetLoadingLabel={getStudyAssetLoadingLabel}
                expandedTextBlocks={expandedTextBlocks}
                toggleTextBlock={toggleTextBlock}
                onOpenFullView={() => {
                  setActivePhase('PASSAGE')
                  setVisualizationMode('passage')
                  setActiveSection('visualizations')
                }}
              />
            </div>
          )}
          {activeSection === 'coach' && (
            <WorkspaceRefineSection
              workspace={workspace}
              workspaceId={workspaceId}
              actionLoading={actionLoading}
              isSpanishWorkspace={isSpanishWorkspace}
              dnaIntegrityReport={dnaIntegrityReport}
              dnaIntegrityLoading={dnaIntegrityLoading}
              dnaIntegrityExpanded={dnaIntegrityExpanded}
              setDnaIntegrityExpanded={setDnaIntegrityExpanded}
              dnaFlowExpanded={dnaFlowExpanded}
              setDnaFlowExpanded={setDnaFlowExpanded}
              dnaText={dnaText}
              latestDnaAnalysis={latestDnaAnalysis}
              sermonType={sermonType}
              outlinePointsForDna={outlinePointsForDna}
              estimatedMinutesDna={estimatedMinutesDna}
              explanationPct={explanationPct}
              applicationPct={applicationPct}
              illustrationPct={illustrationPct}
              scriptureReferencesInManuscript={scriptureReferencesInManuscript}
              paragraphCount={paragraphCount}
              theologicalThemeCounts={theologicalThemeCounts}
              criticalIssuesCount={criticalIssuesCount}
              warningIssuesCount={warningIssuesCount}
              passageAlignmentScore={passageAlignmentScore}
              getOutlinePointNodes={getOutlinePointNodes}
              handleGenerateDna={() => handleGenerate('dna')}
              socraticCoachSession={socraticCoachSession}
              coachMode={coachMode}
              setCoachMode={setCoachMode}
              coachListenerProfile={coachListenerProfile}
              setCoachListenerProfile={setCoachListenerProfile}
              coachAnswers={coachAnswers}
              setCoachAnswers={setCoachAnswers}
              coachFeedback={coachFeedback}
              repairLockedAnchors={repairLockedAnchors}
              setRepairLockedAnchors={setRepairLockedAnchors}
              repairJob={repairJob}
              pendingCoachRepairPlan={pendingCoachRepairPlan}
              handleSocraticCoachGenerate={handleSocraticCoachGenerate}
              handleSocraticCoachAnswer={handleSocraticCoachAnswer}
              handleApplyAllCoachRepairs={handleApplyAllCoachRepairs}
              handleApplyCoachRepair={handleApplyCoachRepair}
              handleApplyCoachToOutline={handleApplyCoachToOutline}
              handleApplyCoachToManuscript={handleApplyCoachToManuscript}
              getRepairIssueByQuestionId={getRepairIssueByQuestionId}
              repairedIssueIds={repairedIssueIds}
            />
          )}
          {activeSection === 'visualizations' && (
            advancedMode ? (
              <WorkspaceVisualizationsSection
                workspace={workspace}
                visualizationMode={visualizationMode}
                setVisualizationMode={setVisualizationMode}
                setActivePhase={setActivePhase}
              />
            ) : (
              <div className="cyber-panel rounded-2xl p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-2">Advanced Mode</p>
                <h3 className="text-xl font-semibold text-white mb-2">Visualizations are gated</h3>
                <p className="text-sm text-gray-200/80 mb-4">
                  Turn on Advanced Mode to access canonical constellation, prophecy web, narrative map, and flow sculptor tools.
                </p>
                <button
                  type="button"
                  onClick={() => handleToggleAdvancedMode(true)}
                  className="cyber-button text-xs px-4 py-2 rounded-full"
                >
                  Enable Advanced Mode
                </button>
              </div>
            )
          )}
          {activeSection === 'media' && (
            <div className="space-y-6">
              <MediaProductionStudio
                workspace={workspace}
                token={localStorage.getItem('token') || ''}
              />
              <WorkspaceExportPanel
                workspace={workspace}
                token={localStorage.getItem('token') || ''}
              />
            </div>
          )}
          {activeSection === 'church-settings' && (
            <ChurchSettingsPanel token={localStorage.getItem('token') || ''} />
          )}
          </div>
          {actionLoading.includes('outlines') && activeSection === 'outlines' && (
            <LoadingOverlay {...getLoadingMessage('outlines')} />
          )}
          {actionLoading.includes('manuscript') && activeSection === 'manuscript' && (
            <LoadingOverlay {...getLoadingMessage('manuscript')} />
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
            <WorkspaceCommandRail
              workspace={workspace}
              advancedMode={advancedMode}
              progress={progress}
              activeSection={activeSection}
              activePhase={activePhase}
              onSectionChange={(section) => {
                if (section === 'visualizations' && !advancedMode) {
                  setError('Enable Advanced Mode to access visualizations.')
                  setActiveSection('study-report')
                  setActivePhase('STUDY')
                  return
                }
                setActiveSection(section)
                const nextPhase = sectionPhaseMap[section]
                if (nextPhase) setActivePhase(nextPhase)
                if (section === 'visualizations') {
                  setVisualizationMode(nextPhase === 'REFINE' ? 'refine' : 'passage')
                }
              }}
              onPhaseChange={setActivePhase}
              onVisualizationModeChange={setVisualizationMode}
              onToggleAdvancedMode={handleToggleAdvancedMode}
              onCloseRail={() => setRailOpen(false)}
              onNextStepAction={handleNextStepAction}
            />
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

      {studyAssetEditor && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="cyber-panel rounded-2xl p-6 max-w-4xl w-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Study Asset Editor</p>
                <h3 className="text-2xl font-semibold capitalize">{studyAssetEditor}</h3>
              </div>
              <button
                onClick={() => setStudyAssetEditor(null)}
                className="cyber-outline px-3 py-2 text-xs rounded-full"
              >
                Close
              </button>
            </div>
            {renderStudyAssetEditor()}
          </div>
        </div>
      )}

      {referencePreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="cyber-panel rounded-2xl p-6 max-w-3xl w-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Reference Preview</p>
                <h3 className="text-2xl font-semibold">{referencePreview.reference}</h3>
              </div>
              <button
                onClick={() => setReferencePreview(null)}
                className="cyber-outline px-3 py-2 text-xs rounded-full"
              >
                Close
              </button>
            </div>
            {referencePreview.context ? (
              <p className="text-sm text-cyan-100/90 mb-4">{referencePreview.context}</p>
            ) : null}
            {referencePreview.loading ? (
              <div className="space-y-3">
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-500 animate-pulse rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 rounded bg-white/10 animate-pulse w-5/6" />
                  <div className="h-3 rounded bg-white/10 animate-pulse w-4/6" />
                  <div className="h-3 rounded bg-white/10 animate-pulse w-3/6" />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-sm text-gray-100/90 leading-relaxed">{referencePreview.text}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Keyboard Shortcuts Help - Floating Button */}
      <KeyboardShortcutsHelp />
    </div>
  )
}
