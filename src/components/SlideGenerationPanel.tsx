'use client'

import { useState, useEffect } from 'react'
import { FileText, Loader2, Sparkles, Edit } from 'lucide-react'
import { slidesApi, SyncWorkspaceData } from '@/lib/slides-api'
import DeckEditor from './DeckEditor'
import ReactMarkdown from 'react-markdown'
import { ReactNode } from 'react'

interface SlideGenerationPanelProps {
  workspace: any
  token: string
  onGenerated?: () => void
}

export default function SlideGenerationPanel({ workspace, token, onGenerated }: SlideGenerationPanelProps) {
  const [syncing, setSyncing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [sermonId, setSermonId] = useState<string | null>(null)
  const [themes, setThemes] = useState<any[]>([])
  const [selectedTheme, setSelectedTheme] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [generatedDeckId, setGeneratedDeckId] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    loadThemes()
  }, [])

  const loadThemes = async () => {
    try {
      const themesData = await slidesApi.getThemes(token)
      setThemes(themesData)
      if (themesData.length > 0) {
        setSelectedTheme(themesData[0].id)
      }
    } catch (err) {
      console.error('Failed to load themes:', err)
    }
  }

  const handleSyncWorkspace = async () => {
    setSyncing(true)
    setError(null)

    try {
      const pointNodes = Array.isArray(workspace?.outlines?.[0]?.structure?.pointNodes)
        ? workspace.outlines[0].structure.pointNodes
        : []
      const legacyPoints = Array.isArray(workspace?.outlines?.[0]?.structure?.points)
        ? workspace.outlines[0].structure.points
        : []

      const normalizedPoints = (pointNodes.length ? pointNodes : legacyPoints)
        .map((point: any) => {
          const title = typeof point === 'string' ? point : (point?.title || point?.content || '')
          const summary = typeof point === 'string' ? '' : (point?.summary || point?.preachingInsight || '')
          const subpoints = Array.isArray(point?.subpoints) ? point.subpoints : []
          const supportingVerses = Array.isArray(point?.supportingVerses) ? point.supportingVerses : []
          const lineParts = [title, summary, subpoints[0], supportingVerses[0]].filter(Boolean)
          return lineParts.join(' — ')
        })
        .filter(Boolean)

      const pointApplications = pointNodes.flatMap((point: any) =>
        Array.isArray(point?.applications) ? point.applications : [],
      )
      const pointQuestions = pointNodes.flatMap((point: any) =>
        Array.isArray(point?.discussionQuestions) ? point.discussionQuestions : [],
      )

      const mergedApplications = [
        ...(workspace.applications || []).map((item: any) => item?.content || item?.text || item).filter(Boolean),
        ...pointApplications,
      ]

      const mergedQuestions = [
        ...(workspace.questions || workspace.discussionQuestions || [])
          .map((item: any) => item?.question || item?.text || item)
          .filter(Boolean),
        ...pointQuestions,
      ]

      const unique = (items: any[]) => Array.from(new Set(items.map((item) => String(item).trim()).filter(Boolean)))

      const manuscriptText = workspace.manuscripts?.[0]?.content?.text || ''
      const studyReport = workspace.studyReports?.[0]?.sections
      const studySummaryParts = [
        studyReport?.summary,
        studyReport?.interpretiveCenter,
        studyReport?.mainTension,
      ].filter(Boolean)

      const syncData: SyncWorkspaceData = {
        workspaceId: workspace.id,
        title: workspace.title,
        seriesTitle: workspace.seriesTitle,
        language: workspace.language || workspace.metadata?.language || 'en',
        mainScriptureRef: workspace.mainPassage,
        bigIdea: workspace.theme || workspace.sermonGoals || 'Sermon presentation',
        mainPoints: normalizedPoints,
        audienceContext: workspace.audienceProfile,
        tone: workspace.metadata?.tone,
        notes: [manuscriptText, ...studySummaryParts].filter(Boolean).join('\n\n'),
        outline: workspace.outlines?.[0],
        manuscript: workspace.manuscripts?.[0],
        applications: unique(mergedApplications),
        questions: unique(mergedQuestions),
      }

      const sermon = await slidesApi.syncWorkspace(syncData, token)
      setSermonId(sermon.id)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sync workspace')
    } finally {
      setSyncing(false)
    }
  }

  const handleGenerateDeck = async () => {
    if (!sermonId) {
      await handleSyncWorkspace()
      return
    }

    setGenerating(true)
    setError(null)
    setProgress(0)
    setProgressMessage('Starting deck generation...')

    try {
      const themeId = selectedTheme && selectedTheme.trim() !== '' ? selectedTheme : undefined
      const deck = await slidesApi.generateDeck(sermonId, themeId, token, 'long')
      
      // Track progress via SSE
      const SLIDES_API_URL = process.env.NEXT_PUBLIC_SLIDES_API_URL || 'http://localhost:3001/api/v1'
      const eventSource = new EventSource(
        `${SLIDES_API_URL}/decks/${deck.id}/progress?token=${token}`
      )

      setGeneratedDeckId(deck.id)
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setProgress(data.progress || 0)
        setProgressMessage(data.message || 'Generating slides...')
        
        if (data.status === 'completed') {
          eventSource.close()
          setGenerating(false)
          setProgress(100)
          setProgressMessage('Deck generation complete!')
          setShowEditor(true)
          onGenerated?.()
        } else if (data.status === 'failed') {
          eventSource.close()
          setGenerating(false)
          setError('Deck generation failed')
        }
      }

      eventSource.onerror = () => {
        eventSource.close()
        setGenerating(false)
        setError('Connection lost during generation')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate slides')
      setGenerating(false)
    }
  }

  return (
    <div className="border border-white/10 rounded-xl p-6 bg-black/20 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-6 h-6 text-purple-300" />
        <h3 className="text-lg font-semibold">Generate Slide Deck</h3>
      </div>

      {/* Sync Status */}
      {!sermonId && (
        <div className="border border-yellow-400/40 bg-yellow-500/10 text-yellow-100 text-sm rounded-xl px-4 py-3">
          <p className="font-medium mb-1">Workspace not synced</p>
          <p className="text-xs text-yellow-200/80">
            Click "Sync Workspace" to send your sermon content to the slides app
          </p>
        </div>
      )}

      {sermonId && (
        <div className="border border-green-400/40 bg-green-500/10 text-green-100 text-sm rounded-xl px-4 py-3">
          <p className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Workspace synced! Ready to generate slides.
          </p>
        </div>
      )}

      {/* Theme Selection */}
      {themes.length > 0 && (
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
            Slide Theme
          </label>
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
          >
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Outline Preview */}
      {workspace.outlines?.[0] && (
        <div className="border border-white/10 rounded-lg p-3 bg-black/20">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
            Outline to Convert
          </p>
          <p className="text-sm font-medium mb-2">{workspace.outlines[0].title}</p>
          <div className="text-xs text-gray-300 space-y-2">
            {(() => {
              const previewPoints =
                Array.isArray(workspace.outlines[0].structure?.pointNodes) && workspace.outlines[0].structure.pointNodes.length
                  ? workspace.outlines[0].structure.pointNodes
                  : (workspace.outlines[0].structure?.points || [])
              return previewPoints.slice(0, 3).map((point: any, idx: number) => {
              const pointText = typeof point === 'string'
                ? point
                : [point.title || point.content || '', point.summary || point.preachingInsight || ''].filter(Boolean).join(' — ')
              return (
                <div key={idx} className="flex gap-2">
                  <span className="text-gray-500 flex-shrink-0">•</span>
                  <div className="flex-1">
                    <ReactMarkdown
                      components={{
                        p: ({ children }: { children?: ReactNode }) => <span className="text-gray-300">{children}</span>,
                        strong: ({ children }: { children?: ReactNode }) => <strong className="text-cyan-200">{children}</strong>,
                        em: ({ children }: { children?: ReactNode }) => <em className="text-cyan-100">{children}</em>,
                      }}
                    >
                      {pointText}
                    </ReactMarkdown>
                  </div>
                </div>
              )
              })
            })()}
            {(() => {
              const previewPoints =
                Array.isArray(workspace.outlines[0].structure?.pointNodes) && workspace.outlines[0].structure.pointNodes.length
                  ? workspace.outlines[0].structure.pointNodes
                  : (workspace.outlines[0].structure?.points || [])
              if (previewPoints.length <= 3) return null
              return (
              <div className="text-gray-500 ml-4">
                ... and {previewPoints.length - 3} more
              </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Progress */}
      {generating && (
        <div className="border border-purple-400/40 bg-purple-500/10 rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-100">{progressMessage}</span>
            <span className="text-purple-200 font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border border-red-400/40 bg-red-500/10 text-red-100 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {!sermonId && (
          <button
            onClick={handleSyncWorkspace}
            disabled={syncing}
            className="w-full cyber-outline text-sm px-4 py-3 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing Workspace...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Sync Workspace
              </>
            )}
          </button>
        )}

        <button
          onClick={handleGenerateDeck}
          disabled={generating || syncing}
          className="w-full cyber-button text-sm px-4 py-3 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Slides...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              {sermonId ? 'Generate Slide Deck' : 'Sync & Generate'}
            </>
          )}
        </button>
      </div>

      {generatedDeckId && !generating && (
        <button
          onClick={() => setShowEditor(!showEditor)}
          className="w-full cyber-outline text-sm px-4 py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <Edit className="w-4 h-4" />
          {showEditor ? 'Hide Editor' : 'Edit Slides'}
        </button>
      )}

      <p className="text-xs text-gray-500 text-center">
        Generates PowerPoint presentation from your outline
      </p>

      {showEditor && generatedDeckId && (
        <div className="mt-6 border-t border-white/10 pt-6">
          <DeckEditor
            deckId={generatedDeckId}
            token={token}
            onClose={() => setShowEditor(false)}
            onExport={() => {}}
          />
        </div>
      )}
    </div>
  )
}
