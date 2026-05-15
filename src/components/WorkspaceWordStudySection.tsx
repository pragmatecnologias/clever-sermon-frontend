import React from 'react'
import { renderSmartValue } from '@/components/workspace-render.helpers'

type WordStudyResult = {
  lemma?: string
  originalScript?: string
  transliteration?: string
  definition?: string
  strongs?: string
  partOfSpeech?: string
  usageCount?: number | string
  examples?: string[]
  verseOccurrences?: string[]
  distributionByBook?: Array<{ book?: string; count?: number }>
}

type WordStudyInsights = {
  rootWord?: string
  semanticRange?: unknown
  nuanceNotes?: unknown
  grammarInsights?: Record<string, unknown> | null
}

type WordStudySuggestion = {
  term: string
  transliteration?: string
  language?: string
  reason?: string
  gloss?: string
}

type Props = {
  isSpanishWorkspace: boolean
  actionLoading: string[]
  wordStudyWord: string
  setWordStudyWord: (value: string) => void
  wordStudyLanguage: string
  setWordStudyLanguage: (value: string) => void
  availableLanguages: Array<{ value: string; label: string }>
  scriptureLastLookup: string
  wordStudySuggestionsLoading: boolean
  wordStudySuggestions: WordStudySuggestion[]
  wordStudyError: string | null
  wordStudyLastLookup: string
  wordStudyResult: WordStudyResult | null
  wordStudyInsights: WordStudyInsights | null
  handleWordStudyLookup: (options?: { word?: string; language?: string }) => void
}

export default function WorkspaceWordStudySection({
  isSpanishWorkspace,
  actionLoading,
  wordStudyWord,
  setWordStudyWord,
  wordStudyLanguage,
  setWordStudyLanguage,
  availableLanguages,
  scriptureLastLookup,
  wordStudySuggestionsLoading,
  wordStudySuggestions,
  wordStudyError,
  wordStudyLastLookup,
  wordStudyResult,
  wordStudyInsights,
  handleWordStudyLookup,
}: Props) {
  return (
    <div className="space-y-4 relative min-h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">{isSpanishWorkspace ? 'Estudio de palabras' : 'Word Study'}</h3>
        <button
          onClick={() => handleWordStudyLookup()}
          disabled={actionLoading.includes('word-study')}
          className="cyber-outline text-xs px-3 py-2 rounded-full disabled:opacity-60"
        >
          {actionLoading.includes('word-study')
            ? (isSpanishWorkspace ? 'Buscando...' : 'Looking up...')
            : (isSpanishWorkspace ? 'Buscar' : 'Lookup')}
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
            {availableLanguages.map((lang) => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-widest text-cyan-200/70">
              {isSpanishWorkspace ? 'Sugerido desde' : 'Suggested From'} {scriptureLastLookup || (isSpanishWorkspace ? 'Pasaje' : 'Passage')}
            </p>
            {wordStudySuggestionsLoading ? (
              <span className="text-[11px] text-gray-400">{isSpanishWorkspace ? 'Cargando...' : 'Loading...'}</span>
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
                ? (isSpanishWorkspace ? 'Analizando términos del pasaje...' : 'Analyzing passage terms...')
                : (isSpanishWorkspace
                  ? 'Aún no hay términos sugeridos. Abre primero Escritura y luego vuelve aquí.'
                  : 'No suggested terms yet. Open Scripture first, then return here.')}
            </p>
          )}
        </div>
        {wordStudyError ? (
          <div className="border border-red-400/40 bg-red-500/10 text-red-100 text-sm rounded-xl px-4 py-3">
            {wordStudyError}
          </div>
        ) : wordStudyLastLookup ? (
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-cyan-200/80">
            <span>{isSpanishWorkspace ? 'Última búsqueda' : 'Last lookup'}: {wordStudyLastLookup}</span>
            <span className="text-cyan-200/40">•</span>
            <span>{wordStudyLanguage}</span>
          </div>
        ) : null}
        {wordStudyResult ? (
          <div className="text-sm text-gray-100/90 space-y-2">
            <p><span className="text-cyan-200">Lemma:</span> {wordStudyResult.lemma}</p>
            {wordStudyResult.originalScript && (
              <p><span className="text-cyan-200">{isSpanishWorkspace ? 'Escritura original' : 'Original Script'}:</span> {wordStudyResult.originalScript}</p>
            )}
            <p><span className="text-cyan-200">{isSpanishWorkspace ? 'Transliteración' : 'Transliteration'}:</span> {wordStudyResult.transliteration}</p>
            <div>
              <span className="text-cyan-200">{isSpanishWorkspace ? 'Definición' : 'Definition'}:</span>
              <div className="mt-1">{renderSmartValue(wordStudyResult.definition || 'N/A')}</div>
            </div>
            <p><span className="text-cyan-200">Strong's:</span> {wordStudyResult.strongs || 'N/A'}</p>
            <p><span className="text-cyan-200">{isSpanishWorkspace ? 'Categoría gramatical' : 'Part of Speech'}:</span> {wordStudyResult.partOfSpeech || 'N/A'}</p>
            <p><span className="text-cyan-200">{isSpanishWorkspace ? 'Ocurrencias' : 'Occurrences'}:</span> {wordStudyResult.usageCount || 'N/A'}</p>
            {wordStudyResult.examples?.length ? (
              <ul className="list-disc list-inside space-y-1">
                {wordStudyResult.examples.map((example: string, index: number) => (
                  <li key={`${example}-${index}`}>{example}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-200/80">{isSpanishWorkspace ? 'No hay ejemplos cargados.' : 'No examples loaded.'}</p>
            )}
            {wordStudyResult.verseOccurrences?.length ? (
              <div>
                <p className="text-xs uppercase tracking-widest cyber-muted">{isSpanishWorkspace ? 'Otras ocurrencias' : 'Other occurrences'}</p>
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
                <p className="text-xs uppercase tracking-widest cyber-muted">{isSpanishWorkspace ? 'Distribución por libro' : 'Distribution by book'}</p>
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
                <p className="text-xs uppercase tracking-widest cyber-muted">{isSpanishWorkspace ? 'Perspectivas avanzadas' : 'Advanced Insights'}</p>
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="text-xs cyber-muted uppercase tracking-widest">{isSpanishWorkspace ? 'Raíz' : 'Root'}</p>
                    {renderSmartValue(wordStudyInsights.rootWord || 'N/A')}
                  </div>
                  <div>
                    <p className="text-xs cyber-muted uppercase tracking-widest">{isSpanishWorkspace ? 'Rango semántico' : 'Semantic Range'}</p>
                    {renderSmartValue(wordStudyInsights.semanticRange || [])}
                  </div>
                  <div>
                    <p className="text-xs cyber-muted uppercase tracking-widest">{isSpanishWorkspace ? 'Matices' : 'Nuance'}</p>
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
          <p className="text-gray-200/80">{isSpanishWorkspace ? 'Aún no se ha cargado ningún estudio de palabras.' : 'No word study loaded yet.'}</p>
        )}
      </div>
    </div>
  )
}
