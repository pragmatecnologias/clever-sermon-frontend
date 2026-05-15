import { Phase } from '@/components/PhaseNavigation'

export type WorkspaceSection =
  | 'workspace'
  | 'church-settings'
  | 'outlines'
  | 'manuscript'
  | 'citations'
  | 'scripture'
  | 'word-study'
  | 'cross-references'
  | 'study-report'
  | 'coach'
  | 'dna'
  | 'visualizations'
  | 'media'

export const sectionPhaseMap: Partial<Record<WorkspaceSection, Phase>> = {
  workspace: 'THEME',
  scripture: 'PASSAGE',
  'word-study': 'STUDY',
  'cross-references': 'STUDY',
  visualizations: 'STUDY',
  'study-report': 'STUDY',
  outlines: 'OUTLINE',
  manuscript: 'WRITE',
  citations: 'WRITE',
  coach: 'REFINE',
  dna: 'REFINE',
  media: 'DELIVER',
  'church-settings': 'DELIVER',
}

