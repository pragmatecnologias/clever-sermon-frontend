'use client'

import { useState, useEffect } from 'react'
import { Mic, Loader2 } from 'lucide-react'
import { slidesApi } from '@/lib/slides-api'

interface AudioGenerationPanelProps {
  workspaceId: string
  sermonId?: string
  workspace: any
  token: string
  autoText?: string
  narrationPrompt?: string
  narrationPromptOptions?: Array<{ id: string; label: string; description?: string; prompt: string }>
  onGenerated?: () => void
}

export default function AudioGenerationPanel({ 
  workspaceId, 
  sermonId, 
  workspace,
  token,
  narrationPrompt,
  narrationPromptOptions = [],
  onGenerated 
}: AudioGenerationPanelProps) {
  const [provider, setProvider] = useState<'local' | 'elevenlabs'>('local')
  const [source, setSource] = useState<'manuscript' | 'scripture' | 'custom'>('manuscript')
  const [text, setText] = useState('')
  const [voiceId, setVoiceId] = useState('')
  const [voices, setVoices] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPromptOption, setSelectedPromptOption] = useState<string>('')

  const stripNarrationMarkup = (value: string) =>
    String(value || '')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<\/?[^>]+>/g, ' ')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim()

  const getVoiceValue = (voice: any) => String(voice?.voice_id || voice?.id || voice?.name || '')
  const getVoiceName = (voice: any) => String(voice?.name || voice?.id || voice?.voice_id || 'Voice')

  useEffect(() => {
    loadVoices(provider)
  }, [provider])

  useEffect(() => {
    if (source === 'manuscript') {
      const manuscriptText = workspace.manuscripts?.[0]?.content?.text || ''
      setText(stripNarrationMarkup(manuscriptText))
    } else if (source === 'scripture') {
      const scriptureText = workspace.mainPassage || ''
      setText(stripNarrationMarkup(scriptureText))
    }
  }, [source, workspace])

  useEffect(() => {
    if (!narrationPromptOptions.length) return
    if (selectedPromptOption) return
    setSelectedPromptOption(narrationPromptOptions[0].id)
  }, [narrationPromptOptions, selectedPromptOption])

  const loadVoices = async (nextProvider: 'local' | 'elevenlabs') => {
    try {
      const voicesData = await slidesApi.getVoices(token, nextProvider)
      setVoices(voicesData)
      if (voicesData.length > 0) {
        setVoiceId(getVoiceValue(voicesData[0]))
      }
    } catch (err) {
      console.error('Failed to load voices:', err)
      setVoices([])
      setVoiceId('')
    }
  }

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter text to narrate')
      return
    }

    setGenerating(true)
    setError(null)

    const selectedPromptText =
      narrationPromptOptions.find((item) => item.id === selectedPromptOption)?.prompt ||
      narrationPrompt ||
      ''
    try {
      await slidesApi.generateAudio(
        {
          workspaceId,
          sermonId,
          text: stripNarrationMarkup(text),
          voiceId,
          provider,
          narrationPrompt: selectedPromptText.trim() || undefined,
        },
        token
      )

      onGenerated?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate audio')
    } finally {
      setGenerating(false)
    }
  }

  const wordCount = text.trim().split(/\s+/).length
  const estimatedMinutes = Math.ceil(wordCount / 150)

  return (
    <div className="border border-white/10 rounded-xl p-6 bg-black/20 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Mic className="w-6 h-6 text-amber-300" />
        <h3 className="text-lg font-semibold">Generate Audio Narration</h3>
      </div>

      {/* Source Selection */}
      <div>
        <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
          Audio Source
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'manuscript', label: 'Manuscript' },
            { value: 'scripture', label: 'Scripture' },
            { value: 'custom', label: 'Custom Text' },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => setSource(s.value as any)}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                source === s.value
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                  : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
          Provider
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'local', label: 'Local (Docker)' },
            { value: 'elevenlabs', label: 'ElevenLabs' },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setProvider(p.value as 'local' | 'elevenlabs')}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                provider === p.value
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                  : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Selection */}
      {voices.length > 0 && (
        <div>
          <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
            Voice
          </label>
          <select
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
          >
            {voices.map((voice) => (
              <option key={getVoiceValue(voice)} value={getVoiceValue(voice)}>
                {getVoiceName(voice)} ({voice.labels?.gender || 'neutral'})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Text Input */}
      <div>
        {narrationPromptOptions.length ? (
          <div className="mb-3">
            <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
              Suggested Voice Prompt
            </label>
            <select
              value={selectedPromptOption}
              onChange={(e) => setSelectedPromptOption(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
              disabled={generating}
            >
              {narrationPromptOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}{option.description ? ` — ${option.description}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {narrationPrompt?.trim() ? (
          <div className="mb-3 border border-amber-400/30 bg-amber-500/10 rounded-lg px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-amber-200/90 mb-1">Study Narration Prompt</p>
            <p className="text-xs text-amber-100/90 leading-relaxed">{narrationPrompt}</p>
          </div>
        ) : narrationPromptOptions.length ? (
          <div className="mb-3 border border-amber-400/30 bg-amber-500/10 rounded-lg px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-amber-200/90 mb-1">Study Narration Prompt</p>
            <p className="text-xs text-amber-100/90 leading-relaxed">
              {narrationPromptOptions.find((item) => item.id === selectedPromptOption)?.prompt || ''}
            </p>
          </div>
        ) : null}
        <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
          Text to Narrate
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to convert to speech..."
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm min-h-[150px]"
          disabled={generating || source !== 'custom'}
        />
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{wordCount} words</span>
          <span>~{estimatedMinutes} min audio</span>
        </div>
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
        disabled={generating || !text.trim()}
        className="w-full cyber-button text-sm px-4 py-3 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Audio...
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            Generate Audio
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        {provider === 'local' ? 'Powered by local Docker text-to-speech' : 'Powered by ElevenLabs text-to-speech'}
      </p>
    </div>
  )
}
