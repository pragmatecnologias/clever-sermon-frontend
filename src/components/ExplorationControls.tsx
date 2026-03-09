'use client'

import { useState } from 'react'
import { Filter, Eye, EyeOff, Maximize2, Minimize2, RotateCcw } from 'lucide-react'

interface FilterOptions {
  strongestOnly: boolean
  directQuotation: boolean
  propheticFulfillment: boolean
  typology: boolean
  thematicEcho: boolean
  covenantDevelopment: boolean
  narrativeContinuation: boolean
  showLabels: boolean
  testament: 'all' | 'OT' | 'NT'
  theme: string
}

interface ExplorationControlsProps {
  filters: FilterOptions
  onFilterChange: (filters: FilterOptions) => void
  onResetView?: () => void
  onFocusMode?: () => void
  focusModeActive?: boolean
}

export default function ExplorationControls({
  filters,
  onFilterChange,
  onResetView,
  onFocusMode,
  focusModeActive = false,
}: ExplorationControlsProps) {
  const [expanded, setExpanded] = useState(false)

  const toggleFilter = (key: keyof FilterOptions) => {
    if (key === 'testament' || key === 'theme') return
    onFilterChange({
      ...filters,
      [key]: !filters[key],
    })
  }

  const activeCount = [
    filters.strongestOnly,
    !filters.directQuotation,
    !filters.propheticFulfillment,
    !filters.typology,
    !filters.thematicEcho,
    !filters.covenantDevelopment,
    !filters.narrativeContinuation,
    !filters.showLabels,
    filters.testament !== 'all',
    filters.theme !== 'all',
  ].filter(Boolean).length

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-black/95 border border-cyan-400/40 rounded-xl shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 px-4 py-3 w-full hover:bg-white/5 transition-colors rounded-t-xl"
        >
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-cyan-300">Filters</span>
          <span className="ml-auto text-xs text-gray-400">
            {activeCount} active
          </span>
        </button>

        {/* Expanded Controls */}
        {expanded && (
          <div className="border-t border-white/10 p-4 space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Filters</p>
              
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.strongestOnly}
                  onChange={() => toggleFilter('strongestOnly')}
                  className="w-4 h-4 rounded border-gray-600 bg-black/40 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors">
                  Strongest connections only
                </span>
              </label>

              <div className="border-t border-white/10 pt-2 mt-2">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Connection Types</p>
                
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.directQuotation}
                    onChange={() => toggleFilter('directQuotation')}
                    className="w-4 h-4 rounded border-gray-600 bg-black/40 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                  />
                  <div className="w-3 h-0.5 bg-cyan-400"></div>
                  <span className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors">
                    Direct Quotation
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.propheticFulfillment}
                    onChange={() => toggleFilter('propheticFulfillment')}
                    className="w-4 h-4 rounded border-gray-600 bg-black/40 text-red-500 focus:ring-red-500 focus:ring-offset-0"
                  />
                  <div className="w-3 h-0.5 bg-red-400 shadow-[0_0_4px_rgba(239,68,68,0.5)]"></div>
                  <span className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors">
                    Prophetic Fulfillment
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.typology}
                    onChange={() => toggleFilter('typology')}
                    className="w-4 h-4 rounded border-gray-600 bg-black/40 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                  />
                  <div className="w-3 h-0.5 border-t-2 border-dashed border-purple-400"></div>
                  <span className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors">
                    Typology
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.thematicEcho}
                    onChange={() => toggleFilter('thematicEcho')}
                    className="w-4 h-4 rounded border-gray-600 bg-black/40 text-green-500 focus:ring-green-500 focus:ring-offset-0"
                  />
                  <div className="w-3 h-0.5 border-t-2 border-dotted border-green-400"></div>
                  <span className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors">
                    Thematic Echo
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.covenantDevelopment}
                    onChange={() => toggleFilter('covenantDevelopment')}
                    className="w-4 h-4 rounded border-gray-600 bg-black/40 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-0"
                  />
                  <div className="w-3 h-0.5 bg-yellow-400 shadow-[0_0_4px_rgba(251,191,36,0.5)]"></div>
                  <span className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors">
                    Covenant Development
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.narrativeContinuation}
                    onChange={() => toggleFilter('narrativeContinuation')}
                    className="w-4 h-4 rounded border-gray-600 bg-black/40 text-gray-500 focus:ring-gray-500 focus:ring-offset-0"
                  />
                  <div className="w-3 h-0.5 bg-gray-400"></div>
                  <span className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors">
                    Narrative Continuation
                  </span>
                </label>
              </div>

              <label className="flex items-center gap-2 cursor-pointer group border-t border-white/10 pt-2 mt-2">
                <input
                  type="checkbox"
                  checked={filters.showLabels}
                  onChange={() => toggleFilter('showLabels')}
                  className="w-4 h-4 rounded border-gray-600 bg-black/40 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors">
                  Show labels
                </span>
              </label>

              <div className="border-t border-white/10 pt-2 mt-2 space-y-2">
                <p className="text-xs uppercase tracking-widest text-gray-400">Testament</p>
                <select
                  value={filters.testament}
                  onChange={(e) => onFilterChange({ ...filters, testament: e.target.value as 'all' | 'OT' | 'NT' })}
                  className="w-full bg-black/40 border border-white/15 rounded-md px-2 py-1.5 text-xs text-gray-200"
                >
                  <option value="all">All</option>
                  <option value="OT">Old Testament</option>
                  <option value="NT">New Testament</option>
                </select>

                <p className="text-xs uppercase tracking-widest text-gray-400">Theme</p>
                <select
                  value={filters.theme}
                  onChange={(e) => onFilterChange({ ...filters, theme: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-md px-2 py-1.5 text-xs text-gray-200"
                >
                  <option value="all">All themes</option>
                  <option value="grace">Grace</option>
                  <option value="covenant">Covenant</option>
                  <option value="redemption">Redemption</option>
                  <option value="new_creation">New Creation</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
