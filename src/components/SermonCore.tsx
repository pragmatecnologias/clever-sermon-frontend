'use client'

import { useState, useEffect } from 'react'
import { Target, Heart, Lightbulb, Users, Sparkles, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

export interface SermonCoreData {
  bigIdea: string
  fallenCondition: string
  centralTruth: string
  sermonGoal: string
  audienceNeed: string
}

interface SermonCoreProps {
  workspaceId: string
  mainPassage: string
  theme?: string
  theologicalLens?: string
  studyReport?: any
  initialData?: SermonCoreData
  onDataChange?: (data: SermonCoreData) => void
  onGenerate?: () => Promise<SermonCoreData | null>
  onUseInOutline?: () => void
  isGenerating?: boolean
}

const emptyCore: SermonCoreData = {
  bigIdea: '',
  fallenCondition: '',
  centralTruth: '',
  sermonGoal: '',
  audienceNeed: ''
}

export default function SermonCore({
  workspaceId,
  mainPassage,
  theme,
  theologicalLens,
  studyReport,
  initialData,
  onDataChange,
  onGenerate,
  onUseInOutline,
  isGenerating = false
}: SermonCoreProps) {
  const [data, setData] = useState<SermonCoreData>(initialData || emptyCore)
  const [expanded, setExpanded] = useState(true)
  const [editingField, setEditingField] = useState<keyof SermonCoreData | null>(null)

  useEffect(() => {
    if (initialData) {
      setData(initialData)
    }
  }, [initialData])

  useEffect(() => {
    if (isGenerating) {
      setExpanded(false)
      setEditingField(null)
    }
  }, [isGenerating])

  const handleFieldChange = (field: keyof SermonCoreData, value: string) => {
    const newData = { ...data, [field]: value }
    setData(newData)
    onDataChange?.(newData)
  }

  const handleGenerate = async () => {
    if (onGenerate) {
      const generated = await onGenerate()
      if (generated) {
        setData(generated)
        onDataChange?.(generated)
      }
    }
  }

  const hasContent = data.bigIdea || data.fallenCondition || data.centralTruth || data.sermonGoal || data.audienceNeed

  const fields: Array<{
    key: keyof SermonCoreData
    label: string
    icon: typeof Target
    placeholder: string
    description: string
    color: string
  }> = [
    {
      key: 'bigIdea',
      label: 'Big Idea',
      icon: Target,
      placeholder: "God's grace reconciles what sin has separated.",
      description: 'The one thing you want people to remember',
      color: 'cyan'
    },
    {
      key: 'fallenCondition',
      label: 'Fallen Condition',
      icon: Heart,
      placeholder: 'Humanity is separated from God because of sin.',
      description: 'The human problem this sermon addresses',
      color: 'rose'
    },
    {
      key: 'centralTruth',
      label: 'Central Truth',
      icon: Lightbulb,
      placeholder: 'Through Christ we are restored into relationship with God.',
      description: 'The biblical truth that answers the problem',
      color: 'amber'
    },
    {
      key: 'sermonGoal',
      label: 'Sermon Goal',
      icon: Sparkles,
      placeholder: 'Invite listeners to accept reconciliation through Christ.',
      description: 'What you want the audience to do',
      color: 'emerald'
    },
    {
      key: 'audienceNeed',
      label: 'Audience Need',
      icon: Users,
      placeholder: 'Many feel distant from God and need assurance of His love.',
      description: 'The specific need your audience has',
      color: 'violet'
    }
  ]

  return (
    <div className="cyber-panel rounded-2xl overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-lg font-semibold">Sermon Core</h3>
            <p className="text-xs text-cyan-200/70">The bridge between study and outline</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {expanded && !isGenerating && onUseInOutline && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onUseInOutline()
              }}
              className="cyber-outline text-xs px-4 py-2 rounded-full flex items-center gap-2"
            >
              Generate outline from Sermon Core
            </button>
          )}
          {expanded && !isGenerating && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleGenerate()
              }}
              disabled={isGenerating}
              className="cyber-button text-xs px-4 py-2 rounded-full flex items-center gap-2 disabled:opacity-60"
            >
              Generate
            </button>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      {isGenerating ? (
        <div className="px-4 pb-4">
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-cyan-200/80">
              <span>Extracting Sermon Core</span>
              <span>Analyzing tension, restoration, invitation, and application...</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-2/3 bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-500 animate-pulse rounded-full" />
            </div>
          </div>
        </div>
      ) : expanded ? (
        <div className="p-4 pt-0 space-y-4">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3">
              <p className="text-[10px] uppercase tracking-widest text-cyan-200/70">Passage</p>
              <p className="mt-1 text-sm text-cyan-50">{mainPassage || 'Passage not set yet.'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-300">Theological Lens</p>
              <p className="mt-1 text-sm text-gray-100">{theologicalLens || 'Adventist / workspace default'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-300">Study Report</p>
              <p className="mt-1 text-sm text-gray-100">{studyReport ? 'Available' : 'Generate study report for deeper Sermon Core results'}</p>
            </div>
          </div>

          {!hasContent && (
            <div className="text-center py-6 text-gray-400">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Define the core message of your sermon</p>
              <p className="text-xs mt-1 text-gray-500">Click Generate to extract from your study, or fill in manually</p>
            </div>
          )}

          {hasContent && (
            <div className="space-y-3">
              {fields.map((field) => {
                const Icon = field.icon
                const isEditing = editingField === field.key
                const value = data[field.key]
                return (
                  <div
                    key={field.key}
                    className={`rounded-xl border transition-colors ${
                      value ? `border-${field.color}-400/30 bg-${field.color}-500/5` : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-4 h-4 text-${field.color}-400`} />
                        <span className="text-xs font-medium uppercase tracking-wider text-gray-300">{field.label}</span>
                        <span className="text-xs text-gray-500 ml-auto">{field.description}</span>
                      </div>

                      {isEditing ? (
                        <textarea
                          value={value}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          onBlur={() => setEditingField(null)}
                          autoFocus
                          placeholder={field.placeholder}
                          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-gray-100 resize-none focus:outline-none focus:border-cyan-400/50"
                          rows={2}
                        />
                      ) : (
                        <div onClick={() => setEditingField(field.key)} className="cursor-text min-h-[2.5rem] px-1">
                          {value ? (
                            <p className="text-sm text-gray-100">{value}</p>
                          ) : (
                            <p className="text-sm text-gray-500 italic">{field.placeholder}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {hasContent && (
            <div className="pt-3 border-t border-white/10">
              <p className="text-xs text-gray-400">
                <span className="text-cyan-300">Core Message:</span> {data.bigIdea || 'Not defined'}
              </p>
            </div>
          )}
        </div>
      ) : hasContent ? (
        <div className="px-4 pb-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-300">Core Message</p>
            <p className="mt-1 text-sm text-gray-100">{data.bigIdea || 'Not defined'}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
