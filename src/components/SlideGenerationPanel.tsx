'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Loader2, Sparkles, Edit } from 'lucide-react'
import { slidesApi } from '@/lib/slides-api'
import DeckEditor from './DeckEditor'
import ReactMarkdown from 'react-markdown'
import { ReactNode } from 'react'
import { createWorkspaceApiClient } from '@/lib/api/openapi-client'
import { getDeckSlideCount, normalizeDeckIntent, selectPreferredDeck } from '@/lib/deck-identity'
import { resolveDeckBackgroundPreset } from '../../../../shared/deck-composition.contract'

interface SlideGenerationPanelProps {
  workspace: any
  token: string
  onGenerated?: () => void
}

type DeckIntent =
  | 'sermon_presentation'
  | 'social_summary'
  | 'teaching_study'
  | 'youth_message'
  | 'evangelistic_appeal'

type VisualStyleKey =
  | 'auto'
  | 'reverent_worship'
  | 'warm_pastoral'
  | 'evangelistic_invitation'
  | 'hopeful_prophecy'
  | 'bible_study_clean'
  | 'youth_modern'
  | 'spanish_church_warm'

type LayoutPreference = 'balanced' | 'text_forward' | 'image_rich' | 'scripture_forward' | 'minimal'
type ImageGenerationTarget = 'background' | 'content' | 'both'

type LocalBackgroundPreset = 'worship' | 'biblical' | 'cyberpunk' | 'modern' | 'aurora' | 'minimal' | 'nature'

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
  const [generatedDeckIntent, setGeneratedDeckIntent] = useState<DeckIntent>('sermon_presentation')
  const [generatedSlideCount, setGeneratedSlideCount] = useState<number | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [existingDeckStatus, setExistingDeckStatus] = useState<string | null>(null)
  const [backgroundProvider, setBackgroundProvider] = useState<'local' | 'openai' | 'falai'>('local')
  const [backgroundPreset, setBackgroundPreset] = useState<LocalBackgroundPreset>('worship')
  const [deckIntent, setDeckIntent] = useState<DeckIntent>('sermon_presentation')
  const [layoutPreference, setLayoutPreference] = useState<LayoutPreference>('balanced')
  const [imageGenerationTarget, setImageGenerationTarget] = useState<ImageGenerationTarget>('both')
  const [visualStyle, setVisualStyle] = useState<VisualStyleKey>('auto')
  const [generatedVisualStyle, setGeneratedVisualStyle] = useState<VisualStyleKey>('auto')
  const [generatedQualityWarnings, setGeneratedQualityWarnings] = useState<string[]>([])
  const [generatedImageCoverage, setGeneratedImageCoverage] = useState<number | null>(null)
  const [generatedExportReady, setGeneratedExportReady] = useState<boolean | null>(null)
  const workspaceExportReady = Boolean((workspace as any)?.exportPack?.status === 'ready' || (workspace as any)?.mediaPack?.exportPrepared)

  const isImageReady = (slide: any) =>
    ['ready', 'completed'].includes(String(slide?.imageStatus || slide?.contentImageStatus || '').toLowerCase()) ||
    Boolean(slide?.imageUrl || slide?.contentImageUrl)

  const getImageCoverage = (slides: any[]) =>
    Array.isArray(slides) && slides.length
      ? Math.round((slides.filter((slide: any) => isImageReady(slide)).length / slides.length) * 100)
      : null

  const loadThemes = useCallback(async () => {
    try {
      const themesData = await slidesApi.getThemes(token)
      setThemes(themesData)
      if (themesData.length > 0) {
        setSelectedTheme(themesData[0].id)
      }
    } catch (err) {
      console.warn('Failed to load themes:', err)
    }
  }, [token])

  const loadExistingDeckContext = useCallback(async () => {
    if (!workspace?.id || !token) return
    try {
      // First restore synced sermon context, even when a deck was not generated yet.
      const sermons = await slidesApi.getSermons(token)
      const normalizedSermons = Array.isArray(sermons) ? sermons : []
      const workspaceSermons = normalizedSermons.filter((sermon: any) => sermon?.workspaceId === workspace.id)
      if (workspaceSermons.length) {
        workspaceSermons.sort(
          (a: any, b: any) =>
            new Date(b?.updatedAt || b?.createdAt || 0).getTime() - new Date(a?.updatedAt || a?.createdAt || 0).getTime(),
        )
        if (workspaceSermons[0]?.id) {
          setSermonId(workspaceSermons[0].id)
        }
      }
    } catch (err) {
      console.warn('Failed to load existing sermon context:', err)
    }

    try {
      const decks = await slidesApi.getDecks(token)
      const normalizedDecks = Array.isArray(decks) ? decks : []
      const workspaceDecks = normalizedDecks.filter((deck: any) => deck?.sermon?.workspaceId === workspace.id)
      if (!workspaceDecks.length) return

      const preferred = selectPreferredDeck(
        workspaceDecks,
        workspace,
        deckIntent === 'social_summary' ? 'social_summary' : 'sermon_presentation',
      )

      if (!preferred?.id) {
        setGeneratedDeckId(null)
        setGeneratedDeckIntent(deckIntent)
        setGeneratedSlideCount(null)
        setExistingDeckStatus(null)
        setShowEditor(false)
        return
      }

      const preferredIntent = normalizeDeckIntent(preferred?.deckIntent)
      const slideCount = getDeckSlideCount(preferred)
      const composition = preferred?.composition || {}
      const slides = Array.isArray(preferred?.slides) ? preferred.slides : []
      const imageCoverage = getImageCoverage(slides)
      setGeneratedDeckId(preferred.id)
      setGeneratedDeckIntent((preferredIntent as DeckIntent) || 'sermon_presentation')
      const preferredVisualStyle = (composition?.visualStyle as VisualStyleKey) || 'auto'
      setGeneratedVisualStyle((current) => (current !== 'auto' ? current : preferredVisualStyle))
      setSermonId(preferred?.sermon?.id || null)
      const status = String(preferred?.status || '').toLowerCase() || null
      setExistingDeckStatus(status)
      setGeneratedSlideCount(slideCount)
      setGeneratedImageCoverage(imageCoverage)
      setGeneratedQualityWarnings(Array.isArray(composition?.qualityWarnings) ? composition.qualityWarnings.map((warning: any) => warning?.message).filter(Boolean) : [])
      const preferredExportReady = Boolean((preferred as any)?.exports?.length || composition?.exportPrepared || workspaceExportReady)
      setGeneratedExportReady((current) => (current === true ? true : preferredExportReady))
      if (status === 'ready' || status === 'completed') {
        setShowEditor(true)
      }
    } catch (err) {
      console.warn('Failed to load existing deck context:', err)
    }
  }, [deckIntent, token, workspace])

  useEffect(() => {
    loadThemes()
  }, [loadThemes])

  useEffect(() => {
    loadExistingDeckContext()
  }, [loadExistingDeckContext])

  const handleSyncWorkspace = async (): Promise<string | null> => {
    setSyncing(true)
    setError(null)

    try {
      const workspaceApi = createWorkspaceApiClient({ token })
      const result = await workspaceApi.composeMediaPack(String(workspace.id), {
        includeDeck: false,
        layoutPreference,
        imageGenerationTarget,
      })
      const sermon = (result as any)?.sermon || result
      const resolved = String(sermon?.id || sermon?.sermonId || '')
      setSermonId(resolved)
      return resolved || null
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sync workspace')
      return null
    } finally {
      setSyncing(false)
    }
  }

  const handleGenerateDeck = async () => {
    setGenerating(true)
    setError(null)
    setProgress(0)
    setProgressMessage('Starting deck generation...')

    try {
      const workspaceApi = createWorkspaceApiClient({ token })
      const result = await workspaceApi.composeMediaPack(String(workspace.id), {
        includeDeck: true,
        deckSize: deckIntent === 'social_summary' ? 'short' : undefined,
        deckIntent,
        exportTypes: deckIntent === 'sermon_presentation' ? ['pptx', 'pdf'] : [],
        themeId: selectedTheme && selectedTheme.trim() !== '' ? selectedTheme : undefined,
        backgroundProvider,
        backgroundPreset: resolveDeckBackgroundPreset(visualStyle, deckIntent, backgroundPreset),
        visualStyle,
        layoutPreference,
        imageGenerationTarget,
      })
      const sermon = (result as any)?.sermon || result
      const deck = (result as any)?.deck || (result as any)?.deckResult || null
      const resolvedSermonId = String(sermon?.id || sermon?.sermonId || sermonId || '')
      if (!resolvedSermonId || !deck?.id) {
        throw new Error('Deck generation did not return a sermon or deck id')
      }
      const chosenVisualStyle = ((result as any)?.manifest?.visualStyle || visualStyle) as VisualStyleKey
      const exportReady = Boolean((result as any)?.manifest?.exportPrepared || workspaceExportReady)
      
      // Track progress via SSE
      const SLIDES_API_URL = `${process.env.NEXT_PUBLIC_SLIDES_API_URL || 'http://localhost:3001/api/v1'}`
      const eventSource = new EventSource(
        `${SLIDES_API_URL}/decks/${deck.id}/progress?token=${token}`
      )

      setGeneratedDeckId(deck.id)
      setGeneratedDeckIntent(deckIntent)
      setGeneratedSlideCount(Array.isArray(deck?.slides) ? deck.slides.length : null)
      setGeneratedVisualStyle(chosenVisualStyle)
      setGeneratedQualityWarnings(Array.isArray(deck?.composition?.qualityWarnings) ? deck.composition.qualityWarnings.map((warning: any) => warning?.message).filter(Boolean) : [])
      setGeneratedImageCoverage(getImageCoverage(Array.isArray(deck?.slides) ? deck.slides : []))
      setGeneratedExportReady(exportReady)
      setExistingDeckStatus('generating')
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setProgress(data.progress || 0)
        setProgressMessage(data.message || 'Generating slides...')
        if (data?.status) {
          setExistingDeckStatus(String(data.status).toLowerCase())
        }
        
        if (data.status === 'completed' || data.status === 'ready') {
          eventSource.close()
          setGenerating(false)
          setProgress(100)
          setProgressMessage('Deck generation complete!')
          setExistingDeckStatus('ready')
          setShowEditor(true)
          setGeneratedDeckIntent(deckIntent)
          slidesApi.getDeck(deck.id, token)
            .then((freshDeck) => {
              setGeneratedDeckIntent((freshDeck?.deckIntent as DeckIntent) || deckIntent)
              setGeneratedSlideCount(Array.isArray(freshDeck?.slides) ? freshDeck.slides.length : null)
              setGeneratedVisualStyle((current) => (current !== 'auto' ? current : chosenVisualStyle))
              setGeneratedQualityWarnings(Array.isArray(freshDeck?.composition?.qualityWarnings)
                ? freshDeck.composition.qualityWarnings.map((warning: any) => warning?.message).filter(Boolean)
                : [])
              setGeneratedImageCoverage(getImageCoverage(Array.isArray(freshDeck?.slides) ? freshDeck.slides : []))
              setGeneratedExportReady((current) => (
                current === true
                  ? true
                  : Boolean((freshDeck as any)?.exports?.length || freshDeck?.composition?.exportPrepared || exportReady)
              ))
            })
            .catch((err) => console.warn('Failed to refresh generated deck metadata:', err))
          onGenerated?.()
        } else if (data.status === 'failed') {
          eventSource.close()
          setGenerating(false)
          setExistingDeckStatus('failed')
          setError('Deck generation failed')
        }
      }

      eventSource.onerror = () => {
        eventSource.close()
        setGenerating(false)
        setExistingDeckStatus('failed')
        setError('Connection lost during generation')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate slides')
      setGenerating(false)
    }
  }

  return (
    <div className="border border-white/10 rounded-xl p-6 bg-black/20 space-y-5">
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-purple-300" />
        <div>
          <h3 className="text-lg font-semibold">Sermon Slides</h3>
          <p className="text-xs text-gray-400">Deck composer, image tools, and editor live in one place.</p>
        </div>
      </div>

      <div className="rounded-xl border border-purple-400/30 bg-purple-500/10 px-4 py-3 text-sm text-purple-100">
        <p className="font-medium">Generate Sermon Presentation Deck</p>
        <p className="text-xs text-purple-100/80 mt-1">
          Best for worship services and Bible study presentations. Expected: 8-14 slides.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">Deck mode</label>
            <select
              className="w-full min-w-0 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
              value={deckIntent}
              onChange={(e) => setDeckIntent(e.target.value as DeckIntent)}
            >
              <option value="sermon_presentation">Sermon Presentation Deck</option>
              <option value="teaching_study">Teaching Study Deck</option>
              <option value="youth_message">Youth Message Deck</option>
              <option value="evangelistic_appeal">Evangelistic Appeal Deck</option>
              <option value="social_summary">Social Promo / Summary Deck</option>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">Layout style</label>
            <select
              className="w-full min-w-0 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
              value={layoutPreference}
              onChange={(e) => setLayoutPreference(e.target.value as LayoutPreference)}
            >
              <option value="balanced">Balanced</option>
              <option value="text_forward">Text Forward</option>
              <option value="image_rich">Image Rich</option>
              <option value="scripture_forward">Scripture Forward</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">Visual style</label>
            <select
              value={visualStyle}
              onChange={(e) => setVisualStyle(e.target.value as VisualStyleKey)}
              className="w-full min-w-0 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
            >
              <option value="auto">Auto</option>
              <option value="reverent_worship">Reverent Worship</option>
              <option value="warm_pastoral">Warm Pastoral</option>
              <option value="evangelistic_invitation">Evangelistic Invitation</option>
              <option value="hopeful_prophecy">Hopeful Prophecy</option>
              <option value="bible_study_clean">Bible Study Clean</option>
              <option value="youth_modern">Youth Modern</option>
              <option value="spanish_church_warm">Spanish Church Warm</option>
            </select>
          </div>

          {themes.length > 0 && (
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
                Slide theme
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
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 xl:col-span-2">
            <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
              Background image
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={backgroundProvider}
                onChange={(e) => setBackgroundProvider(e.target.value as 'local' | 'openai' | 'falai')}
                className="w-full min-w-0 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
              >
                <option value="local">Local Canvas</option>
                <option value="openai">OpenAI (DALL-E 3)</option>
                <option value="falai">fal.ai (Flux Schnell)</option>
              </select>
              <select
                value={backgroundPreset}
                onChange={(e) => setBackgroundPreset(e.target.value as LocalBackgroundPreset)}
                className="w-full min-w-0 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
              >
                <option value="worship">Worship Light</option>
                <option value="biblical">Biblical Horizon</option>
                <option value="cyberpunk">Cyberpunk Neon</option>
                <option value="modern">Modern Geometric</option>
                <option value="aurora">Aurora Glow</option>
                <option value="nature">Nature Warmth</option>
                <option value="minimal">Minimal Studio</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">Image target</label>
            <select
              className="w-full min-w-0 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
              value={imageGenerationTarget}
              onChange={(e) => setImageGenerationTarget(e.target.value as ImageGenerationTarget)}
            >
              <option value="background">Background images</option>
              <option value="content">Content images</option>
              <option value="both">Background + content</option>
            </select>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-400">
          Layout style controls the generated deck mix. Image target controls which image jobs are generated. Use Image Rich when you want generated images placed directly into slides.
        </div>
      </div>

      {/* Sync Status */}
      {!sermonId && (
        <div className="border border-yellow-400/40 bg-yellow-500/10 text-yellow-100 text-sm rounded-xl px-4 py-3">
          <p className="font-medium mb-1">Workspace not synced</p>
          <p className="text-xs text-yellow-200/80">
            Click "Sync & Generate" to sync your sermon content and generate slides in one step.
          </p>
        </div>
      )}

      {sermonId && (
        <div className="border border-green-400/40 bg-green-500/10 text-green-100 text-sm rounded-xl px-4 py-3">
          <p className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Workspace synced. {generatedDeckId ? 'Existing deck loaded.' : 'Ready to generate slides.'}
          </p>
          {generatedDeckId && !generating ? (
            <div className="mt-2 space-y-1 text-xs text-green-200/80">
              <p>
                Deck status: {existingDeckStatus || 'unknown'} · Deck mode: {generatedDeckIntent.replace(/_/g, ' ')}{generatedSlideCount ? ` · Slides: ${generatedSlideCount}` : ''}.
              </p>
              <p>
                Visual style: {generatedVisualStyle.replace(/_/g, ' ')}{generatedImageCoverage !== null ? ` · Image coverage: ${generatedImageCoverage}%` : ''}.
              </p>
              <p>
                Quality: {generatedQualityWarnings.length ? `${generatedQualityWarnings.length} warning(s)` : 'clean'} · Export: {generatedExportReady ? 'ready' : 'pending'}.
              </p>
            </div>
          ) : null}
          {!generating && generatedDeckIntent === 'sermon_presentation' && generatedSlideCount !== null && generatedSlideCount < 8 ? (
            <p className="text-xs text-amber-200 mt-1">
              This deck may be too short for a full sermon presentation.
            </p>
          ) : null}
        </div>
      )}

      {/* Outline Preview */}
      {workspace.outlines?.[0] && (
        <div className="border border-white/10 rounded-xl p-4 bg-black/20 space-y-3">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
            Outline to Convert
          </p>
          <p className="text-sm font-medium mb-2">{workspace.outlines[0].title}</p>
          <div className="text-xs text-gray-300 space-y-2 max-h-56 overflow-auto pr-1">
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
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleGenerateDeck}
          disabled={generating || syncing}
          className="cyber-button text-sm px-4 py-3 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2 min-w-[220px] flex-1"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {deckIntent === 'social_summary' ? 'Generating Styled Social Deck...' : 'Generating Styled Deck...'}
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              {sermonId
                ? deckIntent === 'social_summary'
                  ? 'Generate Styled Social Deck'
                  : 'Generate Styled Deck'
                : 'Sync & Generate'}
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
        {deckIntent === 'social_summary'
          ? 'Generates a short promo deck for sharing or announcements.'
          : 'Generates a full sermon presentation deck from your outline and manuscript.'}
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
