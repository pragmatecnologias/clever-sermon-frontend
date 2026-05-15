'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { type Phase } from '@/components/PhaseNavigation'
import { type WorkspaceSection, sectionPhaseMap } from '@/components/workspace-shell.types'
import { getWorkspaceUiState } from '@/components/workspace-metadata.helpers'

type WorkspaceUiStateWorkspace = {
  metadata?: Record<string, unknown> | null
}

type UseWorkspaceUiStateOptions = {
  workspaceId: string
  workspace: WorkspaceUiStateWorkspace | null
  loading: boolean
  router: {
    replace: (href: string, options?: { scroll?: boolean }) => void
    push: (href: string) => void
  }
}

const VALID_PHASES: Phase[] = ['THEME', 'PASSAGE', 'STUDY', 'OUTLINE', 'WRITE', 'REFINE', 'DELIVER']
const VALID_SECTIONS: WorkspaceSection[] = [
  'workspace',
  'church-settings',
  'outlines',
  'manuscript',
  'citations',
  'scripture',
  'word-study',
  'cross-references',
  'study-report',
  'coach',
  'dna',
  'visualizations',
  'media',
]

const resolvePhaseForSection = (section: WorkspaceSection, preferredPhase?: Phase): Phase => {
  if (preferredPhase && sectionPhaseMap[section] === preferredPhase) return preferredPhase
  return sectionPhaseMap[section] || 'THEME'
}

export function useWorkspaceUiState({ workspaceId, workspace, loading, router }: UseWorkspaceUiStateOptions) {
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('workspace')
  const [activePhase, setActivePhase] = useState<Phase>('THEME')
  const navStateRestored = useRef(false)
  const navStatePersistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navStatePersistHash = useRef<string>('')
  const navStateStorageKey = useMemo(
    () => (workspaceId ? `workspace-ui-nav:${workspaceId}` : null),
    [workspaceId],
  )

  useEffect(() => {
    navStateRestored.current = false
    navStatePersistHash.current = ''
    if (navStatePersistTimer.current) {
      clearTimeout(navStatePersistTimer.current)
      navStatePersistTimer.current = null
    }
  }, [workspaceId])

  useEffect(() => {
    if (!workspace || navStateRestored.current) return

    const queryPhaseRaw = searchParams.get('phase')
    const querySectionRaw = searchParams.get('section')

    const queryPhase = VALID_PHASES.includes((queryPhaseRaw || '').toUpperCase() as Phase)
      ? ((queryPhaseRaw || '').toUpperCase() as Phase)
      : null
    const querySection = VALID_SECTIONS.includes((querySectionRaw || '') as WorkspaceSection)
      ? ((querySectionRaw || '') as WorkspaceSection)
      : null

    const metadataUiState = getWorkspaceUiState(workspace as any)
    let localUiState: Record<string, unknown> = {}
    if (typeof window !== 'undefined' && navStateStorageKey) {
      try {
        localUiState = JSON.parse(localStorage.getItem(navStateStorageKey) || '{}') || {}
      } catch {
        localUiState = {}
      }
    }

    const metadataPhase = VALID_PHASES.includes(String(metadataUiState.phase || '').toUpperCase() as Phase)
      ? (String(metadataUiState.phase).toUpperCase() as Phase)
      : null
    const metadataSection = VALID_SECTIONS.includes(String(metadataUiState.section || '') as WorkspaceSection)
      ? (String(metadataUiState.section) as WorkspaceSection)
      : null
    const localPhase = VALID_PHASES.includes(String(localUiState.phase || '').toUpperCase() as Phase)
      ? (String(localUiState.phase).toUpperCase() as Phase)
      : null
    const localSection = VALID_SECTIONS.includes(String(localUiState.section || '') as WorkspaceSection)
      ? (String(localUiState.section) as WorkspaceSection)
      : null

    const restoredSection = querySection || metadataSection || localSection || 'workspace'
    const restoredPhase = resolvePhaseForSection(restoredSection, queryPhase || metadataPhase || localPhase || undefined)

    setActiveSection(restoredSection)
    setActivePhase(restoredPhase)
    navStateRestored.current = true
  }, [workspace, searchParams, navStateStorageKey])

  useEffect(() => {
    if (!workspaceId || !workspace || loading || !navStateRestored.current) return

    const params = new URLSearchParams(searchParams.toString())
    const currentPhase = params.get('phase')
    const currentSection = params.get('section')
    if (currentPhase !== activePhase || currentSection !== activeSection) {
      params.set('phase', activePhase)
      params.set('section', activeSection)
      router.replace(`/workspace/${workspaceId}?${params.toString()}`, { scroll: false })
    }

    const navHash = `${activePhase}:${activeSection}`
    if (navStatePersistHash.current === navHash) return
    navStatePersistHash.current = navHash
    if (typeof window !== 'undefined' && navStateStorageKey) {
      try {
        localStorage.setItem(
          navStateStorageKey,
          JSON.stringify({
            phase: activePhase,
            section: activeSection,
          }),
        )
      } catch {
        // ignore persistence errors
      }
    }

    navStatePersistTimer.current = setTimeout(() => {
      navStatePersistTimer.current = null
      navStatePersistHash.current = ''
    }, 0)
  }, [activePhase, activeSection, workspace, workspaceId, loading, searchParams, router, navStateStorageKey])

  return {
    activePhase,
    activeSection,
    setActivePhase,
    setActiveSection,
  }
}
