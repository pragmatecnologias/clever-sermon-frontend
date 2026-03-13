'use client'

import { useState, useEffect } from 'react'
import { Music, Sparkles, Loader2, Eye, Play, Download } from 'lucide-react'
import { slidesApi } from '@/lib/slides-api'

interface SermonMusicGeneratorProps {
  workspace: any
  sermonId?: string
  token: string
  suggestedPrompt?: string
  suggestedPromptOptions?: Array<{ id: string; label: string; description?: string; prompt: string }>
  onGenerated?: () => void
}

type SongMode = 'ambient_only' | 'with_lyrics' | 'chorus_only' | 'background_bed'
type MusicStyle = 'worship' | 'acoustic' | 'cinematic' | 'orchestral' | 'piano_prayer' | 'youth_contemporary' | 'choir_inspired' | 'instrumental_ambient'
type UseCase = 'sermon-intro' | 'prayer-reflection' | 'recap-video' | 'youth-promo' | 'closing-appeal' | 'offertory' | 'meditation' | 'theme-song'

export default function SermonMusicGenerator({
  workspace,
  sermonId,
  token,
  suggestedPrompt,
  suggestedPromptOptions = [],
  onGenerated,
}: SermonMusicGeneratorProps) {
  const normalizedLanguage = String(workspace?.language || workspace?.metadata?.language || 'en')
    .trim()
    .toLowerCase()
    .startsWith('es')
    ? 'es'
    : 'en'

  const [mode, setMode] = useState<SongMode>('with_lyrics')
  const [style, setStyle] = useState<MusicStyle>('worship')
  const [useCase, setUseCase] = useState<UseCase>('theme-song')
  const [duration, setDuration] = useState(180)
  const [previewing, setPreviewing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatingLyrics, setGeneratingLyrics] = useState(false)
  const [resolvingSermon, setResolvingSermon] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPromptOption, setSelectedPromptOption] = useState<string>('')
  const [resolvedSermonId, setResolvedSermonId] = useState<string | null>(sermonId || null)

  useEffect(() => {
    if (!suggestedPromptOptions.length) return
    if (selectedPromptOption) return
    setSelectedPromptOption(suggestedPromptOptions[0].id)
  }, [suggestedPromptOptions, selectedPromptOption])

  useEffect(() => {
    if (sermonId) {
      setResolvedSermonId(sermonId)
    }
  }, [sermonId])

  const hydratePreviewFromSongDraft = (songDraft: any) => {
    if (!songDraft?.lyrics || typeof songDraft.lyrics !== 'object') return
    setPreview({
      type: 'lyrics',
      elements: songDraft.elements || null,
      lyrics: {
        title: songDraft.lyrics.title || '',
        themeStatement: songDraft.lyrics.themeStatement || '',
        verse1: Array.isArray(songDraft.lyrics.verse1) ? songDraft.lyrics.verse1 : [],
        chorus: Array.isArray(songDraft.lyrics.chorus) ? songDraft.lyrics.chorus : [],
        verse2: Array.isArray(songDraft.lyrics.verse2) ? songDraft.lyrics.verse2 : [],
        bridge: Array.isArray(songDraft.lyrics.bridge) ? songDraft.lyrics.bridge : [],
        outro: Array.isArray(songDraft.lyrics.outro) ? songDraft.lyrics.outro : [],
        keyPhrases: Array.isArray(songDraft.lyrics.keyPhrases) ? songDraft.lyrics.keyPhrases : [],
        scriptureAnchors: Array.isArray(songDraft.lyrics.scriptureAnchors) ? songDraft.lyrics.scriptureAnchors : [],
        sunoPrompt: songDraft.lyrics.sunoPrompt || '',
      },
    })
  }

  const loadLyricsDraftFromSermon = async (id: string) => {
    try {
      const sermon = await slidesApi.getSermon(id, token)
      const draft = sermon?.manuscript?.songLyricsDraft
      if (draft) {
        hydratePreviewFromSongDraft(draft)
      }
    } catch {
      // Ignore restore failures; manual generation still works.
    }
  }

  useEffect(() => {
    if (!resolvedSermonId) return
    loadLyricsDraftFromSermon(resolvedSermonId)
  }, [resolvedSermonId])

  useEffect(() => {
    if (resolvedSermonId || resolvingSermon || !workspace?.id) return
    resolveSermonId()
  }, [resolvedSermonId, resolvingSermon, workspace?.id])

  const musicStyles: { value: MusicStyle; label: string }[] = [
    { value: 'worship', label: 'Worship' },
    { value: 'acoustic', label: 'Acoustic' },
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'orchestral', label: 'Orchestral' },
    { value: 'piano_prayer', label: 'Piano Prayer' },
    { value: 'youth_contemporary', label: 'Youth Contemporary' },
    { value: 'choir_inspired', label: 'Choir Inspired' },
    { value: 'instrumental_ambient', label: 'Instrumental Ambient' },
  ]

  const useCases: { value: UseCase; label: string; description: string }[] = [
    { value: 'theme-song', label: 'Theme Song', description: 'Main sermon theme song' },
    { value: 'sermon-intro', label: 'Sermon Intro', description: 'Anticipatory opening' },
    { value: 'prayer-reflection', label: 'Prayer', description: 'Contemplative prayer time' },
    { value: 'recap-video', label: 'Recap Video', description: 'Uplifting summary' },
    { value: 'youth-promo', label: 'Youth Promo', description: 'Energetic engagement' },
    { value: 'closing-appeal', label: 'Closing Appeal', description: 'Invitational response' },
    { value: 'offertory', label: 'Offertory', description: 'Worshipful giving' },
    { value: 'meditation', label: 'Meditation', description: 'Peaceful reflection' },
  ]

  const selectedPromptText =
    suggestedPromptOptions.find((item) => item.id === selectedPromptOption)?.prompt ||
    suggestedPrompt ||
    ''

  const resolveSermonId = async (): Promise<string | null> => {
    if (resolvedSermonId) return resolvedSermonId
    setResolvingSermon(true)
    try {
      const sermons = await slidesApi.getSermons(token)
      const workspaceSermons = (Array.isArray(sermons) ? sermons : [])
        .filter((sermon: any) => sermon?.workspaceId === workspace?.id)
        .sort(
          (a: any, b: any) =>
            new Date(b?.updatedAt || b?.createdAt || 0).getTime() - new Date(a?.updatedAt || a?.createdAt || 0).getTime(),
        )
      if (workspaceSermons[0]?.id) {
        setResolvedSermonId(workspaceSermons[0].id)
        if (workspaceSermons[0]?.manuscript?.songLyricsDraft) {
          hydratePreviewFromSongDraft(workspaceSermons[0].manuscript.songLyricsDraft)
        }
        return workspaceSermons[0].id
      }

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
          return [title, summary].filter(Boolean).join(' — ')
        })
        .filter(Boolean)

      const syncData = {
        workspaceId: workspace.id,
        title: workspace.title || 'Untitled Sermon',
        seriesTitle: workspace.seriesTitle,
        language: workspace.language || workspace.metadata?.language || 'en',
        mainScriptureRef: workspace.mainPassage || '',
        bigIdea: workspace.theme || workspace.sermonGoals || 'Sermon',
        mainPoints: normalizedPoints,
        audienceContext: workspace.audienceProfile,
        tone: workspace.metadata?.tone,
        notes: workspace.manuscripts?.[0]?.content?.text || '',
        outline: workspace.outlines?.[0],
        manuscript: workspace.manuscripts?.[0],
        applications: workspace.applications || [],
        questions: workspace.questions || workspace.discussionQuestions || [],
      }

      const sermon = await slidesApi.syncWorkspace(syncData as any, token)
      if (sermon?.id) {
        setResolvedSermonId(sermon.id)
        if (sermon?.manuscript?.songLyricsDraft) {
          hydratePreviewFromSongDraft(sermon.manuscript.songLyricsDraft)
        }
        return sermon.id
      }
      return null
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sync sermon context for music generation')
      return null
    } finally {
      setResolvingSermon(false)
    }
  }

  const handlePreview = async () => {
    const sermonTargetId = await resolveSermonId()
    if (!sermonTargetId) return
    setPreviewing(true)
    setError(null)
    setPreview(null)

    try {
      const previewData = await slidesApi.previewSermonSong({
        sermonId: sermonTargetId,
        mode,
        style,
        useCase,
        studyPrompt: selectedPromptText || undefined,
        language: normalizedLanguage,
      }, token)

      setPreview(previewData)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate preview')
    } finally {
      setPreviewing(false)
    }
  }

  const handleGenerate = async () => {
    const sermonTargetId = await resolveSermonId()
    if (!sermonTargetId) return
    setGenerating(true)
    setError(null)

    try {
      const generated = await slidesApi.generateSermonSong({
        sermonId: sermonTargetId,
        workspaceId: workspace.id,
        mode,
        style,
        useCase,
        duration,
        studyPrompt: selectedPromptText || undefined,
        language: normalizedLanguage,
      }, token)

      if (generated?.metadata?.type === 'lyrics' && generated?.metadata?.lyrics && typeof window !== 'undefined') {
        const persisted = {
          type: 'lyrics',
          elements: generated?.sermonElements,
          lyrics: {
            title: generated?.metadata?.title || '',
            themeStatement: generated?.metadata?.themeStatement || '',
            verse1: generated?.metadata?.lyrics?.verse1 || [],
            chorus: generated?.metadata?.lyrics?.chorus || [],
            verse2: generated?.metadata?.lyrics?.verse2 || [],
            bridge: generated?.metadata?.lyrics?.bridge || [],
            outro: generated?.metadata?.lyrics?.outro || [],
            keyPhrases: generated?.metadata?.keyPhrases || [],
            scriptureAnchors: generated?.metadata?.scriptureAnchors || [],
            sunoPrompt: generated?.prompt || '',
          },
        }
        setPreview(persisted)
      }

      onGenerated?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate music')
    } finally {
      setGenerating(false)
    }
  }

  const handleQuickGenerate = async (quickMode: SongMode) => {
    const sermonTargetId = await resolveSermonId()
    if (!sermonTargetId) return
    setMode(quickMode)
    setGenerating(true)
    setError(null)

    try {
      const generated = await slidesApi.generateSermonSong({
        sermonId: sermonTargetId,
        workspaceId: workspace.id,
        mode: quickMode,
        style: quickMode === 'ambient_only' ? 'instrumental_ambient' : 'worship',
        useCase: quickMode === 'ambient_only' ? 'sermon-intro' : 'theme-song',
        duration: quickMode === 'ambient_only' ? 120 : 180,
        studyPrompt: selectedPromptText || undefined,
        language: normalizedLanguage,
      }, token)

      if (generated?.metadata?.type === 'lyrics' && generated?.metadata?.lyrics && typeof window !== 'undefined') {
        const persisted = {
          type: 'lyrics',
          elements: generated?.sermonElements,
          lyrics: {
            title: generated?.metadata?.title || '',
            themeStatement: generated?.metadata?.themeStatement || '',
            verse1: generated?.metadata?.lyrics?.verse1 || [],
            chorus: generated?.metadata?.lyrics?.chorus || [],
            verse2: generated?.metadata?.lyrics?.verse2 || [],
            bridge: generated?.metadata?.lyrics?.bridge || [],
            outro: generated?.metadata?.lyrics?.outro || [],
            keyPhrases: generated?.metadata?.keyPhrases || [],
            scriptureAnchors: generated?.metadata?.scriptureAnchors || [],
            sunoPrompt: generated?.prompt || '',
          },
        }
        setPreview(persisted)
      }

      onGenerated?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate music')
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateLyrics = async () => {
    const sermonTargetId = await resolveSermonId()
    if (!sermonTargetId) return
    setGeneratingLyrics(true)
    setError(null)
    setPreview(null)
    try {
      const lyricMode = mode === 'chorus_only' ? 'chorus_only' : 'with_lyrics'
      const lyricData = await slidesApi.generateSermonLyrics(
        {
          sermonId: sermonTargetId,
          style,
          mode: lyricMode,
          useCase,
          studyPrompt: selectedPromptText || undefined,
          language: normalizedLanguage,
        },
        token,
      )
      setPreview({
        type: 'lyrics',
        elements: lyricData.elements,
        lyrics: lyricData.lyrics,
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate lyrics')
    } finally {
      setGeneratingLyrics(false)
    }
  }

  return (
    <div className="border border-white/10 rounded-xl p-6 bg-black/20 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Music className="w-6 h-6 text-purple-300" />
        <div>
          <h3 className="text-lg font-semibold">Sermon Theme Song Generator</h3>
          <p className="text-xs text-gray-400">Create worship music that belongs to this sermon</p>
        </div>
      </div>

      {suggestedPromptOptions.length ? (
        <div className="border border-purple-400/30 bg-purple-500/10 rounded-xl px-4 py-3 space-y-2">
          <label className="text-[11px] uppercase tracking-wider text-purple-200/90 block">Study Music Prompt</label>
          <select
            value={selectedPromptOption}
            onChange={(e) => setSelectedPromptOption(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
          >
            {suggestedPromptOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}{option.description ? ` — ${option.description}` : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-purple-100/90 leading-relaxed">
            {suggestedPromptOptions.find((item) => item.id === selectedPromptOption)?.prompt || ''}
          </p>
        </div>
      ) : suggestedPrompt?.trim() ? (
        <div className="border border-purple-400/30 bg-purple-500/10 rounded-xl px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-purple-200/90 mb-1">Study Music Prompt</p>
          <p className="text-xs text-purple-100/90 leading-relaxed">{suggestedPrompt}</p>
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => handleQuickGenerate('ambient_only')}
          disabled={generating || resolvingSermon}
          title="Genera música instrumental rápida para intro/reflexión (sin letra)."
          className="cyber-outline px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Quick Ambient
        </button>
        <button
          onClick={() => handleQuickGenerate('with_lyrics')}
          disabled={generating || resolvingSermon}
          title="Genera canción tema completa con letra en un clic."
          className="cyber-button px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Quick Theme Song
        </button>
      </div>
      <div className="text-xs text-gray-400 space-y-1 -mt-2">
        <p><span className="text-gray-200 font-medium">Quick Ambient:</span> one-click instrumental background (no lyrics), sermon intro focus.</p>
        <p><span className="text-gray-200 font-medium">Quick Theme Song:</span> one-click full worship song with lyrics, theme-song focus.</p>
      </div>

      {/* Mode Selector */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-widest text-gray-400">Mode</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'ambient_only', label: 'Ambient Only' },
            { value: 'with_lyrics', label: 'With Lyrics' },
            { value: 'chorus_only', label: 'Chorus Only' },
            { value: 'background_bed', label: 'Background Bed' },
          ].map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value as SongMode)}
              title={
                m.value === 'ambient_only'
                  ? 'Solo instrumental, sin letra.'
                  : m.value === 'with_lyrics'
                  ? 'Canción completa con letra.'
                  : m.value === 'chorus_only'
                  ? 'Genera enfoque en coro/refrán.'
                  : 'Base instrumental para fondo mientras se habla.'
              }
              className={`px-3 py-2 rounded-lg text-sm ${
                mode === m.value
                  ? 'bg-purple-500/20 border border-purple-400/40 text-purple-200'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Style Selector (for lyrical modes) */}
      {(mode === 'with_lyrics' || mode === 'chorus_only') && (
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-widest text-gray-400">Style</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as MusicStyle)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
          >
            {musicStyles.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Use Case Selector */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-widest text-gray-400">Use Case</label>
        <select
          value={useCase}
          onChange={(e) => setUseCase(e.target.value as UseCase)}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
        >
          {useCases.map((uc) => (
            <option key={uc.value} value={uc.value}>
              {uc.label} - {uc.description}
            </option>
          ))}
        </select>
      </div>

      {/* Duration Slider */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-widest text-gray-400">
          Duration: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
        </label>
        <input
          type="range"
          min="30"
          max="300"
          step="30"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handlePreview}
          disabled={previewing || resolvingSermon}
          title="Vista previa de propuesta (no genera ni guarda audio)."
          className="flex-1 cyber-outline px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
        >
          {previewing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Preview...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Preview
            </>
          )}
        </button>
        <button
          onClick={handleGenerate}
          disabled={generating || resolvingSermon}
          title="Genera audio real y lo guarda en la biblioteca de medios."
          className="flex-1 cyber-button px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Music className="w-4 h-4" />
              Generate Music
            </>
          )}
        </button>
        <button
          onClick={handleGenerateLyrics}
          disabled={generatingLyrics || resolvingSermon}
          title="Genera solo la letra (sin audio) y la deja lista para revisar."
          className="cyber-outline px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2 border-purple-400/40 text-purple-200"
        >
          {generatingLyrics ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Lyrics...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Lyrics
            </>
          )}
        </button>
      </div>
      <div className="text-xs text-gray-400 space-y-1 -mt-2">
        <p><span className="text-gray-200 font-medium">Preview:</span> generates a draft only (lyrics/prompt), does not create media asset.</p>
        <p><span className="text-gray-200 font-medium">Generate Music:</span> submits real audio generation job and saves result to Media Library.</p>
        <p><span className="text-gray-200 font-medium">Generate Lyrics:</span> creates/refines lyrics only; no audio generation.</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="border border-red-400/40 bg-red-500/10 text-red-100 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Preview Display */}
      {preview && (
        <div className="border border-purple-400/40 bg-purple-500/10 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-purple-200">Preview</h4>
            <span className="text-xs text-purple-300">{preview.type}</span>
          </div>

          {/* Extracted Elements */}
          {preview.elements && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-purple-300">Key Phrases</p>
              <div className="flex flex-wrap gap-2">
                {preview.elements.keyPhrases?.map((phrase: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-purple-500/20 border border-purple-400/30 rounded text-xs"
                  >
                    {phrase}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lyrics Preview */}
          {preview.lyrics && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-purple-200">{preview.lyrics.title}</p>
                <p className="text-xs text-purple-300 italic">{preview.lyrics.themeStatement}</p>
              </div>

              {preview.lyrics.verse1?.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-purple-300 mb-1">Verse 1</p>
                  {preview.lyrics.verse1.map((line: string, idx: number) => (
                    <p key={idx} className="text-sm text-gray-200">
                      {line}
                    </p>
                  ))}
                </div>
              )}

              {preview.lyrics.chorus?.length > 0 && (
                <div className="border-l-2 border-purple-400 pl-3">
                  <p className="text-xs uppercase tracking-widest text-purple-300 mb-1">Chorus</p>
                  {preview.lyrics.chorus.map((line: string, idx: number) => (
                    <p key={idx} className="text-sm font-medium text-purple-100">
                      {line}
                    </p>
                  ))}
                </div>
              )}

              {preview.lyrics.verse2?.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-purple-300 mb-1">Verse 2</p>
                  {preview.lyrics.verse2.map((line: string, idx: number) => (
                    <p key={idx} className="text-sm text-gray-200">
                      {line}
                    </p>
                  ))}
                </div>
              )}

              {preview.lyrics.bridge?.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-purple-300 mb-1">Bridge</p>
                  {preview.lyrics.bridge.map((line: string, idx: number) => (
                    <p key={idx} className="text-sm text-gray-200">
                      {line}
                    </p>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-purple-400/20">
                <p className="text-xs text-purple-300">Suno Prompt:</p>
                <p className="text-xs text-gray-400 mt-1">{preview.lyrics.sunoPrompt}</p>
              </div>
            </div>
          )}

          {/* Ambient Preview */}
          {preview.prompt && (
            <div className="space-y-2">
              <div>
                <p className="text-xs uppercase tracking-widest text-purple-300">Description</p>
                <p className="text-sm text-gray-200">{preview.prompt.description}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-purple-300">Mood</p>
                <p className="text-sm text-gray-200">{preview.prompt.mood}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-purple-300">Instruments</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {preview.prompt.instruments?.map((inst: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-purple-500/20 border border-purple-400/30 rounded text-xs"
                    >
                      {inst}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-purple-400/20">
                <p className="text-xs text-purple-300">Suno Prompt:</p>
                <p className="text-xs text-gray-400 mt-1">{preview.prompt.sunoPrompt}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-500 text-center">
        Generates sermon-specific worship music using AI. Lyrics are theologically grounded and match your sermon's theme.
      </p>
    </div>
  )
}
