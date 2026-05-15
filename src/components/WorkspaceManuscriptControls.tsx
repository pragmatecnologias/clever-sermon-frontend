type Props = {
  actionLoading: string[]
  manuscriptTone: string
  setManuscriptTone: (value: string) => void
  manuscriptTargetMinutes: number
  setManuscriptTargetMinutes: (value: number) => void
  manuscriptFormat: 'full' | 'notes'
  setManuscriptFormat: (value: 'full' | 'notes') => void
  manuscriptAudienceMode: string
  setManuscriptAudienceMode: (value: string) => void
  manuscriptIncludeSlideCues: boolean
  setManuscriptIncludeSlideCues: (value: boolean) => void
  manuscriptIncludeKeyLines: boolean
  setManuscriptIncludeKeyLines: (value: boolean) => void
  openPromptEditor: (
    type: 'outline' | 'manuscript' | 'applications' | 'questions' | 'illustrations' | 'citations' | 'study-report',
  ) => void | Promise<void>
  handleGenerate: (asset: string) => void
}

export default function WorkspaceManuscriptControls({
  actionLoading,
  manuscriptTone,
  setManuscriptTone,
  manuscriptTargetMinutes,
  setManuscriptTargetMinutes,
  manuscriptFormat,
  setManuscriptFormat,
  manuscriptAudienceMode,
  setManuscriptAudienceMode,
  manuscriptIncludeSlideCues,
  setManuscriptIncludeSlideCues,
  manuscriptIncludeKeyLines,
  setManuscriptIncludeKeyLines,
  openPromptEditor,
  handleGenerate,
}: Props) {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-gray-400 font-medium">Generation Controls</p>
        <p className="text-[10px] text-gray-500">Changes apply on next generation</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-gray-300 font-medium flex items-center gap-2">
            <span className="text-base">🎭</span> Tone
          </label>
          <select
            value={manuscriptTone}
            onChange={(e) => setManuscriptTone(e.target.value)}
            className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-gray-100 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
          >
            <option value="teaching">Teaching — Instructional, clear</option>
            <option value="pastoral">Pastoral — Warm, caring</option>
            <option value="evangelistic">Evangelistic — Urgent, inviting</option>
            <option value="storytelling">Storytelling — Narrative, engaging</option>
            <option value="motivational">Motivational — Inspiring, energetic</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-gray-300 font-medium flex items-center gap-2">
            <span className="text-base">⏱️</span> Length
          </label>
          <select
            value={manuscriptTargetMinutes}
            onChange={(e) => setManuscriptTargetMinutes(Number(e.target.value) || 22)}
            className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-gray-100 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
          >
            <option value={10}>10 minutes (~1,450 words)</option>
            <option value={22}>22 minutes (~3,190 words)</option>
            <option value={20}>20 minutes (~2,900 words)</option>
            <option value={30}>30 minutes (~4,350 words)</option>
            <option value={40}>40 minutes (~5,800 words)</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-gray-300 font-medium flex items-center gap-2">
            <span className="text-base">📄</span> Format
          </label>
          <select
            value={manuscriptFormat}
            onChange={(e) => setManuscriptFormat((e.target.value as 'full' | 'notes') || 'full')}
            className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-gray-100 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
          >
            <option value="full">Full Manuscript — Word-for-word</option>
            <option value="notes">Preaching Notes — Bullet points</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/5">
        <div className="space-y-1.5">
          <label className="text-xs text-gray-300 font-medium flex items-center gap-2">
            <span className="text-base">👥</span> Audience Focus
          </label>
          <select
            value={manuscriptAudienceMode}
            onChange={(e) => setManuscriptAudienceMode(e.target.value)}
            className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-gray-100 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
          >
            <option value="default">Use Workspace Audience</option>
            <option value="youth">Youth — Modern, relatable</option>
            <option value="families">Families — Inclusive, practical</option>
            <option value="evangelistic meeting">Evangelistic — Seeker-friendly</option>
            <option value="bible study group">Bible Study — Deep, interactive</option>
            <option value="conference congregation">Conference — Formal, inspiring</option>
          </select>
        </div>
        <label className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-black/30 cursor-pointer hover:bg-black/40 transition-colors">
          <input
            type="checkbox"
            checked={manuscriptIncludeSlideCues}
            onChange={(e) => setManuscriptIncludeSlideCues(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-black/50 text-cyan-500 focus:ring-cyan-500/30"
          />
          <div>
            <p className="text-xs text-gray-200 font-medium">Generate Slide Cues</p>
            <p className="text-[10px] text-gray-500">Visual prompts for slides</p>
          </div>
        </label>
        <label className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-black/30 cursor-pointer hover:bg-black/40 transition-colors">
          <input
            type="checkbox"
            checked={manuscriptIncludeKeyLines}
            onChange={(e) => setManuscriptIncludeKeyLines(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-black/50 text-cyan-500 focus:ring-cyan-500/30"
          />
          <div>
            <p className="text-xs text-gray-200 font-medium">Generate Key Lines</p>
            <p className="text-[10px] text-gray-500">Memorable statements to emphasize</p>
          </div>
        </label>
      </div>
      <div className="flex items-center justify-between gap-2">
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
    </>
  )
}
