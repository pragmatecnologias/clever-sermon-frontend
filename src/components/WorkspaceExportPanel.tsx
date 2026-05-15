'use client'

import { useMemo, useState } from 'react'
import { Download, Loader2, Package } from 'lucide-react'
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import { createWorkspaceApiClient } from '@/lib/api/openapi-client'

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

const buildExportArtifacts = (workspace: any): ExportArtifact[] => [
  { type: 'pptx', label: 'Slide deck', status: 'pending', filename: `sermon-deck-${workspace?.id || 'workspace'}.pptx` },
  { type: 'pdf', label: 'Slide deck PDF', status: 'pending', filename: `sermon-deck-${workspace?.id || 'workspace'}.pdf` },
  { type: 'docx', label: 'Manuscript DOCX', status: 'pending', filename: `sermon-manuscript-${workspace?.id || 'workspace'}.docx` },
  { type: 'study-report', label: 'Study report export', status: 'pending', filename: `study-report-${workspace?.id || 'workspace'}.md` },
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

  const artifacts = useMemo(() => buildExportArtifacts(workspace), [workspace])

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

  const handleExportAll = async () => {
    if (!workspace?.id) return
    setStatus('running')
    setMessage('Preparing sermon export package...')
    try {
      const selectedOutline = getSelectedOutline(workspace)
      const selectedManuscript = getSelectedManuscript(workspace)
      const mainPoints = Array.isArray(selectedOutline?.structure?.pointNodes)
        ? selectedOutline.structure.pointNodes.map((point: any) => asText(point?.title || point?.summary || point?.text || point?.content)).filter(Boolean)
        : []

      setMessage('Generating slide deck and exports...')
      const client = createWorkspaceApiClient({ token })
      const result = await client.composeMediaPack(String(workspace.id), {
        deckSize: 'long',
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
        sourceStudyReportId: workspace?.studyReports?.[0]?.id || null,
        deckId: (result as any)?.deck?.id || (result as any)?.deck?.deckId || null,
        sermonId: (result as any)?.sermon?.id || (result as any)?.sermon?.sermonId || null,
        artifacts: artifacts.map((artifact) => ({
          ...artifact,
          status: 'downloaded' as const,
          sourceOutlineId: selectedOutline?.id || null,
          sourceManuscriptId: selectedManuscript?.id || null,
          sourceStudyReportId: workspace?.studyReports?.[0]?.id || null,
        })),
      }
      await updateExportMetadata(manifest)
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
            Download PPTX, PDF, DOCX, and study-report exports from the approved sermon version.
          </p>
        </div>
        <Package className="w-5 h-5 text-cyan-200" />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {artifacts.map((artifact) => (
          <div key={artifact.type} className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">{artifact.type}</p>
            <p className="mt-1 text-sm font-medium text-white">{artifact.label}</p>
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
        <p className="text-xs text-gray-300">{message || 'No export started yet.'}</p>
      </div>
      {status === 'done' && <p className="text-xs text-green-300">Export complete and workspace metadata updated.</p>}
      {status === 'error' && <p className="text-xs text-red-300">Export failed. Check console logs.</p>}
    </div>
  )
}
