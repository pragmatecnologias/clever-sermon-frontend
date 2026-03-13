'use client'

import { CheckCircle, Circle } from 'lucide-react'

interface ProgressIndicatorProps {
  progress: {
    themeConfigured: boolean
    passageExplored: boolean
    studyGenerated: boolean
    outlineCreated: boolean
    manuscriptWritten: boolean
    refineCompleted: boolean
    deliverPrepared: boolean
  }
}

export default function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  const steps = [
    { label: 'Theme configured', complete: progress.themeConfigured },
    { label: 'Passage explored', complete: progress.passageExplored },
    { label: 'Study report generated', complete: progress.studyGenerated },
    { label: 'Outline created', complete: progress.outlineCreated },
    { label: 'Manuscript written', complete: progress.manuscriptWritten },
    { label: 'Refinement run', complete: progress.refineCompleted },
    { label: 'Deliver assets created', complete: progress.deliverPrepared },
  ]

  const completedCount = steps.filter(s => s.complete).length
  const percentage = Math.round((completedCount / steps.length) * 100)

  return (
    <div className="bg-black/30 border border-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300">Sermon Progress</h3>
        <span className="text-2xl font-bold text-cyan-400">{percentage}%</span>
      </div>
      
      <div className="bg-gray-800 rounded-full h-2 mb-4 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-amber-400 to-yellow-500 h-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            {step.complete ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Circle className="w-4 h-4 text-gray-600" />
            )}
            <span className={step.complete ? 'text-green-300' : 'text-gray-400'}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
