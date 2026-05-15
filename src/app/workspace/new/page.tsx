'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

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
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const payload = {
        title: formData.title,
        seriesTitle: formData.seriesTitle || undefined,
        mainPassage: formData.mainPassage,
        additionalPassages: formData.additionalPassages
          ? formData.additionalPassages.split(',').map((item) => item.trim()).filter(Boolean)
          : undefined,
        theme: formData.theme || undefined,
        audienceProfile: formData.audienceProfile || undefined,
        sermonGoals: formData.sermonGoals || undefined,
        theologicalLens: 'adventist',
        style: formData.style || undefined,
        storyArc: formData.storyArc || undefined,
        language: formData.language || 'en',
        egwEnabled: formData.egwEnabled,
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      router.push(`/workspace/${response.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create workspace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-black/40 backdrop-blur border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">Clever Sermon</p>
            <h1 className="text-2xl font-bold text-white">New Workspace</h1>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs cyber-outline px-4 py-2 rounded-full"
          >
            Back to dashboard
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto cyber-panel rounded-2xl p-8">
          <h2 className="text-3xl font-bold mb-6 text-white">Create New Workspace</h2>

          {error && <p className="text-red-400 mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest cyber-muted mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-gray-100/90"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest cyber-muted mb-2">Series Title (optional)</label>
              <input
                type="text"
                value={formData.seriesTitle}
                onChange={(e) => setFormData({ ...formData, seriesTitle: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-gray-100/90"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest cyber-muted mb-2">Main Passage</label>
              <input
                type="text"
                value={formData.mainPassage}
                onChange={(e) => setFormData({ ...formData, mainPassage: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-gray-100/90"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest cyber-muted mb-2">Additional Passages (comma separated)</label>
              <input
                type="text"
                value={formData.additionalPassages}
                onChange={(e) => setFormData({ ...formData, additionalPassages: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-gray-100/90"
                placeholder="e.g., Romans 8:28, Philippians 4:13"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest cyber-muted mb-2">Style</label>
                <select
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-gray-100/90"
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
                <label className="block text-xs uppercase tracking-widest cyber-muted mb-2">Story Arc</label>
                <select
                  value={formData.storyArc}
                  onChange={(e) => setFormData({ ...formData, storyArc: e.target.value })}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-gray-100/90"
                >
                  <option value="">Select arc</option>
                  <option value="problem_truth_response">Problem → Truth → Response</option>
                  <option value="tension_turn_resolution">Tension → Turn → Resolution</option>
                  <option value="question_discovery_answer">Question → Discovery → Answer</option>
                  <option value="challenge_journey_transformation">Challenge → Journey → Transformation</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest cyber-muted mb-2">Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-gray-100/90"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest cyber-muted mb-2">Theme</label>
              <input
                type="text"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-gray-100/90"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest cyber-muted mb-2">Audience Profile</label>
              <input
                type="text"
                value={formData.audienceProfile}
                onChange={(e) => setFormData({ ...formData, audienceProfile: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-gray-100/90"
                placeholder="e.g., Young adults, families, mixed congregation"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest cyber-muted mb-2">Sermon Goals</label>
              <textarea
                value={formData.sermonGoals}
                onChange={(e) => setFormData({ ...formData, sermonGoals: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-gray-100/90"
                rows={3}
                placeholder="What do you want to accomplish with this sermon?"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest cyber-muted mb-2">Theological Lens</label>
              <div className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-gray-100/90">
                Adventist (fixed)
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              <input
                type="checkbox"
                checked={formData.egwEnabled}
                onChange={(e) => setFormData({ ...formData, egwEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-black/40 text-cyan-400"
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
                className="flex-1 cyber-button px-6 py-3 rounded-full disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Workspace'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 cyber-outline rounded-full"
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
