'use client'

import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import axios from 'axios'
import TheologicalCenterPanel from './TheologicalCenterPanel'
import TensionMappingPanel from './TensionMappingPanel'
import DoctrinalPrecisionPanel from './DoctrinalPrecisionPanel'
import BlindSpotPanel from './BlindSpotPanel'
import PreachingStrategyPanel from './PreachingStrategyPanel'
import HistoricalContextPanel from './HistoricalContextPanel'

interface SermonMentorDashboardProps {
  workspaceId: string
  token: string
}

export default function SermonMentorDashboard({ workspaceId, token }: SermonMentorDashboardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['theological-center']))
  const [runningAll, setRunningAll] = useState(false)

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const runAllAnalyses = async () => {
    setRunningAll(true)
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/run-all/${workspaceId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // Expand all sections to show results
      setExpandedSections(new Set([
        'theological-center',
        'tension-mapping',
        'doctrinal-precision',
        'blind-spots',
        'preaching-strategy',
        'historical-context'
      ]))
    } catch (err) {
      console.error('Failed to run all analyses:', err)
    } finally {
      setRunningAll(false)
    }
  }

  const sections = [
    {
      id: 'theological-center',
      title: 'Theological Center',
      description: 'Is your sermon orbiting the passage\'s dominant center?',
      component: TheologicalCenterPanel,
      color: 'purple'
    },
    {
      id: 'tension-mapping',
      title: 'Tension Mapping',
      description: 'Are you preserving tension before resolving it?',
      component: TensionMappingPanel,
      color: 'orange'
    },
    {
      id: 'doctrinal-precision',
      title: 'Doctrinal Precision',
      description: 'Is your theology consistent with SDA doctrine?',
      component: DoctrinalPrecisionPanel,
      color: 'blue'
    },
    {
      id: 'blind-spots',
      title: 'Blind Spots',
      description: 'What is your sermon NOT saying?',
      component: BlindSpotPanel,
      color: 'gray'
    },
    {
      id: 'preaching-strategy',
      title: 'Preaching Strategy',
      description: 'What genre and approach fits this passage?',
      component: PreachingStrategyPanel,
      color: 'indigo'
    },
    {
      id: 'historical-context',
      title: 'Historical Context',
      description: 'Specific social realities, not generic summaries',
      component: HistoricalContextPanel,
      color: 'amber'
    }
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-7 h-7 text-purple-400" />
              <h2 className="text-2xl font-bold text-purple-100">Sermon Mentor</h2>
            </div>
            <p className="text-gray-300">
              Opinionated analysis that prunes, challenges, and sharpens your sermon
            </p>
          </div>
          <button
            onClick={runAllAnalyses}
            disabled={runningAll}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-purple-800 disabled:to-indigo-800 rounded-lg text-white font-semibold transition-all shadow-lg flex items-center gap-2"
          >
            {runningAll ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Running All Analyses...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Run All Analyses
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Sections */}
      <div className="space-y-3">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id)
          const Component = section.component

          return (
            <div key={section.id} className="border border-gray-700/50 rounded-xl overflow-hidden bg-black/20">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full bg-${section.color}-400`} />
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-100">{section.title}</h3>
                    <p className="text-sm text-gray-400">{section.description}</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div className="px-6 pb-6">
                  <Component workspaceId={workspaceId} token={token} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Info Footer */}
      <div className="bg-gradient-to-r from-gray-900/50 to-slate-900/50 border border-gray-700/50 rounded-xl p-5">
        <p className="text-sm text-gray-400 text-center">
          <span className="font-semibold text-gray-300">Depth comes from pruning, not adding.</span>
          {' '}This mentor exposes weaknesses, forces clarity, and tracks your growth over time.
        </p>
      </div>
    </div>
  )
}
