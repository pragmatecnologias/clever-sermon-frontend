'use client'

const getReportScore = (report: any): number => {
  const sections = report?.sections || {}
  let score = 0
  const textFields = [
    'passageOverview',
    'literaryContext',
    'historicalContext',
    'canonicalContext',
    'exegeticalSummary',
    'mainTheologicalClaim',
    'preachingFocus',
  ]
  textFields.forEach((field) => {
    if (String(sections?.[field] || '').trim()) score += 4
  })
  const arrayFields = [
    'exegeticalFlow',
    'structureOfPassage',
    'keyTerms',
    'theologicalThemes',
    'interpretiveChallenges',
  ]
  arrayFields.forEach((field) => {
    if (Array.isArray(sections?.[field]) && sections[field].length > 0) {
      score += Math.min(6, sections[field].length)
    }
  })
  const mediaCards = Array.isArray(sections?.studyAssets?.categoryAssets?.mediaSuggestionCards)
    ? sections.studyAssets.categoryAssets.mediaSuggestionCards.length
    : 0
  const mediaPrompts = Array.isArray(sections?.studyAssets?.categoryAssets?.mediaSuggestions)
    ? sections.studyAssets.categoryAssets.mediaSuggestions.length
    : 0
  score += mediaCards > 0 ? 20 + Math.min(10, mediaCards) : 0
  score += mediaPrompts > 0 ? 10 + Math.min(10, mediaPrompts) : 0
  return score
}

export const getPreferredStudyReport = (workspace: any) => {
  const studyReports = Array.isArray((workspace as any)?.workspace?.studyReports)
    ? (workspace as any).workspace.studyReports
    : Array.isArray(workspace?.studyReports)
      ? workspace.studyReports
      : []
  if (!studyReports.length) return null
  return [...studyReports]
    .sort((left, right) => {
      const scoreDelta = getReportScore(right) - getReportScore(left)
      if (scoreDelta !== 0) return scoreDelta
      const rightTime = new Date(String(right?.updatedAt || right?.createdAt || '')).getTime()
      const leftTime = new Date(String(left?.updatedAt || left?.createdAt || '')).getTime()
      return rightTime - leftTime
    })[0] || null
}
