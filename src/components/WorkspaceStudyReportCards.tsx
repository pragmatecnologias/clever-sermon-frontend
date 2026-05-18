import type { ReactNode } from 'react'
import type { WorkspaceFeatureReadiness } from '@/lib/api/openapi-client'
import FeatureStatusBadge from '@/components/FeatureStatusBadge'

export function StudyAssetBoxes<T>({
  items,
  keyName,
  emptyText,
  expandedTextBlocks,
  toggleTextBlock,
  options,
}: {
  items: T[]
  keyName: string
  emptyText: string
  expandedTextBlocks: Record<string, boolean>
  toggleTextBlock: (key: string) => void
  options?: {
    accentClass?: string
    itemClassName?: string
    renderItem?: (item: T, index: number) => ReactNode
  }
}) {
  const values = Array.isArray(items) ? items.filter(Boolean) : []
  if (!values.length) {
    return <p className="text-xs text-gray-300">{emptyText}</p>
  }

  const expanded = !!expandedTextBlocks[keyName]
  const visible = expanded ? values : values.slice(0, 3)

  return (
    <div className="space-y-2">
      {visible.map((item, index) => (
        <div key={`${keyName}-${index}`} className={options?.itemClassName || 'border border-white/10 rounded-lg p-3 bg-black/30'}>
          {options?.renderItem ? (
            options.renderItem(item, index)
          ) : (
            <p className={`text-sm leading-relaxed ${options?.accentClass || 'text-gray-100/90'}`}>{String(item)}</p>
          )}
        </div>
      ))}
      {values.length > 3 && (
        <button
          onClick={() => toggleTextBlock(keyName)}
          className="cyber-outline text-[10px] px-2 py-1 rounded-full"
        >
          {expanded ? 'Show fewer' : `Show ${values.length - 3} more`}
        </button>
      )}
    </div>
  )
}

export function StudyAssetCard({
  title,
  icon,
  primaryActionLabel,
  onPrimaryAction,
  body,
  secondaryActionLabel,
  onSecondaryAction,
  isLoading,
  loadingLabel,
  disableActions,
  status,
  statusReason,
  resultCount,
  readiness,
}: {
  title: string
  icon: ReactNode
  primaryActionLabel: string
  onPrimaryAction: () => void
  body: ReactNode
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  isLoading: boolean
  loadingLabel: string
  disableActions?: boolean
  status?: 'Ready' | 'Needs prerequisite' | 'Loading' | 'Generated' | 'Empty because no data exists' | 'Unavailable because service/data is not configured' | 'Failed with retry'
  statusReason?: string
  resultCount?: number
  readiness?: WorkspaceFeatureReadiness | null
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-cyan-200">{icon}</div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">{title}</p>
            {typeof resultCount === 'number' ? (
              <p className="text-[11px] uppercase tracking-[0.25em] text-gray-400">{resultCount} item{resultCount === 1 ? '' : 's'}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {secondaryActionLabel && onSecondaryAction ? (
            <button
              onClick={onSecondaryAction}
              disabled={disableActions}
              className="cyber-outline text-xs px-3 py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {secondaryActionLabel}
            </button>
          ) : null}
          <button
            onClick={onPrimaryAction}
            disabled={disableActions}
            className="cyber-outline text-xs px-3 py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {primaryActionLabel}
          </button>
        </div>
      </div>
      {status || readiness ? <FeatureStatusBadge status={status} reason={statusReason} readiness={readiness} /> : null}
      {isLoading ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-cyan-200/80">
            <span>{loadingLabel}</span>
            <span>In progress</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-500 animate-pulse rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-3 rounded bg-white/10 animate-pulse w-5/6" />
            <div className="h-3 rounded bg-white/10 animate-pulse w-3/4" />
            <div className="h-3 rounded bg-white/10 animate-pulse w-2/3" />
          </div>
        </div>
      ) : (
        <div>{body}</div>
      )}
    </div>
  )
}
