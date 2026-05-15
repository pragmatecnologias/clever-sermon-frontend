'use client'

import SermonIntegrityDashboard from '@/components/SermonIntegrityDashboard'
import InteractiveSermonFlowSculptor from '@/components/InteractiveSermonFlowSculptor'

interface WorkspaceRefineSectionProps {
  workspace: any
  workspaceId: string
  actionLoading: string[]
  isSpanishWorkspace: boolean
  dnaIntegrityReport: any
  dnaIntegrityLoading: boolean
  dnaIntegrityExpanded: boolean
  setDnaIntegrityExpanded: (value: boolean | ((prev: boolean) => boolean)) => void
  dnaFlowExpanded: boolean
  setDnaFlowExpanded: (value: boolean | ((prev: boolean) => boolean)) => void
  dnaText: (en: string, es: string) => string
  latestDnaAnalysis: any
  sermonType: string
  outlinePointsForDna: string[]
  estimatedMinutesDna: number
  explanationPct: number
  applicationPct: number
  illustrationPct: number
  scriptureReferencesInManuscript: string[]
  paragraphCount: number
  theologicalThemeCounts: Array<[string, number]>
  criticalIssuesCount: number
  warningIssuesCount: number
  passageAlignmentScore: number | null
  getOutlinePointNodes: (structure: any) => any[]
  handleGenerateDna: () => void
  socraticCoachSession: any
  coachMode: 'refine' | 'self_reflection'
  setCoachMode: (value: 'refine' | 'self_reflection') => void
  coachListenerProfile: string
  setCoachListenerProfile: (value: string) => void
  coachAnswers: Record<string, string>
  setCoachAnswers: (value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void
  coachFeedback: Record<string, any>
  repairLockedAnchors: string[]
  setRepairLockedAnchors: (value: string[] | ((prev: string[]) => string[])) => void
  repairJob: any
  pendingCoachRepairPlan: any[]
  handleSocraticCoachGenerate: () => void
  handleSocraticCoachAnswer: (questionId: string) => void
  handleApplyAllCoachRepairs: () => void
  handleApplyCoachRepair: (questionId: string) => void
  handleApplyCoachToOutline: (question: any, feedback: any) => void
  handleApplyCoachToManuscript: (question: any, feedback: any) => void
  getRepairIssueByQuestionId: (questionId: string) => any
  repairedIssueIds: Set<string>
}

export default function WorkspaceRefineSection({
  workspace,
  workspaceId,
  actionLoading,
  isSpanishWorkspace,
  dnaIntegrityReport,
  dnaIntegrityLoading,
  dnaIntegrityExpanded,
  setDnaIntegrityExpanded,
  dnaFlowExpanded,
  setDnaFlowExpanded,
  dnaText,
  latestDnaAnalysis,
  sermonType,
  outlinePointsForDna,
  estimatedMinutesDna,
  explanationPct,
  applicationPct,
  illustrationPct,
  scriptureReferencesInManuscript,
  paragraphCount,
  theologicalThemeCounts,
  criticalIssuesCount,
  warningIssuesCount,
  passageAlignmentScore,
  getOutlinePointNodes,
  handleGenerateDna,
  socraticCoachSession,
  coachMode,
  setCoachMode,
  coachListenerProfile,
  setCoachListenerProfile,
  coachAnswers,
  setCoachAnswers,
  coachFeedback,
  repairLockedAnchors,
  setRepairLockedAnchors,
  repairJob,
  pendingCoachRepairPlan,
  handleSocraticCoachGenerate,
  handleSocraticCoachAnswer,
  handleApplyAllCoachRepairs,
  handleApplyCoachRepair,
  handleApplyCoachToOutline,
  handleApplyCoachToManuscript,
  getRepairIssueByQuestionId,
  repairedIssueIds,
}: WorkspaceRefineSectionProps) {
  return (
    <div className="space-y-4 relative min-h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">Socratic Sermon Coach</h3>
          <p className="text-xs text-gray-400 mt-1">
            Seminary-style refinement questions after Study Report, Outline, and Manuscript.
          </p>
        </div>
        <button
          onClick={handleSocraticCoachGenerate}
          className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60"
          disabled={actionLoading.includes('coach')}
        >
          {actionLoading.includes('coach') ? 'Generating...' : 'Generate Questions'}
        </button>
      </div>

      <div className="cyber-panel rounded-2xl p-5 grid md:grid-cols-2 gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest cyber-muted mb-2">Mode</p>
          <select
            value={coachMode}
            onChange={(e) => setCoachMode(e.target.value as 'refine' | 'self_reflection')}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
          >
            <option value="refine">Refine Sermon</option>
            <option value="self_reflection">Pastor Self-Reflection</option>
          </select>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest cyber-muted mb-2">Listener Simulation</p>
          <select
            value={coachListenerProfile}
            onChange={(e) => setCoachListenerProfile(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2"
          >
            <option value="general_congregation">General Congregation</option>
            <option value="new_believer">New Believer</option>
            <option value="skeptic">Skeptic</option>
            <option value="teenager">Teenager</option>
            <option value="bible_scholar">Bible Scholar</option>
            <option value="family_church">Family Church</option>
          </select>
        </div>
      </div>

      {socraticCoachSession ? (
        <div className="space-y-4">
          <div className="cyber-panel rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-xs uppercase tracking-widest cyber-muted mb-2">Coach + Repair</p>
              <button
                type="button"
                onClick={handleApplyAllCoachRepairs}
                disabled={actionLoading.includes('coach-repair-apply') || !!repairJob || pendingCoachRepairPlan.length === 0}
                className="cyber-button text-xs px-3 py-2 rounded-full disabled:opacity-60"
              >
                {actionLoading.includes('coach-repair-apply')
                  ? 'Queueing...'
                  : pendingCoachRepairPlan.length > 0
                    ? `Repair All Pending Sections (${pendingCoachRepairPlan.length})`
                    : 'All Actions Repaired'}
              </button>
            </div>
            <p className="text-sm text-gray-200">{socraticCoachSession.summary || 'No summary available.'}</p>
            <p className="text-xs text-gray-400 mt-2">
              Repair actions edit manuscript sections mapped to each question anchor. They do not edit the question text itself.
            </p>
            {repairJob ? (
              <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3 text-xs text-cyan-100 mt-3">
                <span className="uppercase tracking-widest text-cyan-300 mr-2">Repair Job</span>
                {repairJob.state || repairJob.status}
                {repairJob.message ? ` · ${repairJob.message}` : ''}
              </div>
            ) : null}
            {pendingCoachRepairPlan.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {pendingCoachRepairPlan.map((item: any, idx: number) => (
                  <span
                    key={`${String(item?.issueId || 'pending')}-${idx}`}
                    className="px-2 py-1 rounded-md text-[10px] uppercase tracking-widest bg-red-500/10 text-red-200 border border-red-500/20"
                  >
                    {String(item?.issueType || 'issue')} · {String(item?.severity || 'medium')}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                All mapped repair actions are already applied for this manuscript.
              </div>
            )}
          </div>

          <div className="space-y-3">
            {(socraticCoachSession.questions || []).map((question: any, index: number) => {
              const feedback = coachFeedback?.[question.id]
              const repairIssue = getRepairIssueByQuestionId(String(question.id || ''))
              const repairIssueId = String(repairIssue?.issueId || '').trim()
              const repairResolved = Boolean(repairIssueId) && repairedIssueIds.has(repairIssueId)
              const anchor = String(repairIssue?.targetAnchor || question?.sourceAnchor || workspace.mainPassage)
              const locked = repairLockedAnchors.includes(anchor)
              const answerLoading = actionLoading.includes(`coach-answer-${question.id}`)
              const applyOutlineLoading = actionLoading.includes(`coach-apply-outline-${question.id}`)
              const applyManuscriptLoading = actionLoading.includes(`coach-apply-manuscript-${question.id}`)
              return (
                <div key={question.id || index} className="cyber-panel rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-cyan-300">
                        {(question.id || `Q${index + 1}`)} · {question.dimension || 'text_fidelity'}
                      </p>
                      <h4 className="text-base font-semibold mt-1">{question.question}</h4>
                    </div>
                    <span className="px-2 py-1 rounded-full text-[10px] uppercase tracking-widest bg-black/30 border border-white/10">
                      {question.severity || 'medium'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">
                    <span className="text-cyan-200">Purpose:</span> {question.purpose || 'Clarify sermon logic and text fidelity.'}
                  </p>
                  <p className="text-xs text-gray-300">
                    <span className="text-cyan-200">Anchor:</span> {question.sourceAnchor || workspace.mainPassage}
                  </p>
                  {question.listenerAngle ? (
                    <p className="text-xs text-gray-300">
                      <span className="text-cyan-200">Listener Challenge:</span> {question.listenerAngle}
                    </p>
                  ) : null}
                  {repairIssue ? (
                    <div className="rounded-lg border border-white/10 bg-black/25 p-3 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs text-gray-200">
                          <span className="uppercase tracking-widest text-cyan-300 mr-2">Repair Action</span>
                          {String(repairIssue?.issueType || 'text_fidelity')} · {String(repairIssue?.severity || 'medium')}
                          <span className="block text-gray-400 mt-1">{String(repairIssue?.proposedAction || '')}</span>
                        </p>
                        {repairResolved ? (
                          <span className="text-[10px] px-2 py-1 rounded-full border border-emerald-400/40 text-emerald-200 bg-emerald-500/15 uppercase tracking-widest">
                            Repaired
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setRepairLockedAnchors((prev) =>
                                locked ? prev.filter((value) => value !== anchor) : [...prev, anchor],
                              )
                            }
                            className={`text-[10px] px-2 py-1 rounded-full border ${
                              locked
                                ? 'border-amber-400/40 text-amber-200 bg-amber-500/15'
                                : 'border-white/20 text-gray-300 bg-black/30'
                            }`}
                          >
                            {locked ? 'Locked' : 'Lock Anchor'}
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-cyan-200">Anchor: {anchor}</p>
                      {repairResolved ? (
                        <p className="text-[11px] text-emerald-200 pt-1">Already applied to the current manuscript version.</p>
                      ) : (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => handleApplyCoachRepair(String(question.id || ''))}
                            disabled={actionLoading.includes('coach-repair-apply') || !!repairJob}
                            className="cyber-button text-xs px-3 py-2 rounded-full disabled:opacity-60"
                          >
                            {actionLoading.includes('coach-repair-apply') ? 'Queueing...' : 'Repair Manuscript For This Question'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}

                  <textarea
                    value={coachAnswers[question.id] || ''}
                    onChange={(e) =>
                      setCoachAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                    }
                    placeholder="Type your answer here..."
                    className="w-full min-h-[90px] bg-black/40 border border-white/10 rounded-xl px-3 py-2"
                  />
                  <button
                    onClick={() => handleSocraticCoachAnswer(question.id)}
                    className="cyber-outline text-xs px-3 py-2 rounded-full disabled:opacity-60"
                    disabled={answerLoading || !String(coachAnswers[question.id] || '').trim()}
                  >
                    {answerLoading ? 'Reviewing...' : 'Get Coach Feedback'}
                  </button>

                  {feedback ? (
                    <div className="border border-cyan-400/25 bg-cyan-500/5 rounded-xl p-4 space-y-2">
                      {feedback.affirmation ? (
                        <p className="text-sm text-cyan-100">
                          <span className="text-cyan-300">Affirmation:</span> {feedback.affirmation}
                        </p>
                      ) : null}
                      {feedback.coachFeedback ? (
                        <p className="text-sm text-gray-200">
                          <span className="text-cyan-300">Feedback:</span> {feedback.coachFeedback}
                        </p>
                      ) : null}
                      {feedback.improvementSuggestion ? (
                        <p className="text-sm text-gray-200">
                          <span className="text-cyan-300">Improvement:</span> {feedback.improvementSuggestion}
                        </p>
                      ) : null}
                      {feedback.rewriteHint ? (
                        <p className="text-sm text-gray-200">
                          <span className="text-cyan-300">Rewrite Hint:</span> {feedback.rewriteHint}
                        </p>
                      ) : null}
                      {feedback.nextQuestion ? (
                        <p className="text-sm text-gray-200">
                          <span className="text-cyan-300">Next Question:</span> {feedback.nextQuestion}
                        </p>
                      ) : null}

                      <div className="pt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleApplyCoachToOutline(question, feedback)}
                          disabled={applyOutlineLoading}
                          className="cyber-outline text-xs px-3 py-2 rounded-full disabled:opacity-60"
                        >
                          {applyOutlineLoading ? 'Applying...' : 'Push To Outline'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyCoachToManuscript(question, feedback)}
                          disabled={applyManuscriptLoading}
                          className="cyber-outline text-xs px-3 py-2 rounded-full disabled:opacity-60"
                        >
                          {applyManuscriptLoading ? 'Applying...' : 'Push To Manuscript'}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>

          {socraticCoachSession.nextStepSuggestion ? (
            <div className="cyber-panel rounded-2xl p-4">
              <p className="text-xs uppercase tracking-widest cyber-muted mb-2">Next Step</p>
              <p className="text-sm text-gray-200">{socraticCoachSession.nextStepSuggestion}</p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="cyber-panel rounded-2xl p-6">
          <p className="text-gray-200/80">
            Generate Socratic questions to challenge your interpretation, strengthen exposition, and tighten applications.
          </p>
        </div>
      )}

      <div className="cyber-panel rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold">{dnaText('Sermon DNA', 'ADN del Sermón')}</h3>
            <p className="text-xs text-gray-400 mt-1">
              {dnaText('Integrity, composition, and theological profile', 'Integridad, composición y perfil teológico')}
            </p>
          </div>
          <button
            onClick={handleGenerateDna}
            className="cyber-button text-xs px-4 py-2 rounded-full disabled:opacity-60"
          >
            {actionLoading.includes('dna') ? dnaText('Analyzing...', 'Analizando...') : dnaText('Run Full DNA', 'Ejecutar ADN Completo')}
          </button>
        </div>

        <details
          open={dnaFlowExpanded}
          onToggle={(event) => setDnaFlowExpanded((event.currentTarget as HTMLDetailsElement).open)}
          className="border border-white/10 rounded-xl p-4 bg-black/20"
        >
          <summary className="cursor-pointer text-sm text-cyan-200">
            {dnaText('Refine · Flow Visualization', 'Refinar · Visualización de Flujo')}
          </summary>
          <p className="text-sm text-gray-200 mt-3 mb-4">
            {dnaText(
              'Inspect movement, pacing, and structural grounding without leaving Sermon DNA.',
              'Inspecciona movimiento, ritmo y fundamento estructural sin salir de ADN del Sermón.',
            )}
          </p>
          {(() => {
            const selectedOutline = (workspace.outlines?.find((o: any) => o.isSelected) || workspace.outlines?.[0])?.structure || {}
            const selectedPointNodes = getOutlinePointNodes(selectedOutline)
            return (
              <InteractiveSermonFlowSculptor
                bigIdea={workspace.theme || workspace.title}
                points={selectedOutline?.points || []}
                applications={selectedPointNodes.flatMap((point: any) => point.applications || []).length
                  ? selectedPointNodes.flatMap((point: any) => point.applications || [])
                  : (workspace.applications || []).map((app: any) => app.content)}
                supportingVerses={{}}
                illustrations={selectedPointNodes.flatMap((point: any) => point.illustrationIdeas || []).length
                  ? selectedPointNodes.flatMap((point: any) => point.illustrationIdeas || [])
                  : (workspace.illustrations || []).map((ill: any) => ill.content)}
              />
            )
          })()}
        </details>
      </div>

      <div className="cyber-panel rounded-2xl p-5 space-y-4">
        <p className="text-xs uppercase tracking-widest cyber-muted">{dnaText('Layer 1 · Sermon Integrity', 'Capa 1 · Integridad del Sermón')}</p>
        {dnaIntegrityLoading ? (
          <p className="text-sm text-gray-300">{dnaText('Running integrity checks...', 'Ejecutando chequeos de integridad...')}</p>
        ) : dnaIntegrityReport ? (
          <div className="grid md:grid-cols-3 gap-3">
            <div className="border border-white/10 rounded-xl p-4 bg-black/30">
              <p className="text-xs uppercase tracking-widest cyber-muted">{dnaText('Integrity Score', 'Puntaje de Integridad')}</p>
              <p className="text-2xl font-semibold text-cyan-200 mt-2">{dnaIntegrityReport.overallScore}%</p>
            </div>
            <div className="border border-white/10 rounded-xl p-4 bg-black/30">
              <p className="text-xs uppercase tracking-widest cyber-muted">{dnaText('Passage Alignment', 'Alineación con el Pasaje')}</p>
              <p className="text-2xl font-semibold text-cyan-200 mt-2">
                {passageAlignmentScore !== null ? `${passageAlignmentScore}%` : '—'}
              </p>
            </div>
            <div className="border border-white/10 rounded-xl p-4 bg-black/30">
              <p className="text-xs uppercase tracking-widest cyber-muted">{dnaText('Issue Mix', 'Resumen de Problemas')}</p>
              <p className="text-sm text-gray-200 mt-2">
                {dnaText('Critical', 'Crítico')} {criticalIssuesCount} · {dnaText('Warning', 'Advertencia')} {warningIssuesCount}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-300">{dnaText('No integrity report yet.', 'Aún no hay reporte de integridad.')}</p>
        )}
      </div>

      <div className="cyber-panel rounded-2xl p-5 space-y-4">
        <p className="text-xs uppercase tracking-widest cyber-muted">{dnaText('Layer 2 · Sermon Composition', 'Capa 2 · Composición del Sermón')}</p>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="border border-white/10 rounded-xl p-4 bg-black/30">
            <p className="text-xs uppercase tracking-widest cyber-muted">{dnaText('Sermon Type', 'Tipo de Sermón')}</p>
            <p className="text-lg font-semibold text-gray-100 mt-2">{sermonType}</p>
          </div>
          <div className="border border-white/10 rounded-xl p-4 bg-black/30">
            <p className="text-xs uppercase tracking-widest cyber-muted">{dnaText('Outline Points', 'Puntos del Bosquejo')}</p>
            <p className="text-lg font-semibold text-gray-100 mt-2">{outlinePointsForDna.length || 0}</p>
          </div>
          <div className="border border-white/10 rounded-xl p-4 bg-black/30">
            <p className="text-xs uppercase tracking-widest cyber-muted">{dnaText('Estimated Delivery', 'Duración Estimada')}</p>
            <p className="text-lg font-semibold text-gray-100 mt-2">{estimatedMinutesDna ? `${estimatedMinutesDna} min` : '—'}</p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="border border-white/10 rounded-xl p-4 bg-black/30">
            <p className="text-xs uppercase tracking-widest cyber-muted">{dnaText('Explanation', 'Explicación')}</p>
            <p className="text-xl font-semibold text-cyan-200 mt-2">{explanationPct}%</p>
          </div>
          <div className="border border-white/10 rounded-xl p-4 bg-black/30">
            <p className="text-xs uppercase tracking-widest cyber-muted">{dnaText('Application', 'Aplicación')}</p>
            <p className="text-xl font-semibold text-cyan-200 mt-2">{applicationPct}%</p>
          </div>
          <div className="border border-white/10 rounded-xl p-4 bg-black/30">
            <p className="text-xs uppercase tracking-widest cyber-muted">{dnaText('Illustration', 'Ilustración')}</p>
            <p className="text-xl font-semibold text-cyan-200 mt-2">{illustrationPct}%</p>
          </div>
        </div>
        <div className="border border-white/10 rounded-xl p-4 bg-black/30">
          <p className="text-xs uppercase tracking-widest cyber-muted">{dnaText('Scripture Usage', 'Uso de Escritura')}</p>
          <p className="text-sm text-gray-200 mt-2">
            {dnaText('References in manuscript', 'Referencias en manuscrito')}: {scriptureReferencesInManuscript.length} · {dnaText('Paragraphs', 'Párrafos')}: {paragraphCount}
          </p>
        </div>
      </div>

      <div className="cyber-panel rounded-2xl p-5 space-y-4">
        <p className="text-xs uppercase tracking-widest cyber-muted">{dnaText('Layer 3 · Theological Profile', 'Capa 3 · Perfil Teológico')}</p>
        {latestDnaAnalysis ? (
          <div className="space-y-4">
            <div className="border border-white/10 rounded-xl p-4 bg-black/30">
              <p className="text-xs uppercase tracking-widest cyber-muted mb-2">{dnaText('DNA Summary', 'Resumen ADN')}</p>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{latestDnaAnalysis.summary}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="border border-white/10 rounded-xl p-4 bg-black/30">
                <p className="text-xs uppercase tracking-widest cyber-muted mb-2">{dnaText('Theological Emphasis', 'Énfasis Teológico')}</p>
                {theologicalThemeCounts.length ? (
                  <div className="flex flex-wrap gap-2">
                    {theologicalThemeCounts.map(([theme, count]) => (
                      <span
                        key={theme}
                        className="px-2 py-1 rounded-md text-[10px] uppercase tracking-widest bg-cyan-500/10 text-cyan-200 border border-cyan-500/20"
                      >
                        {theme} {count > 1 ? `(${count})` : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-300">{dnaText('No themes detected yet.', 'Aún no se detectan temas.')}</p>
                )}
              </div>
              <div className="border border-white/10 rounded-xl p-4 bg-black/30 space-y-3">
                <p className="text-xs uppercase tracking-widest cyber-muted">{dnaText('Core Scores', 'Puntajes Base')}</p>
                {latestDnaAnalysis.scores && Object.entries(latestDnaAnalysis.scores).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs uppercase tracking-widest cyber-muted mb-1">
                      <span>{String(key)}</span>
                      <span>{Number(value)}/10</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-cyan-400"
                        style={{ width: `${Math.min(100, Number(value) * 10)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs cyber-muted">
              {new Date(latestDnaAnalysis.createdAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="text-gray-100/90">{dnaText('No DNA analysis yet. Run Full DNA.', 'Aún no hay análisis ADN. Ejecuta ADN Completo.')}</p>
        )}
      </div>

      {dnaIntegrityReport?.issues?.length ? (
        <div className="cyber-panel rounded-2xl p-5 space-y-3">
          <p className="text-xs uppercase tracking-widest cyber-muted">{dnaText('Integrity Findings', 'Hallazgos de Integridad')}</p>
          <div className="space-y-2">
            {dnaIntegrityReport.issues.slice(0, 8).map((issue: any, index: number) => (
              <div key={`${issue.category}-${index}`} className="border border-white/10 rounded-lg p-3 bg-black/30">
                <p className="text-sm text-gray-200">{issue.message}</p>
                <p className="text-[11px] uppercase tracking-widest text-cyan-200/70 mt-1">
                  {issue.severity} · {issue.category}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="pt-2">
        <details
          open={dnaIntegrityExpanded}
          onToggle={(event) => setDnaIntegrityExpanded((event.currentTarget as HTMLDetailsElement).open)}
          className="border border-white/10 rounded-xl p-4 bg-black/20"
        >
          <summary className="cursor-pointer text-sm text-cyan-200">
            {dnaText('Open Detailed Integrity Checker', 'Abrir Chequeador de Integridad Detallado')}
          </summary>
          <div className="mt-4">
            <SermonIntegrityDashboard workspaceId={workspaceId} />
          </div>
        </details>
      </div>
    </div>
  )
}
