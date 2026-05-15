'use client'

import type { ReactNode } from 'react'
import { Book } from 'lucide-react'

interface WorkspaceManuscriptPhaseProps {
  workspace: {
    egwEnabled?: boolean
  } | null
  children: ReactNode
}

export default function WorkspaceManuscriptPhase({ workspace, children }: WorkspaceManuscriptPhaseProps) {
  return (
    <div className="space-y-4 relative min-h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold">Manuscript</h3>
          {workspace?.egwEnabled && (
            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/40 flex items-center gap-1">
              <Book className="w-3 h-3" />
              EGW Enabled
            </span>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
