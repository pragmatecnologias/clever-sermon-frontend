'use client'

import { useState } from 'react'
import { Image, Sparkles, Loader2 } from 'lucide-react'
import { slidesApi } from '@/lib/slides-api'

interface ImageGenerationPanelProps {
  workspaceId: string
  sermonId?: string
  workspaceData: {
    title: string
    theme?: string
    mainPassage: string
  }
  token: string
  autoPrompt?: string
  onGenerated?: () => void
}

export default function ImageGenerationPanel({ 
  workspaceId, 
  sermonId, 
  workspaceData, 
  token,
  onGenerated 
}: ImageGenerationPanelProps) {
  const [prompt, setPrompt] = useState('')
  const [provider, setProvider] = useState<'openai' | 'local'>('openai')
  const [preset, setPreset] = useState('worship')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const presets = [
    { value: 'worship', label: 'Worship' },
    { value: 'biblical', label: 'Biblical Scene' },
    { value: 'modern', label: 'Modern' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'nature', label: 'Nature' },
    { value: 'abstract', label: 'Abstract' },
  ]

  const generateAutoPrompt = () => {
    const theme = workspaceData.theme || 'faith'
    const scripture = workspaceData.mainPassage
    const title = workspaceData.title
    
    return `Create a cinematic worship image representing ${theme}. Biblical context: ${scripture}. Sermon title: "${title}". Church setting, inspirational, no text on image.`
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
      await slidesApi.generateImage(
        {
          workspaceId,
          sermonId,
          prompt: prompt.trim(),
          provider,
          preset,
        },
        token
      )

      setPrompt('')
      onGenerated?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate image')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="border border-white/10 rounded-xl p-6 bg-black/20 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Image className="w-6 h-6 text-cyan-300" />
        <h3 className="text-lg font-semibold">Generate Image</h3>
      </div>

      {/* Provider Selection */}
      <div>
        <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
          AI Provider
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setProvider('openai')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm transition-all ${
              provider === 'openai'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
            }`}
          >
            OpenAI DALL-E 3
          </button>
          <button
            onClick={() => setProvider('local')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm transition-all ${
              provider === 'local'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
            }`}
          >
            Stable Diffusion
          </button>
        </div>
      </div>

      {/* Style Preset */}
      <div>
        <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
          Style Preset
        </label>
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
        >
          {presets.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Prompt */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs uppercase tracking-widest text-gray-400">
            Image Prompt
          </label>
          <button
            onClick={handleAutoGenerate}
            className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            Auto-generate
          </button>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
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
            Generating Image...
          </>
        ) : (
          <>
            <Image className="w-4 h-4" />
            Generate Image
          </>
        )}
      </button>

      {provider === 'openai' && (
        <p className="text-xs text-gray-500 text-center">
          ~$0.04-0.08 per image with DALL-E 3
        </p>
      )}
    </div>
  )
}
