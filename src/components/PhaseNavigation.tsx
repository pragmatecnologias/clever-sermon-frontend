'use client'

import { BookOpen, Brain, Compass, FileText, Layers, PenTool, Sparkles } from 'lucide-react'

export type Phase = 'PASSAGE' | 'STUDY' | 'THEME' | 'OUTLINE' | 'WRITE' | 'REFINE' | 'DELIVER'

interface PhaseNavigationProps {
  activePhase: Phase
  onPhaseChange: (phase: Phase) => void
  progress: {
    passageStudied: boolean
    themesIdentified: boolean
    strategySelected: boolean
    outlineCreated: boolean
    manuscriptWritten: boolean
  }
}

export default function PhaseNavigation({ activePhase, onPhaseChange, progress }: PhaseNavigationProps) {
  const phases = [
    { 
      id: 'THEME' as Phase, 
      label: 'Theme', 
      icon: Compass,
      description: 'Direction and setup',
      complete: progress.strategySelected
    },
    { 
      id: 'PASSAGE' as Phase, 
      label: 'Passage', 
      icon: BookOpen,
      description: 'Scripture intelligence',
      complete: progress.passageStudied
    },
    { 
      id: 'STUDY' as Phase, 
      label: 'Study', 
      icon: Brain,
      description: 'Sermon material',
      complete: progress.themesIdentified
    },
    { 
      id: 'OUTLINE' as Phase, 
      label: 'Outline', 
      icon: PenTool,
      description: 'Point structure',
      complete: progress.outlineCreated
    },
    { 
      id: 'WRITE' as Phase,
      label: 'Write',
      icon: FileText,
      description: 'Manuscript and notes',
      complete: progress.manuscriptWritten
    },
    {
      id: 'REFINE' as Phase, 
      label: 'Refine', 
      icon: Sparkles,
      description: 'Polish and improve',
      complete: progress.manuscriptWritten
    },
    {
      id: 'DELIVER' as Phase,
      label: 'Deliver',
      icon: Layers,
      description: 'Slides and media',
      complete: false
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
