'use client'

import { useState, useEffect } from 'react'
import { Music, Sparkles, Loader2, Eye, Play, Download } from 'lucide-react'
import { slidesApi } from '@/lib/slides-api'

interface SermonMusicGeneratorProps {
  workspace: any
  sermonId?: string
  token: string
  suggestedPrompt?: string
  onGenerated?: () => void
}

type SongMode = 'ambient_only' | 'with_lyrics' | 'chorus_only' | 'background_bed'
type MusicStyle = 'worship' | 'acoustic' | 'cinematic' | 'orchestral' | 'piano_prayer' | 'youth_contemporary' | 'choir_inspired' | 'instrumental_ambient'
type UseCase = 'sermon-intro' | 'prayer-reflection' | 'recap-video' | 'youth-promo' | 'closing-appeal' | 'offertory' | 'meditation' | 'theme-song'

export default function SermonMusicGenerator({ workspace, sermonId, token, suggestedPrompt, onGenerated }: SermonMusicGeneratorProps) {
  const [mode, setMode] = useState<SongMode>('with_lyrics')
  const [style, setStyle] = useState<MusicStyle>('worship')
  const [useCase, setUseCase] = useState<UseCase>('theme-song')
  const [duration, setDuration] = useState(180)
  const [previewing, setPreviewing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

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

  const handlePreview = async () => {
    setPreviewing(true)
    setError(null)
    setPreview(null)

    try {
      const previewData = await slidesApi.previewSermonSong({
        sermonId: sermonId!,
        mode,
        style,
        useCase,
      }, token)

      setPreview(previewData)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate preview')
    } finally {
      setPreviewing(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)

    try {
      await slidesApi.generateSermonSong({
        sermonId: sermonId!,
        workspaceId: workspace.id,
        mode,
        style,
        useCase,
        duration,
      }, token)

      onGenerated?.()
      setPreview(null)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate music')
    } finally {
      setGenerating(false)
    }
  }

  const handleQuickGenerate = async (quickMode: SongMode) => {
    setMode(quickMode)
    setGenerating(true)
    setError(null)

    try {
      await slidesApi.generateSermonSong({
        sermonId: sermonId!,
        workspaceId: workspace.id,
        mode: quickMode,
        style: quickMode === 'ambient_only' ? 'instrumental_ambient' : 'worship',
        useCase: quickMode === 'ambient_only' ? 'sermon-intro' : 'theme-song',
        duration: quickMode === 'ambient_only' ? 120 : 180,
      }, token)

      onGenerated?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate music')
    } finally {
      setGenerating(false)
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

      {suggestedPrompt?.trim() ? (
        <div className="border border-purple-400/30 bg-purple-500/10 rounded-xl px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-purple-200/90 mb-1">Study Music Prompt</p>
          <p className="text-xs text-purple-100/90 leading-relaxed">{suggestedPrompt}</p>
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleQuickGenerate('ambient_only')}
          disabled={generating || !sermonId}
          className="cyber-outline px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Quick Ambient
        </button>
        <button
          onClick={() => handleQuickGenerate('with_lyrics')}
          disabled={generating || !sermonId}
          className="cyber-button px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Quick Theme Song
        </button>
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
          disabled={previewing || !sermonId}
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
          disabled={generating || !sermonId}
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
