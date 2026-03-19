'use client'

import { useState, useEffect } from 'react'
import { Mic, Loader2 } from 'lucide-react'
import { slidesApi } from '@/lib/slides-api'
import {
  clampNarrationText,
  MAX_NARRATION_CHARACTERS,
  sanitizeNarrationText,
} from '@/lib/media-prompts'

interface AudioGenerationPanelProps {
  workspaceId: string
  sermonId?: string
  workspace: any
  token: string
  autoText?: string
  narrationPrompt?: string
  narrationPromptOptions?: Array<{ id: string; label: string; description?: string; prompt: string }>
  onQueued?: (payload: { id: string; type: 'audio'; status: 'pending'; createdAt: string }) => void
  onGenerated?: () => void
}

export default function AudioGenerationPanel({ 
  workspaceId, 
  sermonId, 
  workspace,
  token,
  autoText,
  narrationPrompt,
  narrationPromptOptions = [],
  onQueued,
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
  const [voiceManuallySelected, setVoiceManuallySelected] = useState(false)

  const narrationKeyPoints = (
    Array.isArray(workspace?.outlines?.[0]?.structure?.pointNodes)
      ? workspace.outlines[0].structure.pointNodes
      : Array.isArray(workspace?.outlines?.[0]?.structure?.points)
      ? workspace.outlines[0].structure.points
      : []
  )
    .map((item: any) => item?.title || item?.pointTitle || item?.summary || item?.content || item?.text || item)
    .map((item: any) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 6)

  const narrationApplications = (Array.isArray(workspace?.applications) ? workspace.applications : [])
    .map((item: any) => item?.content || item?.text || item?.application || item)
    .map((item: any) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 4)

  const getVoiceValue = (voice: any) => String(voice?.voice_id || voice?.id || voice?.name || '')
  const getVoiceName = (voice: any) => String(voice?.name || voice?.id || voice?.voice_id || 'Voice')

  const isLikelySpanishText = (value: string) => {
    const normalized = String(value || '').toLowerCase()
    if (!normalized.trim()) return false
    return (
      /[áéíóúñü¿¡]/i.test(normalized) ||
      /\b(el|la|los|las|de|que|para|con|por|una|uno|este|esta|cristo|dios|gracia|salvación|iglesia)\b/i.test(normalized)
    )
  }

  useEffect(() => {
    if (source === 'custom') return

    let active = true
    const hydrateNarration = async () => {
      const generated = await requestGeneratedNarration({
        sourceType: source,
      })
      if (!active) return
      setText(generated)
    }

    hydrateNarration()
    return () => {
      active = false
    }
  }, [
    source,
    workspace,
    narrationPrompt,
    narrationKeyPoints,
    narrationApplications,
    autoText,
    token,
  ])

  const isSpanishVoice = (voice: any) => {
    const language = String(voice?.language || voice?.lang || '').toLowerCase()
    const locale = String(voice?.locale || '').toLowerCase()
    const id = getVoiceValue(voice).toLowerCase()
    const name = getVoiceName(voice).toLowerCase()
    if (language === 'es' || language.startsWith('es-') || language.startsWith('es_')) return true
    if (locale.startsWith('es')) return true
    return /(^|[^a-z])es([_-]|$)|spanish|español/.test(`${id} ${name}`)
  }

  const pickPreferredVoiceId = (voicesData: any[], sampleText: string, nextProvider: 'local' | 'elevenlabs') => {
    if (!Array.isArray(voicesData) || voicesData.length === 0) return ''
    const spanishText = isLikelySpanishText(sampleText)
    if (nextProvider === 'local' && spanishText) {
      const spanishVoice = voicesData.find((voice) => isSpanishVoice(voice))
      if (spanishVoice) return getVoiceValue(spanishVoice)
    }
    return getVoiceValue(voicesData[0])
  }

  useEffect(() => {
    setVoiceManuallySelected(false)
    loadVoices(provider)
  }, [provider])

  useEffect(() => {
    if (voiceManuallySelected) return
    if (provider !== 'local') return
    if (!voices.length) return
    if (!isLikelySpanishText(text)) return
    if (voices.some((voice) => getVoiceValue(voice) === voiceId && isSpanishVoice(voice))) return

    const preferredSpanishId = pickPreferredVoiceId(voices, text, provider)
    if (preferredSpanishId) {
      setVoiceId(preferredSpanishId)
    }
  }, [voiceManuallySelected, provider, voices, text, voiceId])

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
        setVoiceId(pickPreferredVoiceId(voicesData, text, nextProvider))
      }
    } catch (err) {
      console.error('Failed to load voices:', err)
      setVoices([])
      setVoiceId('')
    }
  }

  const getSourceText = (nextSource: 'manuscript' | 'scripture' | 'custom') => {
    if (nextSource === 'scripture') {
      return String(workspace.mainPassage || '').trim()
    }
    if (nextSource === 'manuscript') {
      return String(workspace.manuscripts?.[0]?.content?.text || autoText || '').trim()
    }
    return String(text || '').trim()
  }

  const requestGeneratedNarration = async (options: {
    sourceType: 'manuscript' | 'scripture'
    sourceText?: string
    promptOverride?: string
  }) => {
    const sourceText = sanitizeNarrationText(options.sourceText ?? getSourceText(options.sourceType))
    if (!sourceText) return ''

    try {
      const response = await slidesApi.generateNarrationScript(
        {
          language: workspace.language || workspace.metadata?.language || 'en',
          title: workspace.title || 'Untitled Sermon',
          passage: options.sourceType === 'scripture' ? sourceText : workspace.mainPassage || '',
          theme: workspace.theme || workspace.sermonGoals || '',
          manuscript: sourceText,
          keyPoints: narrationKeyPoints,
          applications: narrationApplications,
          narrationPrompt: options.promptOverride || narrationPrompt,
          maxChars: MAX_NARRATION_CHARACTERS,
        },
        token,
      )

      const generated = clampNarrationText(
        sanitizeNarrationText(String(response?.text || '')),
        MAX_NARRATION_CHARACTERS,
      )

      if (generated) return generated
      return clampNarrationText(sourceText, MAX_NARRATION_CHARACTERS)
    } catch (err) {
      console.error('Failed to generate narration script:', err)
      return clampNarrationText(sourceText, MAX_NARRATION_CHARACTERS)
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
    const finalNarrationText =
      source === 'custom'
        ? clampNarrationText(text, MAX_NARRATION_CHARACTERS)
        : await requestGeneratedNarration({
            sourceType: source,
            sourceText: getSourceText(source),
            promptOverride: selectedPromptText || narrationPrompt,
          })

    if (!finalNarrationText.trim()) {
      setError('Please enter text to narrate')
      setGenerating(false)
      return
    }

    if (finalNarrationText !== sanitizeNarrationText(text)) {
      setText(finalNarrationText)
    }

    try {
      const response = await slidesApi.generateAudio(
        {
          workspaceId,
          sermonId,
          text: finalNarrationText,
          voiceId,
          provider,
          narrationPrompt: selectedPromptText.trim() || undefined,
        },
        token
      )

      if (response?.id) {
        onQueued?.({
          id: String(response.id),
          type: 'audio',
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
      }
      onGenerated?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate audio')
    } finally {
      setGenerating(false)
    }
  }

  const normalizedText = sanitizeNarrationText(text)
  const wordCount = normalizedText ? normalizedText.split(/\s+/).length : 0
  const characterCount = normalizedText.length
  const estimatedMinutes = Math.ceil(wordCount / 150)
  const selectedVoice = voices.find((voice) => getVoiceValue(voice) === voiceId)
  const detectedLanguageLabel = !text.trim()
    ? 'Unknown'
    : isLikelySpanishText(text)
    ? 'Spanish'
    : 'English/Other'
  const selectedVoiceLanguageLabel = selectedVoice
    ? isSpanishVoice(selectedVoice)
      ? 'Spanish'
      : 'English/Other'
    : 'Unknown'
  const selectionModeLabel = voiceManuallySelected ? 'Manual' : 'Auto'

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
            onChange={(e) => {
              setVoiceManuallySelected(true)
              setVoiceId(e.target.value)
            }}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
          >
            {voices.map((voice) => (
              <option key={getVoiceValue(voice)} value={getVoiceValue(voice)}>
                {getVoiceName(voice)} ({voice.labels?.gender || 'neutral'})
              </option>
            ))}
          </select>
          <p className="mt-2 text-[11px] text-gray-400">
            Detected language: <span className="text-gray-200">{detectedLanguageLabel}</span> • Voice language:{' '}
            <span className="text-gray-200">{selectedVoiceLanguageLabel}</span> • Selection:{' '}
            <span className="text-gray-200">{selectionModeLabel}</span>
          </p>
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
          <span>{characterCount}/{MAX_NARRATION_CHARACTERS} chars · ~{estimatedMinutes} min audio</span>
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
