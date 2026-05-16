'use client'

import { Book } from 'lucide-react'
import AudioPlayer from '@/components/AudioPlayer'
import EGWPassagePanel from '@/components/EGWPassagePanel'
import SDASmartBoostBanner from '@/components/SDASmartBoostBanner'
import StudyNotes from '@/components/StudyNotes'
import WorkspaceScriptureAnalysisPanels from '@/components/WorkspaceScriptureAnalysisPanels'

type Props = {
  workspace: any
  actionLoading: string[]
  scriptureQuery: string
  setScriptureQuery: (value: string) => void
  scriptureTranslation: string
  setScriptureTranslation: (value: string) => void
  scriptureError: string | null
  scriptureLastLookup: string
  scriptureLookupHistory: Array<any>
  scriptureSuggestions: string[]
  scriptureSuggestionIndex: number
  showScriptureSuggestions: boolean
  scriptureInputWarning: string | null
  scriptureValidationWarning: string | null
  setShowScriptureSuggestions: (value: boolean) => void
  setScriptureSuggestionIndex: (value: number | ((prev: number) => number)) => void
  setScriptureError: (value: string | null) => void
  setScriptureValidationWarning: (value: string | null) => void
  buildScriptureSuggestions: (value: string) => void
  handleScriptureLookup: () => Promise<void>
  handleScriptureSnapshotSelect: (snapshot: any) => void
  scriptureResult: any
  extractVerses: (value: any) => Array<{ reference?: string; text?: string }>
  getReferenceStartVerse: (reference: string) => number | null
  audioUrl: string | null
  isAudioLoading: boolean
  audioError: string | null
  setAudioError: (value: string | null) => void
  generatedScriptureSections: Record<string, boolean>
  scriptureSectionRefreshKey: Record<string, number>
  passageSummary: any
  setPassageSummary: (value: any) => void
  perVerseContext: any
  setPerVerseContext: (value: any) => void
  translationComparison: any
  setTranslationComparison: (value: any) => void
  verseCommentary: any
  setVerseCommentary: (value: any) => void
  structuralAnalysis: any
  setStructuralAnalysis: (value: any) => void
  interpretiveChallenges: any
  setInterpretiveChallenges: (value: any) => void
  canonicalThemes: any
  setCanonicalThemes: (value: any) => void
  studySynthesis: any
  setStudySynthesis: (value: any) => void
  regenerateScriptureSection: (section: string) => any
  persistCurrentScriptureSection: (section: any, data: unknown) => any
  onAddToOutline: (theme: string, verses: string[]) => any
  handleVerseClick: (verseRef: string) => void
}

export function WorkspaceScriptureSection({
  workspace,
  actionLoading,
  scriptureQuery,
  setScriptureQuery,
  scriptureTranslation,
  setScriptureTranslation,
  scriptureError,
  scriptureLastLookup,
  scriptureLookupHistory,
  scriptureSuggestions,
  scriptureSuggestionIndex,
  showScriptureSuggestions,
  scriptureInputWarning,
  scriptureValidationWarning,
  setShowScriptureSuggestions,
  setScriptureSuggestionIndex,
  setScriptureError,
  setScriptureValidationWarning,
  buildScriptureSuggestions,
  handleScriptureLookup,
  handleScriptureSnapshotSelect,
  scriptureResult,
  extractVerses,
  getReferenceStartVerse,
  audioUrl,
  isAudioLoading,
  audioError,
  setAudioError,
  generatedScriptureSections,
  scriptureSectionRefreshKey,
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
  handleVerseClick,
}: Props) {
  return (
    <div className="space-y-4">
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
            {scriptureInputWarning && <p className="mt-2 text-xs text-amber-300/90">{scriptureInputWarning}</p>}
            {scriptureValidationWarning && <p className="mt-2 text-xs text-amber-300/90">{scriptureValidationWarning}</p>}
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest cyber-muted mb-2 block">Translation</label>
            <select
              value={scriptureTranslation}
              onChange={(e) => setScriptureTranslation(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
            >
              {['KJV', 'WEB', 'ESV', 'NIV'].map((trans) => (
                <option key={trans} value={trans}>
                  {trans}
                </option>
              ))}
            </select>
          </div>
        </div>
        {scriptureError ? (
          <div className="border border-red-400/40 bg-red-500/10 text-red-100 text-sm rounded-xl px-4 py-3">{scriptureError}</div>
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

        {scriptureLastLookup && <SDASmartBoostBanner passage={scriptureLastLookup} />}

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

            {isAudioLoading && <div className="text-sm text-cyan-300 animate-pulse">Loading audio...</div>}
            {audioError && <div className="text-sm text-amber-300">{audioError}</div>}
            {audioUrl && (
              <AudioPlayer
                audioUrl={audioUrl}
                title={`${String((scriptureResult as Record<string, unknown> | null)?.reference || scriptureLastLookup || workspace?.mainPassage || 'Passage')} - ${scriptureTranslation}`}
                onError={(error) => setAudioError(error)}
              />
            )}

            <WorkspaceScriptureAnalysisPanels
              workspaceId={workspace?.id || ''}
              language={String(workspace?.language || 'en')}
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
              onAddToOutline={onAddToOutline}
            />

            {Array.isArray((scriptureResult as any)?.studyNotes) && (scriptureResult as any).studyNotes.length > 0 && (
              <StudyNotes notes={(scriptureResult as any).studyNotes || []} onVerseClick={handleVerseClick} />
            )}

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
          <div className="rounded-xl border border-dashed border-cyan-400/30 bg-black/20 p-4">
            <p className="text-gray-200/80">No passage loaded yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Start with a passage reference, then load Scripture to begin study notes and supporting tools.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkspaceScriptureSection
