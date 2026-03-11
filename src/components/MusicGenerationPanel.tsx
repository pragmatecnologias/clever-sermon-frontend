'use client'

import { useState, useEffect } from 'react'
import { Music, Loader2, Sparkles } from 'lucide-react'
import { slidesApi } from '@/lib/slides-api'

interface MusicGenerationPanelProps {
  workspaceId: string
  sermonId?: string
  workspace: any
  token: string
  autoPrompt?: string
  onGenerated?: () => void
}

export default function MusicGenerationPanel({ 
  workspaceId, 
  sermonId, 
  workspace,
  token,
  autoPrompt,
  onGenerated 
}: MusicGenerationPanelProps) {
  const [prompt, setPrompt] = useState('')
  const [genre, setGenre] = useState('worship')
  const [duration, setDuration] = useState(180)
  const [genres, setGenres] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadGenres()
  }, [])

  useEffect(() => {
    if (autoPrompt && !prompt.trim()) {
      setPrompt(autoPrompt)
    }
  }, [autoPrompt, prompt])

  const loadGenres = async () => {
    try {
      const genresData = await slidesApi.getGenres(token)
      setGenres(genresData)
      if (genresData.length > 0) {
        setGenre(genresData[0])
      }
    } catch (err) {
      console.error('Failed to load genres:', err)
      setGenres(['worship', 'ambient', 'cinematic', 'uplifting'])
    }
  }

  const generateAutoPrompt = () => {
    if (autoPrompt?.trim()) return autoPrompt.trim()
    const tone = workspace.metadata?.tone || 'encouraging'
    const theme = workspace.theme || 'faith'
    
    return `${tone} worship background music for sermon about ${theme}, instrumental, piano and strings, peaceful atmosphere`
  }

  const handleAutoGenerate = () => {
    setPrompt(generateAutoPrompt())
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt or use auto-generate')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      await slidesApi.generateMusic(
        {
          workspaceId,
          sermonId,
          prompt: prompt.trim(),
          genre,
          durationSeconds: duration,
        },
        token
      )

      setPrompt('')
      onGenerated?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate music')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="border border-white/10 rounded-xl p-6 bg-black/20 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Music className="w-6 h-6 text-green-300" />
        <h3 className="text-lg font-semibold">Generate Background Music</h3>
      </div>

      {/* Genre Selection */}
      <div>
        <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
          Genre
        </label>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
        >
          {genres.map((g) => (
            <option key={g} value={g}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Duration Selection */}
      <div>
        <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
          Duration: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[30, 60, 180, 300].map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                duration === d
                  ? 'bg-green-500/20 text-green-200 border border-green-400/40'
                  : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
              }`}
            >
              {d < 60 ? `${d}s` : `${d / 60}min`}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs uppercase tracking-widest text-gray-400">
            Music Prompt
          </label>
          <button
            onClick={handleAutoGenerate}
            className="text-xs text-green-300 hover:text-green-200 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            Auto-generate
          </button>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the music you want to generate..."
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm min-h-[100px]"
          disabled={generating}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="border border-red-400/40 bg-red-500/10 text-red-100 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating || !prompt.trim()}
        className="w-full cyber-button text-sm px-4 py-3 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Music...
          </>
        ) : (
          <>
            <Music className="w-4 h-4" />
            Generate Music
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Powered by Suno AI music generation
      </p>
    </div>
  )
}
