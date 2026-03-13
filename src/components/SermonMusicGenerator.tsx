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
  const [lyricsDraft, setLyricsDraft] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPromptOption, setSelectedPromptOption] = useState<string>('')
  const [resolvedSermonId, setResolvedSermonId] = useState<string | null>(sermonId || null)
  const sermonIdStorageKey = workspace?.id ? `workspace-sermon-id:${workspace.id}` : null

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

  useEffect(() => {
    if (typeof window === 'undefined' || sermonId || !sermonIdStorageKey || resolvedSermonId) return
    const cachedSermonId = localStorage.getItem(sermonIdStorageKey)
    if (cachedSermonId) {
      setResolvedSermonId(cachedSermonId)
    }
  }, [sermonId, sermonIdStorageKey, resolvedSermonId])

  const hydratePreviewFromSongDraft = (songDraft: any) => {
    if (!songDraft?.lyrics || typeof songDraft.lyrics !== 'object') return
    setLyricsDraft(songDraft)
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
    if (typeof window !== 'undefined' && sermonIdStorageKey) {
      localStorage.setItem(sermonIdStorageKey, resolvedSermonId)
    }
    loadLyricsDraftFromSermon(resolvedSermonId)
  }, [resolvedSermonId, sermonIdStorageKey])

  useEffect(() => {
    if (resolvedSermonId || resolvingSermon || !workspace?.id) return
    resolveSermonId()
  }, [resolvedSermonId, resolvingSermon, workspace?.id, sermonIdStorageKey])

  const musicStyles: { value: MusicStyle; label: string; labelEs: string }[] = [
    { value: 'worship', label: 'Worship', labelEs: 'Adoración' },
    { value: 'acoustic', label: 'Acoustic', labelEs: 'Acústico' },
    { value: 'cinematic', label: 'Cinematic', labelEs: 'Cinemático' },
    { value: 'orchestral', label: 'Orchestral', labelEs: 'Orquestal' },
    { value: 'piano_prayer', label: 'Piano Prayer', labelEs: 'Piano de oración' },
    { value: 'youth_contemporary', label: 'Youth Contemporary', labelEs: 'Contemporáneo juvenil' },
    { value: 'choir_inspired', label: 'Choir Inspired', labelEs: 'Inspirado en coro' },
    { value: 'instrumental_ambient', label: 'Instrumental Ambient', labelEs: 'Ambiental instrumental' },
  ]

  const useCases: { value: UseCase; label: string; labelEs: string; description: string; descriptionEs: string }[] = [
    { value: 'theme-song', label: 'Theme Song', labelEs: 'Canción tema', description: 'Main sermon theme song', descriptionEs: 'Canción principal del sermón' },
    { value: 'sermon-intro', label: 'Sermon Intro', labelEs: 'Introducción', description: 'Anticipatory opening', descriptionEs: 'Apertura anticipada' },
    { value: 'prayer-reflection', label: 'Prayer', labelEs: 'Oración', description: 'Contemplative prayer time', descriptionEs: 'Momento de oración contemplativa' },
    { value: 'recap-video', label: 'Recap Video', labelEs: 'Video resumen', description: 'Uplifting summary', descriptionEs: 'Resumen inspirador' },
    { value: 'youth-promo', label: 'Youth Promo', labelEs: 'Promo juvenil', description: 'Energetic engagement', descriptionEs: 'Convocatoria enérgica' },
    { value: 'closing-appeal', label: 'Closing Appeal', labelEs: 'Llamado final', description: 'Invitational response', descriptionEs: 'Respuesta de invitación' },
    { value: 'offertory', label: 'Offertory', labelEs: 'Ofrenda', description: 'Worshipful giving', descriptionEs: 'Momento de ofrenda y adoración' },
    { value: 'meditation', label: 'Meditation', labelEs: 'Meditación', description: 'Peaceful reflection', descriptionEs: 'Reflexión en paz' },
  ]

  const selectedPromptText =
    suggestedPromptOptions.find((item) => item.id === selectedPromptOption)?.prompt ||
    suggestedPrompt ||
    ''
  const requiresLyricsDraft = mode === 'with_lyrics' || mode === 'chorus_only'
  const hasLyricsDraft =
    !!lyricsDraft?.lyrics?.sunoPrompt &&
    (lyricsDraft?.mode === (mode === 'chorus_only' ? 'chorus_only' : 'with_lyrics')) &&
    String(lyricsDraft?.language || normalizedLanguage)
      .trim()
      .toLowerCase()
      .startsWith(normalizedLanguage === 'es' ? 'es' : 'en')
  const isSpanish = normalizedLanguage === 'es'
  const uiText = {
    quickAmbient: isSpanish ? 'Rápido Ambiental' : 'Quick Ambient',
    quickThemeSong: isSpanish ? 'Rápida Canción Tema' : 'Quick Theme Song',
    preview: isSpanish ? 'Vista previa' : 'Preview',
    generateMusic: isSpanish ? 'Generar música' : 'Generate Music',
    generateLyrics: isSpanish ? 'Generar letra' : 'Generate Lyrics',
    generatingPreview: isSpanish ? 'Generando vista previa...' : 'Generating Preview...',
    generatingMusic: isSpanish ? 'Generando...' : 'Generating...',
    generatingLyrics: isSpanish ? 'Generando letra...' : 'Generating Lyrics...',
    mode: isSpanish ? 'Modo' : 'Mode',
    style: isSpanish ? 'Estilo' : 'Style',
    useCase: isSpanish ? 'Caso de uso' : 'Use Case',
    duration: isSpanish ? 'Duración' : 'Duration',
    previewTitle: isSpanish ? 'Vista previa' : 'Preview',
    keyPhrases: isSpanish ? 'Frases clave' : 'Key Phrases',
    verse1: isSpanish ? 'Verso 1' : 'Verse 1',
    verse2: isSpanish ? 'Verso 2' : 'Verse 2',
    chorus: isSpanish ? 'Coro' : 'Chorus',
    bridge: isSpanish ? 'Puente' : 'Bridge',
    sunoPrompt: isSpanish ? 'Prompt para Suno' : 'Suno Prompt',
    lyricsRequired: isSpanish
      ? 'Genera y guarda la letra primero para crear música con este modo.'
      : 'Generate and save lyrics first to create music in this mode.',
    quickThemeSongNeedsLyrics: isSpanish
      ? 'Primero generaremos la letra y luego lanzaremos la música.'
      : 'Lyrics will be generated first, then the music job will start.',
  }

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
        if (typeof window !== 'undefined' && sermonIdStorageKey) {
          localStorage.setItem(sermonIdStorageKey, workspaceSermons[0].id)
        }
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
        if (typeof window !== 'undefined' && sermonIdStorageKey) {
          localStorage.setItem(sermonIdStorageKey, sermon.id)
        }
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
    if (requiresLyricsDraft && !hasLyricsDraft) {
      setError(uiText.lyricsRequired)
      return
    }
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
          mode: generated?.metadata?.mode || (mode === 'chorus_only' ? 'chorus_only' : 'with_lyrics'),
          style: generated?.metadata?.style || style,
          useCase: generated?.metadata?.useCase || useCase,
          language: generated?.metadata?.language || normalizedLanguage,
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
            sunoPrompt: generated?.metadata?.lyrics?.sunoPrompt || '',
          },
        }
        setLyricsDraft(persisted)
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
      const quickRequiresLyrics = quickMode === 'with_lyrics' || quickMode === 'chorus_only'
      if (quickRequiresLyrics) {
        const lyricMode = quickMode === 'chorus_only' ? 'chorus_only' : 'with_lyrics'
        const lyricData = await slidesApi.generateSermonLyrics(
          {
            sermonId: sermonTargetId,
            style: 'worship',
            mode: lyricMode,
            useCase: 'theme-song',
            studyPrompt: selectedPromptText || undefined,
            language: normalizedLanguage,
          },
          token,
        )
        const persistedDraft = {
          mode: lyricMode,
          style: 'worship',
          useCase: 'theme-song',
          language: normalizedLanguage,
          elements: lyricData.elements,
          lyrics: lyricData.lyrics,
        }
        setLyricsDraft(persistedDraft)
        setPreview({
          type: 'lyrics',
          elements: lyricData.elements,
          lyrics: lyricData.lyrics,
        })
      }

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
          mode: generated?.metadata?.mode || (quickMode === 'chorus_only' ? 'chorus_only' : 'with_lyrics'),
          style: generated?.metadata?.style || (quickMode === 'ambient_only' ? 'instrumental_ambient' : 'worship'),
          useCase: generated?.metadata?.useCase || (quickMode === 'ambient_only' ? 'sermon-intro' : 'theme-song'),
          language: generated?.metadata?.language || normalizedLanguage,
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
            sunoPrompt: generated?.metadata?.lyrics?.sunoPrompt || '',
          },
        }
        setLyricsDraft(persisted)
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
      setLyricsDraft({
        mode: lyricMode,
        style,
        useCase,
        language: normalizedLanguage,
        elements: lyricData.elements,
        lyrics: lyricData.lyrics,
      })
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
          {uiText.quickAmbient}
        </button>
        <button
          onClick={() => handleQuickGenerate('with_lyrics')}
          disabled={generating || resolvingSermon}
          title={uiText.quickThemeSongNeedsLyrics}
          className="cyber-button px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {uiText.quickThemeSong}
        </button>
      </div>
      <div className="text-xs text-gray-400 space-y-1 -mt-2">
        <p><span className="text-gray-200 font-medium">{uiText.quickAmbient}:</span> {isSpanish ? 'instrumental en un clic (sin letra), ideal para introducción.' : 'one-click instrumental background (no lyrics), sermon intro focus.'}</p>
        <p><span className="text-gray-200 font-medium">{uiText.quickThemeSong}:</span> {isSpanish ? 'canción completa en un clic con letra y enfoque de tema central.' : 'one-click full worship song with lyrics, theme-song focus.'}</p>
      </div>

      {/* Mode Selector */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-widest text-gray-400">{uiText.mode}</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'ambient_only', label: isSpanish ? 'Solo ambiental' : 'Ambient Only' },
            { value: 'with_lyrics', label: isSpanish ? 'Con letra' : 'With Lyrics' },
            { value: 'chorus_only', label: isSpanish ? 'Solo coro' : 'Chorus Only' },
            { value: 'background_bed', label: isSpanish ? 'Base de fondo' : 'Background Bed' },
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
          <label className="text-xs uppercase tracking-widest text-gray-400">{uiText.style}</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as MusicStyle)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
          >
            {musicStyles.map((s) => (
              <option key={s.value} value={s.value}>
                {isSpanish ? s.labelEs : s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Use Case Selector */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-widest text-gray-400">{uiText.useCase}</label>
        <select
          value={useCase}
          onChange={(e) => setUseCase(e.target.value as UseCase)}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
        >
          {useCases.map((uc) => (
            <option key={uc.value} value={uc.value}>
              {isSpanish ? `${uc.labelEs} - ${uc.descriptionEs}` : `${uc.label} - ${uc.description}`}
            </option>
          ))}
        </select>
      </div>

      {/* Duration Slider */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-widest text-gray-400">
          {uiText.duration}: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
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
              {uiText.generatingPreview}
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              {uiText.preview}
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
              {uiText.generatingMusic}
            </>
          ) : (
            <>
              <Music className="w-4 h-4" />
              {uiText.generateMusic}
            </>
          )}
        </button>
        {requiresLyricsDraft ? (
          <button
            onClick={handleGenerateLyrics}
            disabled={generatingLyrics || resolvingSermon}
            title="Genera solo la letra (sin audio) y la deja lista para revisar."
            className="cyber-outline px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2 border-purple-400/40 text-purple-200"
          >
            {generatingLyrics ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {uiText.generatingLyrics}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {uiText.generateLyrics}
              </>
            )}
          </button>
        ) : null}
      </div>
      <div className="text-xs text-gray-400 space-y-1 -mt-2">
        <p><span className="text-gray-200 font-medium">{uiText.preview}:</span> {isSpanish ? 'solo genera borrador (letra/prompt), no crea medio final.' : 'generates a draft only (lyrics/prompt), does not create media asset.'}</p>
        <p><span className="text-gray-200 font-medium">{uiText.generateMusic}:</span> {requiresLyricsDraft ? (isSpanish ? 'usa la letra guardada para lanzar la generación real en Suno y guarda el audio en Media Library.' : 'uses the saved lyrics draft to start real Suno audio generation and stores it in Media Library.') : (isSpanish ? 'lanza la generación real de audio y la guarda en Media Library.' : 'submits real audio generation job and saves result to Media Library.')}</p>
        {requiresLyricsDraft ? (
          <p><span className="text-gray-200 font-medium">{uiText.generateLyrics}:</span> {isSpanish ? 'genera/refina solo la letra; luego Generar música usará esa letra guardada.' : 'creates/refines lyrics only; Generate Music will then use that saved lyrics draft.'}</p>
        ) : null}
        {requiresLyricsDraft && !hasLyricsDraft ? (
          <p className="text-amber-300">{uiText.lyricsRequired}</p>
        ) : null}
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
            <h4 className="font-semibold text-purple-200">{uiText.previewTitle}</h4>
            <span className="text-xs text-purple-300">{preview.type}</span>
          </div>

          {/* Extracted Elements */}
          {preview.elements && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-purple-300">{uiText.keyPhrases}</p>
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
                  <p className="text-xs uppercase tracking-widest text-purple-300 mb-1">{uiText.verse1}</p>
                  {preview.lyrics.verse1.map((line: string, idx: number) => (
                    <p key={idx} className="text-sm text-gray-200">
                      {line}
                    </p>
                  ))}
                </div>
              )}

              {preview.lyrics.chorus?.length > 0 && (
                <div className="border-l-2 border-purple-400 pl-3">
                  <p className="text-xs uppercase tracking-widest text-purple-300 mb-1">{uiText.chorus}</p>
                  {preview.lyrics.chorus.map((line: string, idx: number) => (
                    <p key={idx} className="text-sm font-medium text-purple-100">
                      {line}
                    </p>
                  ))}
                </div>
              )}

              {preview.lyrics.verse2?.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-purple-300 mb-1">{uiText.verse2}</p>
                  {preview.lyrics.verse2.map((line: string, idx: number) => (
                    <p key={idx} className="text-sm text-gray-200">
                      {line}
                    </p>
                  ))}
                </div>
              )}

              {preview.lyrics.bridge?.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest text-purple-300 mb-1">{uiText.bridge}</p>
                  {preview.lyrics.bridge.map((line: string, idx: number) => (
                    <p key={idx} className="text-sm text-gray-200">
                      {line}
                    </p>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-purple-400/20">
                <p className="text-xs text-purple-300">{uiText.sunoPrompt}:</p>
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
