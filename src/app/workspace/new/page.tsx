'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1'

type FieldErrors = {
  title?: string
  mainPassage?: string
}

const isPropheticPassage = (value: string) => {
  const normalized = String(value || '').toLowerCase()
  return (
    /revelation\s*14(?::\s*6\s*-\s*12)?/.test(normalized) ||
    /revelation\s*(?:12\s*-\s*14|12|13|18)/.test(normalized) ||
    /daniel\s*(?:7|8)/.test(normalized) ||
    /matthew\s*24/.test(normalized) ||
    /exodus\s*20/.test(normalized)
  )
}

export default function NewWorkspacePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    seriesTitle: '',
    mainPassage: '',
    additionalPassages: '',
    theme: '',
    audienceProfile: '',
    sermonGoals: '',
    style: '',
    storyArc: '',
    language: 'en',
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

  const updateField = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((current) => ({ ...current, [field]: value }))
    if (field === 'title') setFieldErrors((current) => ({ ...current, title: undefined }))
    if (field === 'mainPassage') setFieldErrors((current) => ({ ...current, mainPassage: undefined }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (loading) return

    setError('')
    setFieldErrors({})

    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      router.push('/login')
      return
    }

    const title = formData.title.trim()
    const mainPassage = formData.mainPassage.trim()
    const nextFieldErrors: FieldErrors = {}

    if (!title) nextFieldErrors.title = 'Enter a workspace title.'
    if (!mainPassage) nextFieldErrors.mainPassage = 'Enter the main passage for this sermon.'

    if (nextFieldErrors.title || nextFieldErrors.mainPassage) {
      setFieldErrors(nextFieldErrors)
      setError('Fix the highlighted fields to continue.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        title,
        seriesTitle: formData.seriesTitle || undefined,
        mainPassage,
        additionalPassages: formData.additionalPassages
          ? formData.additionalPassages
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined,
        theme: formData.theme || undefined,
        audienceProfile: formData.audienceProfile || undefined,
        sermonGoals: formData.sermonGoals || undefined,
        theologicalLens: 'adventist',
        style: formData.style || undefined,
        storyArc: formData.storyArc || undefined,
        language: formData.language || 'en',
        egwEnabled: formData.egwEnabled,
        metadata: {
          planning: {
            sermonDate: formData.sermonDate || undefined,
            targetLengthMinutes: formData.targetLengthMinutes ? Number(formData.targetLengthMinutes) : undefined,
            serviceType: formData.serviceType || undefined,
            appealStyle: formData.appealStyle || undefined,
            ministryMode: formData.ministryMode || undefined,
            bilingualMode: formData.bilingualMode || undefined,
          },
          guardrailMode: isPropheticPassage(mainPassage) || formData.ministryMode === 'prophetic'
            ? 'prophetic_adventist'
            : undefined,
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

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="workspace-title" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                Title
              </label>
              <p id="workspace-title-help" className="mb-2 text-xs text-gray-400">
                Give the sermon workspace a short, recognizable name.
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
                Series Title (optional)
              </label>
              <input
                id="workspace-series-title"
                type="text"
                value={formData.seriesTitle}
                onChange={(e) => updateField('seriesTitle', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
              />
            </div>

            <div>
              <label htmlFor="workspace-main-passage" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                Main Passage
              </label>
              <p id="workspace-main-passage-help" className="mb-2 text-xs text-gray-400">
                This is the passage that starts the sermon flow.
              </p>
              <input
                id="workspace-main-passage"
                type="text"
                value={formData.mainPassage}
                onChange={(e) => updateField('mainPassage', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                aria-describedby="workspace-main-passage-help workspace-main-passage-error"
                aria-invalid={Boolean(fieldErrors.mainPassage)}
              />
              {fieldErrors.mainPassage ? (
                <p id="workspace-main-passage-error" className="mt-2 text-sm text-red-300" role="alert">
                  {fieldErrors.mainPassage}
                </p>
              ) : null}
              {isPropheticPassage(formData.mainPassage) ? (
                <p className="mt-2 text-xs text-amber-200">
                  Prophetic / Adventist Guardrail Mode will be recommended for this passage.
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="workspace-additional-passages" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                Additional Passages (comma separated)
              </label>
              <input
                id="workspace-additional-passages"
                type="text"
                value={formData.additionalPassages}
                onChange={(e) => updateField('additionalPassages', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                placeholder="e.g., Romans 8:28, Philippians 4:13"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="workspace-style" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                  Style
                </label>
                <select
                  id="workspace-style"
                  value={formData.style}
                  onChange={(e) => updateField('style', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                >
                  <option value="">Select style</option>
                  <option value="expository">Expository</option>
                  <option value="topical">Topical</option>
                  <option value="narrative">Narrative</option>
                  <option value="apologetic">Apologetic</option>
                  <option value="devotional">Devotional</option>
                </select>
              </div>
              <div>
                <label htmlFor="workspace-story-arc" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                  Story Arc
                </label>
                <select
                  id="workspace-story-arc"
                  value={formData.storyArc}
                  onChange={(e) => updateField('storyArc', e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                >
                  <option value="">Select arc</option>
                  <option value="problem_truth_response">Problem - Truth - Response</option>
                  <option value="tension_turn_resolution">Tension - Turn - Resolution</option>
                  <option value="question_discovery_answer">Question - Discovery - Answer</option>
                  <option value="challenge_journey_transformation">Challenge - Journey - Transformation</option>
                </select>
              </div>
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
                <option value="en">English</option>
                <option value="es">Spanish</option>
              </select>
            </div>

            <div>
              <label htmlFor="workspace-theme" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                Theme
              </label>
              <input
                id="workspace-theme"
                type="text"
                value={formData.theme}
                onChange={(e) => updateField('theme', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
              />
            </div>

            <div>
              <label htmlFor="workspace-audience" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                Audience Profile
              </label>
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
                Sermon Goals
              </label>
              <textarea
                id="workspace-goals"
                value={formData.sermonGoals}
                onChange={(e) => updateField('sermonGoals', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                rows={3}
                placeholder="What do you want to accomplish with this sermon?"
              />
            </div>

            <details className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <summary className="cursor-pointer list-none text-sm font-medium text-white focus-visible:outline-none">
                Optional planning fields
              </summary>
              <p className="mt-2 text-xs text-gray-400">
                Optional. Helps tune length, tone, delivery, and bilingual planning without changing the sermon flow.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="workspace-sermon-date" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                    Sermon Date (optional)
                  </label>
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
                    Target Length (minutes)
                  </label>
                  <input
                    id="workspace-target-length"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={formData.targetLengthMinutes}
                    onChange={(e) => updateField('targetLengthMinutes', e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                  />
                </div>
                <div>
                  <label htmlFor="workspace-service-type" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                    Service Type
                  </label>
                  <select
                    id="workspace-service-type"
                    value={formData.serviceType}
                    onChange={(e) => updateField('serviceType', e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                  >
                    <option value="">Select service type</option>
                    <option value="sabbath worship">Sabbath worship</option>
                    <option value="sabbath school">Sabbath School</option>
                    <option value="evangelistic">Evangelistic</option>
                    <option value="teaching">Teaching</option>
                    <option value="devotional">Devotional</option>
                    <option value="youth">Youth</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="workspace-appeal-style" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                    Appeal Style
                  </label>
                  <select
                    id="workspace-appeal-style"
                    value={formData.appealStyle}
                    onChange={(e) => updateField('appealStyle', e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                  >
                    <option value="">Select appeal style</option>
                    <option value="invitation">Invitation</option>
                    <option value="commitment">Commitment</option>
                    <option value="reflection">Reflection</option>
                    <option value="doctrinal clarity">Doctrinal clarity</option>
                    <option value="pastoral encouragement">Pastoral encouragement</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="workspace-ministry-mode" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                    Ministry Mode
                  </label>
                  <select
                    id="workspace-ministry-mode"
                    value={formData.ministryMode}
                    onChange={(e) => updateField('ministryMode', e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                  >
                    <option value="">Select ministry mode</option>
                    <option value="evangelistic">Evangelistic</option>
                    <option value="teaching">Teaching</option>
                    <option value="doctrinal">Doctrinal</option>
                    <option value="pastoral">Pastoral</option>
                    <option value="prophetic">Prophetic</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="workspace-bilingual-mode" className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                    Bilingual Mode
                  </label>
                  <select
                    id="workspace-bilingual-mode"
                    value={formData.bilingualMode}
                    onChange={(e) => updateField('bilingualMode', e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90 outline-none transition focus-visible:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                  >
                    <option value="">Select language mode</option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="bilingual">Bilingual</option>
                  </select>
                </div>
              </div>
            </details>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest cyber-muted">Theological Lens</label>
              <div className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-gray-100/90">Adventist (fixed)</div>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              <input
                type="checkbox"
                checked={formData.egwEnabled}
                onChange={(e) => updateField('egwEnabled', e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-black/40 text-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
              />
              <span>
                <span className="block text-sm text-white">Enable EGW support</span>
                <span className="block text-xs text-gray-300">
                  Include Ellen G. White support in study, outline, and manuscript generation.
                </span>
              </span>
            </label>

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
