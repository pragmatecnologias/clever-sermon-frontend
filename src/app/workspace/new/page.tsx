'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import {
  SERMON_STYLE_OPTIONS,
  MESSAGE_FLOW_OPTIONS,
  LANGUAGE_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  MINISTRY_MODE_OPTIONS,
  APPEAL_STYLE_OPTIONS,
  BILINGUAL_SUPPORT_OPTIONS,
  TARGET_LENGTH_OPTIONS,
  isPropheticPassage,
  normalizeLegacyValue,
  labelForValue,
} from '@/constants/workspace-form-options'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1'

type FieldErrors = {
  title?: string
  mainPassage?: string
  targetLengthMinutes?: string
}

type FormData = {
  title: string
  seriesTitle: string
  mainPassage: string
  additionalPassages: string
  style: string
  storyArc: string
  language: string
  theme: string
  audienceProfile: string
  sermonGoals: string
  egwEnabled: boolean
  sermonDate: string
  targetLengthMinutes: string
  serviceType: string
  appealStyle: string
  ministryMode: string
  bilingualMode: string
}

const TARGET_LENGTH_PRESETS = [10, 20, 25, 30, 35, 45, 60]

export default function NewWorkspacePage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    title: '',
    seriesTitle: '',
    mainPassage: '',
    additionalPassages: '',
    style: '',
    storyArc: '',
    language: 'en',
    theme: '',
    audienceProfile: '',
    sermonGoals: '',
    egwEnabled: false,
    sermonDate: '',
    targetLengthMinutes: '',
    serviceType: '',
    appealStyle: '',
    ministryMode: '',
    bilingualMode: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [detectedProphetic, setDetectedProphetic] = useState(false)
  const [propheticLocked, setPropheticLocked] = useState(false)

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))

    // When prophetic passage is detected and user hasn't manually selected ministryMode yet,
    // default ministryMode to prophetic. But if they already manually selected something else, don't override.
    if (field === 'mainPassage' && typeof value === 'string') {
      const prophetic = isPropheticPassage(value)
      setDetectedProphetic(prophetic)
      if (prophetic && !formData.ministryMode) {
        setFormData((current) => ({ ...current, ministryMode: 'prophetic' }))
        setPropheticLocked(true)
      } else if (!prophetic) {
        setPropheticLocked(false)
      }
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (loading) return

    setError('')
    setFieldErrors({})

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const title = formData.title.trim()
    const mainPassage = formData.mainPassage.trim()
    const nextFieldErrors: FieldErrors = {}

    if (!title) nextFieldErrors.title = 'Enter a sermon title.'
    if (!mainPassage) nextFieldErrors.mainPassage = 'Enter the main passage for this sermon.'

    const targetMinutes = formData.targetLengthMinutes ? Number(formData.targetLengthMinutes) : undefined
    if (formData.targetLengthMinutes && (!targetMinutes || targetMinutes < 1)) {
      nextFieldErrors.targetLengthMinutes = 'Target length must be a positive number.'
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      setError('Fix the highlighted fields to continue.')
      return
    }

    setLoading(true)

    try {
      // Normalize snake_case fields for backend compatibility
      const normalizedStyle = formData.style || undefined
      const normalizedStoryArc = formData.storyArc || undefined
      const normalizedServiceType = formData.serviceType || undefined
      const normalizedAppealStyle = formData.appealStyle || undefined
      const normalizedMinistryMode = formData.ministryMode || undefined
      const normalizedBilingualMode = formData.bilingualMode || undefined

      // Determine guardrail mode
      const isProphetic = isPropheticPassage(mainPassage)
      const guardrailMode =
        isProphetic || normalizedMinistryMode === 'prophetic' ? 'prophetic_adventist' : undefined

      // If prophetic passage detected but user already chose a different ministryMode, still use prophetic_adventist if prophetic passage
      const effectiveGuardrailMode = guardrailMode

      // Validate bilingual: if language is es, don't default to english_support_notes
      let effectiveBilingualMode = normalizedBilingualMode
      if (formData.language === 'es' && effectiveBilingualMode === 'english_support_notes') {
        effectiveBilingualMode = undefined
      }

      const payload = {
        title,
        seriesTitle: formData.seriesTitle.trim() || undefined,
        mainPassage,
        additionalPassages: formData.additionalPassages
          ? formData.additionalPassages
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined,
        theme: formData.theme.trim() || undefined,
        audienceProfile: formData.audienceProfile.trim() || undefined,
        sermonGoals: formData.sermonGoals.trim() || undefined,
        theologicalLens: 'adventist',
        style: normalizedStyle || undefined,
        storyArc: normalizedStoryArc || undefined,
        language: formData.language || 'en',
        egwEnabled: formData.egwEnabled,
        metadata: {
          planning: {
            sermonDate: formData.sermonDate || undefined,
            targetLengthMinutes: targetMinutes,
            serviceType: normalizedServiceType || undefined,
            appealStyle: normalizedAppealStyle || undefined,
            ministryMode: normalizedMinistryMode || undefined,
            bilingualMode: effectiveBilingualMode || undefined,
          },
          guardrailMode: effectiveGuardrailMode,
        },
      }

      const response = await axios.post(`${API_URL}/workspaces`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const workspaceId = response.data?.id || response.data?.workspace?.id
      if (!workspaceId) {
        throw new Error('Workspace created but the server did not return an id.')
      }

      router.push(`/workspace/${workspaceId}`)
    } catch (err: any) {
      console.error('Workspace creation failed:', err)
      const serverMessage = err?.response?.data?.message
      setError(serverMessage || err?.message || 'Failed to create workspace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">Clever Sermon</p>
            <h1 className="text-2xl font-bold text-white">New Workspace</h1>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-full px-4 py-2 text-xs cyber-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
          >
            Back to dashboard
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl rounded-2xl p-8 cyber-panel">
          <h2 className="mb-6 text-3xl font-bold text-white">Create New Workspace</h2>

          <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">What this does</p>
            <p className="mt-2 text-sm text-gray-200/85">
              Defines the sermon context. After you save, open Scripture to start reading the passage and continue through the guided flow.
            </p>
          </div>

          {error ? (
            <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert" aria-live="polite">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* ============================================ */}
            {/* SECTION 1: SERMON BASICS */}
            {/* ============================================ */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-white">Sermon Basics</h3>

              <div>
                <label htmlFor="workspace-title" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                  Title <span className="text-red-300">*</span>
                </label>
                <p id="workspace-title-help" className="mb-2 text-xs text-gray-400">
                  A short, recognizable name for this sermon.
                </p>
                <input
                  id="workspace-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                  aria-describedby="workspace-title-help workspace-title-error"
                  aria-invalid={Boolean(fieldErrors.title)}
                  autoFocus
                />
                {fieldErrors.title ? (
                  <p id="workspace-title-error" className="mt-2 text-sm text-red-300" role="alert">
                    {fieldErrors.title}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="workspace-series-title" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                  Series Title <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  id="workspace-series-title"
                  type="text"
                  value={formData.seriesTitle}
                  onChange={(e) => updateField('seriesTitle', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                  placeholder="e.g., Summer Revival Series"
                />
              </div>

              <div>
                <label htmlFor="workspace-main-passage" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                  Main Passage <span className="text-red-300">*</span>
                </label>
                <p id="workspace-main-passage-help" className="mb-2 text-xs text-gray-400">
                  The primary scripture passage this sermon is built around.
                </p>
                <input
                  id="workspace-main-passage"
                  type="text"
                  value={formData.mainPassage}
                  onChange={(e) => updateField('mainPassage', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                  aria-describedby="workspace-main-passage-help workspace-main-passage-error"
                  aria-invalid={Boolean(fieldErrors.mainPassage)}
                  placeholder="e.g., John 3:16"
                />
                {fieldErrors.mainPassage ? (
                  <p id="workspace-main-passage-error" className="mt-2 text-sm text-red-300" role="alert">
                    {fieldErrors.mainPassage}
                  </p>
                ) : null}
                {detectedProphetic ? (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                    <div>
                      <p className="text-sm font-medium text-amber-200">
                        Prophetic / Adventist Guardrail recommended
                      </p>
                      <p className="mt-1 text-xs text-amber-200/80">
                        This passage matches prophetic Adventist themes. Ministry Mode will default to Prophetic / Adventist and enhanced guardrails will be applied.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div>
                <label htmlFor="workspace-additional-passages" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                  Additional Passages <span className="text-gray-500">(optional)</span>
                </label>
                <p id="workspace-additional-passages-help" className="mb-2 text-xs text-gray-400">
                  Supporting passages, comma-separated.
                </p>
                <input
                  id="workspace-additional-passages"
                  type="text"
                  value={formData.additionalPassages}
                  onChange={(e) => updateField('additionalPassages', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                  placeholder="e.g., Romans 5:8, Philippians 4:13"
                />
              </div>

              <div>
                <label htmlFor="workspace-language" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                  Language
                </label>
                <select
                  id="workspace-language"
                  value={formData.language}
                  onChange={(e) => updateField('language', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                  Theological Lens
                </label>
                <div className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-gray-100/90">
                  Adventist (fixed)
                </div>
              </div>
            </div>

            {/* ============================================ */}
            {/* SECTION 2: SERMON DIRECTION */}
            {/* ============================================ */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-white">Sermon Direction</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="workspace-style" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                    Style
                  </label>
                  <p id="workspace-style-help" className="mb-2 text-xs text-gray-400">
                    How the sermon is structured around the scripture.
                  </p>
                  <select
                    id="workspace-style"
                    value={formData.style}
                    onChange={(e) => updateField('style', e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                    aria-describedby="workspace-style-help"
                  >
                    <option value="">Select style</option>
                    {SERMON_STYLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {formData.style && (
                    <p className="mt-2 text-xs text-gray-400">
                      {SERMON_STYLE_OPTIONS.find((o) => o.value === formData.style)?.description}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="workspace-message-flow" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                    Message Flow
                  </label>
                  <p id="workspace-message-flow-help" className="mb-2 text-xs text-gray-400">
                    The movement or arc of the message.
                  </p>
                  <select
                    id="workspace-message-flow"
                    value={formData.storyArc}
                    onChange={(e) => updateField('storyArc', e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                    aria-describedby="workspace-message-flow-help"
                  >
                    <option value="">Select message flow</option>
                    {MESSAGE_FLOW_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {formData.storyArc && (
                    <p className="mt-2 text-xs text-gray-400">
                      {MESSAGE_FLOW_OPTIONS.find((o) => o.value === formData.storyArc)?.description}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="workspace-theme" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                  Theme <span className="text-gray-500">(optional)</span>
                </label>
                <p id="workspace-theme-help" className="mb-2 text-xs text-gray-400">
                  Central idea or topic the sermon addresses.
                </p>
                <input
                  id="workspace-theme"
                  type="text"
                  value={formData.theme}
                  onChange={(e) => updateField('theme', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                  placeholder="e.g., Grace, repentance, end-times hope"
                />
              </div>

              <div>
                <label htmlFor="workspace-audience" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                  Audience Profile <span className="text-gray-500">(optional)</span>
                </label>
                <p id="workspace-audience-help" className="mb-2 text-xs text-gray-400">
                  Who this sermon is primarily for.
                </p>
                <input
                  id="workspace-audience"
                  type="text"
                  value={formData.audienceProfile}
                  onChange={(e) => updateField('audienceProfile', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                  placeholder="e.g., Young adults, families, mixed congregation"
                />
              </div>

              <div>
                <label htmlFor="workspace-goals" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                  Sermon Goals <span className="text-gray-500">(optional)</span>
                </label>
                <p id="workspace-goals-help" className="mb-2 text-xs text-gray-400">
                  What you want to accomplish with this sermon.
                </p>
                <textarea
                  id="workspace-goals"
                  value={formData.sermonGoals}
                  onChange={(e) => updateField('sermonGoals', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                  rows={3}
                  placeholder="What do you want people to understand, feel, or do after hearing this sermon?"
                />
              </div>
            </div>

            {/* ============================================ */}
            {/* SECTION 3: DELIVERY CONTEXT */}
            {/* ============================================ */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-white">Delivery Context</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="workspace-service-type" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                    Service Type
                  </label>
                  <p id="workspace-service-type-help" className="mb-2 text-xs text-gray-400">
                    The worship or ministry setting.
                  </p>
                  <select
                    id="workspace-service-type"
                    value={formData.serviceType}
                    onChange={(e) => updateField('serviceType', e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                    aria-describedby="workspace-service-type-help"
                  >
                    <option value="">Select service type</option>
                    {SERVICE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {formData.serviceType && (
                    <p className="mt-2 text-xs text-gray-400">
                      {SERVICE_TYPE_OPTIONS.find((o) => o.value === formData.serviceType)?.description}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="workspace-ministry-mode" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                    Ministry Mode
                  </label>
                  <p id="workspace-ministry-mode-help" className="mb-2 text-xs text-gray-400">
                    The primary focus or emphasis of the message.
                  </p>
                  <select
                    id="workspace-ministry-mode"
                    value={formData.ministryMode}
                    onChange={(e) => updateField('ministryMode', e.target.value)}
                    disabled={propheticLocked}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 disabled:opacity-60"
                    aria-describedby="workspace-ministry-mode-help"
                  >
                    <option value="">Select ministry mode</option>
                    {MINISTRY_MODE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {formData.ministryMode && (
                    <p className="mt-2 text-xs text-gray-400">
                      {MINISTRY_MODE_OPTIONS.find((o) => o.value === formData.ministryMode)?.description}
                    </p>
                  )}
                  {propheticLocked && (
                    <p className="mt-2 text-xs text-amber-300">
                      Set automatically based on prophetic passage detection.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="workspace-appeal-style" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                  Appeal Style
                </label>
                <p id="workspace-appeal-style-help" className="mb-2 text-xs text-gray-400">
                  How you want listeners to respond.
                </p>
                <select
                  id="workspace-appeal-style"
                  value={formData.appealStyle}
                  onChange={(e) => updateField('appealStyle', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                  aria-describedby="workspace-appeal-style-help"
                >
                  <option value="">Select appeal style</option>
                  {APPEAL_STYLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {formData.appealStyle && (
                  <p className="mt-2 text-xs text-gray-400">
                    {APPEAL_STYLE_OPTIONS.find((o) => o.value === formData.appealStyle)?.description}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="workspace-bilingual-mode" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                  Bilingual Support
                </label>
                <p id="workspace-bilingual-mode-help" className="mb-2 text-xs text-gray-400">
                  Level of bilingual content for bilingual congregations.
                </p>
                <select
                  id="workspace-bilingual-mode"
                  value={formData.bilingualMode}
                  onChange={(e) => updateField('bilingualMode', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                  aria-describedby="workspace-bilingual-mode-help"
                >
                  <option value="">Select bilingual support</option>
                  {BILINGUAL_SUPPORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {formData.bilingualMode && (
                  <p className="mt-2 text-xs text-gray-400">
                    {BILINGUAL_SUPPORT_OPTIONS.find((o) => o.value === formData.bilingualMode)?.description}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="workspace-sermon-date" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                  Sermon Date <span className="text-gray-500">(optional)</span>
                </label>
                <p id="workspace-sermon-date-help" className="mb-2 text-xs text-gray-400">
                  When this sermon will be delivered.
                </p>
                <input
                  id="workspace-sermon-date"
                  type="date"
                  value={formData.sermonDate}
                  onChange={(e) => updateField('sermonDate', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                />
              </div>

              <div>
                <label htmlFor="workspace-target-length" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                  Target Length <span className="text-gray-500">(minutes)</span>
                </label>
                <p id="workspace-target-length-help" className="mb-2 text-xs text-gray-400">
                  Desired sermon length. Quick-select or enter a custom value.
                </p>
                <input
                  id="workspace-target-length"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={formData.targetLengthMinutes}
                  onChange={(e) => updateField('targetLengthMinutes', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                  aria-describedby="workspace-target-length-help workspace-target-length-error"
                  aria-invalid={Boolean(fieldErrors.targetLengthMinutes)}
                />
                {fieldErrors.targetLengthMinutes ? (
                  <p id="workspace-target-length-error" className="mt-2 text-sm text-red-300" role="alert">
                    {fieldErrors.targetLengthMinutes}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  {TARGET_LENGTH_PRESETS.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => updateField('targetLengthMinutes', String(minutes))}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        formData.targetLengthMinutes === String(minutes)
                          ? 'border-cyan-300/60 bg-cyan-500/15 text-cyan-100'
                          : 'border-white/10 bg-black/20 text-gray-200 hover:bg-white/5'
                      }`}
                    >
                      {minutes}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ============================================ */}
            {/* SECTION 4: STUDY GUARDRAILS */}
            {/* ============================================ */}
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-white">Study Guardrails</h3>

              <div>
                <label className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={formData.egwEnabled}
                    onChange={(e) => updateField('egwEnabled', e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-black/40 text-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                  />
                  <span>
                    <span className="block text-sm text-white">Enable EGW Support</span>
                    <span className="block text-xs text-gray-300">
                      Include Ellen G. White writings in study, outline, and manuscript generation.
                    </span>
                  </span>
                </label>
              </div>

              {detectedProphetic && (
                <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3">
                  <p className="text-sm font-medium text-amber-200">
                    Prophetic / Adventist Guardrail Active
                  </p>
                  <p className="mt-1 text-xs text-amber-200/80">
                    This passage has been detected as prophetic Adventist content. Enhanced theological guardrails are applied and Ellen G. White support is recommended.
                  </p>
                </div>
              )}
            </div>

            {/* SUBMIT / CANCEL */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-full px-6 py-3 cyber-button disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
              >
                {loading ? 'Creating...' : 'Create Workspace'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="rounded-full px-6 py-3 cyber-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}