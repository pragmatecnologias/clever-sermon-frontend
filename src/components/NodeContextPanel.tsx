'use client'

import { useState } from 'react'
import { X, BookOpen, Link2, Lightbulb, Plus, ExternalLink, ChevronRight } from 'lucide-react'

interface RelatedTheme {
  name: string
  category: string
}

interface RelatedNode {
  reference: string
  connectionType: string
}

interface NodeContextData {
  reference: string
  title?: string
  verseText: string
  connectionType?: string
  connectionExplanation?: string
  relatedThemes?: RelatedTheme[]
  relatedNodes?: RelatedNode[]
  preachingInsight?: string
}

interface NodeContextPanelProps {
  nodeData: NodeContextData | null
  visible: boolean
  onClose: () => void
  onAddToSermon?: (reference: string) => void
  onOpenPassage?: (reference: string) => void
  onExploreConnections?: (reference: string) => void
}

export default function NodeContextPanel({
  nodeData,
  visible,
  onClose,
  onAddToSermon,
  onOpenPassage,
  onExploreConnections,
}: NodeContextPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'connections' | 'preaching'>('overview')

  if (!visible || !nodeData) return null

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] bg-black/95 border-l border-cyan-400/40 shadow-2xl z-50 overflow-y-auto backdrop-blur-sm animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 border-b border-white/10 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-cyan-300">{nodeData.reference}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        {nodeData.title && (
          <p className="text-sm text-gray-300 font-medium">{nodeData.title}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/10'
              : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('connections')}
          className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
            activeTab === 'connections'
              ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/10'
              : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          Connections
        </button>
        <button
          onClick={() => setActiveTab('preaching')}
          className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
            activeTab === 'preaching'
              ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/10'
              : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          Preaching
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Verse Text */}
            <div className="bg-cyan-500/10 border border-cyan-400/40 rounded-xl p-4">
              <p className="text-xs uppercase tracking-widest text-cyan-300 mb-2">Passage Preview</p>
              {nodeData.verseText && nodeData.verseText.trim() ? (
                <p className="text-sm text-gray-200 leading-relaxed italic">
                  "{nodeData.verseText}"
                </p>
              ) : (
                <p className="text-sm text-gray-400 leading-relaxed">
                  {nodeData.title ? `Book of ${nodeData.title}` : 'Click "Open Full Passage" to view the complete text'}
                </p>
              )}
            </div>

            {/* Connection Type */}
            {nodeData.connectionType && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-purple-400" />
                  <p className="text-xs uppercase tracking-widest text-purple-300">Connection Type</p>
                </div>
                <p className="text-sm font-semibold text-purple-200 mb-2">{nodeData.connectionType}</p>
                {nodeData.connectionExplanation && (
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {nodeData.connectionExplanation}
                  </p>
                )}
              </div>
            )}

            {/* Related Themes */}
            {nodeData.relatedThemes && nodeData.relatedThemes.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Related Themes</p>
                <div className="flex flex-wrap gap-2">
                  {nodeData.relatedThemes.map((theme, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/40"
                    >
                      {theme.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <>
            {nodeData.relatedNodes && nodeData.relatedNodes.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Related Passages</p>
                {nodeData.relatedNodes.map((node, index) => (
                  <button
                    key={index}
                    onClick={() => onExploreConnections?.(node.reference)}
                    className="w-full flex items-center justify-between p-3 bg-black/40 border border-white/10 rounded-lg hover:border-cyan-400/40 hover:bg-cyan-500/5 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-cyan-300">{node.reference}</p>
                      <p className="text-xs text-gray-400">{node.connectionType}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                No related connections found
              </p>
            )}
          </>
        )}

        {/* Preaching Tab */}
        {activeTab === 'preaching' && (
          <>
            {nodeData.preachingInsight ? (
              <div className="bg-amber-500/10 border border-amber-400/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <p className="text-xs uppercase tracking-widest text-amber-300">Preaching Insight</p>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">
                  {nodeData.preachingInsight}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                No preaching insights available
              </p>
            )}
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-black/95 border-t border-white/10 p-4 space-y-2 backdrop-blur-sm">
        {onOpenPassage && (
          <button
            onClick={() => onOpenPassage(nodeData.reference)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 rounded-lg hover:bg-cyan-500/30 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm font-medium">Open Full Passage</span>
          </button>
        )}
        {onAddToSermon && (
          <button
            onClick={() => onAddToSermon(nodeData.reference)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-200 border border-purple-400/40 rounded-lg hover:bg-purple-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add to Sermon References</span>
          </button>
        )}
        {onExploreConnections && (
          <button
            onClick={() => onExploreConnections(nodeData.reference)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-200 border border-blue-400/40 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            <Link2 className="w-4 h-4" />
            <span className="text-sm font-medium">Explore Further Connections</span>
          </button>
        )}
      </div>
    </div>
  )
}
