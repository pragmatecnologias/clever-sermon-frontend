'use client'

import { useState } from 'react'
import { Shield, AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react'
import axios from 'axios'

interface DoctrinalCheck {
  category: string
  isConsistent: boolean
  concern: string | null
  recommendation: string | null
  severity: 'info' | 'warning' | 'critical'
}

interface DoctrinalPrecisionCheck {
  id: string
  checks: DoctrinalCheck[]
  overallConsistencyScore: number
  summary: string
}

export default function DoctrinalPrecisionPanel({ 
  workspaceId, 
  token 
}: { 
  workspaceId: string
  token: string 
}) {
  const [analysis, setAnalysis] = useState<DoctrinalPrecisionCheck | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/doctrinal-precision/${workspaceId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setAnalysis(response.data)
    } catch (err) {
      setError('Failed to check doctrinal precision')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadExisting = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/doctrinal-precision/${workspaceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.data) {
        setAnalysis(response.data)
      }
    } catch (err) {
      console.error('No existing analysis found')
    }
  }

  useState(() => {
    loadExisting()
  })

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-400" />
      case 'info': return <Info className="w-5 h-5 text-blue-400" />
      default: return <Info className="w-5 h-5 text-gray-400" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500/50 bg-red-900/10'
      case 'warning': return 'border-yellow-500/50 bg-yellow-900/10'
      case 'info': return 'border-blue-500/50 bg-blue-900/10'
      default: return 'border-gray-500/50 bg-gray-900/10'
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-blue-200">Doctrinal Precision Check</h3>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking...
            </>
          ) : (
            'Check Doctrine'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-black/30 rounded-lg p-5 border border-blue-500/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-blue-300 uppercase tracking-wide">
                Overall Consistency Score
              </h4>
              <span className={`text-4xl font-bold ${
                analysis.overallConsistencyScore >= 85 ? 'text-green-400' :
                analysis.overallConsistencyScore >= 70 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {analysis.overallConsistencyScore}
              </span>
            </div>
            <p className="text-sm text-gray-300">{analysis.summary}</p>
          </div>

          {/* Doctrinal Checks */}
          {analysis.checks && analysis.checks.length > 0 && (
            <div className="space-y-3">
              {analysis.checks.map((check, idx) => (
                <div key={idx} className={`rounded-lg p-4 border ${getSeverityColor(check.severity)}`}>
                  <div className="flex items-start gap-3">
                    {check.isConsistent ? (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      getSeverityIcon(check.severity)
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-semibold text-gray-100 capitalize">
                          {check.category.replace(/_/g, ' ')}
                        </h5>
                        {!check.isConsistent && (
                          <span className={`text-xs uppercase font-bold ${
                            check.severity === 'critical' ? 'text-red-400' :
                            check.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                          }`}>
                            {check.severity}
                          </span>
                        )}
                      </div>
                      
                      {check.concern && (
                        <div className="mb-2">
                          <span className="text-xs font-semibold text-gray-400 uppercase">Concern:</span>
                          <p className="text-sm text-gray-200 mt-1">{check.concern}</p>
                        </div>
                      )}
                      
                      {check.recommendation && (
                        <div className="bg-black/30 rounded p-3 border-l-4 border-blue-500">
                          <span className="text-xs font-semibold text-blue-300 uppercase">Recommendation:</span>
                          <p className="text-sm text-gray-200 mt-1">{check.recommendation}</p>
                        </div>
                      )}
                      
                      {check.isConsistent && !check.concern && (
                        <p className="text-sm text-green-300">✓ Consistent with SDA doctrinal framework</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!analysis && !loading && (
        <div className="text-center py-12 text-gray-400">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Click "Check Doctrine" to ensure SDA doctrinal consistency</p>
        </div>
      )}
    </div>
  )
}
