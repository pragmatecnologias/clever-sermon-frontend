'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, Loader2, Package, Play, RefreshCw } from 'lucide-react'
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import { createWorkspaceApiClient } from '@/lib/api/openapi-client'
import { slidesApi } from '@/lib/slides-api'
import {
  getDeckIdentity,
  selectPreferredDeck,
} from '@/lib/deck-identity'

type WorkspaceExportPanelProps = {
  workspace: any
  token: string
}

type ExportStatus = 'idle' | 'running' | 'done' | 'error'

type ExportArtifact = {
  type: 'pptx' | 'pdf' | 'docx' | 'study-report'
  label: string
  status: 'pending' | 'ready' | 'downloaded'
  filename: string
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const asText = (value: unknown) => String(value || '').trim()

const getSelectedOutline = (workspace: any) =>
  workspace?.outlines?.find((item: any) => item?.isSelected) || workspace?.outlines?.[0] || null

const getSelectedManuscript = (workspace: any) => workspace?.manuscripts?.[0] || null

const getWorkspaceDecks = async (token: string, workspaceId: string) => {
  const decks = await slidesApi.getDecks(token)
  const normalizedDecks = Array.isArray(decks) ? decks : []
  return normalizedDecks.filter((deck: any) => {
    const deckWorkspaceId = String(
      deck?.sermon?.workspaceId || deck?.sermon?.workspace?.id || deck?.workspaceId || deck?.workspace?.id || '',
    ).trim()
    return deckWorkspaceId === String(workspaceId)
  })
}

const getExportReadiness = (workspace: any) => {
  const exportPack = workspace?.metadata?.exportPack || workspace?.metadata?.deliverables?.export || null
  const mediaPack = workspace?.metadata?.mediaPack || workspace?.metadata?.deliverables?.mediaPack || null
  const selectedOutline = getSelectedOutline(workspace)
  const selectedManuscript = getSelectedManuscript(workspace)
  const studyReport = workspace?.studyReports?.[0] || null
  const activeSermonDeckId =
    mediaPack?.activeSermonDeckId ||
    mediaPack?.latestDeckByIntent?.sermon_presentation ||
    exportPack?.deckId ||
    null

  return {
    hasOutline: Boolean(selectedOutline),
    hasManuscript: Boolean(selectedManuscript),
    hasStudyReport: Boolean(studyReport),
    deckReady: Boolean(activeSermonDeckId || exportPack?.deckId || mediaPack?.status === 'ready'),
    exportReady: Boolean(exportPack?.status === 'ready'),
    mediaReady: Boolean(mediaPack?.status === 'ready'),
    missing: [
      !selectedOutline ? 'Outline' : null,
      !selectedManuscript ? 'Manuscript' : null,
      !studyReport ? 'Study report' : null,
    ].filter(Boolean) as string[],
    exportPack,
    mediaPack,
    studyReport,
    selectedOutline,
    selectedManuscript,
    activeSermonDeckId,
  }
}

const buildExportArtifacts = (workspace: any, readiness: ReturnType<typeof getExportReadiness>): ExportArtifact[] => [
  {
    type: 'pptx',
    label: 'Slide deck',
    status: readiness.deckReady ? 'ready' : 'pending',
    filename: `sermon-deck-${workspace?.id || 'workspace'}.pptx`,
  },
  {
    type: 'pdf',
    label: 'Slide deck PDF',
    status: readiness.deckReady ? 'ready' : 'pending',
    filename: `sermon-deck-${workspace?.id || 'workspace'}.pdf`,
  },
  {
    type: 'docx',
    label: 'Manuscript DOCX',
    status: readiness.hasManuscript ? 'ready' : 'pending',
    filename: `sermon-manuscript-${workspace?.id || 'workspace'}.docx`,
  },
  {
    type: 'study-report',
    label: 'Study report export',
    status: readiness.hasStudyReport ? 'ready' : 'pending',
    filename: `study-report-${workspace?.id || 'workspace'}.md`,
  },
]

const buildStudyReportMarkdown = (workspace: any) => {
  const report = workspace?.studyReports?.[0]?.sections || {}
  const lines = [
    `# ${asText(workspace?.title || 'Study Report')}`,
    `Main Passage: ${asText(workspace?.mainPassage)}`,
    '',
    `## Passage Overview`,
    asText(report.passageOverview || report.overview || report.summary || 'No overview available.'),
    '',
    `## Literary Context`,
    asText(report.literaryContext || 'No literary context available.'),
    '',
    `## Main Theological Claim`,
    asText(report.mainTheologicalClaim || 'No theological claim available.'),
    '',
    `## Cross References`,
    Array.isArray(report.crossReferences) ? report.crossReferences.map((item: any) => `- ${asText(item?.reference || item?.verse || item)}`).join('\n') : '- None available.',
    '',
    `## Interpretive Challenges`,
    Array.isArray(report.interpretiveChallenges)
      ? report.interpretiveChallenges.map((item: any) => `- ${asText(item?.question || item?.challenge || item)}`).join('\n')
      : '- None available.',
  ]
  return lines.join('\n')
}

const buildDocxBlob = async (title: string, sections: Array<{ heading: string; body: string }>) => {
  const children: Paragraph[] = [
    new Paragraph({ text: title, heading: HeadingLevel.TITLE, spacing: { after: 240 } }),
  ]
  sections.forEach((section) => {
    children.push(new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }))
    section.body
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        children.push(new Paragraph({ children: [new TextRun(line)], spacing: { after: 120 } }))
      })
  })

  const doc = new Document({
    sections: [{ children }],
  })
  return Packer.toBlob(doc)
}

export default function WorkspaceExportPanel({ workspace, token }: WorkspaceExportPanelProps) {
  const [status, setStatus] = useState<ExportStatus>('idle')
  const [message, setMessage] = useState<string>('')
  const [workspaceDecks, setWorkspaceDecks] = useState<any[]>([])
  const [deckLoading, setDeckLoading] = useState(false)

  const readiness = useMemo(() => getExportReadiness(workspace), [workspace])
  const artifacts = useMemo(() => buildExportArtifacts(workspace, readiness), [workspace, readiness])
  useEffect(() => {
    let mounted = true
    const loadDecks = async () => {
      if (!workspace?.id || !token) return
      try {
        setDeckLoading(true)
        const decks = await getWorkspaceDecks(token, String(workspace.id))
        if (mounted) setWorkspaceDecks(decks)
      } catch (error) {
        console.warn('Failed to load workspace decks for export panel:', error)
      } finally {
        if (mounted) setDeckLoading(false)
      }
    }
    void loadDecks()
    return () => {
      mounted = false
    }
  }, [workspace?.id, token])

  const sermonDeck = useMemo(() => selectPreferredDeck(workspaceDecks, workspace, 'sermon_presentation'), [workspaceDecks, workspace])
  const socialDeck = useMemo(() => selectPreferredDeck(workspaceDecks, workspace, 'social_summary'), [workspaceDecks, workspace])
  const legacyShortDeck = useMemo(
    () =>
      workspaceDecks.find((deck) => {
        const identity = getDeckIdentity(deck, workspace)
        return identity.qualityStatus === 'Legacy short deck'
      }) || null,
    [workspaceDecks, workspace],
  )

  const updateExportMetadata = async (manifest: Record<string, unknown>) => {
    const client = createWorkspaceApiClient({ token })
    await client.updateWorkspace(String(workspace?.id || ''), {
      metadata: {
        ...(workspace?.metadata || {}),
        exportPack: manifest,
        deliverables: {
          ...((workspace?.metadata as Record<string, unknown> | undefined)?.deliverables || {}),
          export: manifest,
        },
      },
    })
  }

  const refreshWorkspaceDecks = async () => {
    if (!workspace?.id) return
    const decks = await getWorkspaceDecks(token, String(workspace.id))
    setWorkspaceDecks(decks)
  }

  const previewDeck = async (deck: any) => {
    const slides = Array.isArray(deck?.slides) ? [...deck.slides] : []
    const firstSlide = slides.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))[0]
    if (!firstSlide?.id) return
    const blob = await slidesApi.getSlideImageBlob(firstSlide.id, token)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  const generateDeckForIntent = async (deckIntent: 'sermon_presentation' | 'social_summary') => {
    if (!workspace?.id) return
    const client = createWorkspaceApiClient({ token })
    const result = await client.composeMediaPack(String(workspace.id), {
      deckSize: deckIntent === 'social_summary' ? 'short' : 'long',
      deckIntent,
      includeDeck: true,
      exportTypes: deckIntent === 'sermon_presentation' ? ['pptx', 'pdf'] : [],
      backgroundProvider: 'local',
      backgroundPreset: 'modern',
    })
    const deckId = (result as any)?.deck?.id || (result as any)?.deck?.deckId || null
    if (deckId) {
      await refreshWorkspaceDecks()
    }
    return deckId
  }

  const sermonDeckInfo = sermonDeck ? getDeckIdentity(sermonDeck, workspace) : null
  const socialDeckInfo = socialDeck ? getDeckIdentity(socialDeck, workspace) : null

  const handleExportAll = async () => {
    if (!workspace?.id) return
    setStatus('running')
    setMessage('Preparing sermon export package...')
    try {
      const selectedOutline = readiness.selectedOutline
      const selectedManuscript = readiness.selectedManuscript

      setMessage('Generating slide deck and exports...')
      const client = createWorkspaceApiClient({ token })
      const result = await client.composeMediaPack(String(workspace.id), {
        deckSize: 'long',
        deckIntent: 'sermon_presentation',
        includeDeck: true,
        exportTypes: ['pptx', 'pdf'],
        backgroundProvider: 'local',
        backgroundPreset: 'modern',
      })

      setMessage('Building DOCX manuscript export...')
      const manuscriptText = asText(selectedManuscript?.content?.text || selectedManuscript?.content || '')
      const manuscriptDocx = await buildDocxBlob(
        `${asText(workspace.title || 'Sermon Manuscript')}`,
        [
          { heading: 'Manuscript', body: manuscriptText || 'No manuscript text available.' },
        ],
      )
      downloadBlob(manuscriptDocx, `sermon-manuscript-${workspace.id}.docx`)

      setMessage('Building study report export...')
      const studyReportMarkdown = buildStudyReportMarkdown(workspace)
      downloadBlob(new Blob([studyReportMarkdown], { type: 'text/markdown;charset=utf-8' }), `study-report-${workspace.id}.md`)
      const studyReportDocx = await buildDocxBlob(
        `${asText(workspace.title || 'Study Report')}`,
        [
          { heading: 'Study Report', body: studyReportMarkdown },
        ],
      )
      downloadBlob(studyReportDocx, `study-report-${workspace.id}.docx`)

      const manifest = {
        status: 'ready' as const,
        generatedAt: new Date().toISOString(),
        sourceOutlineId: selectedOutline?.id || null,
        sourceManuscriptId: selectedManuscript?.id || null,
        sourceStudyReportId: readiness.studyReport?.id || null,
        deckId: (result as any)?.deck?.id || (result as any)?.deck?.deckId || null,
        sermonId: (result as any)?.sermon?.id || (result as any)?.sermon?.sermonId || null,
        artifacts: artifacts.map((artifact) => ({
          ...artifact,
          status: 'downloaded' as const,
          sourceOutlineId: selectedOutline?.id || null,
          sourceManuscriptId: selectedManuscript?.id || null,
          sourceStudyReportId: readiness.studyReport?.id || null,
        })),
      }
      await updateExportMetadata(manifest)
      await refreshWorkspaceDecks()
      setStatus('done')
      setMessage('Export package complete.')
    } catch (error) {
      console.error('Export pipeline failed', error)
      setStatus('error')
      setMessage('Export package failed.')
    }
  }

  return (
    <div className="cyber-panel rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 mb-2">Export Pipeline</p>
          <h3 className="text-xl font-semibold text-white">Approved Sermon Package</h3>
          <p className="text-sm text-gray-200/80 mt-1">
            Sermon Presentation Deck for worship use. Social Summary Deck for promo sharing.
          </p>
        </div>
        <Package className="w-5 h-5 text-cyan-200" />
      </div>
      <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className={`cyber-tag ${readiness.hasOutline ? 'text-emerald-200' : 'text-amber-200'}`}>
            {readiness.hasOutline ? 'Outline ready' : 'Outline missing'}
          </span>
          <span className={`cyber-tag ${readiness.hasManuscript ? 'text-emerald-200' : 'text-amber-200'}`}>
            {readiness.hasManuscript ? 'Manuscript ready' : 'Manuscript missing'}
          </span>
          <span className={`cyber-tag ${readiness.hasStudyReport ? 'text-emerald-200' : 'text-amber-200'}`}>
            {readiness.hasStudyReport ? 'Study report ready' : 'Study report missing'}
          </span>
          <span className={`cyber-tag ${readiness.exportReady ? 'text-emerald-200' : 'text-amber-200'}`}>
            {readiness.exportReady ? 'Export ready' : 'Export pending'}
          </span>
          <span className={`cyber-tag ${deckLoading ? 'text-amber-200' : 'text-emerald-200'}`}>
            {deckLoading ? 'Deck history loading' : 'Deck history loaded'}
          </span>
        </div>
        <p className="text-xs text-gray-300">
          Sermon export uses the active sermon deck. Social sharing uses the active social deck.
        </p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Current Sermon Presentation Deck</p>
              <h4 className="text-lg font-semibold text-white">
                {sermonDeck?.title || sermonDeck?.sermon?.title || 'No sermon deck yet'}
              </h4>
              <p className="text-xs text-cyan-50/80 mt-1">
                {sermonDeckInfo
                  ? `${sermonDeckInfo.slideCount} slides • ${sermonDeckInfo.qualityStatus} • ${sermonDeckInfo.generatedAtLabel}`
                  : legacyShortDeck
                    ? 'You have an older short deck. Generate a full sermon presentation deck for preaching.'
                    : 'Generate a Sermon Presentation Deck for worship service use.'}
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full border border-cyan-300/40 bg-cyan-500/15 text-cyan-100">
              Sermon
            </span>
          </div>
          {sermonDeckInfo?.warnings?.length ? (
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              {sermonDeckInfo.warnings.join(' ')}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => sermonDeck && void previewDeck(sermonDeck)}
              disabled={!sermonDeck}
              className="cyber-outline text-xs px-3 py-2 rounded-full inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Play className="w-3 h-3" />
              Open deck
            </button>
            <button
              type="button"
              onClick={() => sermonDeck && slidesApi.exportDeck(sermonDeck.id, 'pptx', token).catch((error) => console.error('Failed to export deck:', error))}
              disabled={!sermonDeck}
              className="cyber-outline text-xs px-3 py-2 rounded-full inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Download className="w-3 h-3" />
              Export PPTX
            </button>
            <button
              type="button"
              onClick={() => sermonDeck && slidesApi.exportDeck(sermonDeck.id, 'pdf', token).catch((error) => console.error('Failed to export deck:', error))}
              disabled={!sermonDeck}
              className="cyber-outline text-xs px-3 py-2 rounded-full inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Download className="w-3 h-3" />
              Export PDF
            </button>
            <button
              type="button"
              onClick={() => {
                void generateDeckForIntent('sermon_presentation')
              }}
              className="cyber-outline text-xs px-3 py-2 rounded-full inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Regenerate sermon deck
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-pink-400/20 bg-pink-500/10 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-pink-200">Current Social Summary Deck</p>
              <h4 className="text-lg font-semibold text-white">
                {socialDeck?.title || socialDeck?.sermon?.title || 'No social deck yet'}
              </h4>
              <p className="text-xs text-pink-50/80 mt-1">
                {socialDeckInfo ? `${socialDeckInfo.slideCount} slides/cards • ${socialDeckInfo.qualityStatus} • ${socialDeckInfo.generatedAtLabel}` : 'Generate a Social Summary Deck for sharing.'}
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full border border-pink-300/40 bg-pink-500/15 text-pink-100">
              Social
            </span>
          </div>
          {socialDeckInfo?.warnings?.length ? (
            <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              {socialDeckInfo.warnings.join(' ')}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => socialDeck && void previewDeck(socialDeck)}
              disabled={!socialDeck}
              className="cyber-outline text-xs px-3 py-2 rounded-full inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Play className="w-3 h-3" />
              Open social deck
            </button>
            <button
              type="button"
              onClick={() => {
                void generateDeckForIntent('social_summary')
              }}
              className="cyber-outline text-xs px-3 py-2 rounded-full inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Regenerate social deck
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {artifacts.map((artifact) => (
          <div key={artifact.type} className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">{artifact.type}</p>
            <p className="mt-1 text-sm font-medium text-white">{artifact.label}</p>
            <p className={`mt-1 text-[10px] uppercase tracking-[0.25em] ${artifact.status === 'ready' ? 'text-emerald-300' : 'text-amber-300'}`}>
              {artifact.status === 'ready' ? 'Ready' : 'Missing'}
            </p>
            <p className="text-xs text-gray-400 mt-1">{artifact.filename}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleExportAll}
          disabled={status === 'running'}
          className="cyber-button inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full disabled:opacity-60"
        >
          {status === 'running' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          {status === 'running' ? 'Exporting...' : 'Export All'}
        </button>
        <p className="text-xs text-gray-300">
          {message || 'No export started yet. Export uses the active sermon presentation deck.'}
        </p>
      </div>
      {status === 'done' && <p className="text-xs text-green-300">Export complete and workspace metadata updated.</p>}
      {status === 'error' && <p className="text-xs text-red-300">Export failed. Check console logs.</p>}
    </div>
  )
}
