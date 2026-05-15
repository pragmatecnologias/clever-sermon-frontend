'use client'

import type { Dispatch, SetStateAction } from 'react'
import { AlertCircle, BookOpen, Lightbulb, Layers, MessageSquare, Network, Rows } from 'lucide-react'
import PassageSummary from '@/components/PassageSummary'
import TranslationComparisonEnhanced from '@/components/TranslationComparisonEnhanced'
import PerVerseContextPanel from '@/components/PerVerseContextPanel'
import VerseCommentaryPanel from '@/components/VerseCommentaryPanel'
import StructuralAnalysisPanel from '@/components/StructuralAnalysisPanel'
import InterpretiveChallengePanel from '@/components/InterpretiveChallengePanel'
import CanonicalThemeTracing from '@/components/CanonicalThemeTracing'
import StudySynthesis from '@/components/StudySynthesis'
import { ScriptureSection } from '@/components/WorkspaceScripturePhase'
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

type ScriptureSectionKey =
  | 'passageSummary'
  | 'verseContext'
  | 'translationComparison'
  | 'verseCommentary'
  | 'structuralAnalysis'
  | 'interpretiveChallenges'
  | 'canonicalThemes'
  | 'studySynthesis'

interface WorkspaceScriptureAnalysisPanelsProps {
  workspaceId: string
  language: string
  token: string
  scriptureLastLookup: string
  generatedScriptureSections: Record<string, boolean>
  sectionRefreshKey: Record<string, number>
  passageSummary: PassageSummaryData | null
  setPassageSummary: Dispatch<SetStateAction<PassageSummaryData | null>>
  perVerseContext: VerseContextData | null
  setPerVerseContext: Dispatch<SetStateAction<VerseContextData | null>>
  translationComparison: TranslationComparisonData | null
  setTranslationComparison: Dispatch<SetStateAction<TranslationComparisonData | null>>
  verseCommentary: VerseCommentaryData | null
  setVerseCommentary: Dispatch<SetStateAction<VerseCommentaryData | null>>
  structuralAnalysis: StructuralAnalysisData | null
  setStructuralAnalysis: Dispatch<SetStateAction<StructuralAnalysisData | null>>
  interpretiveChallenges: InterpretiveChallengeData | null
  setInterpretiveChallenges: Dispatch<SetStateAction<InterpretiveChallengeData | null>>
  canonicalThemes: CanonicalThemesData | null
  setCanonicalThemes: Dispatch<SetStateAction<CanonicalThemesData | null>>
  studySynthesis: StudySynthesisData | null
  setStudySynthesis: Dispatch<SetStateAction<StudySynthesisData | null>>
  regenerateScriptureSection: (section: string) => void
  persistCurrentScriptureSection: (section: ScriptureSectionKey, data: unknown) => void
  onAddToOutline?: (theme: string, verses: string[]) => Promise<void> | void
}

export default function WorkspaceScriptureAnalysisPanels({
  workspaceId,
  language,
  token,
  scriptureLastLookup,
  generatedScriptureSections,
  sectionRefreshKey,
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
  onAddToOutline,
}: WorkspaceScriptureAnalysisPanelsProps) {
  if (!scriptureLastLookup) return null

  return (
    <>
      <ScriptureSection title="Passage Context">
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
              key={`${scriptureLastLookup}-passageSummary-${sectionRefreshKey.passageSummary}`}
              reference={scriptureLastLookup}
              token={token}
              language={language}
              cachedData={passageSummary}
              onDataLoad={(data) => {
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
              key={`${scriptureLastLookup}-verseContext-${sectionRefreshKey.verseContext}`}
              reference={scriptureLastLookup}
              token={token}
              language={language}
              cachedData={perVerseContext}
              onDataLoad={(data) => {
                setPerVerseContext(data)
                persistCurrentScriptureSection('verseContext', data)
              }}
            />
          ) : (
            <div className="cyber-panel rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold">Historical Context</h3>
              </div>
            </div>
          )}
        </div>
      </ScriptureSection>

      <ScriptureSection title="Translation and Analysis">
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
              key={`${scriptureLastLookup}-translationComparison-${sectionRefreshKey.translationComparison}`}
              reference={scriptureLastLookup}
              token={token}
              language={language}
              cachedData={translationComparison}
              onDataLoad={(data) => {
                setTranslationComparison(data)
                persistCurrentScriptureSection('translationComparison', data)
              }}
            />
          ) : (
            <div className="cyber-panel rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <Rows className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold">Translation Comparison</h3>
              </div>
            </div>
          )}
        </div>

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
              key={`${scriptureLastLookup}-verseCommentary-${sectionRefreshKey.verseCommentary}`}
              reference={scriptureLastLookup}
              token={token}
              language={language}
              cachedData={verseCommentary}
              onDataLoad={(data) => {
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
              key={`${scriptureLastLookup}-structuralAnalysis-${sectionRefreshKey.structuralAnalysis}`}
              passage={scriptureLastLookup}
              token={token}
              language={language}
              cachedData={structuralAnalysis}
              onDataLoad={(data) => {
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
              key={`${scriptureLastLookup}-interpretiveChallenges-${sectionRefreshKey.interpretiveChallenges}`}
              passage={scriptureLastLookup}
              token={token}
              language={language}
              cachedData={interpretiveChallenges}
              onDataLoad={(data) => {
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
      </ScriptureSection>

      <ScriptureSection title="Cross References and Synthesis">
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
              key={`${scriptureLastLookup}-canonicalThemes-${sectionRefreshKey.canonicalThemes}`}
              reference={scriptureLastLookup}
              token={token}
              workspaceId={workspaceId}
              language={language}
              cachedData={canonicalThemes}
              onDataLoad={(data) => {
                setCanonicalThemes(data)
                persistCurrentScriptureSection('canonicalThemes', data)
              }}
              onAddToOutline={onAddToOutline}
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
              key={`${scriptureLastLookup}-studySynthesis-${sectionRefreshKey.studySynthesis}`}
              reference={scriptureLastLookup}
              token={token}
              language={language}
              cachedData={studySynthesis}
              onDataLoad={(data) => {
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
      </ScriptureSection>
    </>
  )
}
