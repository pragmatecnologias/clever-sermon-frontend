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
        label: 'Review workspace setup',
        description: 'Confirm title, passage, language, and audience before building the sermon',
        action: 'open-theme',
        icon: '🧭'
      }
    }

    if (!progress.passageExplored) {
      return {
        label: 'Explore the passage',
        description: 'Use Scripture, word study, cross references, and passage tools first',
        action: 'open-passage',
        icon: '📖'
      }
    }

    if (!progress.studyGenerated) {
      return {
        label: 'Generate study report',
        description: 'Compile passage intelligence into sermon-ready study material',
        action: 'generate-study-report',
        icon: '🔍'
      }
    }

    if (!progress.outlineCreated) {
      return {
        label: 'Create sermon outline',
        description: 'Turn study material into point-by-point sermon structure',
        action: 'open-outline',
        icon: '📝'
      }
    }

    if (!progress.manuscriptWritten) {
      return {
        label: 'Write the manuscript',
        description: 'Draft the sermon body and speaking notes for delivery',
        action: 'open-write',
        icon: '✍️'
      }
    }

    if (!progress.refineCompleted) {
      return {
        label: 'Run refinement tools',
        description: 'Use DNA, integrity, and coaching tools to polish the sermon',
        action: 'open-refine',
        icon: '✨'
      }
    }

    if (!progress.deliverPrepared) {
      return {
        label: 'Prepare deliver assets',
        description: 'Generate slides, media, music, and social assets for presentation',
        action: 'open-deliver',
        icon: '🎬'
      }
    }

    return {
      label: 'Review deliver assets',
      description: 'Everything is in place. Finalize the materials for service.',
      action: 'open-deliver',
      icon: '✅'
    }
  }

  const nextStep = getNextStep()

  return (
    <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border border-cyan-500/30 rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="text-3xl">{nextStep.icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-cyan-200 mb-1">
            Suggested Next Step
          </h3>
          <p className="text-sm text-gray-300 mb-3">{nextStep.description}</p>
          <button
            onClick={() => onAction(nextStep.action)}
            className="cyber-button px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span>{nextStep.label}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
