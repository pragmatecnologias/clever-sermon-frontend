'use client'

import { Book } from 'lucide-react'
import { renderMarkdown } from '@/components/workspace-render.helpers'

type Props = {
  studyAssetEditor: 'applications' | 'questions' | 'illustrations' | null
  workspace: any
  actionLoading: string[]
  openPromptEditor: (type: 'outline' | 'manuscript' | 'applications' | 'questions' | 'illustrations' | 'citations' | 'study-report') => Promise<void> | void
  handleGenerate: (asset: 'applications' | 'questions' | 'illustrations') => Promise<void> | void
  editingApplicationId: string | null
  applicationDraft: string
  setEditingApplicationId: (value: string | null) => void
  setApplicationDraft: (value: string) => void
  handleApplicationSave: (id: string) => Promise<void> | void
  editingQuestionId: string | null
  questionDraft: string
  setEditingQuestionId: (value: string | null) => void
  setQuestionDraft: (value: string) => void
  handleQuestionSave: (id: string) => Promise<void> | void
  editingIllustrationId: string | null
  illustrationDraft: any
  setEditingIllustrationId: (value: string | null) => void
  setIllustrationDraft: (value: any) => void
  handleIllustrationSave: () => Promise<void> | void
  onClose: () => void
}

export function WorkspaceStudyAssetEditor({
  studyAssetEditor,
  workspace,
  actionLoading,
  openPromptEditor,
  handleGenerate,
  editingApplicationId,
  applicationDraft,
  setEditingApplicationId,
  setApplicationDraft,
  handleApplicationSave,
  editingQuestionId,
  questionDraft,
  setEditingQuestionId,
  setQuestionDraft,
  handleQuestionSave,
  editingIllustrationId,
  illustrationDraft,
  setEditingIllustrationId,
  setIllustrationDraft,
  handleIllustrationSave,
  onClose,
}: Props) {
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
            <button onClick={() => openPromptEditor('applications')} className="cyber-outline text-xs px-4 py-2 rounded-full">
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
            {workspace.applications.map((app: any) => (
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
                      <button onClick={() => { setEditingApplicationId(null); setApplicationDraft('') }} className="cyber-outline text-xs px-4 py-2 rounded-full">
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
            <button onClick={() => openPromptEditor('questions')} className="cyber-outline text-xs px-4 py-2 rounded-full">
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
            {workspace.discussionQuestions.map((q: any) => (
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
                      <button onClick={() => { setEditingQuestionId(null); setQuestionDraft('') }} className="cyber-outline text-xs px-4 py-2 rounded-full">
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
            <button onClick={() => openPromptEditor('illustrations')} className="cyber-outline text-xs px-4 py-2 rounded-full">
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
            {workspace.illustrations.map((ill: any) => (
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
                      <button onClick={() => { setEditingIllustrationId(null); setIllustrationDraft(null) }} className="cyber-outline text-xs px-4 py-2 rounded-full">
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

export default WorkspaceStudyAssetEditor
