'use client'

import { BookOpen, Brain, Compass, FileText, Layers, PenTool, Sparkles } from 'lucide-react'
import FeatureStatusBadge from '@/components/FeatureStatusBadge'
import type { WorkspaceFeatureReadiness, WorkspaceFeatureReadinessMap } from '@/lib/api/openapi-client'
import { getFeatureReadiness } from '@/components/feature-readiness'
import type { WorkspaceSection } from '@/components/workspace-shell.types'

export type Phase = 'PASSAGE' | 'STUDY' | 'THEME' | 'OUTLINE' | 'WRITE' | 'REFINE' | 'DELIVER'

interface PhaseNavigationProps {
  activePhase: Phase
  onPhaseChange: (phase: Phase) => void
  onSectionChange?: (section: WorkspaceSection) => void
  featureReadiness?: WorkspaceFeatureReadinessMap | null
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

export default function PhaseNavigation({
  activePhase,
  onPhaseChange,
  onSectionChange,
  featureReadiness,
  progress,
}: PhaseNavigationProps) {
  const phaseDefaultSections: Record<Phase, WorkspaceSection> = {
    THEME: 'workspace',
    PASSAGE: 'scripture',
    STUDY: 'study-report',
    OUTLINE: 'outlines',
    WRITE: 'manuscript',
    REFINE: 'dna',
    DELIVER: 'media',
  }

  const phases = [
    {
      id: 'THEME' as Phase,
      label: 'Setup',
      icon: Compass,
      description: 'Define the sermon context.',
      complete: progress.themeConfigured
    },
    {
      id: 'PASSAGE' as Phase,
      label: 'Scripture',
      icon: BookOpen,
      description: 'Start by reading the passage.',
      complete: progress.passageExplored
    },
    {
      id: 'STUDY' as Phase,
      label: 'Study', 
      icon: Brain,
      description: 'Explore context, words, references, and EGW support.',
      complete: progress.studyGenerated
    },
    {
      id: 'OUTLINE' as Phase,
      label: 'Outline', 
      icon: PenTool,
      description: 'Shape the sermon structure.',
      complete: progress.outlineCreated
    },
    { 
      id: 'WRITE' as Phase,
      label: 'Manuscript',
      icon: FileText,
      description: 'Draft what you will preach.',
      complete: progress.manuscriptWritten
    },
    {
      id: 'REFINE' as Phase, 
      label: 'Review', 
      icon: Sparkles,
      description: 'Check support, clarity, and theological balance.',
      complete: progress.refineCompleted
    },
    {
      id: 'DELIVER' as Phase,
      label: 'Media & Export',
      icon: Layers,
      description: 'Prepare slides, exports, and delivery assets.',
      complete: progress.deliverPrepared
    },
  ]

  const getPhaseStatus = (phaseId: Phase, complete: boolean): { readiness?: WorkspaceFeatureReadiness | null; status?: 'Ready' | 'Needs prerequisite' | 'Loading' | 'Generated' | 'Empty because no data exists' | 'Unavailable because service/data is not configured' | 'Failed with retry'; reason?: string } => {
    switch (phaseId) {
      case 'THEME':
        return complete
          ? { status: 'Ready' as const, reason: 'Workspace setup is ready.' }
          : { status: 'Needs prerequisite' as const, reason: 'Add a title and main passage to start.' }
      case 'PASSAGE':
        return getFeatureReadiness(featureReadiness, 'scripture')
          ? { readiness: getFeatureReadiness(featureReadiness, 'scripture') }
          : (complete
          ? { status: 'Generated' as const, reason: 'Passage lookup is saved.' }
          : { status: 'Needs prerequisite' as const, reason: 'Load the current passage first.' })
      case 'STUDY':
        return getFeatureReadiness(featureReadiness, 'studyReport')
          ? { readiness: getFeatureReadiness(featureReadiness, 'studyReport') }
          : (complete
          ? { status: 'Generated' as const, reason: 'Study report exists for this workspace.' }
          : { status: 'Ready' as const, reason: 'Use Scripture tools to generate study material.' })
      case 'OUTLINE':
        return getFeatureReadiness(featureReadiness, 'outline')
          ? { readiness: getFeatureReadiness(featureReadiness, 'outline') }
          : (complete
          ? { status: 'Generated' as const, reason: 'An outline is available.' }
          : { status: 'Ready' as const, reason: 'Build the outline from passage or study notes.' })
      case 'WRITE':
        return getFeatureReadiness(featureReadiness, 'manuscript')
          ? { readiness: getFeatureReadiness(featureReadiness, 'manuscript') }
          : (complete
          ? { status: 'Generated' as const, reason: 'A manuscript exists.' }
          : { status: 'Ready' as const, reason: 'Draft the manuscript from the outline.' })
      case 'REFINE':
        return getFeatureReadiness(featureReadiness, 'integrityReview')
          ? { readiness: getFeatureReadiness(featureReadiness, 'integrityReview') }
          : (complete
          ? { status: 'Generated' as const, reason: 'Review tools have been used.' }
          : { status: 'Ready' as const, reason: 'Review after manuscript generation.' })
      case 'DELIVER':
        return getFeatureReadiness(featureReadiness, 'media')
          ? { readiness: getFeatureReadiness(featureReadiness, 'media') }
          : (complete
          ? { status: 'Generated' as const, reason: 'Media or export assets are ready.' }
          : { status: 'Ready' as const, reason: 'Prepare media after manuscript or outline.' })
      default:
        return { status: 'Ready' as const, reason: 'Ready for work.' }
    }
  }

  return (
    <div className="border-b border-white/10 bg-black/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-2 overflow-x-auto">
          {phases.map((phase) => {
            const Icon = phase.icon
            const isActive = activePhase === phase.id
            const isComplete = phase.complete
            const phaseStatus = getPhaseStatus(phase.id, isComplete)
            
            return (
              <button
                key={phase.id}
                onClick={() => {
                  onPhaseChange(phase.id)
                  onSectionChange?.(phaseDefaultSections[phase.id])
                }}
                title={phase.description}
                aria-label={phase.label}
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
                <span className="flex flex-col items-start gap-1">
                  <span className="font-medium">{phase.label}</span>
                  <FeatureStatusBadge status={phaseStatus.status} reason={phaseStatus.reason} readiness={phaseStatus.readiness} />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
