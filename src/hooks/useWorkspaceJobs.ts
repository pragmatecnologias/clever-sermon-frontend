'use client'

import { useEffect } from 'react'
import type { WorkspaceStateResponse } from '@/lib/api/openapi-client'

type WorkspaceManuscriptRepairJobState = {
  manuscriptId: string
  jobId: string
  status: string
  state?: string
  message?: string
} | null

type WorkspaceGenerationJobState = {
  capability: string
  jobId: string
  status: string
  state?: string
  message?: string
} | null

type WorkspaceJobsDeps = {
  workspaceId: string
  repairJob: WorkspaceManuscriptRepairJobState
  generationJob: WorkspaceGenerationJobState
  workspaceApiClient: () => {
    get: <T>(path: string) => Promise<T>
    getGenerationJobStatus: (workspaceId: string, jobId: string) => Promise<Record<string, unknown>>
  } | null
  refreshWorkspaceState: (config: Record<string, unknown>) => Promise<WorkspaceStateResponse | null>
  withToken: () => Record<string, unknown> | null
  setError: (value: string | null) => void
  setRepairJob: (value: WorkspaceManuscriptRepairJobState | ((prev: WorkspaceManuscriptRepairJobState) => WorkspaceManuscriptRepairJobState)) => void
  setGenerationJob: (value: WorkspaceGenerationJobState | ((prev: WorkspaceGenerationJobState) => WorkspaceGenerationJobState)) => void
  setSermonCoreGenerating: (value: boolean) => void
  setActionLoading: (value: (prev: string[]) => string[]) => void
  setLastRepairNotice: (value: {
    manuscriptId: string
    repairedCount: number
    remainingCount: number
    lastRepairedAt: string
  } | null) => void
  setManuscriptQualityExpanded: (value: (prev: Record<string, boolean>) => Record<string, boolean>) => void
}

export function useWorkspaceJobs({
  workspaceId,
  repairJob,
  generationJob,
  workspaceApiClient,
  refreshWorkspaceState,
  withToken,
  setError,
  setRepairJob,
  setGenerationJob,
  setSermonCoreGenerating,
  setActionLoading,
  setLastRepairNotice,
  setManuscriptQualityExpanded,
}: WorkspaceJobsDeps) {
  useEffect(() => {
    if (!repairJob?.jobId || !repairJob?.manuscriptId) return
    const config = withToken()
    if (!config) return

    const poll = async () => {
      try {
        const client = workspaceApiClient()
        if (!client) return
        const data = await client.get<Record<string, unknown>>(
          `/workspaces/${workspaceId}/manuscripts/${repairJob.manuscriptId}/repair/jobs/${repairJob.jobId}`,
        )
        const nextStatus = String(data.status || data.state || '').toLowerCase()
        setRepairJob((prev) =>
          prev
            ? {
                ...prev,
                status: nextStatus || prev.status,
                state: String(data.state || prev.state || ''),
                message: String(data.message || ''),
              }
            : prev,
        )

        if (nextStatus === 'completed') {
          const refreshedWorkspace = await client.get<Record<string, unknown>>(`/workspaces/${workspaceId}`)
          const manuscripts = Array.isArray(refreshedWorkspace?.manuscripts) ? refreshedWorkspace.manuscripts : []
          const refreshedManuscript = manuscripts.find(
            (item) => String((item as { id?: string })?.id || '') === String(repairJob.manuscriptId || ''),
          ) as
            | {
                id?: string
                content?: {
                  metadata?: {
                    quality?: {
                      repairedIssues?: unknown[]
                      remainingIssues?: unknown[]
                    }
                    repair?: {
                      lastRepairedAt?: string
                    }
                  }
                }
              }
            | undefined

          if (refreshedManuscript?.id) {
            const repairedCount = Array.isArray(refreshedManuscript?.content?.metadata?.quality?.repairedIssues)
              ? refreshedManuscript.content.metadata.quality.repairedIssues.length
              : 0
            const remainingCount = Array.isArray(refreshedManuscript?.content?.metadata?.quality?.remainingIssues)
              ? refreshedManuscript.content.metadata.quality.remainingIssues.length
              : 0
            const lastRepairedAt = String(
              refreshedManuscript?.content?.metadata?.repair?.lastRepairedAt || new Date().toISOString(),
            )
            setLastRepairNotice({
              manuscriptId: refreshedManuscript.id,
              repairedCount,
              remainingCount,
              lastRepairedAt,
            })
            setManuscriptQualityExpanded((prev) => ({
              ...prev,
              [String(refreshedManuscript.id)]: true,
            }))
          }
          setError(null)
          setRepairJob(null)
        } else if (nextStatus === 'failed') {
          setError(String(data.error || 'Repair job failed.'))
          setRepairJob(null)
        }
      } catch (err) {
        console.error('Failed to poll repair job status', err)
        setError('Unable to track repair progress.')
        setRepairJob(null)
      }
    }

    poll()
    const timer = window.setInterval(poll, 2000)
    return () => window.clearInterval(timer)
  }, [
    repairJob?.jobId,
    repairJob?.manuscriptId,
    workspaceId,
    withToken,
    workspaceApiClient,
    setError,
    setRepairJob,
    setLastRepairNotice,
    setManuscriptQualityExpanded,
  ])

  useEffect(() => {
    console.log('[useWorkspaceJobs] Generation job effect running, generationJob:', JSON.stringify(generationJob))
    if (!generationJob?.jobId) return
    const config = withToken()
    if (!config) return
    const capability = generationJob.capability

    const poll = async () => {
      try {
        const client = workspaceApiClient()
        if (!client) return
        console.log('[useWorkspaceJobs] Polling job:', generationJob.jobId, 'capability:', capability)
        const data = await client.getGenerationJobStatus(workspaceId, generationJob.jobId)
        console.log('[useWorkspaceJobs] Job response:', JSON.stringify(data))
        const nextStatus = String(data.status || data.state || '').toLowerCase()
        setGenerationJob((prev) =>
          prev
            ? {
                ...prev,
                status: nextStatus || prev.status,
                state: String(data.state || prev.state || ''),
                message: String(data.message || ''),
              }
            : prev,
        )

        if (nextStatus === 'completed') {
          await refreshWorkspaceState(config)
          if (capability === 'sermon-core') {
            setSermonCoreGenerating(false)
          }
          setGenerationJob(null)
          setActionLoading((prev) => prev.filter((item) => item !== capability))
        } else if (nextStatus === 'failed') {
          setError(String(data.error || 'Generation job failed.'))
          if (capability === 'sermon-core') {
            setSermonCoreGenerating(false)
          }
          setGenerationJob(null)
          setActionLoading((prev) => prev.filter((item) => item !== capability))
        }
      } catch (err) {
        setError('Unable to track generation progress.')
        if (capability === 'sermon-core') {
          setSermonCoreGenerating(false)
        }
        setGenerationJob(null)
        setActionLoading((prev) => prev.filter((item) => item !== capability))
      }
    }

    poll()
    const timer = window.setInterval(poll, 2000)
    return () => window.clearInterval(timer)
  }, [
    generationJob?.jobId,
    generationJob?.capability,
    workspaceId,
    withToken,
    workspaceApiClient,
    refreshWorkspaceState,
    setError,
    setGenerationJob,
    setSermonCoreGenerating,
    setActionLoading,
  ])
}
