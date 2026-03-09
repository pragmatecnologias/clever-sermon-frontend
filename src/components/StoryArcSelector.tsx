'use client'

interface StoryArcSelectorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function StoryArcSelector({ value, onChange, className = '' }: StoryArcSelectorProps) {
  const storyArcs = [
    { value: 'problem_truth_response', label: 'Problem → Truth → Response' },
    { value: 'tension_turn_resolution', label: 'Tension → Turn → Resolution' },
    { value: 'question_discovery_answer', label: 'Question → Discovery → Answer' },
    { value: 'challenge_journey_transformation', label: 'Challenge → Journey → Transformation' },
    { value: 'expository_text_driven', label: 'Expository (Text-Driven)' },
    { value: 'narrative_progression', label: 'Narrative Progression' },
    { value: 'apologetic_argument', label: 'Apologetic Argument' }
  ]

  return (
    <div className={className}>
      <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
        Story Arc
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 focus:border-cyan-400/40 focus:outline-none"
      >
        <option value="">Select Story Arc...</option>
        {storyArcs.map(arc => (
          <option key={arc.value} value={arc.value}>
            {arc.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-1">
        Choose the narrative structure for your sermon
      </p>
    </div>
  )
}
