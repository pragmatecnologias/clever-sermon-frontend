import CrossReferenceRanked from '@/components/CrossReferenceRanked'
import CrossReferenceSOPPanel from '@/components/CrossReferenceSOPPanel'

type Props = {
  actionLoading: string[]
  crossRefVerse: string
  setCrossRefVerse: (value: string) => void
  crossRefError: string | null
  crossRefLastLookup: string
  crossRefHasScriptureResults: boolean
  setCrossRefHasScriptureResults: (value: boolean) => void
  handleCrossReferenceLookup: () => void
  workspaceLanguage?: string
  token: string
}

export default function WorkspaceCrossReferencesSection({
  actionLoading,
  crossRefVerse,
  setCrossRefVerse,
  crossRefError,
  crossRefLastLookup,
  crossRefHasScriptureResults,
  setCrossRefHasScriptureResults,
  handleCrossReferenceLookup,
  workspaceLanguage,
  token,
}: Props) {
  return (
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
              token={token}
              onReferencesLoaded={(count) => setCrossRefHasScriptureResults(count > 0)}
            />
            {crossRefHasScriptureResults ? (
              <CrossReferenceSOPPanel
                verse={crossRefLastLookup}
                token={token}
                language={workspaceLanguage || 'en'}
              />
            ) : null}
          </div>
        ) : (
          <p className="text-gray-200/80">Enter a verse reference above to explore cross references.</p>
        )}
      </div>
    </div>
  )
}
