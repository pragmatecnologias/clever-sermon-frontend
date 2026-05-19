// Sermon style options - matches backend SermonStyle enum
export const SERMON_STYLE_OPTIONS = [
  { value: 'expository', label: 'Expository', description: 'Verse-by-verse teaching through a passage' },
  { value: 'topical', label: 'Topical', description: 'Theme or concept organized sermon' },
  { value: 'narrative', label: 'Narrative', description: 'Story-driven message with biblical narrative' },
  { value: 'apologetic', label: 'Apologetic', description: 'Reasoned defense of Christian faith' },
  { value: 'devotional', label: 'Devotional', description: 'Encouraging reflection and spiritual growth' },
] as const

// Message flow options - renamed from "Story Arc" for pastor clarity
export const MESSAGE_FLOW_OPTIONS = [
  { value: 'problem_truth_response', label: 'Problem → Truth → Response', description: 'Present a need, reveal God\'s answer, call to action' },
  { value: 'tension_turn_resolution', label: 'Tension → Turn → Resolution', description: 'Build tension around a question, pivot to Scripture, resolve' },
  { value: 'question_discovery_answer', label: 'Question → Discovery → Answer', description: 'Start with a listener\'s question, explore Scripture together, give answer' },
  { value: 'challenge_journey_transformation', label: 'Challenge → Journey → Transformation', description: 'Issue a challenge, walk through the journey, show transformation' },
] as const

// Language options
export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
] as const

// Service type options
export const SERVICE_TYPE_OPTIONS = [
  { value: 'sabbath_worship', label: 'Sabbath Worship', description: 'Main Sabbath service sermon' },
  { value: 'sabbath_school', label: 'Sabbath School', description: 'Adult or children\'s Sabbath School lesson' },
  { value: 'evangelistic_meeting', label: 'Evangelistic Meeting', description: 'Public evangelistic series or crusade' },
  { value: 'bible_study', label: 'Bible Study / Teaching', description: 'Small group or classroom Bible study' },
  { value: 'devotional', label: 'Devotional', description: 'Short inspirational message' },
  { value: 'youth', label: 'Youth / Young Adults', description: 'Youth ministry setting' },
  { value: 'prayer_meeting', label: 'Prayer Meeting', description: 'Midweek prayer meeting message' },
  { value: 'funeral_memorial', label: 'Funeral / Memorial', description: 'Memorial or funeral service tribute' },
  { value: 'wedding_family', label: 'Wedding / Family', description: 'Wedding ceremony or family celebration' },
] as const

// Ministry mode options
export const MINISTRY_MODE_OPTIONS = [
  { value: 'evangelistic', label: 'Evangelistic', description: 'Focused on sharing the gospel and winning souls' },
  { value: 'teaching', label: 'Teaching', description: 'Instruction-focused Bible teaching' },
  { value: 'doctrinal', label: 'Doctrinal', description: 'Doctrinal instruction and theological clarity' },
  { value: 'pastoral', label: 'Pastoral', description: 'Shepherding and pastoral care message' },
  { value: 'prophetic', label: 'Prophetic / Adventist', description: 'Adventist prophetic focus with eschatological themes' },
  { value: 'discipleship', label: 'Discipleship', description: 'Building disciples and Christian maturity' },
  { value: 'family_youth', label: 'Family / Youth', description: 'Family or youth ministry focus' },
] as const

// Appeal style options
export const APPEAL_STYLE_OPTIONS = [
  { value: 'invitation', label: 'Invitation', description: 'Extends an invitation to respond to Christ' },
  { value: 'commitment', label: 'Commitment', description: 'Calls for a decision of commitment' },
  { value: 'reflection', label: 'Reflection', description: 'Invites introspection and personal examination' },
  { value: 'doctrinal_clarity', label: 'Doctrinal Clarity', description: 'Clarifies doctrine and biblical truth' },
  { value: 'pastoral_encouragement', label: 'Pastoral Encouragement', description: 'Uplifts and encourages the congregation' },
  { value: 'repentance_return', label: 'Repentance / Return', description: 'Calls people to repent and return to God' },
  { value: 'mission_service', label: 'Mission / Service', description: 'Challenges to mission and service' },
] as const

// Bilingual support options
export const BILINGUAL_SUPPORT_OPTIONS = [
  { value: 'none', label: 'No bilingual support', description: 'Single language only' },
  { value: 'bilingual_key_phrases', label: 'Bilingual key phrases', description: 'Key phrases and terms in both languages' },
  { value: 'bilingual_outline', label: 'Bilingual outline', description: 'Full sermon outline in both languages' },
  { value: 'spanish_support_notes', label: 'Spanish support notes', description: 'Spanish translation of main notes and cues' },
  { value: 'english_support_notes', label: 'English support notes', description: 'English translation of main notes and cues' },
] as const

// Target length quick-select options (minutes)
export const TARGET_LENGTH_OPTIONS = [10, 20, 25, 30, 35, 45, 60] as const

// Prophetic passages that trigger guardrail auto-detection
export const PROPHETIC_PASSAGE_PATTERNS = [
  /revelation\s*14(?::\s*6\s*-\s*12)?/i,
  /revelation\s*(?:12|13|14|18)/i,
  /daniel\s*(?:7|8)/i,
  /matthew\s*24/i,
  /exodus\s*20/i,
] as const

// Maps prophetic passage pattern index to readable name
export const PROPHETIC_PASSAGE_NAMES: Record<number, string> = {
  0: 'Revelation 14:6-12',
  1: 'Revelation 12, 13, 14, or 18',
  2: 'Daniel 7 or 8',
  3: 'Matthew 24',
  4: 'Exodus 20',
}

export type SermonStyleValue = typeof SERMON_STYLE_OPTIONS[number]['value']
export type MessageFlowValue = typeof MESSAGE_FLOW_OPTIONS[number]['value']
export type LanguageValue = typeof LANGUAGE_OPTIONS[number]['value']
export type ServiceTypeValue = typeof SERVICE_TYPE_OPTIONS[number]['value']
export type MinistryModeValue = typeof MINISTRY_MODE_OPTIONS[number]['value']
export type AppealStyleValue = typeof APPEAL_STYLE_OPTIONS[number]['value']
export type BilingualSupportValue = typeof BILINGUAL_SUPPORT_OPTIONS[number]['value']

// Check if a passage is prophetic (triggers Adventist guardrail recommendation)
export function isPropheticPassage(passage: string): boolean {
  const normalized = String(passage || '').trim()
  return PROPHETIC_PASSAGE_PATTERNS.some((pattern) => pattern.test(normalized))
}

// Normalize legacy values to new snake_case format for compatibility
export function normalizeLegacyValue(field: string, value: string): string {
  if (!value) return value

  // Already snake_case - return as-is
  if (value.includes('_')) return value

  // Map human-readable legacy values to snake_case
  const legacyMap: Record<string, Record<string, string>> = {
    style: {
      'expository': 'expository',
      'topical': 'topical',
      'narrative': 'narrative',
      'apologetic': 'apologetic',
      'devotional': 'devotional',
    },
    storyArc: {
      'problem - truth - response': 'problem_truth_response',
      'problem_truth_response': 'problem_truth_response',
      'tension - turn - resolution': 'tension_turn_resolution',
      'tension_turn_resolution': 'tension_turn_resolution',
      'question - discovery - answer': 'question_discovery_answer',
      'question_discovery_answer': 'question_discovery_answer',
      'challenge - journey - transformation': 'challenge_journey_transformation',
      'challenge_journey_transformation': 'challenge_journey_transformation',
    },
    serviceType: {
      'sabbath worship': 'sabbath_worship',
      'sabbath school': 'sabbath_school',
      'evangelistic': 'evangelistic_meeting',
      'evangelistic meeting': 'evangelistic_meeting',
      'teaching': 'bible_study',
      'bible study': 'bible_study',
      'devotional': 'devotional',
      'youth': 'youth',
      'youth / young adults': 'youth',
    },
    appealStyle: {
      'invitation': 'invitation',
      'commitment': 'commitment',
      'reflection': 'reflection',
      'doctrinal clarity': 'doctrinal_clarity',
      'doctrinal': 'doctrinal_clarity',
      'pastoral encouragement': 'pastoral_encouragement',
      'pastoral': 'pastoral_encouragement',
      'repentance / return': 'repentance_return',
      'mission / service': 'mission_service',
    },
    ministryMode: {
      'evangelistic': 'evangelistic',
      'teaching': 'teaching',
      'doctrinal': 'doctrinal',
      'pastoral': 'pastoral',
      'prophetic': 'prophetic',
    },
    bilingualMode: {
      'none': 'none',
      'english': 'english_support_notes',
      'spanish': 'spanish_support_notes',
      'bilingual': 'bilingual_key_phrases',
      'bilingual key phrases': 'bilingual_key_phrases',
      'bilingual outline': 'bilingual_outline',
      'spanish support notes': 'spanish_support_notes',
      'english support notes': 'english_support_notes',
    },
  }

  const fieldMap = legacyMap[field]
  if (!fieldMap) return value

  const normalizedValue = value.toLowerCase().trim()
  return fieldMap[normalizedValue] || value
}

// Convert snake_case display label back to readable format
export function labelForValue(options: readonly { value: string; label: string }[], value: string): string {
  if (!value) return ''
  const option = options.find((o) => o.value === value)
  return option ? option.label : value
}