'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import NodeContextPanel from './NodeContextPanel'

interface BiblicalNarrativeMapProps {
  focusPassage?: string
}

const themeOptions = [
  { value: 'grace', label: 'Grace' },
  { value: 'covenant', label: 'Covenant' },
  { value: 'kingdom', label: 'Kingdom' },
  { value: 'redemption', label: 'Redemption' },
  { value: 'new_creation', label: 'New Creation' },
]

export default function BiblicalNarrativeMap({ focusPassage }: BiblicalNarrativeMapProps) {
  const [theme, setTheme] = useState('grace')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [selectedNode, setSelectedNode] = useState<any | null>(null)
  const [panelVisible, setPanelVisible] = useState(false)

  useEffect(() => {
    if (!focusPassage) return
    loadMap(theme)
  }, [focusPassage, theme])

  const loadMap = async (nextTheme: string) => {
    if (!focusPassage) return
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const url = `${process.env.NEXT_PUBLIC_API_URL}/visualization/biblical-narrative-map?focusPassage=${encodeURIComponent(
        focusPassage,
      )}&theme=${encodeURIComponent(nextTheme)}`

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await response.json()
      setData(json)
    } catch (error) {
      console.error('Error loading biblical narrative map:', error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const nodesByStage = useMemo(() => {
    const map = new Map<string, any[]>()
    for (const node of data?.nodes || []) {
      const stage = node.stage || 'Church'
      if (!map.has(stage)) map.set(stage, [])
      map.get(stage)!.push(node)
    }
    return map
  }, [data])

  const handleNodeClick = (node: any) => {
    setSelectedNode({
      reference: node.reference,
      title: node.label,
      verseText: node.verseText || '',
      connectionType: node.relationType || node.kind || 'Narrative Link',
      connectionExplanation: node.explanation || `Narrative stage: ${node.stage}`,
      relatedThemes: (node.themes || []).map((theme: string) => ({ name: theme, category: 'canonical' })),
      relatedNodes: [],
      preachingInsight: node.explanation || `Use ${node.reference} to show how this stage contributes to redemptive history.`,
    })
    setPanelVisible(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {themeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={`px-3 py-1.5 rounded-full text-xs border transition ${
              theme === option.value
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                : 'bg-black/20 border-white/10 text-gray-300 hover:border-cyan-400/30'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-52 rounded-xl border border-white/10 bg-black/20 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-cyan-300 animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4 overflow-x-auto">
          <div className="min-w-[920px] flex items-start gap-4">
            {(data?.timeline || []).map((stage: any, index: number) => (
              <div
                key={`${stage.stage}-${index}`}
                className={`flex-1 min-h-[220px] rounded-xl border p-3 ${
                  stage.isFocusStage
                    ? 'border-cyan-400/60 bg-cyan-500/10'
                    : 'border-white/10 bg-black/30'
                }`}
              >
                <p className="text-xs uppercase tracking-widest text-cyan-200 mb-3">{stage.stage}</p>
                <div className="space-y-2">
                  {(nodesByStage.get(stage.stage) || []).map((node: any) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => handleNodeClick(node)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg border text-sm transition ${
                        node.kind === 'focus_passage'
                          ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100'
                          : 'border-white/15 bg-black/30 text-gray-100 hover:border-cyan-400/40'
                      }`}
                    >
                      {node.reference}
                    </button>
                  ))}
                  {(nodesByStage.get(stage.stage) || []).length === 0 && (
                    <p className="text-xs text-gray-500">No nodes</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <NodeContextPanel
        nodeData={selectedNode}
        visible={panelVisible}
        onClose={() => setPanelVisible(false)}
        onAddToSermon={(reference) => console.log('Add to sermon refs:', reference)}
        onOpenPassage={(reference) => console.log('Open passage inline:', reference)}
        onExploreConnections={(reference) => console.log('Explore related nodes inline:', reference)}
      />
    </div>
  )
}

