import { expect, test, type Page } from '@playwright/test'

const ADMIN_EMAIL = 'admin@example.com'
const ADMIN_PASSWORD = 'password123'
const SCREENSHOT_DIR = '/Users/admin/CascadeProjects/clever-church/docs/e2e/screenshots'

const isKnownNoise = (text: string) =>
  text.includes('THREE.WebGLRenderer:') ||
  text.includes('Failed to load themes:') ||
  text.includes('Failed to load existing sermon context:') ||
  text.includes('Failed to load existing deck context:') ||
  text.includes('Failed to load voices:') ||
  text.includes('Failed to generate narration script:') ||
  text.includes('Failed to load resource: the server responded with a status of 404 (Not Found)')

const captureConsoleNoise = (page: Page) => {
  const consoleErrors: string[] = []
  const failedRequests: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text()
      if (!isKnownNoise(text)) {
        consoleErrors.push(text)
      }
    }
  })

  page.on('pageerror', (error) => {
    if (!isKnownNoise(error.message)) {
      consoleErrors.push(error.message)
    }
  })

  page.on('requestfailed', (request) => {
    const url = request.url()
    if (
      url.includes('favicon.ico') ||
      url.includes('manifest.json') ||
      url.includes('apple-touch-icon') ||
      url.includes('_rsc') ||
      request.failure()?.errorText === 'net::ERR_ABORTED'
    ) {
      return
    }
    failedRequests.push(`${request.method()} ${url} :: ${request.failure()?.errorText || 'failed'}`)
  })

  return { consoleErrors, failedRequests }
}

async function loginAndCreateWorkspace(page: Page) {
  await page.route('**/favicon.ico', async (route) => route.fulfill({ status: 204, body: '' }))
  await page.route('**/manifest.json', async (route) => route.fulfill({ status: 204, body: '' }))
  await page.route('**/apple-touch-icon.png', async (route) => route.fulfill({ status: 204, body: '' }))
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()

  const loginResponse = await page.request.post('http://localhost:4001/api/v1/auth/login', {
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
  })
  expect(loginResponse.ok()).toBeTruthy()
  const loginData = await loginResponse.json()
  await page.evaluate((payload) => {
    localStorage.setItem('token', payload.access_token)
    localStorage.setItem('user', JSON.stringify(payload.user))
  }, loginData)

  await page.goto('/dashboard')
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(750)
  await expect(page.getByRole('heading', { name: 'My Workspaces' })).toBeVisible()

  await page.screenshot({ path: `${SCREENSHOT_DIR}/ux-01-dashboard.png`, fullPage: true })

  await page.goto('/workspace/new')
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(750)
  await expect(page.getByRole('heading', { name: 'Create New Workspace' })).toBeVisible()
  await page.screenshot({ path: `${SCREENSHOT_DIR}/ux-02-create-workspace.png`, fullPage: true })

  const title = `UX Stabilization Sermon ${Date.now()}`
  const createResponse = await page.request.post('http://localhost:4001/api/v1/workspaces', {
    headers: {
      Authorization: `Bearer ${loginData.access_token}`,
    },
    data: {
      title,
      seriesTitle: 'UX Stabilization',
      mainPassage: 'John 3:16',
      theme: 'Gods love made clear',
      audienceProfile: 'Congregation',
      sermonGoals: 'Make the sermon feel clear, kind, and easy to follow.',
      theologicalLens: 'adventist',
      style: 'expository',
      storyArc: 'problem_truth_response',
      language: 'en',
      egwEnabled: true,
    },
  })
  expect(createResponse.ok()).toBeTruthy()
  const createdWorkspace = await createResponse.json()
  const workspaceId = createdWorkspace.id
  expect(workspaceId).toBeTruthy()

  await page.goto(`/workspace/${workspaceId}`)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(1000)

  return { title, workspaceId }
}

async function assertStablePhase(page: Page, phase: string, section: string) {
  const phaseUrl = new URL(page.url())
  expect(phaseUrl.searchParams.get('phase')).toBe(phase)
  expect(phaseUrl.searchParams.get('section')).toBe(section)
  await page.reload()
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(750)
  const reloadedUrl = new URL(page.url())
  expect(reloadedUrl.searchParams.get('phase')).toBe(phase)
  expect(reloadedUrl.searchParams.get('section')).toBe(section)
}

test.describe('UX stabilization', () => {
  test('pastor-friendly workspace flow stays stable across refresh', async ({ page }) => {
    const { consoleErrors, failedRequests } = captureConsoleNoise(page)

    const { title, workspaceId } = await loginAndCreateWorkspace(page)
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sermon Progress' }).first()).toBeVisible()
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ux-03-overview.png`, fullPage: true })

    await page.goto(`/workspace/${workspaceId}?phase=STUDY&section=study-report`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
    await expect(page.getByRole('button', { name: 'Study' }).first()).toBeVisible()
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ux-04-study.png`, fullPage: true })
    await assertStablePhase(page, 'STUDY', 'study-report')

    await page.goto(`/workspace/${workspaceId}?phase=OUTLINE&section=outlines`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
    await expect(page.getByRole('button', { name: 'Outline' }).first()).toBeVisible()
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ux-05-outline.png`, fullPage: true })
    await assertStablePhase(page, 'OUTLINE', 'outlines')

    await page.goto(`/workspace/${workspaceId}?phase=WRITE&section=manuscript`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
    await expect(page.getByRole('button', { name: 'Manuscript' }).first()).toBeVisible()
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ux-06-manuscript.png`, fullPage: true })
    await assertStablePhase(page, 'WRITE', 'manuscript')

    await page.goto(`/workspace/${workspaceId}?phase=REFINE&section=dna`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
    await expect(page.getByRole('button', { name: 'Review' }).first()).toBeVisible()
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ux-07-review.png`, fullPage: true })
    await assertStablePhase(page, 'REFINE', 'dna')

    await page.goto(`/workspace/${workspaceId}?phase=DELIVER&section=media`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
    await expect(page.getByRole('button', { name: 'Media & Export' }).first()).toBeVisible()
    await page.screenshot({ path: `${SCREENSHOT_DIR}/ux-08-media-export.png`, fullPage: true })
    await assertStablePhase(page, 'DELIVER', 'media')

    expect(consoleErrors).toEqual([])
    expect(failedRequests).toEqual([])
  })
})
