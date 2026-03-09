'use client'

import { useState } from 'react'
import { Video, Loader2 } from 'lucide-react'
import { slidesApi } from '@/lib/slides-api'

interface VideoGenerationPanelProps {
  workspaceId: string
  sermonId?: string
  token: string
  onGenerated?: () => void
}

export default function VideoGenerationPanel({ 
  workspaceId, 
  sermonId,
  token,
  onGenerated 
}: VideoGenerationPanelProps) {
  const [deckId, setDeckId] = useState('')
  const [audioId, setAudioId] = useState('')
  const [resolution, setResolution] = useState('1920x1080')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolutions = [
    { value: '1920x1080', label: '1080p (Full HD)' },
    { value: '1280x720', label: '720p (HD)' },
    { value: '3840x2160', label: '4K (Ultra HD)' },
  ]

  const handleGenerate = async () => {
    if (!deckId && !audioId) {
      setError('Please select at least a slide deck or audio track')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      await slidesApi.generateVideo(
        {
          workspaceId,
          sermonId,
          deckId: deckId || undefined,
          audioId: audioId || undefined,
          resolution,
        },
        token
      )

      setDeckId('')
      setAudioId('')
      onGenerated?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate video')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="border border-white/10 rounded-xl p-6 bg-black/20 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Video className="w-6 h-6 text-pink-300" />
        <h3 className="text-lg font-semibold">Generate Video</h3>
      </div>

      <div className="border border-blue-400/40 bg-blue-500/10 text-blue-100 text-sm rounded-xl px-4 py-3">
        <p className="font-medium mb-1">Video Composition</p>
        <p className="text-xs text-blue-200/80">
          Combines your slide deck with audio narration or background music into a video file
        </p>
      </div>

      {/* Deck Selection */}
      <div>
        <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
          Slide Deck (Optional)
        </label>
        <input
          type="text"
          value={deckId}
          onChange={(e) => setDeckId(e.target.value)}
          placeholder="Enter deck ID or leave empty"
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
          disabled={generating}
        />
        <p className="text-xs text-gray-500 mt-1">
          Generate slides first, then use the deck ID here
        </p>
      </div>

      {/* Audio Selection */}
      <div>
        <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
          Audio Track (Optional)
        </label>
        <input
          type="text"
          value={audioId}
          onChange={(e) => setAudioId(e.target.value)}
          placeholder="Enter audio ID or leave empty"
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
          disabled={generating}
        />
        <p className="text-xs text-gray-500 mt-1">
          Generate audio first, then use the audio ID here
        </p>
      </div>

      {/* Resolution Selection */}
      <div>
        <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
          Video Resolution
        </label>
        <select
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
        >
          {resolutions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
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
        disabled={generating || (!deckId && !audioId)}
        className="w-full cyber-button text-sm px-4 py-3 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Composing Video...
          </>
        ) : (
          <>
            <Video className="w-4 h-4" />
            Generate Video
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Video composition may take several minutes
      </p>
    </div>
  )
}
