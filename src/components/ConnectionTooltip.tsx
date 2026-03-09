'use client'

interface ConnectionData {
  id: string
  type: 'direct_quotation' | 'prophetic_fulfillment' | 'typology' | 'thematic_echo' | 'covenant_development' | 'narrative_continuation'
  strength: 'strong' | 'moderate' | 'weak'
  explanation: string
  canonicalSignificance: string
  fromReference: string
  toReference: string
  sourceEra?: string
  targetEra?: string
}

interface ConnectionTooltipProps {
  connectionData: ConnectionData | null
  position: { x: number; y: number }
  visible: boolean
}

export default function ConnectionTooltip({ connectionData, position, visible }: ConnectionTooltipProps) {
  if (!visible || !connectionData) return null

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      direct_quotation: 'Direct Quotation',
      prophetic_fulfillment: 'Prophetic Fulfillment',
      typology: 'Typology',
      thematic_echo: 'Thematic Echo',
      covenant_development: 'Covenant Development',
      narrative_continuation: 'Narrative Continuation'
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      direct_quotation: 'text-cyan-400 border-cyan-400/40 bg-cyan-500/10',
      prophetic_fulfillment: 'text-red-400 border-red-400/40 bg-red-500/10',
      typology: 'text-purple-400 border-purple-400/40 bg-purple-500/10',
      thematic_echo: 'text-green-400 border-green-400/40 bg-green-500/10',
      covenant_development: 'text-yellow-400 border-yellow-400/40 bg-yellow-500/10',
      narrative_continuation: 'text-gray-400 border-gray-400/40 bg-gray-500/10'
    }
    return colors[type] || 'text-gray-400 border-gray-400/40 bg-gray-500/10'
  }

  const getStrengthColor = (strength: string) => {
    const colors: Record<string, string> = {
      strong: 'text-red-400',
      moderate: 'text-yellow-400',
      weak: 'text-blue-400'
    }
    return colors[strength] || 'text-gray-400'
  }

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(12px, -120%)',
      }}
    >
      <div className="bg-black/95 border border-cyan-400/40 rounded-lg p-4 shadow-2xl backdrop-blur-sm max-w-[320px] mb-2 animate-in fade-in duration-150">
        {/* Connection Type */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${getTypeColor(connectionData.type)}`}>
            {getTypeLabel(connectionData.type)}
          </span>
          <span className={`text-xs font-bold uppercase ${getStrengthColor(connectionData.strength)}`}>
            {connectionData.strength}
          </span>
        </div>

        {/* References with Eras */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-300 font-medium">{connectionData.fromReference}</span>
            {connectionData.sourceEra && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-400/30">
                {connectionData.sourceEra}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 pl-2">
            <span className="text-xs text-gray-400">→</span>
            <span className="text-xs text-purple-300 font-medium">{connectionData.toReference}</span>
            {connectionData.targetEra && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-400/30">
                {connectionData.targetEra}
              </span>
            )}
          </div>
        </div>

        {/* Explanation */}
        {connectionData.explanation && (
          <div className="mb-3">
            <p className="text-xs text-gray-300 leading-relaxed">
              {connectionData.explanation}
            </p>
          </div>
        )}

        {/* Canonical Significance */}
        {connectionData.canonicalSignificance && (
          <div className="pt-2 border-t border-white/10">
            <p className="text-[10px] text-cyan-300 leading-relaxed italic">
              {connectionData.canonicalSignificance}
            </p>
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-white/10">
          <p className="text-[10px] text-gray-500 text-center">Click connection for details</p>
        </div>
      </div>
      {/* Arrow pointing down */}
      <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-cyan-400/40 mx-auto"></div>
    </div>
  )
}
