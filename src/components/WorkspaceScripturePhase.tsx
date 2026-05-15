'use client'

import type { ReactNode } from 'react'

interface WorkspaceScripturePhaseProps {
  children: ReactNode
}

function ScriptureSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-300/90">{title}</p>
      </div>
      {children}
    </section>
  )
}

export default function WorkspaceScripturePhase({ children }: WorkspaceScripturePhaseProps) {
  return <div className="space-y-4 relative min-h-full">{children}</div>
}

export { ScriptureSection }
