export const loadingMessages = {
  outlines: {
    message: 'Crafting sermon outlines based on your passage...',
    duration: '15-20 seconds'
  },
  manuscript: {
    message: 'Writing full manuscript from your outline...',
    duration: '30-45 seconds'
  },
  applications: {
    message: 'Generating practical applications for your audience...',
    duration: '10-15 seconds'
  },
  questions: {
    message: 'Creating discussion questions...',
    duration: '10-15 seconds'
  },
  illustrations: {
    message: 'Finding relevant illustrations and stories...',
    duration: '15-20 seconds'
  },
  citations: {
    message: 'Analyzing your sermon for biblical support...',
    duration: '10-15 seconds'
  },
  'study-report': {
    message: 'Analyzing passage for themes and insights...',
    duration: '20-30 seconds'
  },
  scripture: {
    message: 'Looking up passage...',
    duration: '2-3 seconds'
  },
  'word-study': {
    message: 'Researching word meanings and usage...',
    duration: '5-10 seconds'
  },
  'cross-references': {
    message: 'Finding related passages...',
    duration: '5-10 seconds'
  },
  dna: {
    message: 'Analyzing sermon DNA...',
    duration: '15-20 seconds'
  }
} as const

export type LoadingMessageType = keyof typeof loadingMessages

export function getLoadingMessage(type: LoadingMessageType) {
  return loadingMessages[type] || { message: 'Processing...', duration: 'a moment' }
}
