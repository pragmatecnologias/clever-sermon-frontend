'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
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
import WorkspaceScriptureSection from '@/components/WorkspaceScriptureSection'
import WorkspaceManuscriptCard from '@/components/WorkspaceManuscriptCard'
import WorkspaceScriptureAnalysisPanels from '@/components/WorkspaceScriptureAnalysisPanels'
import WorkspaceStudyReportSection from '@/components/WorkspaceStudyReportSection'
import WorkspaceStudyReportView from '@/components/WorkspaceStudyReportView'
import WorkspaceStudyAssetEditor from '@/components/WorkspaceStudyAssetEditor'
import WorkspaceManuscriptCuesPanel from '@/components/WorkspaceManuscriptCuesPanel'
import {
  buildScriptureSnapshot,
  compactSnapshotForPersistence,
  extractVerses,
  getReferenceStartVerse,
  getScriptureSuggestions,
  getVerseValidationWarning,
  mergeScriptureLookupHistory,
  normalizeScriptureResult,
} from '@/components/workspace-scripture.helpers'
import {
  buildCueAnchorsFromHtml,
  buildInlineWordDiff,
  buildWordDiff,
  compactLabel,
  estimatePointMinutes,
  getFlowNarrativeEntries,
  getManuscriptQualityUi,
  getOutlineBigIdea,
  getOutlinePointLabel,
  getOutlinePointNodes,
  getOutlineTitle,
  getPassageFocusText,
  getRepairAuditTrail,
  getRepairItemMatchQuery,
  getRepairedAuditItems,
  getStudyAssetLoadingLabel,
  hasGeneratedStudyReport,
  isStudyAssetLoading,
  isManuscriptV2,
  normalizeCueSearchText,
  normalizeManuscriptCues,
  normalizeRepairSnippetRaw,
  sanitizeManuscriptForDisplay,
  summarizeRepairSnippet,
} from '@/components/workspace-page.helpers'
import WorkspaceVisualizationsSection from '@/components/WorkspaceVisualizationsSection'
import WorkspaceRefineSection from '@/components/WorkspaceRefineSection'
import WorkspaceWordStudySection from '@/components/WorkspaceWordStudySection'
import WorkspaceCrossReferencesSection from '@/components/WorkspaceCrossReferencesSection'
import WorkspaceOverviewSection from '@/components/WorkspaceOverviewSection'
import WorkspaceCommandRail from '@/components/WorkspaceCommandRail'
import WorkspaceManuscriptControls from '@/components/WorkspaceManuscriptControls'
import WorkspaceExportPanel from '@/components/WorkspaceExportPanel'
import { createWorkspaceApiClient } from '@/lib/api/openapi-client'
import type { WorkspaceStateResponse } from '@/lib/api/openapi-client'
import { createAppApiClient } from '@/lib/api/app-api-client'
import { WorkspaceSection, sectionPhaseMap } from '@/components/workspace-shell.types'
import { useWorkspaceUiState } from '@/hooks/useWorkspaceUiState'
import { useWorkspaceJobs } from '@/hooks/useWorkspaceJobs'
import { useWorkspaceStructureActions } from '@/hooks/useWorkspaceStructureActions'
import { useWorkspaceGenerationActions } from '@/hooks/useWorkspaceGenerationActions'
import { useWorkspaceStudyActions } from '@/hooks/useWorkspaceStudyActions'
import { useWorkspaceContentActions } from '@/hooks/useWorkspaceContentActions'
import type {
  WorkspaceCitationDraft,
  WorkspaceCitationItem,
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
type WorkspaceShellState = WorkspaceStateResponse

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
  scriptureCache?: Record<string, unknown>
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
  const [workspaceState, setWorkspaceState] = useState<WorkspaceStateResponse | null>(null)
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
  const { activePhase, activeSection, setActivePhase, setActiveSection } = useWorkspaceUiState({
    workspaceId,
    workspace,
    loading,
    router,
  })

  const buildScriptureSuggestions = (value: string) => {
    const { suggestions, warning } = getScriptureSuggestions(value)
    setScriptureSuggestions(suggestions)
    setScriptureSuggestionIndex(suggestions.length ? 0 : -1)
    setScriptureInputWarning(warning)
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
      nextHistory = mergeScriptureLookupHistory(snapshot as unknown as import('@/components/workspace-scripture.helpers').ScriptureLookupSnapshot, prev as unknown as import('@/components/workspace-scripture.helpers').ScriptureLookupSnapshot[]) as unknown as ScriptureLookupSnapshot[]
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
  const latestStudyReport = (workspace as any)?.workspace?.studyReports?.[0] ?? workspace?.studyReports?.[0]
  const latestManuscript = workspace?.manuscripts?.[0]
  const latestManuscriptCueAnchors = (() => {
    if (!latestManuscript) return {}
    const content = latestManuscript.content || {}
    const metadata = isRecord(content.metadata) ? (content.metadata as Record<string, unknown>) : null
    const savedAnchors = metadata && isRecord(metadata.cueAnchors) ? (metadata.cueAnchors as Record<string, unknown>) : null
    if (savedAnchors && Object.keys(savedAnchors).length > 0) return savedAnchors
    const html = String(content.text || '')
    const cues = normalizeManuscriptCues((content.cues || {}) as Record<string, unknown>)
    return buildCueAnchorsForRenderedHtml(html, cues) as Record<string, unknown>
  })()
  const workspaceMetadata = getWorkspaceMetadata(workspace)
  const manuscriptOptionsDrifted = (options: Record<string, unknown> | null | undefined) => {
    const uiState = isRecord(workspaceMetadata.uiState) ? (workspaceMetadata.uiState as Record<string, unknown>) : null
    const currentOptions = uiState && isRecord(uiState.manuscriptOptions) ? (uiState.manuscriptOptions as Record<string, unknown>) : null
    if (!currentOptions) return false
    return JSON.stringify(currentOptions) !== JSON.stringify(options || {})
  }
  const repairedIssueIds = new Set<string>(getLatestManuscriptRepairIssues(workspace))
  const coachRepairPlan = Array.isArray(socraticCoachSession?.repairPlan) ? socraticCoachSession.repairPlan : []
  const pendingCoachRepairPlan = coachRepairPlan.filter((item: WorkspaceRepairPlanItem) => {
    const issueId = String(item?.issueId || '').trim()
    return issueId && !repairedIssueIds.has(issueId)
  })
  const themeConfigured =
    Boolean(String(workspace?.title || '').trim()) &&
    Boolean(String(workspace?.mainPassage || '').trim()) &&
    Boolean(String(workspace?.language || workspaceMetadata.language || '').trim()) &&
    Boolean(String(workspace?.style || '').trim()) &&
    Boolean(String(workspace?.storyArc || '').trim())
  const refineCompleted =
    Boolean(dnaIntegrityReport) ||
    Boolean(socraticCoachSession) ||
    Boolean(getWorkspaceSermonDnaAnalysis(workspace)) ||
    Boolean(getWorkspaceCoachSession(workspace))
  const deliverPrepared =
    workspaceHasDeliverables(workspace, ['hasSlides', 'hasMedia', 'hasSocial', 'hasMusic'])

  const backendProgress = workspaceState?.progress || null
  const progress = backendProgress
    ? {
        themeConfigured: backendProgress.themeConfigured || themeConfigured,
        passageExplored: backendProgress.passageExplored || !!scriptureResult,
        studyGenerated: backendProgress.studyGenerated || !!latestStudyReport,
        outlineCreated: backendProgress.outlineCreated || !!workspace?.outlines?.some((item) => item?.isSelected),
        manuscriptWritten: backendProgress.manuscriptWritten || !!latestManuscript,
        refineCompleted: backendProgress.refineCompleted || refineCompleted,
        deliverPrepared: backendProgress.deliverPrepared || deliverPrepared,
      }
    : {
        themeConfigured,
        passageExplored: !!scriptureResult,
        studyGenerated: !!latestStudyReport,
        outlineCreated: !!workspace?.outlines?.some((item) => item?.isSelected),
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
      const hydrateScriptureCache = (data: Record<string, unknown> | null | undefined): boolean => {
        if (!data || typeof data !== 'object') return false

        let restored = false

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
          restored = true
        }

        if (data.crossReferences) {
          const cachedCrossReferences = data.crossReferences as Record<string, unknown>
          setCrossRefVerse(String(cachedCrossReferences.verse || ''))
          setCrossRefLastLookup(String(cachedCrossReferences.verse || ''))
          const ranked = Array.isArray(cachedCrossReferences.ranked) ? cachedCrossReferences.ranked : []
          setCrossRefResults(ranked)
          setCrossRefHasScriptureResults(ranked.length > 0)
          restored = true
        }

        const history: ScriptureLookupSnapshot[] = Array.isArray(data.lookupHistory) ? data.lookupHistory : []
        const normalizedHistory = history
          .filter((entry) => entry?.scriptureLastLookup && entry?.scriptureResult)
          .map((entry) => buildScriptureSnapshot(entry))
          .filter((entry) => extractVerses(entry.scriptureResult).length > 0)
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
          if (extractVerses(legacySnapshot.scriptureResult).length > 0) {
            const restoredSnapshot = legacySnapshot
            setScriptureLookupHistory([restoredSnapshot])
            applyScriptureLookupSnapshot(restoredSnapshot)
            return true
          }
        }

        return restored
      }

      const localCache = isRecord(workspaceData?.scriptureCache) ? (workspaceData?.scriptureCache as Record<string, unknown>) : null
      if (hydrateScriptureCache(localCache)) return true

      const client = getAppApiClient()
      if (!client) return false
      const data = await client.get<Record<string, unknown>>(`/workspaces/${workspaceId}/scripture-cache`)
      if (data) return hydrateScriptureCache(data)
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

  function cueAnchorKey(cueType: keyof ManuscriptCues, cueIndex: number) {
    return `${cueType}:${cueIndex}`
  }

  function cueParagraphHash(value: string) {
    const normalized = normalizeCueSearchText(value)
    if (!normalized) return ''
    let hash = 0
    for (let i = 0; i < normalized.length; i += 1) {
      hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0
    }
    return `h${hash.toString(16)}`
  }

  function scoreCueMatch(cueText: string, candidateText: string) {
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

  function buildCueAnchorsForRenderedHtml(html: string, cues: ManuscriptCues): Record<string, CueAnchor> {
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
  ) => (
    <WorkspaceManuscriptCuesPanel
      cues={cues}
      editable={editable}
      collapsed={manuscriptCuesCollapsed}
      setCollapsed={setManuscriptCuesCollapsed}
      onCueClick={onCueClick}
      options={options}
    />
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
      await restoreScriptureLookupCache(workspaceData)
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

  useWorkspaceJobs({
    workspaceId,
    repairJob,
    generationJob,
    workspaceApiClient: getWorkspaceApiClient,
    refreshWorkspaceState,
    withToken,
    setError,
    setRepairJob,
    setGenerationJob,
    setSermonCoreGenerating,
    setActionLoading,
    setLastRepairNotice,
    setManuscriptQualityExpanded,
  })

  const {
    handleWorkspaceSave,
    handleOutlineSave,
    handleOutlineSelect,
    handleCitationValidate,
    handleSearch,
    handleCitationSave,
  } = useWorkspaceStructureActions({
    workspaceId,
    workspaceDraft,
    outlineDraft,
    citationDraft,
    citationTranslation,
    searchQuery,
    workspaceApiClient: getWorkspaceApiClient,
    appApiClient: getAppApiClient,
    refreshWorkspaceState,
    withToken,
    setActionLoading,
    setError,
    setWorkspaceDraft,
    setEditingWorkspace,
    setEditingOutlineId,
    setOutlineDraft,
    setEditingCitationId,
    setCitationDraft,
    setSearchResults,
  })

  const {
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
  } = useWorkspaceGenerationActions({
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
  })

  const {
    handleScriptureLookup,
    handleWordStudyLookup,
    fetchWordStudySuggestions,
    handleCrossReferenceLookup,
    openPromptEditor,
    runPrompt,
  } = useWorkspaceStudyActions({
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
    promptText,
    setPromptType,
    setPromptText,
    setPromptModalOpen,
    workspaceIdRef: workspaceId,
    handleGenerate,
  })

  const {
    handleManuscriptSave,
    handleRegenerateManuscriptCues,
    handleApplicationSave,
    handleQuestionSave,
    handleIllustrationSave,
    handleRepairClaim,
    handleAcknowledgeClaim,
    handleCiteClaim,
  } = useWorkspaceContentActions({
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
  })

  // Keyboard shortcuts
  useKeyboardShortcut('1', () => handlePhaseChange('THEME'), { cmd: true })
  useKeyboardShortcut('2', () => handlePhaseChange('PASSAGE'), { cmd: true })
  useKeyboardShortcut('3', () => handlePhaseChange('STUDY'), { cmd: true })
  useKeyboardShortcut('4', () => handlePhaseChange('OUTLINE'), { cmd: true })
  useKeyboardShortcut('5', () => handlePhaseChange('WRITE'), { cmd: true })
  useKeyboardShortcut('6', () => handlePhaseChange('REFINE'), { cmd: true })
  useKeyboardShortcut('7', () => handlePhaseChange('DELIVER'), { cmd: true })

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
          activePhase={activePhase}
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
                getPassageFocusText={() => getPassageFocusText(passageSummary, workspaceState || workspace)}
                getOutlinePointNodes={getOutlinePointNodes}
                estimatePointMinutes={estimatePointMinutes}
                getFlowNarrativeEntries={(outline, pointNodes) =>
                  getFlowNarrativeEntries(outline, pointNodes, passageSummary, workspaceState || workspace)
                }
                getOutlineTitle={(outline) => getOutlineTitle(outline, getOutlinePointNodes)}
                getOutlineBigIdea={(outline) => getOutlineBigIdea(outline, passageSummary, workspaceState || workspace)}
                expandedTextBlocks={expandedTextBlocks}
                toggleTextBlock={toggleTextBlock}
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
              {/* Prompt/Generate buttons are rendered by WorkspaceManuscriptControls below */}
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
                  manuscriptCueAnchors={latestManuscriptCueAnchors}
                  ensureManuscriptRichHtml={ensureManuscriptRichHtml}
                  manuscriptContentRef={latestManuscript ? (() => { const mid = latestManuscript?.id ?? ''; return (el: HTMLDivElement | null) => { if (mid) manuscriptContentRefs.current[mid] = el } })() : undefined}
                  markdownLikeToHtml={markdownLikeToHtml}
                  sanitizeManuscriptForDisplay={sanitizeManuscriptForDisplay}
                  emptyManuscriptCues={emptyManuscriptCues}
                  handleManuscriptSave={handleManuscriptSave}
                handleRegenerateManuscriptCues={handleRegenerateManuscriptCues}
              />
              ) : (
                <div className="rounded-xl border border-dashed border-cyan-400/30 bg-black/20 p-4">
                  <p className="text-gray-100/90">No manuscript yet.</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Build an outline first, then draft the sermon or let the app help shape it section by section.
                  </p>
                </div>
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
              <WorkspaceScriptureSection
                workspace={workspace}
                featureReadiness={workspaceState?.featureReadiness}
                actionLoading={actionLoading}
                scriptureQuery={scriptureQuery}
                setScriptureQuery={setScriptureQuery}
                scriptureTranslation={scriptureTranslation}
                setScriptureTranslation={setScriptureTranslation}
                scriptureError={scriptureError}
                scriptureLastLookup={scriptureLastLookup}
                scriptureLookupHistory={scriptureLookupHistory}
                scriptureSuggestions={scriptureSuggestions}
                scriptureSuggestionIndex={scriptureSuggestionIndex}
                showScriptureSuggestions={showScriptureSuggestions}
                scriptureInputWarning={scriptureInputWarning}
                scriptureValidationWarning={scriptureValidationWarning}
                setShowScriptureSuggestions={setShowScriptureSuggestions}
                setScriptureSuggestionIndex={setScriptureSuggestionIndex}
                setScriptureError={setScriptureError}
                setScriptureValidationWarning={setScriptureValidationWarning}
                buildScriptureSuggestions={buildScriptureSuggestions}
                handleScriptureLookup={handleScriptureLookup}
                handleScriptureSnapshotSelect={handleScriptureSnapshotSelect}
                scriptureResult={scriptureResult}
                extractVerses={extractVerses}
                getReferenceStartVerse={getReferenceStartVerse}
                audioUrl={audioUrl}
                isAudioLoading={isAudioLoading}
                audioError={audioError}
                setAudioError={setAudioError}
                generatedScriptureSections={generatedScriptureSections}
                scriptureSectionRefreshKey={scriptureSectionRefreshKey}
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
                handleVerseClick={handleVerseClick}
              />
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
              featureReadiness={workspaceState?.featureReadiness}
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
                      featureReadiness={workspaceState?.featureReadiness}
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
              {isStudyAssetLoading('report', actionLoading) ? (
                <div className="cyber-panel rounded-2xl p-6">
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
                </div>
              ) : (workspace as any)?.workspace?.studyReports?.length ?? workspace?.studyReports?.length ? (
                <div className="cyber-panel rounded-2xl p-6">
              <WorkspaceStudyReportView
                    report={workspace.studyReports?.[0] || null}
                    onJumpToWordStudy={(term) => {
                      const clean = String(term || '').trim()
                      if (!clean) return
                      setWordStudyWord(clean)
                      setWordStudyLastLookup(clean)
                      setActiveSection('word-study')
                      setTimeout(() => {
                        handleWordStudyLookup()
                      }, 60)
                    }}
                  />
                </div>
              ) : (
                <div className="cyber-panel rounded-2xl p-6">
                  <p className="text-gray-200/80">No study report yet.</p>
                </div>
              )}
              <WorkspaceStudyReportSection
                workspace={workspace}
                featureReadiness={workspaceState?.featureReadiness}
                hasGeneratedStudyReport={hasGeneratedStudyReport(workspaceState || workspace)}
                onGenerate={(asset) => handleGenerate(asset)}
                onEditAsset={(asset) => setStudyAssetEditor(asset)}
                isStudyAssetLoading={isStudyAssetLoading}
                getStudyAssetLoadingLabel={getStudyAssetLoadingLabel}
                expandedTextBlocks={expandedTextBlocks}
                actionLoading={actionLoading}
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
              handleSocraticCoachGenerate={handleSocraticCoachGenerate}
              handleSocraticCoachAnswer={handleSocraticCoachAnswer}
              handleApplyAllCoachRepairs={handleApplyAllCoachRepairs}
              handleApplyCoachRepair={handleApplyCoachRepair}
              handleApplyCoachToOutline={handleApplyCoachToOutline}
              handleApplyCoachToManuscript={handleApplyCoachToManuscript}
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
            <WorkspaceStudyAssetEditor
              studyAssetEditor={studyAssetEditor}
              workspace={workspace}
              actionLoading={actionLoading}
              openPromptEditor={openPromptEditor}
              handleGenerate={handleGenerate}
              editingApplicationId={editingApplicationId}
              applicationDraft={applicationDraft}
              setEditingApplicationId={setEditingApplicationId}
              setApplicationDraft={setApplicationDraft}
              handleApplicationSave={handleApplicationSave}
              editingQuestionId={editingQuestionId}
              questionDraft={questionDraft}
              setEditingQuestionId={setEditingQuestionId}
              setQuestionDraft={setQuestionDraft}
              handleQuestionSave={handleQuestionSave}
              editingIllustrationId={editingIllustrationId}
              illustrationDraft={illustrationDraft}
              setEditingIllustrationId={setEditingIllustrationId}
              setIllustrationDraft={setIllustrationDraft}
              handleIllustrationSave={handleIllustrationSave}
              onClose={() => setStudyAssetEditor(null)}
            />
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
