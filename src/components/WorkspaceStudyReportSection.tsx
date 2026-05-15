'use client'

import { Film, Layers, Lightbulb, MessageSquare, Network } from 'lucide-react'
import InteractiveCanonicalConstellation from '@/components/InteractiveCanonicalConstellation'
import SanctuaryProphecyMapper from '@/components/SanctuaryProphecyMapper'
import InteractiveProphecyWeb from '@/components/InteractiveProphecyWeb'
import BiblicalNarrativeMap from '@/components/BiblicalNarrativeMap'
import { StudyAssetCard, StudyAssetBoxes } from '@/components/WorkspaceStudyReportCards'

type StudyAssetEditor = 'applications' | 'questions' | 'illustrations' | null

interface WorkspaceStudyReportSectionProps {
  workspace: any
  hasGeneratedStudyReport: boolean
  onGenerate: (asset: 'applications' | 'questions' | 'illustrations' | 'media') => void
  onEditAsset: (asset: Exclude<StudyAssetEditor, null>) => void
  isStudyAssetLoading: (asset: 'applications' | 'questions' | 'illustrations' | 'media' | 'egw' | 'references' | 'report') => boolean
  getStudyAssetLoadingLabel: (asset: 'applications' | 'questions' | 'illustrations' | 'media' | 'egw' | 'references' | 'report') => string
  expandedTextBlocks: Record<string, boolean>
  toggleTextBlock: (key: string) => void
  onOpenFullView: () => void
}

export default function WorkspaceStudyReportSection({
  workspace,
  hasGeneratedStudyReport,
  onGenerate,
  onEditAsset,
  isStudyAssetLoading,
  getStudyAssetLoadingLabel,
  expandedTextBlocks,
  toggleTextBlock,
  onOpenFullView,
}: WorkspaceStudyReportSectionProps) {
  const requireStudyReport = !hasGeneratedStudyReport
  const workspaceMainPassage = String(workspace?.mainPassage || '').trim()
  const workspaceLanguage = String(workspace?.language || 'en').trim()
  const sections = workspace?.studyReports?.[0]?.sections || {}
  const studyAssetsSection = sections?.studyAssets || {}
  const categoryAssets = studyAssetsSection?.categoryAssets || {}
  const movementAssets = Array.isArray(studyAssetsSection?.movementAssets) ? studyAssetsSection.movementAssets : []

  const flattenMovement = (key: string) => movementAssets.flatMap((item: any) => (Array.isArray(item?.[key]) ? item[key] : []))

  const sanitizeStudyAssetText = (value: any) => {
    const text = String(value || '').trim()
    if (!text) return ''
    const extracted = text.match(
      /(?:^|[\s,{])(?:content|text|prompt|question)\s*[:=]\s*["“]?([^"”\n]+?)["”]?(?:\s*[,}]|$)/i,
    )
    if (extracted?.[1]) return extracted[1].trim()
    return text
      .replace(/^\s*(title|content|text|prompt|question|verseReference|source)\s*[:=]\s*/i, '')
      .replace(/^[`"'“”]+|[`"'“”]+$/g, '')
      .trim()
  }

  const mergeLists = (...lists: any[][]) =>
    Array.from(
      new Set(
        lists
          .flatMap((list) => (Array.isArray(list) ? list : []))
          .map((item) => sanitizeStudyAssetText(item))
          .filter(Boolean),
      ),
    )

  const normalizeMediaSuggestionCards = (items: any[]) =>
    (Array.isArray(items) ? items : [])
      .map((item: any) => {
        const isLikelyJsonNoise = (text: string) => {
          const trimmed = String(text || '').trim()
          if (!trimmed) return true
          if (/^[\{\}\[\],]+$/.test(trimmed)) return true
          if (trimmed.startsWith('"') && trimmed.includes('":')) return true
          if (/^[A-Za-z0-9_]+\s*:\s*[\[{]?\s*$/.test(trimmed)) return true
          if (/^["']?mediaSuggestions["']?\s*:/.test(trimmed)) return true
          return false
        }

        if (!item) return null
        if (typeof item === 'string') {
          const prompt = String(item).trim()
          if (!prompt || isLikelyJsonNoise(prompt)) return null
          return {
            type: workspaceLanguage === 'es' ? 'Medio' : 'Media',
            intent: workspaceLanguage === 'es' ? 'Sugerencia de estudio' : 'Study suggestion',
            prompt,
          }
        }
        const type = String(item?.type || item?.label || item?.name || '').trim()
        const lowerType = type.toLowerCase()
        if (
          lowerType.includes('presentación') ||
          lowerType.includes('presentation') ||
          lowerType.includes('slide') ||
          lowerType.includes('deck')
        ) {
          return null
        }
        const intent = String(item?.intent || item?.category || item?.purpose || '').trim()
        const useCase = String(item?.useCase || item?.usage || item?.howToUse || '').trim()
        const prompt = String(item?.prompt || item?.text || item?.content || '').trim()
        if (!prompt || isLikelyJsonNoise(prompt)) return null
        return {
          type: type || (workspaceLanguage === 'es' ? 'Medio' : 'Media'),
          intent: intent || (workspaceLanguage === 'es' ? 'Sugerencia de estudio' : 'Study suggestion'),
          ...(useCase ? { useCase } : {}),
          prompt,
        }
      })
      .filter(Boolean)

  const studyAssets = {
    applications: mergeLists(
      categoryAssets?.applications,
      (workspace?.applications || []).map((item: any) => item?.content).filter(Boolean),
      flattenMovement('applications'),
      sections?.pastoralImplications?.personalLife || [],
      sections?.pastoralImplications?.churchLife || [],
      sections?.pastoralImplications?.mission || [],
    ),
    discussionQuestions: mergeLists(
      categoryAssets?.discussionQuestions,
      (workspace?.discussionQuestions || []).map((item: any) => item?.question).filter(Boolean),
      flattenMovement('discussionQuestions'),
    ),
    illustrationIdeas: mergeLists(
      categoryAssets?.illustrationIdeas,
      (workspace?.illustrations || []).map((item: any) => item?.content || item?.title).filter(Boolean),
      flattenMovement('illustrationIdeas'),
    ),
  }
  const studyMediaCards = Array.isArray(categoryAssets?.mediaSuggestionCards) && categoryAssets.mediaSuggestionCards.length
    ? normalizeMediaSuggestionCards(categoryAssets.mediaSuggestionCards)
    : normalizeMediaSuggestionCards(
        categoryAssets?.mediaSuggestionCards ||
          (workspace?.studyReports?.[0]?.sections?.studyAssets?.categoryAssets?.mediaSuggestionCards || []),
      )
  const studyMediaFallback = mergeLists(categoryAssets?.mediaSuggestions, flattenMovement('mediaSuggestions'))
  const studyMediaPrompts = studyMediaCards.length
    ? studyMediaCards
    : studyMediaFallback.map((prompt: string) => ({
        type: workspaceLanguage === 'es' ? 'Medio' : 'Media',
        intent: workspaceLanguage === 'es' ? 'Sugerencia de estudio' : 'Study suggestion',
        prompt,
      }))

  return (
    <>
      <p className="text-xs text-cyan-100/80">
        Applications, Discussion Questions, Illustration Ideas, and Media Suggestions require a generated Study Report.
      </p>
      <div className="space-y-4">
        <StudyAssetCard
          title="Applications"
          icon={<Lightbulb className="w-4 h-4" />}
          primaryActionLabel="Generate"
          onPrimaryAction={() => onGenerate('applications')}
          body={StudyAssetBoxes({
            items: studyAssets.applications,
            keyName: 'study-assets-applications',
            emptyText: 'No applications yet.',
            expandedTextBlocks,
            toggleTextBlock,
            options: {
              accentClass: 'text-amber-100',
              itemClassName: 'border border-amber-400/20 rounded-lg p-3 bg-amber-500/5',
            },
          })}
          secondaryActionLabel="Edit"
          onSecondaryAction={() => onEditAsset('applications')}
          isLoading={isStudyAssetLoading('applications')}
          loadingLabel={getStudyAssetLoadingLabel('applications')}
          disableActions={isStudyAssetLoading('applications') || requireStudyReport}
        />
        <StudyAssetCard
          title="Discussion Questions"
          icon={<MessageSquare className="w-4 h-4" />}
          primaryActionLabel="Generate"
          onPrimaryAction={() => onGenerate('questions')}
          body={StudyAssetBoxes({
            items: studyAssets.discussionQuestions,
            keyName: 'study-assets-questions',
            emptyText: 'No discussion questions yet.',
            expandedTextBlocks,
            toggleTextBlock,
            options: {
              accentClass: 'text-sky-100',
              itemClassName: 'border border-sky-400/20 rounded-lg p-3 bg-sky-500/5',
            },
          })}
          secondaryActionLabel="Edit"
          onSecondaryAction={() => onEditAsset('questions')}
          isLoading={isStudyAssetLoading('questions')}
          loadingLabel={getStudyAssetLoadingLabel('questions')}
          disableActions={isStudyAssetLoading('questions') || requireStudyReport}
        />
        <StudyAssetCard
          title="Illustration Ideas"
          icon={<Layers className="w-4 h-4" />}
          primaryActionLabel="Generate"
          onPrimaryAction={() => onGenerate('illustrations')}
          body={StudyAssetBoxes({
            items: studyAssets.illustrationIdeas,
            keyName: 'study-assets-illustrations',
            emptyText: 'No illustration ideas yet.',
            expandedTextBlocks,
            toggleTextBlock,
            options: {
              accentClass: 'text-rose-100',
              itemClassName: 'border border-rose-400/20 rounded-lg p-3 bg-rose-500/5',
            },
          })}
          secondaryActionLabel="Edit"
          onSecondaryAction={() => onEditAsset('illustrations')}
          isLoading={isStudyAssetLoading('illustrations')}
          loadingLabel={getStudyAssetLoadingLabel('illustrations')}
          disableActions={isStudyAssetLoading('illustrations') || requireStudyReport}
        />
        <StudyAssetCard
          title="Media Suggestions"
          icon={<Film className="w-4 h-4" />}
          primaryActionLabel="Generate"
          onPrimaryAction={() => onGenerate('media')}
          body={StudyAssetBoxes({
            items: studyMediaPrompts,
            keyName: 'study-assets-media',
            emptyText: 'No media suggestions yet.',
            expandedTextBlocks,
            toggleTextBlock,
            options: {
              itemClassName: 'border border-violet-400/20 rounded-lg p-3 bg-violet-500/5',
              renderItem: (item: any) => (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-violet-100">{item.type}</p>
                    <span className="text-[10px] uppercase tracking-widest text-violet-200/70">{item.intent}</span>
                  </div>
                  {item?.useCase ? (
                    <p className="text-[11px] text-cyan-100/90 mt-2">{item.useCase}</p>
                  ) : null}
                  <p className="text-xs text-violet-50/90 mt-2 leading-relaxed">{item.prompt}</p>
                </>
              ),
            },
          })}
          isLoading={isStudyAssetLoading('media')}
          loadingLabel={getStudyAssetLoadingLabel('media')}
          disableActions={isStudyAssetLoading('media') || requireStudyReport}
        />
      </div>

      <div className="cyber-panel rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Network className="w-5 h-5 text-cyan-300" />
            <div>
              <h4 className="text-lg font-semibold">Study Visualizations</h4>
              <p className="text-xs text-gray-400 mt-1">Keep the charts inside Study instead of bouncing to another page.</p>
            </div>
          </div>
          <button
            onClick={onOpenFullView}
            className="cyber-outline text-xs px-3 py-2 rounded-full"
          >
            Open Full View
          </button>
        </div>
        <div className="space-y-6">
          <div className="cyber-panel rounded-2xl p-5">
            <h5 className="text-base font-semibold mb-3">Canonical Constellation</h5>
            <InteractiveCanonicalConstellation focusPassage={workspaceMainPassage} />
          </div>
          {workspaceMainPassage && (
            <div className="cyber-panel rounded-2xl p-5">
              <SanctuaryProphecyMapper
                passage={workspaceMainPassage}
                mode={/Daniel|Revelation/.test(workspaceMainPassage) ? 'prophecy' : 'sanctuary'}
                language={workspaceLanguage || 'en'}
              />
            </div>
          )}
          <div className="cyber-panel rounded-2xl p-5">
            <h5 className="text-base font-semibold mb-3">Prophecy Fulfillment Web</h5>
            <InteractiveProphecyWeb theme="all" />
          </div>
          <div className="cyber-panel rounded-2xl p-5">
            <h5 className="text-base font-semibold mb-3">Biblical Narrative Map</h5>
            <BiblicalNarrativeMap focusPassage={workspaceMainPassage} />
          </div>
        </div>
      </div>
    </>
  )
}
