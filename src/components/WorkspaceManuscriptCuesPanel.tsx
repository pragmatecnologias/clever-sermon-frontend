'use client'

import type { ReactNode } from 'react'
import type { ManuscriptCues } from '@/components/workspace-page.helpers'
import { cueColorMap, cueIconMap, cueLabelMap, hasCueContent } from '@/components/workspace-page.helpers'

type WorkspaceManuscriptCuesPanelProps = {
  cues: ManuscriptCues
  editable: boolean
  collapsed: boolean
  setCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void
  onCueClick?: (cue: string, cueType: keyof ManuscriptCues, cueIndex: number) => void
  options?: {
    staleInfo?: { total: number; matched: number; stale: boolean } | null
    onRegenerateCues?: () => void
    regenerating?: boolean
  }
}

export default function WorkspaceManuscriptCuesPanel({
  cues,
  editable,
  collapsed,
  setCollapsed,
  onCueClick,
  options,
}: WorkspaceManuscriptCuesPanelProps) {
  if (!hasCueContent(cues) && !editable) return null

  const priorityCues: Array<keyof ManuscriptCues> = ['keyLine', 'cta', 'read', 'quote']
  const secondaryCues: Array<keyof ManuscriptCues> = ['transition', 'pause', 'slide']
  const totalCueCount = Object.values(cues).reduce((sum, items) => sum + items.length, 0)

  const renderCueSection = (keys: Array<keyof ManuscriptCues>, title: string): ReactNode => {
    const hasContent = keys.some((key) => cues[key]?.length > 0)
    if (!hasContent && !editable) return null

    return (
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">{title}</p>
        {keys.map((key) => {
          const values = cues[key]
          if (!editable && values.length === 0) return null
          const colors = cueColorMap[key]
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">{cueIconMap[key]}</span>
                <p className={`text-xs font-medium ${colors.text}`}>{cueLabelMap[key]}</p>
                {values.length > 0 && <span className="text-[10px] text-gray-500">({values.length})</span>}
              </div>
              <div className="space-y-1.5 pl-6">
                {values.length ? values.map((item, index) =>
                  onCueClick && !editable ? (
                    <button
                      key={`${key}-${index}`}
                      type="button"
                      onClick={() => onCueClick(item, key, index)}
                      className={`w-full text-left px-3 py-2 rounded-lg border ${colors.border} ${colors.bg} text-sm leading-relaxed hover:brightness-110 transition`}
                      title="Jump to this cue in manuscript"
                    >
                      {item}
                    </button>
                  ) : (
                    <div key={`${key}-${index}`} className={`px-3 py-2 rounded-lg border ${colors.border} ${colors.bg} text-sm leading-relaxed`}>
                      {item}
                    </div>
                  ),
                ) : editable ? (
                  <span className="text-[11px] text-gray-500 italic">None generated</span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-gradient-to-b from-black/30 to-black/10 sticky top-4 self-start max-h-[calc(100vh-1.5rem)] overflow-y-auto transition-all duration-300 ${
        collapsed ? 'p-2 w-16' : 'p-4 space-y-5'
      }`}
    >
      <div className={`flex ${collapsed ? 'flex-col items-center gap-2' : 'items-center justify-between'}`}>
        {!collapsed ? (
          <>
            <p className="text-sm font-semibold text-white">Preaching Cues</p>
            <span className="text-[10px] uppercase tracking-widest text-gray-500">Sidebar</span>
          </>
        ) : (
          <span className="text-[10px] uppercase tracking-widest text-gray-500 [writing-mode:vertical-rl] rotate-180">Cues</span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="cyber-outline text-[10px] px-2 py-1 rounded-full"
          title={collapsed ? 'Expand preaching cues' : 'Collapse preaching cues'}
        >
          {collapsed ? '›' : '‹'}
        </button>
        {collapsed ? <span className="text-[10px] text-cyan-300/80">{totalCueCount}</span> : null}
      </div>
      {!collapsed && editable && (
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Cues are generated with the manuscript based on your settings. Regenerate to update.
        </p>
      )}
      {!collapsed && options?.staleInfo?.stale ? (
        <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 space-y-2">
          <p className="text-xs text-amber-100">
            Cues may be outdated after manual edits ({options.staleInfo.matched}/{options.staleInfo.total} matched).
          </p>
          {options.onRegenerateCues ? (
            <button
              type="button"
              onClick={options.onRegenerateCues}
              disabled={options.regenerating}
              className="cyber-outline text-xs px-3 py-1.5 rounded-full disabled:opacity-60"
            >
              {options.regenerating ? 'Regenerating Cues...' : 'Regenerate Cues'}
            </button>
          ) : null}
        </div>
      ) : null}
      {!collapsed && (
        <>
          {renderCueSection(priorityCues, 'Key Moments')}
          {renderCueSection(secondaryCues, 'Delivery Notes')}
        </>
      )}
    </div>
  )
}
