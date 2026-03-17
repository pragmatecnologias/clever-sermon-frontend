'use client'

import { useEffect, useState } from 'react'
import { Image, Sparkles, Loader2 } from 'lucide-react'
import { slidesApi } from '@/lib/slides-api'
import { buildFallbackImagePrompt, composeImagePrompt, type ImagePromptFields } from '@/lib/media-prompts'

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
  autoPromptFields?: ImagePromptFields
  promptOptions?: Array<{ id: string; label: string; description?: string; prompt: string }>
  onGenerated?: () => void
}

export default function ImageGenerationPanel({ 
  workspaceId, 
  sermonId, 
  workspaceData, 
  token,
  autoPrompt,
  autoPromptFields,
  promptOptions = [],
  onGenerated 
}: ImageGenerationPanelProps) {
  const [prompt, setPrompt] = useState('')
  const [provider, setProvider] = useState<'openai' | 'local'>('openai')
  const [preset, setPreset] = useState('worship')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<ImagePromptFields>(
    autoPromptFields || {
      subject: '',
      environment: '',
      action: '',
      symbolism: '',
      camera: '',
      lighting: '',
      style: '',
      colorPalette: '',
      quality: '',
      negativePrompt: '',
    },
  )
  const [selectedPromptOption, setSelectedPromptOption] = useState<string>('')

  useEffect(() => {
    if (promptOptions.length && !selectedPromptOption) {
      const first = promptOptions[0]
      setSelectedPromptOption(first.id)
      if (!prompt.trim()) {
        setPrompt(first.prompt)
      }
      return
    }
    if (autoPrompt && !prompt.trim()) {
      setPrompt(autoPrompt)
    }
  }, [autoPrompt, prompt, promptOptions, selectedPromptOption])

  useEffect(() => {
    if (autoPromptFields) {
      setFields(autoPromptFields)
    }
  }, [autoPromptFields])

  const presets = [
    { value: 'worship', label: 'Worship' },
    { value: 'biblical', label: 'Biblical Scene' },
    { value: 'modern', label: 'Modern' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'nature', label: 'Nature' },
    { value: 'abstract', label: 'Abstract' },
  ]

  const generateAutoPrompt = () => {
    if (autoPrompt?.trim()) return autoPrompt.trim()
    return buildFallbackImagePrompt({
      theme: workspaceData.theme || 'faith',
      scripture: workspaceData.mainPassage,
      title: workspaceData.title,
    })
  }

  const handleAutoGenerate = () => {
    if (fields.subject || fields.environment || fields.style) {
      setPrompt(composeImagePrompt(fields, false))
      return
    }
    setPrompt(generateAutoPrompt())
  }

  const updateField = (key: keyof ImagePromptFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  const composeFromFields = () => {
    const next = composeImagePrompt(fields, false)
    setPrompt(next)
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
        {promptOptions.length ? (
          <div className="mb-3">
            <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
              Suggested Prompt
            </label>
            <select
              value={selectedPromptOption}
              onChange={(e) => {
                const next = e.target.value
                setSelectedPromptOption(next)
                const match = promptOptions.find((item) => item.id === next)
                if (match?.prompt) setPrompt(match.prompt)
              }}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
              disabled={generating}
            >
              {promptOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}{option.description ? ` — ${option.description}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : null}
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
        <details className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-cyan-200/80">
            Structured Prompt Fields
          </summary>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            {(
              [
                ['subject', 'Subject'],
                ['environment', 'Environment'],
                ['action', 'Action'],
                ['symbolism', 'Symbolism'],
                ['camera', 'Camera'],
                ['lighting', 'Lighting'],
                ['style', 'Style'],
                ['colorPalette', 'Color Palette'],
                ['quality', 'Quality'],
                ['negativePrompt', 'Negative Prompt'],
              ] as Array<[keyof ImagePromptFields, string]>
            ).map(([key, label]) => (
              <label key={key} className="text-[11px] uppercase tracking-widest text-gray-400">
                {label}
                <input
                  value={fields[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                  className="mt-1 w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-100 normal-case tracking-normal"
                  disabled={generating}
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={composeFromFields}
            className="mt-3 cyber-outline text-xs px-3 py-2 rounded-full"
            disabled={generating}
          >
            Compose Prompt
          </button>
        </details>
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
