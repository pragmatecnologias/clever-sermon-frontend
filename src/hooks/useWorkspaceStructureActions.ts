'use client'

import type { WorkspaceStateResponse } from '@/lib/api/openapi-client'

type WorkspaceDraft = {
  title?: string
  seriesTitle?: string
  mainPassage?: string
  additionalPassages?: string[]
  theme?: string
  audienceProfile?: string
  sermonGoals?: string
  style?: string
  storyArc?: string
  language?: string
  includeEGW?: boolean
}

type OutlineDraft = {
  id: string
  title: string
  introduction: string
  points: string[]
  pointNodes?: Array<Record<string, unknown>>
  conclusion: string
  callToAction: string
}

type CitationDraft = {
  id: string
  statement: string
  verseReferences: string
}

type SearchResult = {
  type?: string
  id?: string
  title?: string
  snippet?: string
  workspaceId?: string
}

type Props = {
  workspaceId: string
  workspaceDraft: WorkspaceDraft | null
  outlineDraft: OutlineDraft | null
  citationDraft: CitationDraft | null
  citationTranslation: string
  searchQuery: string
  workspaceApiClient: () => {
    updateWorkspace?: (workspaceId: string, payload: Record<string, unknown>) => Promise<unknown>
    updateOutline?: (outlineId: string, payload: Record<string, unknown>) => Promise<unknown>
    updateCitation?: (citationId: string, payload: Record<string, unknown>) => Promise<unknown>
    getWorkspaceState?: (workspaceId: string) => Promise<WorkspaceStateResponse>
  } | null
  appApiClient: () => any
  refreshWorkspaceState: (config: Record<string, unknown>) => Promise<WorkspaceStateResponse | null>
  withToken: () => Record<string, unknown> | null
  setActionLoading: (value: (prev: string[]) => string[]) => void
  setError: (value: string | null) => void
  setWorkspaceDraft: (value: WorkspaceDraft | null) => void
  setEditingWorkspace: (value: boolean) => void
  setEditingOutlineId: (value: string | null) => void
  setOutlineDraft: (value: OutlineDraft | null) => void
  setEditingCitationId: (value: string | null) => void
  setCitationDraft: (value: CitationDraft | null) => void
  setSearchResults: (value: SearchResult[]) => void
}

export function useWorkspaceStructureActions({
  workspaceId,
    workspaceDraft,
    outlineDraft,
    citationDraft,
    citationTranslation,
  searchQuery,
  workspaceApiClient,
  appApiClient,
  refreshWorkspaceState,
  withToken,
  setActionLoading,
  setError,
  setWorkspaceDraft,
  setEditingWorkspace,
  setEditingOutlineId,
  setOutlineDraft,
  setEditingCitationId,
  setCitationDraft,
  setSearchResults,
}: Props) {
  const withWorkspaceClient = () => {
    const client = workspaceApiClient()
    if (!client) {
      setError('Unable to connect to the API.')
      return null
    }
    return client
  }

  const withAppClient = () => {
    const client = appApiClient()
    if (!client) {
      setError('Unable to connect to the API.')
      return null
    }
    return client
  }

  const handleWorkspaceSave = async () => {
    const config = withToken()
    if (!config || !workspaceDraft) return
    const client = withWorkspaceClient()
    if (!client?.updateWorkspace) return
    setActionLoading((prev) => (prev.includes('workspace') ? prev : [...prev, 'workspace']))
    try {
      await client.updateWorkspace(workspaceId, {
        title: workspaceDraft.title,
        seriesTitle: workspaceDraft.seriesTitle,
        mainPassage: workspaceDraft.mainPassage,
        additionalPassages: workspaceDraft.additionalPassages,
        theme: workspaceDraft.theme,
        audienceProfile: workspaceDraft.audienceProfile,
        sermonGoals: workspaceDraft.sermonGoals,
        theologicalLens: 'adventist',
        style: workspaceDraft.style,
        storyArc: workspaceDraft.storyArc,
        language: workspaceDraft.language,
        includeEGW: workspaceDraft.includeEGW,
      })
      await refreshWorkspaceState(config)
      setEditingWorkspace(false)
    } catch (err) {
      console.error('Failed to update workspace', err)
      setError('Unable to save workspace changes.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'workspace'))
    }
  }

  const handleOutlineSave = async () => {
    const config = withToken()
    if (!config || !outlineDraft) return
    const client = withWorkspaceClient()
    if (!client?.updateOutline) return
    setActionLoading((prev) => (prev.includes('outline-edit') ? prev : [...prev, 'outline-edit']))
    try {
      await client.updateOutline(outlineDraft.id, {
        title: outlineDraft.title,
        structure: {
          introduction: outlineDraft.introduction,
          points: outlineDraft.points,
          pointNodes: Array.isArray(outlineDraft.pointNodes) ? outlineDraft.pointNodes : [],
          conclusion: outlineDraft.conclusion,
          callToAction: outlineDraft.callToAction,
        },
      })
      await refreshWorkspaceState(config)
      setEditingOutlineId(null)
      setOutlineDraft(null)
    } catch (err) {
      console.error('Failed to update outline', err)
      setError('Unable to save outline changes.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'outline-edit'))
    }
  }

  const handleOutlineSelect = async (outlineId: string) => {
    const config = withToken()
    if (!config) return
    const client = withWorkspaceClient()
    if (!client?.updateOutline) return
    const actionKey = `outline-select-${outlineId}`
    setActionLoading((prev) => (prev.includes(actionKey) ? prev : [...prev, actionKey]))
    try {
      await client.updateOutline(outlineId, { isSelected: true })
      await refreshWorkspaceState(config)
    } catch (err) {
      console.error('Failed to activate outline', err)
      setError('Unable to activate outline.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== actionKey))
    }
  }

  const handleCitationValidate = async () => {
    const config = withToken()
    if (!config) return
    const client = withWorkspaceClient()
    if (!client?.updateCitation) return
    setActionLoading((prev) => (prev.includes('citations-validate') ? prev : [...prev, 'citations-validate']))
    try {
      await refreshWorkspaceState(config)
    } catch (err) {
      console.error('Citation validation failed', err)
      setError('Unable to validate citations.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'citations-validate'))
    }
  }

  const handleSearch = async () => {
    const config = withToken()
    if (!config || !searchQuery) return
    setActionLoading((prev) => (prev.includes('search') ? prev : [...prev, 'search']))
    try {
      const client = withAppClient()
      if (!client?.search) return
      const response = await client.search(searchQuery)
      setSearchResults(Array.isArray(response) ? response : [])
    } catch (err) {
      console.error('Search failed', err)
      setError('Unable to search.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'search'))
    }
  }

  const handleCitationSave = async () => {
    const config = withToken()
    if (!config || !citationDraft) return
    const client = withWorkspaceClient()
    if (!client?.updateCitation) return
    setActionLoading((prev) => (prev.includes('citation-edit') ? prev : [...prev, 'citation-edit']))
    try {
      await client.updateCitation(citationDraft.id, {
        statement: citationDraft.statement,
        verseReferences: citationDraft.verseReferences
          ? citationDraft.verseReferences.split(',').map((item) => item.trim()).filter(Boolean)
          : [],
      })
      await refreshWorkspaceState(config)
      setEditingCitationId(null)
      setCitationDraft(null)
    } catch (err) {
      console.error('Failed to update citation', err)
      setError('Unable to save citation changes.')
    } finally {
      setActionLoading((prev) => prev.filter((item) => item !== 'citation-edit'))
    }
  }

  return {
    handleWorkspaceSave,
    handleOutlineSave,
    handleOutlineSelect,
    handleCitationValidate,
    handleSearch,
    handleCitationSave,
  }
}
