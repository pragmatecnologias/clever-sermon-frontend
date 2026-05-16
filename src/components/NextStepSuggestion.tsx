'use client'

import { ArrowRight } from 'lucide-react'

interface NextStepSuggestionProps {
  progress: {
    themeConfigured: boolean
    passageExplored: boolean
    studyGenerated: boolean
    outlineCreated: boolean
    manuscriptWritten: boolean
    refineCompleted: boolean
    deliverPrepared: boolean
  }
  onAction: (action: string) => void
}

export default function NextStepSuggestion({ progress, onAction }: NextStepSuggestionProps) {
  const getNextStep = () => {
    if (!progress.themeConfigured) {
      return {
        label: 'Finish sermon setup',
        description: 'Confirm the title, passage, language, and audience before you begin',
        action: 'open-theme',
        icon: '🧭'
      }
    }

    if (!progress.passageExplored) {
      return {
        label: 'Study the passage',
        description: 'Read Scripture first, then use study tools for context and meaning',
        action: 'open-passage',
        icon: '📖'
      }
    }

    if (!progress.studyGenerated) {
      return {
        label: 'Prepare study notes',
        description: 'Turn the passage findings into sermon-ready study material',
        action: 'generate-study-report',
        icon: '🔍'
      }
    }

    if (!progress.outlineCreated) {
      return {
        label: 'Build the outline',
        description: 'Turn the study material into a clear point-by-point sermon flow',
        action: 'open-outline',
        icon: '📝'
      }
    }

    if (!progress.manuscriptWritten) {
      return {
        label: 'Draft the manuscript',
        description: 'Write the sermon body and speaking notes for delivery',
        action: 'open-write',
        icon: '✍️'
      }
    }

    if (!progress.refineCompleted) {
      return {
        label: 'Review the sermon',
        description: 'Check support, clarity, and balance before you finalize it',
        action: 'open-refine',
        icon: '✨'
      }
    }

    if (!progress.deliverPrepared) {
      return {
        label: 'Prepare media and export',
        description: 'Generate slides, downloads, and presentation extras',
        action: 'open-deliver',
        icon: '🎬'
      }
    }

    return {
      label: 'Review media and export',
      description: 'Everything is in place. Finalize the sermon materials for service.',
      action: 'open-deliver',
      icon: '✅'
    }
  }

  const nextStep = getNextStep()

  return (
    <div className="bg-gradient-to-br from-cyan-900/40 via-slate-950 to-purple-900/35 border border-cyan-400/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
      <div className="flex items-start gap-5">
        <div className="text-4xl leading-none">{nextStep.icon}</div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-200/70 mb-2">Next Action</p>
          <h3 className="text-2xl font-semibold text-white mb-2">
            {nextStep.label}
          </h3>
          <p className="text-sm text-gray-200/80 mb-4 max-w-xl">{nextStep.description}</p>
          <button
            onClick={() => onAction(nextStep.action)}
            className="cyber-button px-5 py-3 rounded-xl flex items-center gap-2 text-base shadow-lg shadow-cyan-500/20"
          >
            <span>{nextStep.label}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
