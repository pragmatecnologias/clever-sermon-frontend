import type { Dispatch, SetStateAction } from 'react'
import StoryArcSelector from '@/components/StoryArcSelector'
import WorkspaceEGWToggle from '@/components/WorkspaceEGWToggle'

type WorkspaceLike = {
  title?: string
  mainPassage?: string
  status?: string
  seriesTitle?: string
  theme?: string
  audienceProfile?: string
  sermonGoals?: string
  style?: string
  storyArc?: string
  language?: string
  includeEGW?: boolean
  additionalPassages?: string[]
  createdAt?: string
}

type WorkspaceDraft = {
  title?: string
  mainPassage?: string
  seriesTitle?: string
  theme?: string
  audienceProfile?: string
  sermonGoals?: string
  style?: string
  storyArc?: string
  language?: string
  includeEGW?: boolean
  additionalPassages?: string[]
}

type Props = {
  workspace: WorkspaceLike
  workspaceDraft: WorkspaceDraft | null
  editingWorkspace: boolean
  setEditingWorkspace: (value: boolean) => void
  setWorkspaceDraft: Dispatch<SetStateAction<WorkspaceDraft | null>>
  handleWorkspaceSave: () => void
  actionLoading: string[]
  styleLabels: Record<string, string>
  formatTheologicalLens: () => string
}

export default function WorkspaceOverviewSection({
  workspace,
  workspaceDraft,
  editingWorkspace,
  setEditingWorkspace,
  setWorkspaceDraft,
  handleWorkspaceSave,
  actionLoading,
  styleLabels,
  formatTheologicalLens,
}: Props) {
  const updateDraft = (patch: Partial<WorkspaceDraft>) => {
    setWorkspaceDraft((current) => (current ? { ...current, ...patch } : current))
  }

  return (
    <div className="space-y-6 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {editingWorkspace ? (
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest cyber-muted">Title</label>
              <input
                value={workspaceDraft?.title || ''}
                onChange={(e) => updateDraft({ title: e.target.value })}
                className="w-full text-3xl font-bold mb-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2"
              />
            </div>
          ) : (
            <h2 className="text-3xl font-bold mb-2">{workspace.title || 'Workspace'}</h2>
          )}
          {editingWorkspace ? (
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest cyber-muted">Main Passage</label>
              <input
                value={workspaceDraft?.mainPassage || ''}
                onChange={(e) => updateDraft({ mainPassage: e.target.value })}
                className="w-full text-cyan-200/80 bg-black/40 border border-white/10 rounded-xl px-3 py-2"
              />
            </div>
          ) : (
            <p className="text-cyan-200/80">{workspace.mainPassage}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="cyber-tag">{workspace.status || 'draft'}</span>
          <button
            onClick={() => {
              if (editingWorkspace) {
                setEditingWorkspace(false)
                setWorkspaceDraft(workspace as WorkspaceDraft)
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
                onChange={(e) => updateDraft({ seriesTitle: e.target.value })}
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
                onChange={(e) => updateDraft({ theme: e.target.value })}
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
                onChange={(e) => updateDraft({ audienceProfile: e.target.value })}
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
              <div className="w-full mb-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-gray-200/90">
                Adventist (fixed)
              </div>
            </div>
          ) : (
            <p><span className="font-semibold text-cyan-300">Lens:</span> {formatTheologicalLens()}</p>
          )}
          {editingWorkspace && (
            <StoryArcSelector
              value={workspaceDraft?.storyArc || ''}
              onChange={(arc) => updateDraft({ storyArc: arc })}
              className="mt-4"
            />
          )}
          {editingWorkspace && (
            <div className="mt-4">
              <WorkspaceEGWToggle
                includeEGW={workspaceDraft?.includeEGW ?? true}
                onToggle={(value: boolean) => updateDraft({ includeEGW: value })}
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
                onChange={(e) => setWorkspaceDraft({ ...(workspaceDraft as WorkspaceDraft), style: e.target.value })}
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
              {styleLabels[workspace.style || ''] || workspace.style || '—'}
            </p>
          )}
          <p className="text-xs text-cyan-100/70 mt-2">
            Story arc feeds outline and flow defaults.
          </p>
          {editingWorkspace ? (
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest cyber-muted">Language</label>
              <select
                value={workspaceDraft?.language || 'en'}
                onChange={(e) => updateDraft({ language: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          ) : (
            <p><span className="font-semibold text-cyan-300">Language:</span> {workspace.language || 'en'}</p>
          )}
          <p><span className="font-semibold text-cyan-300">Created:</span> {workspace.createdAt ? new Date(workspace.createdAt).toLocaleDateString() : '—'}</p>
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
                onChange={(e) => updateDraft({ sermonGoals: e.target.value })}
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
                  updateDraft({
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
  )
}
