import type {
  WorkspaceFeatureReadiness,
  WorkspaceFeatureReadinessMap,
  WorkspaceFeatureReadinessStatus,
} from '@/lib/api/openapi-client'

export type FeatureStatusBadgeLabel =
  | 'Ready'
  | 'Needs prerequisite'
  | 'Loading'
  | 'Generated'
  | 'Empty because no data exists'
  | 'Unavailable because service/data is not configured'
  | 'Failed with retry'

export const mapFeatureReadinessStatus = (status?: WorkspaceFeatureReadinessStatus | null): FeatureStatusBadgeLabel | null => {
  switch (status) {
    case 'ready':
      return 'Ready'
    case 'generated':
      return 'Generated'
    case 'needs_prerequisite':
      return 'Needs prerequisite'
    case 'needs_data':
      return 'Empty because no data exists'
    case 'needs_service':
      return 'Unavailable because service/data is not configured'
    case 'failed':
      return 'Failed with retry'
    default:
      return null
  }
}

export const getFeatureReadiness = (
  readiness: WorkspaceFeatureReadinessMap | null | undefined,
  key: keyof WorkspaceFeatureReadinessMap,
): WorkspaceFeatureReadiness | null => readiness?.[key] || null

export const getFeatureStatusLabel = (
  readiness?: WorkspaceFeatureReadiness | null,
  fallback?: FeatureStatusBadgeLabel,
): FeatureStatusBadgeLabel => mapFeatureReadinessStatus(readiness?.status) || fallback || 'Ready'
