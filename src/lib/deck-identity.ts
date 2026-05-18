export type DeckIntentValue =
  | 'sermon_presentation'
  | 'social_summary'
  | 'teaching_study'
  | 'youth_message'
  | 'evangelistic_appeal'

export type DeckLibraryBucket = 'sermon_presentation' | 'social_summary' | 'legacy'

export type DeckQualityStatus = 'Ready' | 'Needs review' | 'Legacy short deck' | 'Social-only' | 'Failed'

export type DeckIdentity = {
  intent: DeckIntentValue | null
  intentLabel: string
  bucket: DeckLibraryBucket
  qualityStatus: DeckQualityStatus
  slideCount: number
  isLegacy: boolean
  isArchived: boolean
  generatedAtLabel: string
  sourceWorkspaceId: string | null
  sourceWorkspaceTitle: string
  sourceOutlineId: string | null
  sourceManuscriptId: string | null
  warnings: string[]
}

type WorkspaceLike = {
  id?: string
  title?: string
  metadata?: {
    mediaPack?: {
      activeSermonDeckId?: string | null
      activeSocialDeckId?: string | null
      latestDeckByIntent?: Partial<Record<DeckIntentValue, string | null>>
      archivedDeckIds?: string[]
    }
  }
}

const intentLabels: Record<DeckIntentValue, string> = {
  sermon_presentation: 'Sermon Presentation',
  social_summary: 'Social Summary',
  teaching_study: 'Teaching Study',
  youth_message: 'Youth Message',
  evangelistic_appeal: 'Evangelistic Appeal',
}

const socialSignals = /social|promo|promo|summary|instagram|whatsapp|announcement|share|carousel|story/i

const normalizeText = (value: unknown) => String(value || '').trim()

export const normalizeDeckIntent = (value?: unknown): DeckIntentValue | null => {
  const normalized = normalizeText(value).toLowerCase() as DeckIntentValue
  return normalized && normalized in intentLabels ? normalized : null
}

export const getDeckSlideCount = (deck: any): number => {
  const slides = Array.isArray(deck?.slides) ? deck.slides.length : 0
  const slideCount = Number(deck?.slideCount || deck?.slidesCount || slides || 0)
  return Number.isFinite(slideCount) ? slideCount : 0
}

export const getDeckWorkspaceId = (deck: any): string | null =>
  normalizeText(
    deck?.sermon?.workspaceId ||
      deck?.sermon?.workspace?.id ||
      deck?.sermon?.workspace?.workspaceId ||
      deck?.workspaceId ||
      deck?.workspace?.id,
  ) || null

export const getDeckSourceWorkspaceTitle = (deck: any, workspace?: WorkspaceLike | null): string =>
  normalizeText(
    deck?.sermon?.workspace?.title ||
      deck?.workspace?.title ||
      workspace?.title ||
      deck?.sermon?.title ||
      deck?.title ||
      '',
  ) || 'Current Workspace'

export const getDeckGeneratedAtLabel = (deck: any): string =>
  normalizeText(deck?.createdAt || deck?.updatedAt || '') || 'Unknown date'

export const inferDeckIntent = (deck: any): { intent: DeckIntentValue | null; source: 'explicit' | 'slide-count' | 'title' | 'legacy' } => {
  const explicit = normalizeDeckIntent(deck?.deckIntent)
  if (explicit) return { intent: explicit, source: 'explicit' }

  const slideCount = getDeckSlideCount(deck)
  const title = normalizeText(deck?.title || deck?.sermon?.title || deck?.name || '')

  if (slideCount >= 8) return { intent: 'sermon_presentation', source: 'slide-count' }
  if (slideCount <= 5 && socialSignals.test(title)) return { intent: 'social_summary', source: 'title' }

  return { intent: null, source: 'legacy' }
}

export const getDeckIdentity = (deck: any, workspace?: WorkspaceLike | null): DeckIdentity => {
  const inferred = inferDeckIntent(deck)
  const slideCount = getDeckSlideCount(deck)
  const intent = inferred.intent
  const archivedDeckIds = workspace?.metadata?.mediaPack?.archivedDeckIds || []
  const isArchived = archivedDeckIds.includes(String(deck?.id || ''))
  const sourceWorkspaceId = getDeckWorkspaceId(deck)
  const sourceWorkspaceTitle = getDeckSourceWorkspaceTitle(deck, workspace)
  const generatedAtLabel = getDeckGeneratedAtLabel(deck)
  const sourceOutlineId = normalizeText(deck?.sourceOutlineId || deck?.outlineId || deck?.metadata?.sourceOutlineId) || null
  const sourceManuscriptId =
    normalizeText(deck?.sourceManuscriptId || deck?.manuscriptId || deck?.metadata?.sourceManuscriptId) || null

  let bucket: DeckLibraryBucket = 'legacy'
  let qualityStatus: DeckQualityStatus = 'Needs review'
  const warnings: string[] = []

  if (isArchived) {
    warnings.push('Archived deck')
  }

  if (intent === 'social_summary') {
    bucket = 'social_summary'
    qualityStatus = 'Social-only'
    if (slideCount > 5) {
      warnings.push('This social deck is longer than the usual promo range.')
    }
  } else if (intent === 'sermon_presentation') {
    bucket = 'sermon_presentation'
    if (slideCount < 8) {
      qualityStatus = 'Legacy short deck'
      warnings.push(`This deck has only ${slideCount} slides. It looks like a promo or legacy deck, not a full sermon presentation.`)
    } else if (slideCount > 14) {
      qualityStatus = 'Needs review'
      warnings.push('This deck is longer than the standard sermon range.')
    } else {
      qualityStatus = 'Ready'
    }
  } else if (slideCount >= 8) {
    bucket = 'sermon_presentation'
    qualityStatus = 'Needs review'
    warnings.push('This deck was generated before deck modes were added.')
  } else if (slideCount <= 5) {
    bucket = 'legacy'
    qualityStatus = 'Legacy short deck'
    warnings.push(`This deck has only ${slideCount} slides. It looks like a promo or legacy deck, not a full sermon presentation.`)
  } else {
    bucket = 'legacy'
    qualityStatus = 'Needs review'
    warnings.push('This deck was generated before deck modes were added.')
  }

  if (!intent) {
    warnings.push('Legacy deck label applied because deck intent is missing.')
  }

  if (isArchived) {
    bucket = 'legacy'
  }

  return {
    intent,
    intentLabel: intent ? intentLabels[intent] : 'Legacy Deck',
    bucket,
    qualityStatus,
    slideCount,
    isLegacy: bucket === 'legacy' || !intent,
    isArchived,
    generatedAtLabel,
    sourceWorkspaceId,
    sourceWorkspaceTitle,
    sourceOutlineId,
    sourceManuscriptId,
    warnings,
  }
}

export const getActiveDeckIdForIntent = (workspace: WorkspaceLike | null | undefined, intent: DeckIntentValue) =>
  String(
    intent === 'sermon_presentation'
      ? workspace?.metadata?.mediaPack?.activeSermonDeckId || ''
      : intent === 'social_summary'
        ? workspace?.metadata?.mediaPack?.activeSocialDeckId || ''
        : workspace?.metadata?.mediaPack?.latestDeckByIntent?.[intent] || '',
  ).trim() || null

export const selectPreferredDeck = (
  decks: any[],
  workspace: WorkspaceLike | null | undefined,
  intent: DeckIntentValue,
) => {
  const archivedDeckIds = new Set(workspace?.metadata?.mediaPack?.archivedDeckIds || [])
  const activeDeckId = getActiveDeckIdForIntent(workspace, intent)
  const latestByIntent = workspace?.metadata?.mediaPack?.latestDeckByIntent?.[intent] || null
  const activeDeck = activeDeckId ? decks.find((deck) => String(deck?.id || '') === String(activeDeckId)) : null
  if (activeDeck && !archivedDeckIds.has(String(activeDeck.id))) return activeDeck

  const latestDeck = latestByIntent ? decks.find((deck) => String(deck?.id || '') === String(latestByIntent)) : null
  if (latestDeck && !archivedDeckIds.has(String(latestDeck.id))) return latestDeck

  const matchingDecks = decks
    .filter((deck) => !archivedDeckIds.has(String(deck?.id || '')))
    .filter((deck) => inferDeckIntent(deck).intent === intent || normalizeDeckIntent(deck?.deckIntent) === intent)
    .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())

  if (matchingDecks.length) return matchingDecks[0]

  if (intent === 'sermon_presentation') {
    const sermonLike = decks
      .filter((deck) => !archivedDeckIds.has(String(deck?.id || '')))
      .filter((deck) => getDeckSlideCount(deck) >= 8)
      .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())
    if (sermonLike.length) return sermonLike[0]
  }

  if (intent === 'social_summary') {
    const socialLike = decks
      .filter((deck) => !archivedDeckIds.has(String(deck?.id || '')))
      .filter((deck) => getDeckSlideCount(deck) <= 5)
      .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())
    if (socialLike.length) return socialLike[0]
  }

  return null
}

export const groupDecksForWorkspace = (decks: any[], workspace?: WorkspaceLike | null) => {
  const activeSermonDeckId = workspace?.metadata?.mediaPack?.activeSermonDeckId || null
  const activeSocialDeckId = workspace?.metadata?.mediaPack?.activeSocialDeckId || null
  const grouped = {
    sermon_presentation: [] as Array<{ deck: any; identity: DeckIdentity }>,
    social_summary: [] as Array<{ deck: any; identity: DeckIdentity }>,
    legacy: [] as Array<{ deck: any; identity: DeckIdentity }>,
  }

  decks.forEach((deck) => {
    const identity = getDeckIdentity(deck, workspace)
    grouped[identity.bucket].push({ deck, identity })
  })

  const sortByDateDesc = (a: { deck: any }, b: { deck: any }) =>
    new Date(b?.deck?.createdAt || 0).getTime() - new Date(a?.deck?.createdAt || 0).getTime()

  grouped.sermon_presentation.sort(sortByDateDesc)
  grouped.social_summary.sort(sortByDateDesc)
  grouped.legacy.sort(sortByDateDesc)

  return {
    activeSermonDeckId,
    activeSocialDeckId,
    grouped,
  }
}
