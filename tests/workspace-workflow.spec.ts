import { expect, test } from '@playwright/test'

const workspaceId = 'test'

const sampleWorkspace = {
  id: workspaceId,
  title: 'Grace That Transforms',
  seriesTitle: 'Ephesians Study',
  mainPassage: 'Ephesians 2:1-10',
  language: 'en',
  status: 'DRAFT',
  theme: 'Grace and new life',
  audienceProfile: 'congregation',
  sermonGoals: 'Show salvation by grace',
  storyArc: 'gospel',
  egwEnabled: true,
  theologicalLens: 'Adventist',
  metadata: {},
  outlines: [
    {
      id: 'outline-1',
      title: 'From Death to Life',
      isSelected: true,
      pointCount: 3,
      structure: {
        introduction: 'God makes dead hearts live.',
        points: [{ title: 'Dead in sin' }, { title: 'Made alive by grace' }, { title: 'Saved for good works' }],
        conclusion: 'Walk in the life Christ gives.',
      },
    },
  ],
  manuscripts: [
    {
      id: 'manuscript-1',
      outlineId: 'outline-1',
      wordCount: 1240,
      estimatedMinutes: 9,
      content: {
        text: '<p>Grace that transforms us.</p>',
      },
    },
  ],
  studyReports: [
    {
      id: 'report-1',
      sections: {
        passageOverview: 'Paul describes salvation as a gift.',
      },
    },
  ],
  citations: [],
  applications: [],
  discussionQuestions: [],
  illustrations: [],
  scriptureCache: {},
  dnaAnalyses: [],
}

const sampleState = {
  workspace: sampleWorkspace,
  activePhase: 'THEME',
  activeSection: 'workspace',
  progress: {
    themeConfigured: true,
    passageExplored: true,
    studyGenerated: true,
    outlineCreated: true,
    manuscriptWritten: true,
    refineCompleted: false,
    deliverPrepared: false,
  },
  artifacts: {
    outlines: 1,
    manuscripts: 1,
    studyReports: 1,
    applications: 0,
    illustrations: 0,
    citations: 0,
  },
  activeOutline: {
    id: 'outline-1',
    title: 'From Death to Life',
    isSelected: true,
    pointCount: 3,
  },
  activeManuscript: {
    id: 'manuscript-1',
    outlineId: 'outline-1',
    wordCount: 1240,
    estimatedMinutes: 9,
  },
  outlineHistory: [],
  manuscriptHistory: [],
  outlineComparison: null,
  manuscriptComparison: null,
  latestIntegrityReport: {
    overallScore: 82,
    balanced: true,
    issueCount: 1,
    strengthCount: 4,
    criticalIssueCount: 0,
    warningIssueCount: 1,
    reviewedIssueCount: 0,
    updatedAt: new Date().toISOString(),
  },
  integrityIssueLedger: [
    {
      id: 'issue-1',
      severity: 'warning',
      category: 'application',
      message: 'One application needs a citation.',
      affectedItem: 'Point 2',
      status: 'open',
      updatedAt: new Date().toISOString(),
    },
  ],
  integrityIssueReviews: [],
  mediaPack: {
    status: 'ready',
    generatedAt: new Date().toISOString(),
    sourceOutlineId: 'outline-1',
    sourceManuscriptId: 'manuscript-1',
    sourceStudyReportId: 'report-1',
    slideCount: 6,
    exportPrepared: true,
  },
  exportPack: {
    status: 'draft',
    generatedAt: new Date().toISOString(),
    sourceOutlineId: 'outline-1',
    sourceManuscriptId: 'manuscript-1',
    sourceStudyReportId: 'report-1',
    artifacts: [
      { type: 'pptx', label: 'Slides', status: 'ready', filename: 'grace-that-transforms.pptx' },
      { type: 'pdf', label: 'Slides PDF', status: 'ready', filename: 'grace-that-transforms.pdf' },
      { type: 'docx', label: 'Manuscript', status: 'ready', filename: 'grace-that-transforms.docx' },
      { type: 'study-report', label: 'Study Report', status: 'ready', filename: 'grace-that-transforms-study-report.docx' },
    ],
  },
  claimLedger: [],
  sourceLedger: [],
  claimReviewDecisions: [],
  nextAction: {
    phase: 'PASSAGE',
    section: 'scripture',
    action: 'lookup-passage',
    label: 'Study the passage',
    description: 'Load the main passage, compare translations, and confirm the textual context.',
  },
  uiState: {
    phase: 'THEME',
    section: 'workspace',
  },
}

test.describe('Workspace workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token')
    })

    await page.route('**/api/v1/**', async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      const method = request.method()
      const path = url.pathname

      const fulfillJson = async (payload: unknown, status = 200) =>
        route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify(payload),
        })

      if (path === '/api/v1/workspaces/test/state' && method === 'GET') {
        return fulfillJson(sampleState)
      }

      if (path === '/api/v1/workspaces/test' && method === 'GET') {
        return fulfillJson(sampleWorkspace)
      }

      if (path === '/api/v1/workspaces/test/scripture-cache' && method === 'GET') {
        return fulfillJson(sampleWorkspace.scriptureCache)
      }

      if (path === '/api/v1/workspaces/test/jobs/job-1' && method === 'GET') {
        return fulfillJson({ status: 'completed', state: 'completed', result: sampleState })
      }

      if (path.endsWith('/prompts') && method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'text/plain',
          body: 'Prompt preview stub.',
        })
      }

      if (method === 'POST' && (
        path.endsWith('/outlines') ||
        path.endsWith('/manuscript') ||
        path.endsWith('/applications') ||
        path.endsWith('/discussion-questions') ||
        path.endsWith('/illustrations') ||
        path.endsWith('/citations') ||
        path.endsWith('/media-suggestions') ||
        path.endsWith('/integrity-check') ||
        path.endsWith('/study-report') ||
        path.endsWith('/sermon-core')
      )) {
        return fulfillJson({ jobId: 'job-1', status: 'queued', capability: 'workspace-generation' })
      }

      if (method === 'POST' && path.endsWith('/claim-reviews')) {
        return fulfillJson({ ok: true })
      }

      if (method === 'POST' && path.endsWith('/integrity-issue-reviews')) {
        return fulfillJson({ ok: true })
      }

      if (method === 'POST' && path.includes('/restore')) {
        return fulfillJson(sampleWorkspace.outlines?.[0] || sampleWorkspace.manuscripts?.[0] || {})
      }

      if (method === 'PATCH') {
        return fulfillJson({ ok: true })
      }

      if (path.includes('/scripture/') || path.includes('/search') || path.includes('/coach') || path.includes('/dna')) {
        return fulfillJson({})
      }

      return fulfillJson({})
    })
  })

  test('walks the sermon workspace flow', async ({ page }) => {
    await page.goto('/workspace/test')

    await expect(page.locator('h1').first()).toHaveText('Grace That Transforms')
    await expect(page.getByRole('button', { name: 'Workspace' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Outlines' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Manuscript' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Media' }).first()).toBeVisible()

    await page.getByRole('button', { name: 'Outlines' }).first().click()
    await expect(page.locator('h3').filter({ hasText: 'Outlines' }).first()).toBeVisible()
    await page.getByRole('button', { name: 'Generate' }).first().click()

    await page.getByRole('button', { name: 'Manuscript' }).first().click()
    await expect(page.getByRole('heading', { name: 'Manuscript' }).first()).toBeVisible()

    await page.getByRole('button', { name: 'DNA' }).first().click()
    await expect(page.getByRole('button', { name: 'DNA' }).first()).toBeVisible()

    await expect(page.getByText('Media Pack').first()).toBeVisible()
  })
})
