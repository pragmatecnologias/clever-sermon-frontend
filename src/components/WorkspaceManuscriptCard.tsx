'use client'

import ManuscriptRichEditor from '@/components/ManuscriptRichEditor'

interface WorkspaceManuscriptCardProps {
  manuscript: any
  actionLoading: string[]
  lastRepairNotice: any
  showRepairMarkers: boolean
  setShowRepairMarkers: (value: boolean | ((prev: boolean) => boolean)) => void
  manuscriptQualityExpanded: Record<string, boolean>
  setManuscriptQualityExpanded: (value: any) => void
  repairHistoryExpanded: Record<string, boolean>
  setRepairHistoryExpanded: (value: any) => void
  legacyConvertCandidateId: string | null
  setLegacyConvertCandidateId: (value: string | null) => void
  editingManuscriptId: string | null
  setEditingManuscriptId: (value: string | null) => void
  manuscriptDraft: string
  setManuscriptDraft: (value: string) => void
  manuscriptCueDraft: any
  setManuscriptCueDraft: (value: any) => void
  getManuscriptQualityUi: (manuscript: any) => { label: string; className: string }
  manuscriptOptionsDrifted: (options: any) => boolean
  getRepairAuditTrail: (manuscript: any) => any[]
  normalizeRepairSnippetRaw: (value: string) => string
  buildInlineWordDiff: (before: string, after: string) => { beforeHtml: string; afterHtml: string }
  buildWordDiff: (before: string, after: string) => { removedText: string; addedText: string }
  focusRepairAuditChange: (manuscriptId: string, entry: any) => void
  getRepairedAuditItems: (manuscript: any) => any[]
  summarizeRepairSnippet: (value: string) => string
  isManuscriptV2: (manuscript: any) => boolean
  toV2ManuscriptDraft: (manuscript: any) => { html: string; cues: any }
  renderManuscriptCuesPanel: (...args: any[]) => any
  focusCueInManuscript: (...args: any[]) => void
  ensureManuscriptRichHtml: (html: string, converter: any) => string
  markdownLikeToHtml: any
  sanitizeManuscriptForDisplay: (html: string) => string
  emptyManuscriptCues: () => any
  handleManuscriptSave: (id: string, inlineHtml?: string) => Promise<void>
  handleRegenerateManuscriptCues: (manuscriptId: string) => Promise<void>
}

export default function WorkspaceManuscriptCard({
  manuscript,
  actionLoading,
  lastRepairNotice,
  showRepairMarkers,
  setShowRepairMarkers,
  manuscriptQualityExpanded,
  setManuscriptQualityExpanded,
  repairHistoryExpanded,
  setRepairHistoryExpanded,
  legacyConvertCandidateId,
  setLegacyConvertCandidateId,
  editingManuscriptId,
  setEditingManuscriptId,
  manuscriptDraft,
  setManuscriptDraft,
  manuscriptCueDraft,
  setManuscriptCueDraft,
  getManuscriptQualityUi,
  manuscriptOptionsDrifted,
  getRepairAuditTrail,
  normalizeRepairSnippetRaw,
  buildInlineWordDiff,
  buildWordDiff,
  focusRepairAuditChange,
  getRepairedAuditItems,
  summarizeRepairSnippet,
  isManuscriptV2,
  toV2ManuscriptDraft,
  renderManuscriptCuesPanel,
  focusCueInManuscript,
  ensureManuscriptRichHtml,
  markdownLikeToHtml,
  sanitizeManuscriptForDisplay,
  emptyManuscriptCues,
  handleManuscriptSave,
  handleRegenerateManuscriptCues,
}: WorkspaceManuscriptCardProps) {
  if (!manuscript) return null

  return (
    <div className="space-y-4">
      {lastRepairNotice ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-emerald-300">Last Repair Applied</p>
            <p>
              Changed sections: {lastRepairNotice.repairedCount} · Remaining review items: {lastRepairNotice.remainingCount}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="cyber-outline text-xs px-3 py-2 rounded-full"
              onClick={() => setShowRepairMarkers((prev) => !prev)}
            >
              {showRepairMarkers ? 'Hide Inline Markers' : 'Show Inline Markers'}
            </button>
            <button
              type="button"
              className="cyber-outline text-xs px-3 py-2 rounded-full"
              onClick={() =>
                setManuscriptQualityExpanded((prev: any) => ({
                  ...prev,
                  [lastRepairNotice.manuscriptId]: true,
                }))
              }
            >
              Show Repair Changes
            </button>
          </div>
        </div>
      ) : null}

      <div className="border border-white/10 rounded-2xl overflow-visible bg-black/30">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-black/40 to-transparent border-b border-white/5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <div>
                <p className="text-sm font-medium text-white">{manuscript.wordCount?.toLocaleString() || '—'} words</p>
                <p className="text-[10px] text-gray-500">~{manuscript.estimatedMinutes || '—'} min read</p>
              </div>
            </div>
            {manuscript.content?.metadata?.options && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 capitalize">
                    {manuscript.content.metadata.options.tone || 'teaching'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    {manuscript.content.metadata.options.format === 'notes' ? 'notes' : 'full'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    {manuscript.content.metadata.options.targetMinutes || 22} min
                  </span>
                </div>
                {manuscriptOptionsDrifted(manuscript.content.metadata.options) ? (
                  <p className="text-[10px] text-amber-300/90">
                    Controls changed after this draft. Regenerate to apply current settings.
                  </p>
                ) : null}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const qualityUi = getManuscriptQualityUi(manuscript)
              return (
                <span className={`text-[10px] px-2 py-1 rounded-full border uppercase tracking-widest ${qualityUi.className}`}>
                  {qualityUi.label}
                </span>
              )
            })()}
            <button
              type="button"
              onClick={() =>
                setManuscriptQualityExpanded((prev: any) => ({
                  ...prev,
                  [manuscript.id]: !prev[manuscript.id],
                }))
              }
              className="cyber-outline text-[10px] px-2 py-1 rounded-full"
            >
              {manuscriptQualityExpanded[manuscript.id] ? 'Hide details' : 'Quality details'}
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {manuscriptQualityExpanded[manuscript.id] ? (
            <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-cyan-300">Quality Governance</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-300">
                <p>Attempts: {manuscript?.content?.metadata?.quality?.repairAttempts ?? 0}</p>
                <p>Fixed: {Array.isArray(manuscript?.content?.metadata?.quality?.repairedIssues) ? manuscript.content.metadata.quality.repairedIssues.length : 0}</p>
                <p>Remaining: {Array.isArray(manuscript?.content?.metadata?.quality?.remainingIssues) ? manuscript.content.metadata.quality.remainingIssues.length : 0}</p>
              </div>
              {manuscript?.content?.metadata?.quality?.warningMessage ? (
                <p className="text-xs text-amber-200">{String(manuscript.content.metadata.quality.warningMessage)}</p>
              ) : null}
              {Array.isArray(manuscript?.content?.metadata?.repair?.auditTrail) ? (
                <p className="text-[11px] text-gray-400">
                  Repair provenance: {manuscript.content.metadata.repair.auditTrail.length} patch actions.
                </p>
              ) : null}
              {(() => {
                const auditTrail = getRepairAuditTrail(manuscript)
                if (!auditTrail.length) return null
                return (
                  <div className="pt-2 space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-cyan-300">What Changed</p>
                    {auditTrail.map((entry: any, idx: number) => {
                      const result = String(entry?.result || 'unknown')
                      const resultTone =
                        result === 'repaired'
                          ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                          : result === 'locked'
                            ? 'border-amber-400/30 bg-amber-500/10 text-amber-100'
                            : 'border-white/15 bg-black/30 text-gray-200'
                      return (
                        <div key={`${entry?.issueId || 'issue'}-${idx}`} className={`rounded-lg border p-3 space-y-2 ${resultTone}`}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[11px] uppercase tracking-widest">
                              {String(entry?.issueId || 'issue')} · {result}
                            </p>
                            <button
                              type="button"
                              onClick={() => focusRepairAuditChange(manuscript.id, entry)}
                              className="cyber-outline text-[10px] px-2 py-1 rounded-full"
                            >
                              Locate in Manuscript
                            </button>
                          </div>
                          <p className="text-xs text-cyan-100/90">Anchor: {String(entry?.anchor || '—')}</p>
                          {(() => {
                            const rawBefore = normalizeRepairSnippetRaw(String(entry?.beforeSnippet || ''))
                            const rawAfter = normalizeRepairSnippetRaw(String(entry?.afterSnippet || ''))
                            const displayBefore = rawBefore || 'No snippet was captured for this repair action.'
                            const displayAfter = rawAfter || 'No snippet was captured for this repair action.'
                            const { beforeHtml, afterHtml } = buildInlineWordDiff(displayBefore, displayAfter)
                            const { removedText, addedText } = buildWordDiff(displayBefore, displayAfter)
                            const showDiff = Boolean(removedText || addedText)
                            return (
                              <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                  <div className="rounded-md border border-white/15 bg-black/25 p-2">
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Before</p>
                                    <div className="max-h-36 overflow-y-auto pr-1">
                                      <p className="text-gray-200 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: beforeHtml }} />
                                    </div>
                                  </div>
                                  <div className="rounded-md border border-white/15 bg-black/25 p-2">
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">After</p>
                                    <div className="max-h-36 overflow-y-auto pr-1">
                                      <p className="text-gray-100 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: afterHtml }} />
                                    </div>
                                  </div>
                                </div>
                                {showDiff ? (
                                  <div className="rounded-md border border-white/15 bg-black/35 p-2">
                                    <p className="text-[10px] uppercase tracking-widest text-cyan-200 mb-2">Diff</p>
                                    <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px] leading-relaxed pr-1">
                                      {removedText ? (
                                        <p className="whitespace-pre-wrap text-rose-200 bg-rose-500/10 border border-rose-400/20 rounded px-2 py-1">
                                          <span className="text-rose-300 mr-1">-</span>
                                          {removedText}
                                        </p>
                                      ) : null}
                                      {addedText ? (
                                        <p className="whitespace-pre-wrap text-emerald-200 bg-emerald-500/10 border border-emerald-400/20 rounded px-2 py-1">
                                          <span className="text-emerald-300 mr-1">+</span>
                                          {addedText}
                                        </p>
                                      ) : null}
                                    </div>
                                  </div>
                                ) : null}
                              </>
                            )
                          })()}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          ) : null}

          {(() => {
            const repairedItems = getRepairedAuditItems(manuscript)
            if (!repairedItems.length) return null
            const expanded = !!repairHistoryExpanded[manuscript.id]
            const visibleItems = expanded ? repairedItems : repairedItems.slice(0, 3)
            return (
              <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-300">
                    Repaired Sections ({repairedItems.length})
                  </p>
                  {repairedItems.length > 3 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setRepairHistoryExpanded((prev: any) => ({
                          ...prev,
                          [manuscript.id]: !expanded,
                        }))
                      }
                      className="cyber-outline text-[10px] px-2 py-1 rounded-full"
                    >
                      {expanded ? 'Show Less' : `Show ${repairedItems.length - 3} More`}
                    </button>
                  ) : null}
                </div>
                <div className="space-y-2">
                  {visibleItems.map((entry: any, idx: number) => (
                    <div key={`repair-visible-${entry?.issueId || 'issue'}-${idx}`} className="rounded-md border border-emerald-400/20 bg-black/25 p-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <p className="text-[11px] text-emerald-100">
                          {String(entry?.issueId || 'issue')} · {String(entry?.anchor || 'anchor')}
                        </p>
                        <button
                          type="button"
                          onClick={() => focusRepairAuditChange(manuscript.id, entry)}
                          className="cyber-outline text-[10px] px-2 py-1 rounded-full"
                        >
                          Locate
                        </button>
                      </div>
                      <p className="text-xs text-emerald-50/90">{summarizeRepairSnippet(String(entry?.afterSnippet || entry?.beforeSnippet || ''))}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {!isManuscriptV2(manuscript) && legacyConvertCandidateId === manuscript.id && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100 space-y-2">
              <p className="text-xs uppercase tracking-widest text-amber-300">Legacy manuscript format</p>
              <p>This manuscript still uses markdown/tag format. Convert it when you want to edit in the new rich editor.</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const converted = toV2ManuscriptDraft(manuscript)
                    setEditingManuscriptId(manuscript.id)
                    setLegacyConvertCandidateId(null)
                    setManuscriptDraft(converted.html)
                    setManuscriptCueDraft(converted.cues)
                  }}
                  className="cyber-button text-xs px-3 py-2 rounded-full"
                >
                  Convert & Edit
                </button>
                <button
                  onClick={() => setLegacyConvertCandidateId(null)}
                  className="cyber-outline text-xs px-3 py-2 rounded-full"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {editingManuscriptId === manuscript.id ? (
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-widest cyber-muted">Manuscript Text</label>
              <ManuscriptRichEditor value={manuscriptDraft} onChange={setManuscriptDraft} />
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
                    setLegacyConvertCandidateId(null)
                    setManuscriptDraft('')
                    setManuscriptCueDraft(emptyManuscriptCues())
                  }}
                  className="cyber-outline text-xs px-4 py-2 rounded-full"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : isManuscriptV2(manuscript) ? (
            <div className="space-y-3">
              {getRepairedAuditItems(manuscript).length > 0 ? (
                <div className="text-[11px] text-amber-200">
                  {showRepairMarkers
                    ? `Inline repaired markers visible (${getRepairedAuditItems(manuscript).length}).`
                    : `Inline repaired markers hidden (${getRepairedAuditItems(manuscript).length}).`}
                </div>
              ) : null}
              <div className={`grid grid-cols-1 gap-6 items-start ${false ? 'xl:grid-cols-[1fr_64px]' : 'xl:grid-cols-[1fr_320px]'}`}>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const newHtml = (e.target as HTMLDivElement).innerHTML
                    if (newHtml !== manuscript.content?.text) {
                      handleManuscriptSave(manuscript.id, newHtml)
                    }
                  }}
                  className="manuscript-display rounded-lg shadow-xl bg-white px-12 py-16 md:px-16 md:py-20 max-w-4xl mx-auto
                    text-gray-900 text-[1.05rem] leading-[1.9] outline-none focus:ring-2 focus:ring-cyan-400/50 cursor-text
                    [&_h1]:text-[2.5rem] [&_h1]:leading-tight [&_h1]:text-center [&_h1]:mb-8 [&_h1]:mt-0 [&_h1]:font-bold [&_h1]:text-black
                    [&_h2]:text-[1.75rem] [&_h2]:leading-snug [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-gray-300 [&_h2]:font-semibold [&_h2]:text-black
                    [&_h3]:text-[1.35rem] [&_h3]:leading-snug [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-gray-900 [&_h3]:font-medium
                    [&_p]:text-gray-900 [&_p]:leading-[1.9] [&_p]:my-4 [&_p]:text-[1.05rem]
                    [&_ul]:my-4 [&_ol]:my-4 [&_li]:my-1 [&_li]:text-gray-900 [&_li]:leading-relaxed
                    [&_strong]:text-black [&_strong]:font-bold
                    [&_em]:text-gray-800 [&_em]:italic
                    [&_blockquote]:my-6 [&_blockquote]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-400 [&_blockquote]:italic [&_blockquote]:text-gray-700 [&_blockquote]:bg-gray-100 [&_blockquote]:py-3 [&_blockquote]:pr-4 [&_blockquote]:rounded-r
                    [&_.manuscript-section-title]:text-black [&_.manuscript-section-title]:font-serif
                    [&_.manuscript-subsection-title]:text-gray-900
                    [&_.manuscript-scripture-ref]:my-4 [&_.manuscript-scripture-ref]:text-gray-700 [&_.manuscript-scripture-ref]:text-[1.15rem] [&_.manuscript-scripture-ref]:font-medium [&_.manuscript-scripture-ref]:italic
                    [&_.manuscript-scripture-block]:my-6 [&_.manuscript-scripture-block]:rounded-lg [&_.manuscript-scripture-block]:border [&_.manuscript-scripture-block]:border-gray-300 [&_.manuscript-scripture-block]:bg-gray-100 [&_.manuscript-scripture-block]:px-6 [&_.manuscript-scripture-block]:py-4
                    [&_.manuscript-scripture-block>p]:my-2 [&_.manuscript-scripture-block>p]:text-[1.05rem] [&_.manuscript-scripture-block>p]:leading-relaxed [&_.manuscript-scripture-block>p]:text-gray-900
                    [&_.manuscript-callout]:my-5 [&_.manuscript-callout]:rounded-lg [&_.manuscript-callout]:border [&_.manuscript-callout]:border-blue-300 [&_.manuscript-callout]:bg-blue-50 [&_.manuscript-callout]:px-5 [&_.manuscript-callout]:py-4
                    [&_[data-repair-marker='true']]:relative
                    [&_[data-repair-marker='true']::after]:content-[attr(data-repair-label)] [&_[data-repair-marker='true']::after]:block [&_[data-repair-marker='true']::after]:w-fit [&_[data-repair-marker='true']::after]:ml-auto [&_[data-repair-marker='true']::after]:mt-1 [&_[data-repair-marker='true']::after]:rounded-full [&_[data-repair-marker='true']::after]:border [&_[data-repair-marker='true']::after]:border-amber-500/60 [&_[data-repair-marker='true']::after]:bg-amber-100 [&_[data-repair-marker='true']::after]:px-1.5 [&_[data-repair-marker='true']::after]:py-0.5 [&_[data-repair-marker='true']::after]:text-[9px] [&_[data-repair-marker='true']::after]:leading-none [&_[data-repair-marker='true']::after]:font-semibold [&_[data-repair-marker='true']::after]:uppercase [&_[data-repair-marker='true']::after]:tracking-wider [&_[data-repair-marker='true']::after]:text-amber-900
                    selection:bg-blue-200 print:shadow-none print:px-8 print:py-12"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  dangerouslySetInnerHTML={{
                    __html: ensureManuscriptRichHtml(String(manuscript.content?.text || ''), markdownLikeToHtml),
                  }}
                />
                {renderManuscriptCuesPanel(
                  manuscript.content?.cues,
                  false,
                  (cue: any, cueType: any, cueIndex: any) =>
                    focusCueInManuscript(
                      manuscript.id,
                      cue,
                      cueType,
                      cueIndex,
                      manuscript?.content?.metadata?.cueAnchors || {},
                    ),
                  {
                    staleInfo: undefined,
                    onRegenerateCues: () => handleRegenerateManuscriptCues(manuscript.id),
                    regenerating: actionLoading.includes(`manuscript-cues-${manuscript.id}`),
                  },
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-amber-300 mb-4">Legacy manuscript format</p>
              <div
                className="rounded-lg shadow-xl bg-white px-12 py-16 md:px-16 md:py-20 prose prose-lg prose-slate max-w-4xl mx-auto prose-headings:text-gray-900 prose-headings:font-serif prose-p:text-gray-700 prose-p:leading-[1.9] prose-strong:text-gray-900 prose-em:text-gray-800"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                {/** keep legacy rendering visible */}
                <div dangerouslySetInnerHTML={{ __html: sanitizeManuscriptForDisplay(manuscript.content?.text || '') }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
