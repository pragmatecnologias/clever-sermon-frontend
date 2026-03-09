'use client'

import { ArrowRight } from 'lucide-react'

interface NextStepSuggestionProps {
  progress: {
    passageStudied: boolean
    themesIdentified: boolean
    strategySelected: boolean
    outlineCreated: boolean
    manuscriptWritten: boolean
  }
  onAction: (action: string) => void
}

export default function NextStepSuggestion({ progress, onAction }: NextStepSuggestionProps) {
  const getNextStep = () => {
    if (!progress.passageStudied) {
      return {
        label: 'Look up your passage',
        description: 'Start by studying the biblical text',
        action: 'lookup-passage',
        icon: '📖'
      }
    }
    
    if (!progress.themesIdentified) {
      return {
        label: 'Generate study report',
        description: 'AI will identify key themes and insights',
        action: 'generate-study-report',
        icon: '🔍'
      }
    }
    
    if (!progress.strategySelected) {
      return {
        label: 'Choose preaching strategy',
        description: 'Determine the best approach for this sermon',
        action: 'select-strategy',
        icon: '🎯'
      }
    }
    
    if (!progress.outlineCreated) {
      return {
        label: 'Create sermon outline',
        description: 'Generate structured outline options',
        action: 'create-outline',
        icon: '📝'
      }
    }
    
    if (!progress.manuscriptWritten) {
      return {
        label: 'Write full manuscript',
        description: 'Generate complete sermon text',
        action: 'write-manuscript',
        icon: '✍️'
      }
    }
    
    return {
      label: 'Analyze your sermon',
      description: 'Get AI feedback and refinement suggestions',
      action: 'analyze-sermon',
      icon: '✨'
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
