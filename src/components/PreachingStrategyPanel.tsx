'use client'

import { useState } from 'react'
import { Compass, TrendingUp, Clock, Zap, Loader2 } from 'lucide-react'
import axios from 'axios'

interface StructuralGuidance {
  introduction: string
  bodyStructure: string
  conclusion: string
}

interface PreachingStrategy {
  id: string
  recommendedGenre: string
  genreRationale: string
  emotionalArc: string
  tone: string
  targetLengthMinutes: number
  tensionLevel: number
  applicationDensity: number
  invitationDriven: boolean
  structuralGuidance: StructuralGuidance | null
}

export default function PreachingStrategyPanel({ 
  workspaceId, 
  token 
}: { 
  workspaceId: string
  token: string 
}) {
  const [strategy, setStrategy] = useState<PreachingStrategy | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/preaching-strategy/${workspaceId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setStrategy(response.data)
    } catch (err) {
      setError('Failed to select preaching strategy')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadExisting = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/preaching-strategy/${workspaceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.data) {
        setStrategy(response.data)
      }
    } catch (err) {
      console.error('No existing strategy found')
    }
  }

  useState(() => {
    loadExisting()
  })

  return (
    <div className="bg-gradient-to-br from-indigo-900/20 to-violet-900/20 border border-indigo-500/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Compass className="w-6 h-6 text-indigo-400" />
          <h3 className="text-xl font-bold text-indigo-200">Preaching Strategy</h3>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Selecting...
            </>
          ) : (
            'Select Strategy'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {strategy && (
        <div className="space-y-6">
          {/* Recommended Genre */}
          <div className="bg-black/30 rounded-lg p-5 border border-indigo-500/20">
            <h4 className="text-sm font-semibold text-indigo-300 uppercase tracking-wide mb-3">
              Recommended Genre
            </h4>
            <div className="text-3xl font-bold text-indigo-100 capitalize mb-3">
              {strategy.recommendedGenre.replace(/_/g, ' ')}
            </div>
            <p className="text-gray-300">{strategy.genreRationale}</p>
          </div>

          {/* Emotional Arc & Tone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/30 rounded-lg p-4 border border-indigo-500/20">
              <h5 className="text-xs font-semibold text-indigo-300 uppercase tracking-wide mb-2">
                Emotional Arc
              </h5>
              <div className="text-lg font-semibold text-indigo-100 capitalize">
                {strategy.emotionalArc.replace(/_/g, ' → ')}
              </div>
            </div>
            <div className="bg-black/30 rounded-lg p-4 border border-indigo-500/20">
              <h5 className="text-xs font-semibold text-indigo-300 uppercase tracking-wide mb-2">
                Tone
              </h5>
              <div className="text-lg font-semibold text-indigo-100 capitalize">
                {strategy.tone}
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/30 rounded-lg p-4 border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h5 className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">
                  Target Length
                </h5>
              </div>
              <div className="text-3xl font-bold text-indigo-100">
                {strategy.targetLengthMinutes}<span className="text-lg text-gray-400">min</span>
              </div>
            </div>
            <div className="bg-black/30 rounded-lg p-4 border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                <h5 className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">
                  Tension Level
                </h5>
              </div>
              <div className="text-3xl font-bold text-indigo-100">
                {strategy.tensionLevel}<span className="text-lg text-gray-400">/100</span>
              </div>
            </div>
          </div>

          {/* Application Density */}
          <div className="bg-black/30 rounded-lg p-4 border border-indigo-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <h5 className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">
                  Application Density
                </h5>
              </div>
              <span className="text-2xl font-bold text-indigo-100">{strategy.applicationDensity}</span>
            </div>
            <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all"
                style={{ width: `${strategy.applicationDensity}%` }}
              />
            </div>
          </div>

          {/* Invitation Driven */}
          {strategy.invitationDriven && (
            <div className="bg-indigo-900/20 rounded-lg p-4 border border-indigo-500/40 text-center">
              <p className="text-indigo-200 font-semibold">✓ Invitation-Driven Sermon</p>
            </div>
          )}

          {/* Structural Guidance */}
          {strategy.structuralGuidance && (
            <div className="bg-black/30 rounded-lg p-5 border border-indigo-500/20">
              <h4 className="text-sm font-semibold text-indigo-300 uppercase tracking-wide mb-4">
                Structural Guidance
              </h4>
              <div className="space-y-4">
                <div>
                  <h5 className="text-xs font-semibold text-indigo-400 uppercase mb-1">Introduction</h5>
                  <p className="text-sm text-gray-300">{strategy.structuralGuidance.introduction}</p>
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-indigo-400 uppercase mb-1">Body Structure</h5>
                  <p className="text-sm text-gray-300">{strategy.structuralGuidance.bodyStructure}</p>
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-indigo-400 uppercase mb-1">Conclusion</h5>
                  <p className="text-sm text-gray-300">{strategy.structuralGuidance.conclusion}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!strategy && !loading && (
        <div className="text-center py-12 text-gray-400">
          <Compass className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Click "Select Strategy" to determine the optimal preaching approach</p>
        </div>
      )}
    </div>
  )
}
