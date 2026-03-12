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
  const [source, setSource] = useState<'manuscript' | 'scripture' | 'custom'>('manuscript')
  const [text, setText] = useState('')
  const [voiceId, setVoiceId] = useState('')
  const [voices, setVoices] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPromptOption, setSelectedPromptOption] = useState<string>('')

  useEffect(() => {
    loadVoices()
  }, [])

  useEffect(() => {
    if (source === 'manuscript') {
      const manuscriptText = workspace.manuscripts?.[0]?.content?.text || ''
      // Strip markdown formatting for clean display
      const cleanText = manuscriptText
        .replace(/\*\*/g, '') // Remove bold markers
        .replace(/\*/g, '')   // Remove italic markers
        .replace(/#{1,6}\s/g, '') // Remove heading markers
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to plain text
      setText(cleanText)
    } else if (source === 'scripture') {
      const scriptureText = workspace.mainPassage || ''
      setText(scriptureText)
    }
  }, [source, workspace])

  useEffect(() => {
    if (!narrationPromptOptions.length) return
    if (selectedPromptOption) return
    setSelectedPromptOption(narrationPromptOptions[0].id)
  }, [narrationPromptOptions, selectedPromptOption])

  const loadVoices = async () => {
    try {
      const voicesData = await slidesApi.getVoices(token)
      setVoices(voicesData)
      if (voicesData.length > 0) {
        setVoiceId(voicesData[0].voice_id)
      }
    } catch (err) {
      console.error('Failed to load voices:', err)
    }
  }

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter text to narrate')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      await slidesApi.generateAudio(
        {
          workspaceId,
          sermonId,
          text: text.trim(),
          voiceId,
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
              <option key={voice.voice_id} value={voice.voice_id}>
                {voice.name} ({voice.labels?.gender || 'neutral'})
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
        Powered by ElevenLabs text-to-speech
      </p>
    </div>
  )
}
