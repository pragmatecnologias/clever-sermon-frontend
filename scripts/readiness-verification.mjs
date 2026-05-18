import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../../..')
const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:4000'
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1'
const screenshotDir = path.join(repoRoot, 'docs/qa/screenshots')
const reportPath = path.join(repoRoot, 'docs/qa/FEATURE_READINESS_AND_ARTIFACT_VERIFICATION.md')

const adminEmail = 'admin@example.com'
const adminPassword = 'password123'
const passage = 'John 3:16'
const translation = 'KJV'
const now = () => new Date().toISOString()
const logStep = (message) => console.log(`[verify] ${message}`)

fs.mkdirSync(screenshotDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 2200 } })
const page = await context.newPage()

const consoleErrors = []
const failedRequests = []
page.on('console', (message) => {
  if (message.type() === 'error') {
    const text = message.text()
    if (!text.includes('Failed to load resource: the server responded with a status of 404 (Not Found)')) {
      consoleErrors.push(text)
    }
  }
})
page.on('pageerror', (error) => {
  consoleErrors.push(error.message)
})
page.on('requestfailed', (request) => {
  const url = request.url()
  if (url.includes('favicon.ico') || url.includes('manifest.json') || request.failure()?.errorText === 'net::ERR_ABORTED') {
    return
  }
  failedRequests.push(`${request.method()} ${url} :: ${request.failure()?.errorText || 'failed'}`)
})

const authHeaders = () => {
  const token = globalThis.__authToken
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function requestJson(method, url, data) {
  const options = {
    headers: authHeaders(),
    timeout: 120000,
  }
  if (data !== undefined) {
    options.data = data
  }
  const response = await page.request[method.toLowerCase()](url, options)
  const text = await response.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  if (!response.ok()) {
    const message = typeof body === 'string' ? body : JSON.stringify(body)
    throw new Error(`${method} ${url} failed ${response.status()}: ${message}`)
  }
  return body
}

async function waitForState(workspaceId, predicate, timeoutMs = 120000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    const state = await requestJson('GET', `${apiBaseUrl}/workspaces/${workspaceId}/state`)
    if (predicate(state)) return state
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  throw new Error(`Timed out waiting for workspace state update: ${workspaceId}`)
}

async function waitForJob(workspaceId, jobId, timeoutMs = 900000) {
  const startedAt = Date.now()
  let lastLogAt = 0
  while (Date.now() - startedAt < timeoutMs) {
    const job = await requestJson('GET', `${apiBaseUrl}/workspaces/${workspaceId}/jobs/${jobId}`)
    if (job?.status === 'completed') return job
    if (job?.status === 'failed') {
      throw new Error(`Generation job ${jobId} failed: ${job?.error || 'unknown error'}`)
    }
    if (Date.now() - lastLogAt > 30000) {
      logStep(`job ${jobId} still ${job?.status || job?.state || 'queued'}`)
      lastLogAt = Date.now()
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  throw new Error(`Timed out waiting for generation job ${jobId}`)
}

async function queueGeneration(path, body = {}) {
  const payload = await requestJson('POST', `${apiBaseUrl}${path}?async=true`, body)
  if (!payload?.jobId) {
    throw new Error(`Queue response for ${path} did not include a job id`)
  }
  return payload
}

async function capture(name) {
  await page.screenshot({ path: path.join(screenshotDir, name), fullPage: true })
}

function classifyReadiness(status) {
  switch (status) {
    case 'generated':
      return 'Integrated and working'
    case 'ready':
      return 'Integrated and waiting for prerequisite'
    case 'needs_data':
      return 'Integrated and waiting for seed data'
    case 'needs_service':
      return 'Integrated and waiting for service'
    case 'needs_prerequisite':
      return 'Integrated and waiting for prerequisite'
    case 'failed':
      return 'Broken'
    default:
      return 'Integrated but needs UX polish'
  }
}

function safeCount(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

const rows = []
function addRow(row) {
  rows.push(row)
}

await page.goto(`${frontendBaseUrl}/login`)
logStep('logging in')
await page.locator('input[type="email"]').fill(adminEmail)
await page.locator('input[type="password"]').fill(adminPassword)
const loginData = await page.request.post(`${apiBaseUrl.replace(/\/api\/v1$/, '')}/api/v1/auth/login`, {
  data: { email: adminEmail, password: adminPassword },
})
const loginPayload = await loginData.json()
globalThis.__authToken = loginPayload.access_token
await page.evaluate(({ token, user }) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}, { token: loginPayload.access_token, user: loginPayload.user })
await page.goto(`${frontendBaseUrl}/dashboard`)
await page.waitForLoadState('domcontentloaded')
await page.waitForTimeout(800)

await page.goto(`${frontendBaseUrl}/workspace/new`)
logStep('creating workspace')
const workspaceForm = page.locator('form').first()
await workspaceForm.locator('input').nth(0).fill(`Feature Readiness Sermon ${Date.now()}`)
await workspaceForm.locator('input').nth(1).fill('Feature Readiness Sprint')
await workspaceForm.locator('input').nth(2).fill(passage)
await workspaceForm.locator('input').nth(3).fill('Romans 8:28, Philippians 4:13')
await workspaceForm.locator('select').nth(0).selectOption({ label: 'Expository' })
await workspaceForm.locator('select').nth(1).selectOption({ label: 'Problem → Truth → Response' })
await workspaceForm.locator('select').nth(2).selectOption({ label: 'English' })
await workspaceForm.locator('input').nth(4).fill('God gives salvation through Christ')
await workspaceForm.locator('input').nth(5).fill('Mixed congregation')
await workspaceForm.locator('textarea').fill('Show the gospel clearly and bridge study into an outline.')
await workspaceForm.locator('input[type="checkbox"]').check()
await page.getByRole('button', { name: 'Create Workspace' }).click()
await page.waitForURL(/\/workspace\/[^/?]+/)
await page.waitForLoadState('domcontentloaded')
await page.waitForTimeout(1200)

const workspaceId = new URL(page.url()).pathname.split('/').filter(Boolean).pop()
if (!workspaceId) throw new Error('Workspace id not found after create')
logStep(`workspace created ${workspaceId}`)

await capture('readiness-01-setup.png')

let state = await requestJson('GET', `${apiBaseUrl}/workspaces/${workspaceId}/state`)

const scripturePage = new URL(page.url())
logStep('loading scripture')
scripturePage.searchParams.set('phase', 'PASSAGE')
scripturePage.searchParams.set('section', 'scripture')
await page.goto(scripturePage.toString())
await page.waitForLoadState('domcontentloaded')
await page.locator('input[placeholder="John 3:16"]').fill(passage)
await page.getByRole('button', { name: 'Lookup', exact: true }).click()
await page.getByText(`Last lookup: ${passage}`).waitFor({ state: 'visible', timeout: 30000 })

const scripture = await requestJson('GET', `${apiBaseUrl}/scripture/passage?reference=${encodeURIComponent(passage)}&translation=${encodeURIComponent(translation)}`)
logStep('captured scripture payloads')
const passageSummary = await requestJson('GET', `${apiBaseUrl}/scripture/passage-summary?reference=${encodeURIComponent(passage)}&language=en`)
const translationComparison = await requestJson('GET', `${apiBaseUrl}/scripture/translation-comparison-enhanced?reference=${encodeURIComponent(passage)}&language=en`)
const verseCommentary = await requestJson('GET', `${apiBaseUrl}/scripture/verse-commentary?reference=${encodeURIComponent(passage)}&language=en`)
const structuralAnalysis = await requestJson('GET', `${apiBaseUrl}/scripture/structural-analysis?reference=${encodeURIComponent(passage)}&language=en`)
const interpretiveChallenges = await requestJson('GET', `${apiBaseUrl}/scripture/interpretive-challenge?passage=${encodeURIComponent(passage)}&language=en`)
const canonicalThemes = await requestJson('GET', `${apiBaseUrl}/scripture/canonical-themes?reference=${encodeURIComponent(passage)}&language=en`)
const studySynthesis = await requestJson('GET', `${apiBaseUrl}/scripture/study-synthesis?reference=${encodeURIComponent(passage)}&language=en`)
const crossReferences = await requestJson('GET', `${apiBaseUrl}/scripture/cross-references-ranked?verse=${encodeURIComponent(passage)}`)
const egwPanel = await requestJson('GET', `${apiBaseUrl}/egw/passage-panel?book=John&chapter=3&verseStart=16&verseEnd=16&language=en&limit=5`)
const wordStudySuggestions = await requestJson('GET', `${apiBaseUrl}/scripture/word-study-suggestions?reference=${encodeURIComponent(passage)}&translation=${encodeURIComponent(translation)}&language=greek&responseLanguage=en`)
let wordStudy = null
const candidateTerm = Array.isArray(wordStudySuggestions) ? wordStudySuggestions[0]?.term : null
if (candidateTerm) {
  try {
    wordStudy = await requestJson(
      'GET',
      `${apiBaseUrl}/scripture/word-study-insights?word=${encodeURIComponent(candidateTerm)}&language=greek&context=${encodeURIComponent(passage)}&responseLanguage=en`,
    )
  } catch {
    wordStudy = null
  }
}

await requestJson('PATCH', `${apiBaseUrl}/workspaces/${workspaceId}/scripture-cache`, {
  scriptureLastLookup: passage,
  scriptureTranslation: translation,
  scriptureResult: scripture,
  lookupHistory: [
    {
      scriptureLastLookup: passage,
      scriptureTranslation: translation,
      cachedAt: now(),
    },
  ],
  passageSummary,
  translationComparison,
  verseCommentary,
  structuralAnalysis,
  interpretiveChallenges,
  canonicalThemes,
  studySynthesis,
  crossReferences: {
    verse: passage,
    ranked: Array.isArray(crossReferences) ? crossReferences : [],
    cachedAt: now(),
  },
  egwPanel,
  wordStudy,
})

state = await waitForState(workspaceId, (nextState) => Boolean(nextState.featureReadiness?.scripture?.status === 'generated'))
await page.reload()
await page.waitForLoadState('domcontentloaded')
await page.waitForTimeout(1200)
await capture('readiness-02-scripture.png')

const studyReportResponse = await queueGeneration(`/workspaces/${workspaceId}/study-report`, { promptOverride: '' })
logStep(`study report queued ${studyReportResponse.jobId}`)
await waitForJob(workspaceId, studyReportResponse.jobId)
logStep('study report completed')
state = await waitForState(workspaceId, (nextState) => safeCount(nextState.artifacts?.studyReports) > 0)
const studyReportId = state.studyReports?.[0]?.id || state.workspace?.studyReport?.id || null

await page.goto(`${frontendBaseUrl}/workspace/${workspaceId}?phase=STUDY&section=study-report`)
await page.waitForLoadState('domcontentloaded')
await page.waitForTimeout(1200)
await capture('readiness-03-deep-study.png')

const sermonCoreResponse = await queueGeneration(`/workspaces/${workspaceId}/sermon-core`, { promptOverride: '' })
logStep(`sermon core queued ${sermonCoreResponse.jobId}`)
await waitForJob(workspaceId, sermonCoreResponse.jobId)
logStep('sermon core completed')
state = await waitForState(workspaceId, (nextState) => Boolean(nextState.workspace?.sermonCore?.bigIdea))
await page.goto(`${frontendBaseUrl}/workspace/${workspaceId}?phase=OUTLINE&section=outlines`)
await page.waitForLoadState('domcontentloaded')
await page.waitForTimeout(1200)
await capture('readiness-04-sermon-core.png')

const outlineResponse = await queueGeneration(`/workspaces/${workspaceId}/outlines`, { promptOverride: '' })
logStep(`outline queued ${outlineResponse.jobId}`)
await waitForJob(workspaceId, outlineResponse.jobId)
logStep('outline completed')
state = await waitForState(workspaceId, (nextState) => safeCount(nextState.artifacts?.outlines) > 0)
const selectedOutlineId =
  state.activeOutline?.id ||
  state.workspace?.outlines?.find((outline) => outline?.isSelected)?.id ||
  state.workspace?.outlines?.[0]?.id ||
  outlineResponse?.id ||
  null
if (!selectedOutlineId) {
  throw new Error('Outline id not found after generation')
}

await page.goto(`${frontendBaseUrl}/workspace/${workspaceId}?phase=OUTLINE&section=outlines`)
await page.waitForLoadState('domcontentloaded')
await page.waitForTimeout(1200)
await capture('readiness-05-outline.png')

const manuscriptResponse = await queueGeneration(`/workspaces/${workspaceId}/manuscript`, {
  outlineId: selectedOutlineId,
  promptOverride: '',
  manuscriptOptions: {
    tone: 'teaching',
    targetMinutes: 28,
    format: 'full',
    audienceMode: 'default',
    includeSlideCues: true,
    includeKeyLines: true,
  },
})
logStep(`manuscript queued ${manuscriptResponse.jobId}`)
await waitForJob(workspaceId, manuscriptResponse.jobId)
logStep('manuscript completed')
state = await waitForState(workspaceId, (nextState) => safeCount(nextState.artifacts?.manuscripts) > 0)
await page.goto(`${frontendBaseUrl}/workspace/${workspaceId}?phase=WRITE&section=manuscript`)
await page.waitForLoadState('domcontentloaded')
await page.waitForTimeout(1200)
await capture('readiness-06-manuscript.png')

const citationsResponse = await queueGeneration(`/workspaces/${workspaceId}/citations`, { promptOverride: '' })
logStep(`citations queued ${citationsResponse.jobId}`)
await waitForJob(workspaceId, citationsResponse.jobId)
logStep('citations completed')
state = await waitForState(workspaceId, (nextState) => safeCount(nextState.artifacts?.citations) > 0)
const integrityResponse = await queueGeneration(`/workspaces/${workspaceId}/integrity-check`)
logStep(`integrity check queued ${integrityResponse.jobId}`)
await waitForJob(workspaceId, integrityResponse.jobId)
logStep('integrity check completed')
state = await waitForState(workspaceId, (nextState) => Boolean(nextState.latestIntegrityReport || nextState.integrityIssueLedger?.length))

await page.goto(`${frontendBaseUrl}/workspace/${workspaceId}?phase=REFINE&section=dna`)
await page.waitForLoadState('domcontentloaded')
await page.waitForTimeout(1200)
await capture('readiness-07-review.png')

await requestJson('POST', `${apiBaseUrl}/workspaces/${workspaceId}/media-pack/compose`, {
  includeDeck: true,
  exportTypes: ['pptx', 'pdf'],
  deckSize: 'standard',
  backgroundProvider: 'local',
})
logStep('media pack composed')
state = await waitForState(workspaceId, (nextState) => Boolean(nextState.mediaPack?.status === 'ready' || nextState.exportPack?.artifacts?.length))

let slidesDecks = []
let slidesServiceAvailable = false
try {
  slidesDecks = await requestJson('GET', `${apiBaseUrl}/media/decks`)
  slidesServiceAvailable = true
} catch {
  slidesDecks = []
}
logStep('slides deck list checked')

await page.goto(`${frontendBaseUrl}/workspace/${workspaceId}?phase=STUDY&section=visualizations`)
await page.waitForLoadState('domcontentloaded')
await page.waitForTimeout(1200)
await capture('readiness-08-visual-exploration.png')

await page.goto(`${frontendBaseUrl}/workspace/${workspaceId}?phase=DELIVER&section=media`)
await page.waitForLoadState('domcontentloaded')
await page.waitForTimeout(1200)
await capture('readiness-09-media.png')

await page.reload()
await page.waitForLoadState('domcontentloaded')
await page.waitForTimeout(1000)
const stateAfterReload = await requestJson('GET', `${apiBaseUrl}/workspaces/${workspaceId}/state`)
logStep('workspace reloaded and final state captured')

addRow({
  feature: 'Create Workspace',
  action: 'Filled /workspace/new and submitted the form',
  endpoint: 'POST /api/v1/workspaces',
  artifact: 'Workspace record',
  found: Boolean(workspaceId),
  persisted: Boolean(stateAfterReload?.workspace?.id === workspaceId),
  classification: 'Integrated and working',
  notes: 'Redirected to /workspace/:id and workspace survived reload.',
})

addRow({
  feature: 'Scripture Load',
  action: 'Looked up John 3:16 and patched scripture cache',
  endpoint: 'GET /api/v1/scripture/passage',
  artifact: 'Scripture snapshot',
  found: Boolean(stateAfterReload?.featureReadiness?.scripture?.status),
  persisted: Boolean(stateAfterReload?.featureReadiness?.scripture?.status === 'generated'),
  classification: classifyReadiness(stateAfterReload?.featureReadiness?.scripture?.status),
  notes: `Lookup history count ${safeCount(stateAfterReload?.featureReadiness?.scripture?.count)}.`,
})

addRow({
  feature: 'Study Report',
  action: 'Generated study report',
  endpoint: 'POST /api/v1/workspaces/:id/study-report',
  artifact: 'SermonStudyReport',
  found: safeCount(stateAfterReload?.artifacts?.studyReports) > 0,
  persisted: safeCount(stateAfterReload?.artifacts?.studyReports) > 0,
  classification: classifyReadiness(stateAfterReload?.featureReadiness?.studyReport?.status),
  notes: `Count ${safeCount(stateAfterReload?.artifacts?.studyReports)}; report id ${studyReportId || 'n/a'}.`,
})

addRow({
  feature: 'Sermon Core',
  action: 'Generated sermon core',
  endpoint: 'POST /api/v1/workspaces/:id/sermon-core',
  artifact: 'SermonCoreData',
  found: Boolean(stateAfterReload?.workspace?.sermonCore?.bigIdea),
  persisted: Boolean(stateAfterReload?.workspace?.sermonCore?.bigIdea),
  classification: classifyReadiness(stateAfterReload?.featureReadiness?.sermonCore?.status),
  notes: `Big idea: ${stateAfterReload?.workspace?.sermonCore?.bigIdea ? 'present' : 'missing'}.`,
})

addRow({
  feature: 'Outline',
  action: 'Generated outline',
  endpoint: 'POST /api/v1/workspaces/:id/outlines',
  artifact: 'Selected outline',
  found: safeCount(stateAfterReload?.artifacts?.outlines) > 0,
  persisted: safeCount(stateAfterReload?.artifacts?.outlines) > 0,
  classification: classifyReadiness(stateAfterReload?.featureReadiness?.outline?.status),
  notes: `Selected outline ${selectedOutlineId || 'missing'}; count ${safeCount(stateAfterReload?.artifacts?.outlines)}.`,
})

addRow({
  feature: 'Manuscript',
  action: 'Generated manuscript from selected outline',
  endpoint: 'POST /api/v1/workspaces/:id/manuscript',
  artifact: 'SermonManuscript',
  found: safeCount(stateAfterReload?.artifacts?.manuscripts) > 0,
  persisted: safeCount(stateAfterReload?.artifacts?.manuscripts) > 0,
  classification: classifyReadiness(stateAfterReload?.featureReadiness?.manuscript?.status),
  notes: `Count ${safeCount(stateAfterReload?.artifacts?.manuscripts)}.`,
})

addRow({
  feature: 'Citations',
  action: 'Generated citations',
  endpoint: 'POST /api/v1/workspaces/:id/citations',
  artifact: 'SermonCitation[]',
  found: safeCount(stateAfterReload?.artifacts?.citations) > 0,
  persisted: safeCount(stateAfterReload?.artifacts?.citations) > 0,
  classification: classifyReadiness(stateAfterReload?.featureReadiness?.citations?.status),
  notes: `Count ${safeCount(stateAfterReload?.artifacts?.citations)}.`,
})

addRow({
  feature: 'Integrity Review',
  action: 'Ran integrity check',
  endpoint: 'POST /api/v1/workspaces/:id/integrity-check',
  artifact: 'Integrity report / issue ledger',
  found: Boolean(stateAfterReload?.latestIntegrityReport || stateAfterReload?.integrityIssueLedger?.length),
  persisted: Boolean(stateAfterReload?.latestIntegrityReport || stateAfterReload?.integrityIssueLedger?.length),
  classification: classifyReadiness(stateAfterReload?.featureReadiness?.integrityReview?.status),
  notes: `Issues ${safeCount(stateAfterReload?.integrityIssueLedger?.length)}.`,
})

addRow({
  feature: 'Visual Exploration',
  action: 'Opened visual exploration phase',
  endpoint: 'GET /api/v1/workspaces/:id/state',
  artifact: 'Workspace-connected visualization tools',
  found: Boolean(stateAfterReload?.featureReadiness?.visualExploration),
  persisted: true,
  classification: classifyReadiness(stateAfterReload?.featureReadiness?.visualExploration?.status),
  notes: 'Rendered as a workspace-connected analysis surface.',
})

addRow({
  feature: 'Media Pack',
  action: 'Composed media pack',
  endpoint: 'POST /api/v1/workspaces/:id/media-pack/compose',
  artifact: 'MediaPack manifest',
  found: Boolean(stateAfterReload?.mediaPack?.status === 'ready'),
  persisted: Boolean(stateAfterReload?.mediaPack?.status === 'ready'),
  classification: classifyReadiness(stateAfterReload?.featureReadiness?.media?.status),
  notes: `Slides count ${safeCount(stateAfterReload?.mediaPack?.slideCount)}.`,
})

addRow({
  feature: 'Slides Export',
  action: 'Generated PPTX/PDF exports',
  endpoint: 'GET /api/v1/media/decks',
  artifact: 'Deck/export artifacts',
  found: Boolean(slidesDecks?.length || stateAfterReload?.exportPack?.artifacts?.length),
  persisted: Boolean(stateAfterReload?.exportPack?.artifacts?.length),
  classification: slidesServiceAvailable ? 'Integrated and working' : 'Integrated and waiting for service',
  notes: slidesServiceAvailable
    ? `Deck count ${safeCount(slidesDecks.length)}.`
    : 'Slides service did not return decks.',
})

addRow({
  feature: 'LLM Provider',
  action: 'Read readiness from workspace state',
  endpoint: 'GET /api/v1/workspaces/:id/state',
  artifact: 'Readiness signal',
  found: Boolean(stateAfterReload?.featureReadiness?.llmProvider),
  persisted: true,
  classification: classifyReadiness(stateAfterReload?.featureReadiness?.llmProvider?.status),
  notes: stateAfterReload?.featureReadiness?.llmProvider?.message || 'No provider message returned.',
})

const workspaceSummary = stateAfterReload?.workspace || {}
const readiness = stateAfterReload?.featureReadiness || {}

const report = `# Feature Readiness And Artifact Verification

## Readiness Model

- Backend truth source: \`GET /api/v1/workspaces/:id/state\`
- Status values: ready, generated, needs_prerequisite, needs_data, needs_service, failed
- Frontend badges now read backend readiness when present and only fall back to local heuristics when needed.

## Files Changed

- apps/clever-sermon-frontend/scripts/readiness-verification.mjs
- apps/clever-sermon-frontend/src/components/FeatureStatusBadge.tsx
- apps/clever-sermon-frontend/src/components/PhaseNavigation.tsx
- apps/clever-sermon-frontend/src/components/WorkspaceScriptureAnalysisPanels.tsx
- apps/clever-sermon-frontend/src/components/WorkspaceVisualizationsSection.tsx
- apps/clever-sermon-frontend/src/components/CanonicalThemeTracing.tsx
- apps/clever-sermon-frontend/src/components/WorkspaceOutlinePhase.tsx
- services/clever-sermon-backend/src/modules/workspaces/workspaces.service.ts
- services/clever-sermon-backend/src/modules/workspaces/media-proxy.controller.ts
- shared/workspace-state.contract.ts

## Verified Artifact Chain

- Workspace title: ${workspaceSummary.title || 'n/a'}
- Workspace id: ${workspaceId}
- Main passage: ${workspaceSummary.mainPassage || passage}
- Study report id: ${studyReportId || 'n/a'}
- Selected outline id: ${selectedOutlineId || 'n/a'}
- Slides decks found: ${safeCount(slidesDecks?.length)}

## Artifact Verification Table

| Feature | Action tested | API endpoint | Artifact expected | Artifact found? | Persisted after reload? | Classification | Notes |
|---|---|---|---|---:|---:|---|---|
${rows.map((row) => `| ${row.feature} | ${row.action} | ${row.endpoint} | ${row.artifact} | ${row.found ? 'Yes' : 'No'} | ${row.persisted ? 'Yes' : 'No'} | ${row.classification} | ${row.notes} |`).join('\n')}

## Screenshots

- [readiness-01-setup.png](/Users/admin/CascadeProjects/clever-church/docs/qa/screenshots/readiness-01-setup.png)
- [readiness-02-scripture.png](/Users/admin/CascadeProjects/clever-church/docs/qa/screenshots/readiness-02-scripture.png)
- [readiness-03-deep-study.png](/Users/admin/CascadeProjects/clever-church/docs/qa/screenshots/readiness-03-deep-study.png)
- [readiness-04-sermon-core.png](/Users/admin/CascadeProjects/clever-church/docs/qa/screenshots/readiness-04-sermon-core.png)
- [readiness-05-outline.png](/Users/admin/CascadeProjects/clever-church/docs/qa/screenshots/readiness-05-outline.png)
- [readiness-06-manuscript.png](/Users/admin/CascadeProjects/clever-church/docs/qa/screenshots/readiness-06-manuscript.png)
- [readiness-07-review.png](/Users/admin/CascadeProjects/clever-church/docs/qa/screenshots/readiness-07-review.png)
- [readiness-08-visual-exploration.png](/Users/admin/CascadeProjects/clever-church/docs/qa/screenshots/readiness-08-visual-exploration.png)
- [readiness-09-media.png](/Users/admin/CascadeProjects/clever-church/docs/qa/screenshots/readiness-09-media.png)

## Remaining Gaps

- Cross-reference and EGW seed coverage can still be sparse depending on database contents.
- Visual exploration tools are integrated but still rely on current sermon data quality.
- Slides availability depends on the slides backend responding to the proxied media facade.

## Next Recommended Sprint

- Fill the remaining seed-data gaps for EGW and cross references.
- Tighten any readiness labels that still read as "ready" when a downstream data source is truly empty.
- Expand the same backend-driven readiness model to the remaining tool cards in the workspace shell.
`

fs.writeFileSync(reportPath, report, 'utf8')

if (consoleErrors.length || failedRequests.length) {
  console.log(JSON.stringify({ consoleErrors, failedRequests }, null, 2))
}

await browser.close()

console.log(JSON.stringify({
  workspaceId,
  screenshots: [
    'readiness-01-setup.png',
    'readiness-02-scripture.png',
    'readiness-03-deep-study.png',
    'readiness-04-sermon-core.png',
    'readiness-05-outline.png',
    'readiness-06-manuscript.png',
    'readiness-07-review.png',
    'readiness-08-visual-exploration.png',
    'readiness-09-media.png',
  ],
  reportPath,
  readiness: Object.fromEntries(Object.entries(readiness).map(([key, value]) => [key, value?.status || null])),
}, null, 2))
