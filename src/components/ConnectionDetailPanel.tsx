'use client'

import { useState } from 'react'
import { X, ArrowRight, BookOpen, Sparkles } from 'lucide-react'

interface ConnectionDetailPanelProps {
  connection: {
    id: string
    source: string
    target: string
    type: string
    strength: string
    explanation: string
    canonicalSignificance: string
    direction?: string
    sourceEra: string
    targetEra: string
  }
  sourceNode: {
    reference: string
    label: string
  }
  targetNode: {
    reference: string
    label: string
  }
  onClose: () => void
  onOpenPassage: (reference: string) => void
  onAddToSermon: (reference: string) => void
  onExploreSimilar: () => void
}

const connectionTypeLabels: Record<string, string> = {
  direct_quotation: 'Direct Quotation',
  prophetic_fulfillment: 'Prophetic Fulfillment',
  typology: 'Typology',
  thematic_echo: 'Thematic Echo',
  covenant_development: 'Covenant Development',
  narrative_continuation: 'Narrative Continuation'
}

const connectionTypeColors: Record<string, string> = {
  direct_quotation: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
  prophetic_fulfillment: 'bg-red-500/20 text-red-200 border-red-400/40',
  typology: 'bg-purple-500/20 text-purple-200 border-purple-400/40',
  thematic_echo: 'bg-green-500/20 text-green-200 border-green-400/40',
  covenant_development: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/40',
  narrative_continuation: 'bg-gray-500/20 text-gray-200 border-gray-400/40'
}

const strengthColors: Record<string, string> = {
  strong: 'bg-red-500/20 text-red-200 border-red-400/40',
  moderate: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/40',
  weak: 'bg-blue-500/20 text-blue-200 border-blue-400/40'
}

export default function ConnectionDetailPanel({
  connection,
  sourceNode,
  targetNode,
  onClose,
  onOpenPassage,
  onAddToSermon,
  onExploreSimilar
}: ConnectionDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'connections' | 'preaching'>('overview')

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-black/95 border-l border-cyan-400/30 backdrop-blur-xl z-50 overflow-y-auto">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">Connection Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/10'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('connections')}
            className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
              activeTab === 'connections'
                ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/10'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Connections
          </button>
          <button
            onClick={() => setActiveTab('preaching')}
            className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
              activeTab === 'preaching'
                ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/10'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Preaching
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>

        {/* Connection Type */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-gray-400">Connection Type</p>
          <div className={`px-3 py-2 rounded-lg border ${connectionTypeColors[connection.type] || 'bg-gray-500/20 text-gray-200 border-gray-400/40'}`}>
            <p className="font-semibold">{connectionTypeLabels[connection.type] || connection.type}</p>
          </div>
        </div>

        {/* Strength */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-gray-400">Connection Strength</p>
          <div className={`px-3 py-2 rounded-lg border ${strengthColors[connection.strength] || 'bg-gray-500/20 text-gray-200 border-gray-400/40'}`}>
            <p className="font-semibold capitalize">{connection.strength}</p>
          </div>
        </div>

        {/* Passages */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-gray-400">Connected Passages</p>
          
          {/* Source */}
          <div className="border border-blue-400/40 rounded-lg p-3 bg-blue-500/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-blue-200">{sourceNode.label}</p>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-400/40">
                {connection.sourceEra}
              </span>
            </div>
            <button
              onClick={() => onOpenPassage(sourceNode.reference)}
              className="text-xs text-blue-300 hover:text-blue-200 flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              Open passage
            </button>
          </div>

          {/* Direction Arrow */}
          {connection.direction && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-cyan-400">
                <ArrowRight className="w-5 h-5" />
                <span className="text-xs uppercase tracking-wider">{connection.direction}</span>
              </div>
            </div>
          )}

          {/* Target */}
          <div className="border border-purple-400/40 rounded-lg p-3 bg-purple-500/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-purple-200">{targetNode.label}</p>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-400/40">
                {connection.targetEra}
              </span>
            </div>
            <button
              onClick={() => onOpenPassage(targetNode.reference)}
              className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              Open passage
            </button>
          </div>
        </div>

        {/* Explanation */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-gray-400">Explanation</p>
          <div className="border border-white/10 rounded-lg p-4 bg-black/30">
            <p className="text-sm text-gray-200 leading-relaxed">{connection.explanation}</p>
          </div>
        </div>

        {/* Canonical Significance */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-gray-400">Canonical Significance</p>
          <div className="border border-cyan-400/40 rounded-lg p-4 bg-cyan-500/10">
            <p className="text-sm text-cyan-100 leading-relaxed">{connection.canonicalSignificance}</p>
          </div>
        </div>
            </>
          )}

          {/* Connections Tab */}
          {activeTab === 'connections' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Theological Thread
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  This {connectionTypeLabels[connection.type] || connection.type} connection is part of a larger biblical narrative. Understanding how these passages relate helps trace God's redemptive plan through Scripture.
                </p>
              </div>

              <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2">
                  Connection Pattern
                </h4>
                <p className="text-sm text-gray-200">
                  {connection.direction === 'forward' 
                    ? `${sourceNode.label} points forward to its fulfillment in ${targetNode.label}, showing how God's promises unfold across redemptive history.`
                    : connection.direction === 'backward'
                    ? `${targetNode.label} looks back to ${sourceNode.label}, grounding New Testament truth in Old Testament foundation.`
                    : `${sourceNode.label} and ${targetNode.label} share a common theological theme that appears throughout Scripture.`
                  }
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Explore Further
                </h4>
                <button
                  onClick={onExploreSimilar}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 text-purple-200 border border-purple-400/40 rounded-lg hover:bg-purple-500/30 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Find Similar Connections</span>
                </button>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Discover other passages with the same connection type
                </p>
              </div>
            </div>
          )}

          {/* Preaching Tab */}
          {activeTab === 'preaching' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Sermon Application
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  This connection provides a powerful sermon illustration showing how Scripture interprets Scripture.
                </p>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-2">
                  Key Preaching Point
                </h4>
                <p className="text-sm text-gray-200 leading-relaxed">
                  {connection.canonicalSignificance}
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-yellow-300 uppercase tracking-wider mb-2">
                  Sermon Illustration Idea
                </h4>
                <p className="text-sm text-gray-200 leading-relaxed">
                  {connection.type === 'prophetic_fulfillment' 
                    ? `Show how God's promise in ${sourceNode.label} finds its ultimate fulfillment in ${targetNode.label}. This demonstrates God's faithfulness across centuries.`
                    : connection.type === 'typology'
                    ? `Use ${sourceNode.label} as a shadow or pattern that points forward to the reality revealed in ${targetNode.label}. This helps your congregation see Christ throughout the Old Testament.`
                    : connection.type === 'direct_quotation'
                    ? `Highlight how ${targetNode.label} directly quotes ${sourceNode.label}, showing the New Testament authors' deep engagement with Scripture.`
                    : connection.type === 'covenant_development'
                    ? `Trace how God's covenant promise develops from ${sourceNode.label} to ${targetNode.label}, revealing the progressive nature of God's redemptive plan.`
                    : connection.type === 'thematic_echo'
                    ? `Show how the same theological theme appears in both ${sourceNode.label} and ${targetNode.label}, demonstrating the unity of Scripture.`
                    : `Connect ${sourceNode.label} and ${targetNode.label} to show the narrative flow of redemptive history.`
                  }
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    onAddToSermon(sourceNode.reference)
                    onAddToSermon(targetNode.reference)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 rounded-lg hover:bg-cyan-500/30 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm font-medium">Add Both Passages to Sermon</span>
                </button>
                <p className="text-xs text-gray-400 text-center">
                  These passages will be added to your sermon references
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
