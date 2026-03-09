'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Link2 } from 'lucide-react'

interface NodeData {
  reference: string
  title?: string
  theme?: string
  snippet?: string
  connectionType?: string
  connectionStrength?: 'strong' | 'medium' | 'weak'
  explanation?: string
}

interface NodeHoverPreviewProps {
  nodeData: NodeData | null
  position: { x: number; y: number }
  visible: boolean
}

export default function NodeHoverPreview({ nodeData, position, visible }: NodeHoverPreviewProps) {
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  useEffect(() => {
    if (!visible || !nodeData) return

    const padding = 20
    const previewWidth = 320
    const previewHeight = 200

    let x = position.x + 20
    let y = position.y + 20

    if (x + previewWidth > window.innerWidth - padding) {
      x = position.x - previewWidth - 20
    }

    if (y + previewHeight > window.innerHeight - padding) {
      y = position.y - previewHeight - 20
    }

    setAdjustedPosition({ x, y })
  }, [position, visible, nodeData])

  if (!visible || !nodeData) return null

  const getStrengthColor = (strength?: string) => {
    switch (strength) {
      case 'strong':
        return 'text-green-400 border-green-400/40 bg-green-500/10'
      case 'medium':
        return 'text-amber-400 border-amber-400/40 bg-amber-500/10'
      case 'weak':
        return 'text-gray-400 border-gray-400/40 bg-gray-500/10'
      default:
        return 'text-cyan-400 border-cyan-400/40 bg-cyan-500/10'
    }
  }

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      <div className="bg-black/95 border border-cyan-400/40 rounded-xl p-4 shadow-2xl backdrop-blur-sm max-w-[320px] animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-semibold text-cyan-300">{nodeData.reference}</h4>
        </div>

        {/* Title */}
        {nodeData.title && (
          <p className="text-xs text-gray-300 mb-2 font-medium">{nodeData.title}</p>
        )}

        {/* Theme */}
        {nodeData.theme && (
          <div className="mb-2">
            <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/40">
              {nodeData.theme}
            </span>
          </div>
        )}

        {/* Snippet */}
        {nodeData.snippet && (
          <p className="text-xs text-gray-400 mb-3 leading-relaxed italic">
            "{nodeData.snippet}"
          </p>
        )}

        {/* Connection Info */}
        {nodeData.connectionType && (
          <div className="border-t border-white/10 pt-2 mt-2">
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-cyan-300">Connection</span>
            </div>
            <p className="text-xs text-gray-300 mb-1">{nodeData.connectionType}</p>
            {nodeData.connectionStrength && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStrengthColor(nodeData.connectionStrength)}`}>
                {nodeData.connectionStrength} strength
              </span>
            )}
          </div>
        )}

        {/* Explanation */}
        {nodeData.explanation && (
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            {nodeData.explanation}
          </p>
        )}

        {/* Hint */}
        <p className="text-[10px] text-gray-500 mt-3 text-center">
          Click to explore further
        </p>
      </div>
    </div>
  )
}
