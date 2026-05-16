'use client'

import { BookOpen, Brain, Compass, FileText, Layers, PenTool, Sparkles } from 'lucide-react'

export type Phase = 'PASSAGE' | 'STUDY' | 'THEME' | 'OUTLINE' | 'WRITE' | 'REFINE' | 'DELIVER'

interface PhaseNavigationProps {
  activePhase: Phase
  onPhaseChange: (phase: Phase) => void
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

export default function PhaseNavigation({ activePhase, onPhaseChange, progress }: PhaseNavigationProps) {
  const phases = [
    {
      id: 'THEME' as Phase,
      label: 'Setup',
      icon: Compass,
      description: 'Set the passage, title, language, and audience',
      complete: progress.themeConfigured
    },
    {
      id: 'PASSAGE' as Phase,
      label: 'Scripture',
      icon: BookOpen,
      description: 'Read the passage and check the text',
      complete: progress.passageExplored
    },
    {
      id: 'STUDY' as Phase,
      label: 'Study', 
      icon: Brain,
      description: 'Gather study notes, cross references, and context',
      complete: progress.studyGenerated
    },
    {
      id: 'OUTLINE' as Phase,
      label: 'Outline', 
      icon: PenTool,
      description: 'Shape the sermon points and flow',
      complete: progress.outlineCreated
    },
    { 
      id: 'WRITE' as Phase,
      label: 'Manuscript',
      icon: FileText,
      description: 'Draft the sermon words and speaking notes',
      complete: progress.manuscriptWritten
    },
    {
      id: 'REFINE' as Phase, 
      label: 'Review', 
      icon: Sparkles,
      description: 'Check support, clarity, and balance',
      complete: progress.refineCompleted
    },
    {
      id: 'DELIVER' as Phase,
      label: 'Media & Export',
      icon: Layers,
      description: 'Prepare slides, downloads, and service materials',
      complete: progress.deliverPrepared
    },
  ]

  return (
    <div className="border-b border-white/10 bg-black/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-2 overflow-x-auto">
          {phases.map((phase) => {
            const Icon = phase.icon
            const isActive = activePhase === phase.id
            const isComplete = phase.complete
            
            return (
              <button
                key={phase.id}
                onClick={() => onPhaseChange(phase.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap
                  ${isActive 
                    ? 'border-cyan-400 text-cyan-200' 
                    : isComplete
                      ? 'border-transparent text-green-400 hover:text-green-300'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isComplete && !isActive ? 'text-green-400' : ''}`} />
                <span className="font-medium">{phase.label}</span>
                {isComplete && !isActive && <span className="text-xs">✓</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
