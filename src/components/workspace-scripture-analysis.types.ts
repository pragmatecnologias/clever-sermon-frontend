export interface PassageSummaryData {
  passage: string
  summary: string
  interpretiveCenter: string
  mainTension: string
  movement: string[]
  dataSource: 'llm-generated' | 'curated' | 'unavailable'
  mainIdea?: string
}

export interface VerseContextNote {
  note: string
  period: string
  source?: string
}

export interface VerseContextCulturalNote {
  note: string
  category: 'social' | 'religious' | 'economic' | 'political'
}

export interface VerseContextGeographicalInfo {
  place: string
  description: string
  significance: string
  modernLocation?: string
}

export interface VerseContextSection {
  title: string
  content: string
}

export interface VerseContextData {
  reference: string
  status?: 'ready' | 'unavailable'
  genre?: string
  sections?: VerseContextSection[]
  warnings?: string[]
  message?: string | null
  source?: 'llm-generated' | 'curated'
  historical?: VerseContextNote[]
  cultural?: VerseContextCulturalNote[]
  geographical?: VerseContextGeographicalInfo[]
  dataSource?: string
}

export interface TranslationComparisonVerse {
  number: string
  text: string
  reference?: string
}

export interface TranslationComparisonTranslation {
  code: string
  name: string
  text: string
  verses?: TranslationComparisonVerse[]
  type: 'formal' | 'dynamic' | 'paraphrase'
}

export interface TranslationComparisonKeyDifference {
  category: 'theological_term' | 'verb_difference' | 'literal_vs_dynamic' | 'addition_omission'
  translations: string[]
  difference: string
  explanation: string
  significance: 'high' | 'medium' | 'low'
}

export interface TranslationComparisonData {
  reference: string
  translations: TranslationComparisonTranslation[]
  keyDifferences: TranslationComparisonKeyDifference[]
  analysis: {
    verbDifferences: string[]
    theologicalTermDifferences: string[]
    literalVsDynamic: string[]
    overallAssessment: string
  }
}

export interface VerseCommentaryNote {
  type: 'context' | 'word' | 'historical' | 'theological' | 'egw'
  content: string
  source: string
}

export interface VerseCommentaryData {
  verseReference: string
  notes: VerseCommentaryNote[]
  dataSource: 'egw' | 'llm-generated' | 'unavailable'
}

export interface StructuralAnalysisElement {
  verses: string
  type: string
  description: string
}

export interface StructuralAnalysisChiasmElement {
  label: string
  verses: string
  content: string
}

export interface StructuralAnalysisData {
  passage: string
  literaryGenre: string
  structure: StructuralAnalysisElement[]
  chiasm?: {
    pattern: string
    elements: StructuralAnalysisChiasmElement[]
  }
  dataSource: string
}

export interface InterpretiveViewData {
  viewName: string
  summary: string
  keyArguments: string[]
}

export interface SDAPerspectiveData {
  position: string
  reasoning: string
  supportingTexts: string[]
}

export interface InterpretiveChallengeData {
  passage: string
  challenge: string
  views: InterpretiveViewData[]
  sdaPerspective?: SDAPerspectiveData
  dataSource: string
}

export interface CanonicalThemeVerseData {
  reference: string
  snippet: string
  explanation: string
  stage: 'foundation' | 'expansion' | 'echo' | 'fulfillment'
  testament: 'OT' | 'NT'
  era: 'Torah' | 'History' | 'Wisdom' | 'Prophets' | 'Gospels' | 'Acts' | 'Epistles' | 'Revelation'
}

export interface CanonicalThemeData {
  theme: string
  description: string
  explanation: string
  canonicalMovement: string
  category: string
  verses: CanonicalThemeVerseData[]
  isPrimary?: boolean
}

export interface CanonicalThemesData {
  passage: string
  themes: CanonicalThemeData[]
  dataSource: 'llm-generated' | 'unavailable'
}

export interface StudySynthesisData {
  passage: string
  centralClaim: string
  canonicalSignificance: string
  pastoralTakeaway: string
  preachingFocus: string
  dataSource: 'llm-generated' | 'curated' | 'unavailable'
}
