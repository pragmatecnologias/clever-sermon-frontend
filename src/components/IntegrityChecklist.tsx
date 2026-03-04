'use client'

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface IntegrityChecklistProps {
  integrityData: {
    passed: boolean
    score: number
    checks: {
      name: string
      passed: boolean
      message: string
    }[]
  }
}

export default function IntegrityChecklist({ integrityData }: IntegrityChecklistProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-300'
    if (score >= 50) return 'text-amber-300'
    return 'text-red-300'
  }

  return (
    <div className="border border-white/10 rounded-xl p-4 bg-gradient-to-br from-cyan-900/10 to-purple-900/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-100">Passage Integrity Checklist</h3>
        <div className={`text-2xl font-bold ${getScoreColor(integrityData.score)}`}>
          {integrityData.score}%
        </div>
      </div>

      <div className="space-y-3">
        {integrityData.checks.map((check, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 bg-black/30 rounded-lg">
            <div className="mt-0.5">
              {check.passed ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-100 mb-1">{check.name}</p>
              <p className="text-xs text-gray-400">{check.message}</p>
            </div>
          </div>
        ))}
      </div>

      {integrityData.passed ? (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-400/40 rounded-lg">
          <p className="text-xs text-green-200">✓ Sermon passes integrity checks</p>
        </div>
      ) : (
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-400/40 rounded-lg">
          <p className="text-xs text-amber-200">⚠️ Consider strengthening scriptural grounding</p>
        </div>
      )}
    </div>
  )
}
