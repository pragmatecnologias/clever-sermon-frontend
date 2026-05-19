'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Sparkles, FileText, Image as ImageIcon, Mic, Music, Video, Share2, Loader2, Calendar, Clock3 } from 'lucide-react'
import { slidesApi } from '@/lib/slides-api'
import { createWorkspaceApiClient } from '@/lib/api/openapi-client'
import {
  buildStructuredMediaPrompts,
  buildSocialCaption,
  buildSocialHeadline,
  MAX_NARRATION_CHARACTERS,
  type ImagePromptFields,
} from '@/lib/media-prompts'
import SlideGenerationPanel from './SlideGenerationPanel'
import ImageGenerationPanel from './ImageGenerationPanel'
import AudioGenerationPanel from './AudioGenerationPanel'
import MusicGenerationPanel from './MusicGenerationPanel'
import VideoGenerationPanel from './VideoGenerationPanel'
import MediaGallery from './MediaGallery'
import SermonMusicGenerator from './SermonMusicGenerator'

interface MediaProductionStudioProps {
  workspace: any
  token: string
}

type MediaFilter = 'all' | 'image' | 'slide' | 'audio' | 'music' | 'video' | 'social'
type OptimisticMediaItem = {
  id: string
  type: 'audio'
  status: 'pending'
  createdAt: string
}
type SocialPackMode = 'auto_multi_network' | 'core4'
type SocialBackgroundProvider = 'local' | 'openai'
type SocialBackgroundPreset = 'cyberpunk' | 'modern' | 'aurora' | 'minimal'
type SocialPromptType = 'visual_prompt' | 'caption_copy' | 'quote_candidate'
type SocialPromptOption = {
  id: string
  label: string
  description: string
  prompt: string
  promptType: SocialPromptType
}

const US_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (America/New_York)' },
  { value: 'America/Chicago', label: 'Central (America/Chicago)' },
  { value: 'America/Denver', label: 'Mountain (America/Denver)' },
  { value: 'America/Phoenix', label: 'Arizona (America/Phoenix)' },
  { value: 'America/Los_Angeles', label: 'Pacific (America/Los_Angeles)' },
  { value: 'America/Anchorage', label: 'Alaska (America/Anchorage)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (Pacific/Honolulu)' },
]

export default function MediaProductionStudio({ workspace, token }: MediaProductionStudioProps) {
  const sermonBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1').replace(/\/api\/v1\/?$/, '')
  const planning = workspace?.metadata?.planning || {}
  const guardrail = workspace?.metadata?.guardrail || null
  const [generatingAll, setGeneratingAll] = useState(false)
  const [currentStep, setCurrentStep] = useState<string>('')
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [libraryFilter, setLibraryFilter] = useState<MediaFilter>('all')
  const [optimisticMediaItems, setOptimisticMediaItems] = useState<OptimisticMediaItem[]>([])
  const [socialPromptId, setSocialPromptId] = useState('')
  const [socialVisualPrompt, setSocialVisualPrompt] = useState('')
  const [socialQuote, setSocialQuote] = useState('')
  const [socialCaption, setSocialCaption] = useState('')
  const [socialMode, setSocialMode] = useState<SocialPackMode>('auto_multi_network')
  const [socialGenerating, setSocialGenerating] = useState(false)
  const [socialBackgroundProvider, setSocialBackgroundProvider] = useState<SocialBackgroundProvider>('local')
  const [socialBackgroundPreset, setSocialBackgroundPreset] = useState<SocialBackgroundPreset>('modern')
  const [churchSettingsLoading, setChurchSettingsLoading] = useState(false)
  const [showOptionalMedia, setShowOptionalMedia] = useState(false)
  const [showMusicTools, setShowMusicTools] = useState(false)
  const [showSocialTools, setShowSocialTools] = useState(false)
  const [churchDefaults, setChurchDefaults] = useState({
    churchName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    website: '',
    logoUrl: '',
    defaultTimezone: '',
  })
  const [eventOverrides, setEventOverrides] = useState({
    eventTitle: workspace?.title || '',
    eventSubtitle: workspace?.mainPassage || '',
    serviceDate: planning.sermonDate || '',
    serviceTime: '',
    timezone: '',
    showLogo: true,
    showAddress: true,
    showWebsite: true,
    showPhone: false,
    showServiceTime: true,
    preset: 'minimal' as 'minimal' | 'bold' | 'announcement',
  })

  useEffect(() => {
    if (!optimisticMediaItems.length) return
    const timer = setTimeout(() => {
      const cutoff = Date.now() - 30_000
      setOptimisticMediaItems((prev) =>
        prev.filter((item) => new Date(item.createdAt).getTime() >= cutoff),
      )
    }, 5_000)
    return () => clearTimeout(timer)
  }, [optimisticMediaItems])

  useEffect(() => {
    setEventOverrides((prev) => ({
      ...prev,
      eventTitle: prev.eventTitle || workspace?.title || '',
      eventSubtitle: prev.eventSubtitle || workspace?.mainPassage || '',
      serviceDate: prev.serviceDate || planning.sermonDate || '',
      timezone: prev.timezone || churchDefaults.defaultTimezone || '',
    }))
  }, [workspace?.title, workspace?.mainPassage, planning.sermonDate, churchDefaults.defaultTimezone])

  const normalizeChurchDefaults = (data: any) => ({
    churchName: data?.churchName ?? '',
    addressLine1: data?.addressLine1 ?? '',
    addressLine2: data?.addressLine2 ?? '',
    city: data?.city ?? '',
    state: data?.state ?? '',
    postalCode: data?.postalCode ?? '',
    country: data?.country ?? '',
    phone: data?.phone ?? '',
    website: data?.website ?? '',
    logoUrl: data?.logoUrl ?? '',
    defaultTimezone: data?.defaultTimezone ?? '',
  })

  const toAbsoluteLogoUrl = (logoUrl: string) => {
    if (!logoUrl) return ''
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) return logoUrl
    return `${sermonBaseUrl}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`
  }

  // Auto-generate sermon summary for prompts
  const sermonSummary = useMemo(
    () => ({
      title: workspace.title || 'Untitled Sermon',
      seriesTitle: workspace.seriesTitle || '',
      passage: workspace.mainPassage || '',
      additionalPassages: Array.isArray(workspace.additionalPassages) ? workspace.additionalPassages : [],
      language: workspace.language || workspace.metadata?.language || 'en',
      style: workspace.style || '',
      storyArc: workspace.storyArc || '',
      theme: workspace.theme || workspace.sermonGoals || '',
      audienceProfile: workspace.audienceProfile || '',
      sermonGoals: workspace.sermonGoals || '',
      serviceType: planning.serviceType || '',
      ministryMode: planning.ministryMode || '',
      appealStyle: planning.appealStyle || '',
      bilingualMode: planning.bilingualMode || '',
      sermonDate: planning.sermonDate || '',
      targetLengthMinutes: planning.targetLengthMinutes || null,
      egwEnabled: workspace.egwEnabled !== false,
      guardrailMode: planning.guardrailMode || workspace.metadata?.guardrailMode || '',
      tone: workspace.metadata?.tone || 'encouraging',
      outline: workspace.outlines?.[0]?.structure?.points || [],
      pointNodes: workspace.outlines?.[0]?.structure?.pointNodes || [],
      manuscript: workspace.manuscripts?.[0]?.content?.text || '',
      applications: workspace.applications || [],
      discussionQuestions: workspace.questions || workspace.discussionQuestions || [],
      illustrations: workspace.illustrations || [],
    }),
    [workspace, planning.serviceType, planning.ministryMode, planning.appealStyle, planning.bilingualMode, planning.sermonDate],
  )

  const socialLanguage = ((workspace?.language || workspace?.metadata?.language || 'en') as string).toLowerCase().startsWith('es')
    ? 'es'
    : 'en'
  const socialHeadline = useMemo(
    () =>
      buildSocialHeadline({
        title: sermonSummary.title,
        passage: sermonSummary.passage,
        theme: sermonSummary.theme,
        language: socialLanguage,
        planning: {
          serviceType: sermonSummary.serviceType,
          ministryMode: sermonSummary.ministryMode,
          appealStyle: sermonSummary.appealStyle,
          bilingualMode: sermonSummary.bilingualMode,
          sermonDate: sermonSummary.sermonDate,
        },
      }),
    [sermonSummary.title, sermonSummary.passage, sermonSummary.theme, socialLanguage, sermonSummary.serviceType, sermonSummary.ministryMode, sermonSummary.appealStyle, sermonSummary.bilingualMode, sermonSummary.sermonDate],
  )
  const socialCaptionFallback = useMemo(
    () =>
      buildSocialCaption({
        title: sermonSummary.title,
        passage: sermonSummary.passage,
        theme: sermonSummary.theme,
        language: socialLanguage,
        planning: {
          serviceType: sermonSummary.serviceType,
          ministryMode: sermonSummary.ministryMode,
          appealStyle: sermonSummary.appealStyle,
          bilingualMode: sermonSummary.bilingualMode,
          sermonDate: sermonSummary.sermonDate,
        },
      }),
    [sermonSummary.title, sermonSummary.passage, sermonSummary.theme, socialLanguage, sermonSummary.serviceType, sermonSummary.ministryMode, sermonSummary.appealStyle, sermonSummary.bilingualMode, sermonSummary.sermonDate],
  )

  const narrationKeyPoints = useMemo(() => {
    const fromPointNodes = Array.isArray(sermonSummary.pointNodes)
      ? sermonSummary.pointNodes
          .map((item: any) => item?.title || item?.pointTitle || item?.summary || item?.content || '')
          .filter(Boolean)
      : []
    const fromOutline = Array.isArray(sermonSummary.outline)
      ? sermonSummary.outline
          .map((item: any) => item?.title || item?.point || item?.summary || item?.text || '')
          .filter(Boolean)
      : []

    return Array.from(new Set([...fromPointNodes, ...fromOutline].map((item) => String(item).trim()).filter(Boolean))).slice(0, 6)
  }, [sermonSummary.pointNodes, sermonSummary.outline])

  const narrationApplications = useMemo(() => {
    return (Array.isArray(sermonSummary.applications) ? sermonSummary.applications : [])
      .map((item: any) => item?.content || item?.text || item?.application || item)
      .map((item: any) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 4)
  }, [sermonSummary.applications])

  const extractBestQuote = useCallback((manuscript: string, applications: any[]): string => {
    // Extract a powerful quote from manuscript or applications
    if (applications.length > 0 && applications[0].content) {
      const content = typeof applications[0].content === 'string' 
        ? applications[0].content 
        : applications[0].content.text || ''
      const sentences = content.split(/[.!?]/).filter((s: string) => s.trim().length > 20)
      return sentences[0]?.trim() || sermonSummary.theme
    }
    
    if (manuscript) {
      const sentences = manuscript.split(/[.!?]/).filter((s: string) => s.trim().length > 30 && s.trim().length < 150)
      return sentences[0]?.trim() || sermonSummary.theme
    }
    
    return sermonSummary.theme
  }, [sermonSummary.theme])

  const studyMediaPrompts = useMemo(() => {
    const sections = workspace?.studyReports?.[0]?.sections || {}
    const studyAssets = sections?.studyAssets || {}
    const categoryAssets = studyAssets?.categoryAssets || {}
    const movementAssets = Array.isArray(studyAssets?.movementAssets) ? studyAssets.movementAssets : []

    const flattenMovement = (key: string) =>
      movementAssets.flatMap((item: any) => (Array.isArray(item?.[key]) ? item[key] : []))

    const rawCards = Array.isArray(categoryAssets?.mediaSuggestionCards)
      ? categoryAssets.mediaSuggestionCards
      : []
    const cards = rawCards
      .map((item: any, index: number) => {
        if (typeof item === 'string') {
          return {
            id: `legacy-${index}`,
            type: 'Media',
            intent: 'Study suggestion',
            useCase: '',
            prompt: String(item || '').trim(),
          }
        }
        return {
          id: String(item?.id || `card-${index}`),
          type: String(item?.type || item?.label || 'Media'),
          intent: String(item?.intent || item?.category || 'Study suggestion'),
          useCase: String(item?.useCase || item?.usage || ''),
          prompt: String(item?.prompt || item?.text || item?.content || '').trim(),
        }
      })
      .filter((item: any) => item.prompt)

    const legacyPrompts = Array.from(
      new Set(
        [categoryAssets?.mediaSuggestions, flattenMovement('mediaSuggestions')]
          .flatMap((list) => (Array.isArray(list) ? list : []))
          .map((item: any) => String(item || '').trim())
          .filter(Boolean),
      ),
    ).map((prompt, index) => ({
      id: `legacy-text-${index}`,
      type: 'Media',
      intent: 'Study suggestion',
      useCase: '',
      prompt,
    }))
    const promptCards = cards.length ? cards : legacyPrompts

    const isVideoOrClipPrompt = (item: any) => {
      const source = `${item?.type || ''} ${item?.intent || ''} ${item?.useCase || ''} ${item?.prompt || ''}`.toLowerCase()
      return /(video|clip|reel|short|15-second|15 second|countdown sticker|thumbnail|youtube)/.test(source)
    }

    const classifyPromptType = (item: any): SocialPromptType => {
      const source = `${item?.type || ''} ${item?.intent || ''} ${item?.useCase || ''}`.toLowerCase()
      if (/(quote|cita|frase|texto clave|featured)/.test(source)) return 'quote_candidate'
      if (/(caption|copy|social|promo|promoci|post copy|call to action|cta)/.test(source)) return 'caption_copy'
      return 'visual_prompt'
    }
    const toOption = (item: any, index: number): SocialPromptOption => ({
      id: item.id || `opt-${index}`,
      label: String(item.type || 'Media'),
      description: [item.intent, item.useCase].filter(Boolean).join(' · ').slice(0, 120),
      prompt: item.prompt,
      promptType: classifyPromptType(item),
    })
    const byType = (matcher: RegExp) =>
      promptCards
        .filter((item: any) => matcher.test(String(item.type || '').toLowerCase()))
        .map((item: any, index: number) => toOption(item, index))

    const imageOptions = byType(/visual|imagen|image/)
    const audioOptions = byType(/voz|voice|audio|narr/)
    const musicOptions = byType(/canto|song|music|música/)
    const videoOptions = byType(/video|vídeo/)
    const socialOptions = promptCards
      .filter((item: any) =>
        /(social|promo|promoci|caption|copy|quote|cita|frase|visual|imagen|image)/.test(
          `${item?.type || ''} ${item?.intent || ''} ${item?.useCase || ''}`.toLowerCase(),
        ),
      )
      .filter((item: any) => !isVideoOrClipPrompt(item))
      .map((item: any, index: number) => toOption(item, index))

    return {
      imageOptions,
      audioOptions,
      musicOptions,
      videoOptions,
      socialOptions,
      all: promptCards.map((item: any) => item.prompt),
    }
  }, [workspace])

  const structuredPrompts = useMemo(() => {
    const isSpanish = (workspace?.language || workspace?.metadata?.language) === 'es'
    const quote = extractBestQuote(sermonSummary.manuscript, sermonSummary.applications)
    const entries = buildStructuredMediaPrompts({
      isSpanish,
      title: sermonSummary.title,
      passage: sermonSummary.passage,
      theme: sermonSummary.theme || (isSpanish ? 'mensaje central del sermón' : 'main sermon message'),
      quoteSeed: String(quote).slice(0, 220),
      planning: {
        title: sermonSummary.title,
        seriesTitle: sermonSummary.seriesTitle,
        serviceType: sermonSummary.serviceType,
        ministryMode: sermonSummary.ministryMode,
        appealStyle: sermonSummary.appealStyle,
        bilingualMode: sermonSummary.bilingualMode,
        sermonDate: sermonSummary.sermonDate,
        targetLengthMinutes: sermonSummary.targetLengthMinutes || undefined,
        guardrailMode: sermonSummary.guardrailMode,
        guardrailActive: Boolean(guardrail?.active),
      },
      source: {
        slides: undefined,
        image: studyMediaPrompts.imageOptions[0]?.prompt || undefined,
        audio: studyMediaPrompts.audioOptions[0]?.prompt || undefined,
        music: studyMediaPrompts.musicOptions[0]?.prompt || undefined,
        video: studyMediaPrompts.videoOptions[0]?.prompt || undefined,
        social: studyMediaPrompts.socialOptions[0]?.prompt || undefined,
      },
    })
    const pick = (key: string) => entries.find((entry) => entry.key === key)
    return {
      image: pick('image'),
      audio: pick('audio'),
      music: pick('music'),
      video: pick('video'),
      social: pick('social'),
      quote,
    }
  }, [workspace, sermonSummary, studyMediaPrompts, extractBestQuote])

  const autoPrompts = {
    image: structuredPrompts.image?.prompt || '',
    imageFields: (structuredPrompts.image?.fields || undefined) as ImagePromptFields | undefined,
    music: structuredPrompts.music?.prompt || '',
    audio: structuredPrompts.audio?.prompt || '',
    video: structuredPrompts.video?.prompt || '',
    social: {
      quote: structuredPrompts.quote,
      caption:
        structuredPrompts.social?.prompt ||
        `${socialHeadline}\n\n${socialCaptionFallback}`,
    },
  }

  const resolvedSocialOptions = useMemo(() => {
    const baseOptions = studyMediaPrompts.socialOptions.length
      ? studyMediaPrompts.socialOptions
      : [
          {
            id: 'social-default',
            label: 'Creative Direction',
            description: 'Auto-generated from sermon context',
            prompt: autoPrompts.social.caption,
            promptType: 'visual_prompt' as const,
          },
        ]

    const filtered = baseOptions.filter((option: SocialPromptOption) => {
      const text = `${option.label} ${option.description} ${option.prompt}`.toLowerCase()
      return !/(video|clip|reel|short|15-second|15 second|countdown sticker|thumbnail|youtube)/.test(text)
    })
    if (filtered.length) return filtered
    return [
      {
        id: 'social-default-fallback',
        label: 'Creative Direction',
        description: 'Default visual direction',
        prompt: autoPrompts.image || autoPrompts.social.caption,
        promptType: 'visual_prompt' as const,
      },
    ]
  }, [studyMediaPrompts.socialOptions, autoPrompts.social.caption, autoPrompts.image])

  useEffect(() => {
    if (!resolvedSocialOptions.length) return
    const selected = resolvedSocialOptions.find((item: any) => item.id === socialPromptId)
    if (!selected) {
      setSocialPromptId(resolvedSocialOptions[0].id)
      const fallback = resolvedSocialOptions[0]
      if (fallback.promptType === 'visual_prompt') setSocialVisualPrompt(fallback.prompt)
      if (fallback.promptType === 'caption_copy') setSocialCaption(sanitizeSocialCaptionCopy(fallback.prompt))
      if (fallback.promptType === 'quote_candidate') setSocialQuote(fallback.prompt)
    }
    if (!socialQuote) {
      setSocialQuote(autoPrompts.social.quote)
    }
    if (!socialVisualPrompt) {
      const visual = resolvedSocialOptions.find((item: SocialPromptOption) => item.promptType === 'visual_prompt')
      if (visual?.prompt) setSocialVisualPrompt(visual.prompt)
      else setSocialVisualPrompt(studyMediaPrompts.imageOptions[0]?.prompt || autoPrompts.image)
    }
    if (!socialCaption) {
      const copy = resolvedSocialOptions.find((item: SocialPromptOption) => item.promptType === 'caption_copy')
      setSocialCaption(sanitizeSocialCaptionCopy(copy?.prompt || autoPrompts.social.caption || socialCaptionFallback))
    }
  }, [resolvedSocialOptions, socialPromptId, socialQuote, socialCaption, socialVisualPrompt, autoPrompts.social.quote, autoPrompts.social.caption, autoPrompts.image, studyMediaPrompts.imageOptions, socialCaptionFallback])

  useEffect(() => {
    let mounted = true
    const loadChurchSettings = async () => {
      setChurchSettingsLoading(true)
      try {
        const response = await slidesApi.getChurchSettings(token)
        if (!mounted || !response) return
        const normalized = normalizeChurchDefaults(response)
        setChurchDefaults(normalized)
        setEventOverrides((prev) => ({
          ...prev,
          eventTitle: prev.eventTitle?.trim() ? prev.eventTitle : socialHeadline,
          eventSubtitle: sermonSummary.passage || '',
          timezone: normalized.defaultTimezone || '',
        }))
      } catch (error) {
        console.warn('Failed to load church settings:', error)
      } finally {
        if (mounted) setChurchSettingsLoading(false)
      }
    }
    loadChurchSettings()
    return () => {
      mounted = false
    }
  }, [token, sermonSummary.title, sermonSummary.passage, socialHeadline])

  const generatedSocialMeta = useMemo(() => {
    const sourcePrompt = [socialCaption, socialQuote, autoPrompts.social.caption].filter(Boolean).join(' ')

    const hashtagMatches: string[] = sourcePrompt.match(/#[A-Za-z0-9_]+/g) || []
    const normalizedHashtags = Array.from(new Set(hashtagMatches.map((tag: string) => tag.trim()))).slice(0, 6)

    const language = (workspace?.language || workspace?.metadata?.language || 'en').toLowerCase()
    const clean = (text: string) =>
      String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((part) => part.length > 2)

    if (!normalizedHashtags.length) {
      const titleWords = clean(sermonSummary.title).slice(0, 2)
      const themeWords = clean(sermonSummary.theme).slice(0, 2)
      const serviceWords = clean(sermonSummary.serviceType).slice(0, 1)
      const modeWords = clean(sermonSummary.ministryMode).slice(0, 1)
      const base =
        language === 'es'
          ? ['#sermon', '#iglesia', '#fe']
          : ['#sermon', '#church', '#faith']
      const dynamic = [...titleWords, ...themeWords].map((word) => `#${word}`)
      const planningTags = [...serviceWords, ...modeWords].map((word) => `#${word}`)
      normalizedHashtags.push(...Array.from(new Set([...dynamic, ...planningTags, ...base])).slice(0, 6))
    }

    const ctaText =
      sermonSummary.appealStyle === 'repentance_return'
        ? (language === 'es' ? 'Vuelve al Padre' : 'Come home to the Father')
        : sermonSummary.appealStyle === 'mission_service'
          ? (language === 'es' ? 'Sirve con propósito' : 'Serve with purpose')
          : sermonSummary.appealStyle === 'doctrinal_clarity'
            ? (language === 'es' ? 'Aférrate a la verdad' : 'Stand on the truth')
            : sermonSummary.serviceType === 'evangelistic_meeting'
              ? (language === 'es' ? 'Invita a alguien hoy' : 'Invite someone today')
              : sermonSummary.serviceType === 'sabbath_school'
                ? (language === 'es' ? 'Únete al estudio bíblico' : 'Join the Bible study')
                : sermonSummary.serviceType === 'prayer_meeting'
                  ? (language === 'es' ? 'Oremos juntos' : 'Let us pray together')
                  : (language === 'es' ? 'Únase a escuchar la Palabra' : 'Join us to hear the Word')

    return {
      ctaText,
      hashtags: normalizedHashtags.join(' '),
    }
  }, [
    socialCaption,
    socialQuote,
    autoPrompts.social.caption,
    workspace?.language,
    workspace?.metadata?.language,
    sermonSummary.title,
    sermonSummary.theme,
    sermonSummary.serviceType,
    sermonSummary.ministryMode,
    sermonSummary.appealStyle,
  ])

  const sanitizeSocialCaptionCopy = (input: string) => {
    let value = String(input || '').trim()
    if (!value) return ''
    const patterns = [
      /^image\s*:\s*/i,
      /^imagen\s*:\s*/i,
      /^video\s*:\s*/i,
      /^caption in (spanish|english)\s*:\s*/i,
      /^texto en (espanol|español|ingles|inglés)\s*:\s*/i,
      /^text in (spanish|english)\s*:\s*/i,
      /^include (church )?logo( and date)?\.?\s*/i,
      /^incluir (el )?logo( y fecha)?\.?\s*/i,
      /^include link\.?\s*/i,
      /^incluir enlace\.?\s*/i,
    ]
    for (const pattern of patterns) {
      value = value.replace(pattern, '').trim()
    }
    return value
  }

  const handleGenerateSocialPack = async () => {
    setSocialGenerating(true)
    try {
      const resolvedVisualPrompt = String(
        socialVisualPrompt || studyMediaPrompts.imageOptions[0]?.prompt || autoPrompts.image || '',
      ).trim()
      const resolvedCaption = sanitizeSocialCaptionCopy(socialCaption || autoPrompts.social.caption || socialCaptionFallback)
      await slidesApi.generateSocialKit(
        {
          workspaceId: workspace.id,
          sermonId: workspace.sermonId,
          title: sermonSummary.title,
          passage: sermonSummary.passage,
          quote: socialQuote || autoPrompts.social.quote,
          caption: resolvedCaption,
          prompt: resolvedVisualPrompt || autoPrompts.image,
          mode: socialMode,
          useCase: 'social-pack',
          overlay: {
            ...eventOverrides,
            language: workspace.language || workspace.metadata?.language || 'en',
            eventTitle: eventOverrides.eventTitle || socialHeadline,
            eventSubtitle: eventOverrides.eventSubtitle || sermonSummary.passage,
            serviceDate: eventOverrides.serviceDate || sermonSummary.sermonDate || '',
            serviceTime: eventOverrides.serviceTime || '',
            timezone: eventOverrides.timezone || churchDefaults.defaultTimezone,
            ctaText: generatedSocialMeta.ctaText,
            hashtags: generatedSocialMeta.hashtags,
            locationOverride: [churchDefaults.addressLine1, churchDefaults.city, churchDefaults.state]
              .filter(Boolean)
              .join(', '),
            churchName: churchDefaults.churchName || '',
            logoUrl: toAbsoluteLogoUrl(churchDefaults.logoUrl || ''),
            website: churchDefaults.website || '',
            phone: churchDefaults.phone || '',
            imageProvider: socialBackgroundProvider,
            imagePreset: socialBackgroundProvider === 'local' ? socialBackgroundPreset : undefined,
          },
        },
        token,
      )
      setCompletedSteps((prev) => (prev.includes('social') ? prev : [...prev, 'social']))
      setRefreshKey((prev) => prev + 1)
    } catch (err: any) {
      console.warn('Failed to generate social kit:', err)
    } finally {
      setSocialGenerating(false)
    }
  }

  const handleGenerateAll = async () => {
    setGeneratingAll(true)
    setCompletedSteps([])
    let sermonId: string | null = null
    let deckId: string | null = null
    let audioId: string | null = null
    
    try {
      // Step 0: Sync workspace to slides app
      setCurrentStep('Syncing workspace...')
      const pointNodes = Array.isArray(sermonSummary.pointNodes) ? sermonSummary.pointNodes : []
      const legacyPoints = Array.isArray(sermonSummary.outline) ? sermonSummary.outline : []
      const normalizedPoints = (pointNodes.length ? pointNodes : legacyPoints)
        .map((point: any) => {
          const title = typeof point === 'string' ? point : (point?.title || point?.content || '')
          const summary = typeof point === 'string' ? '' : (point?.summary || point?.preachingInsight || '')
          const subpoint = Array.isArray(point?.subpoints) ? point.subpoints[0] : ''
          const verse = Array.isArray(point?.supportingVerses) ? point.supportingVerses[0] : ''
          return [title, summary, subpoint, verse].filter(Boolean).join(' — ')
        })
        .filter(Boolean)

      const pointApplications = pointNodes.flatMap((point: any) =>
        Array.isArray(point?.applications) ? point.applications : [],
      )
      const pointQuestions = pointNodes.flatMap((point: any) =>
        Array.isArray(point?.discussionQuestions) ? point.discussionQuestions : [],
      )

      const dedupe = (items: any[]) => Array.from(new Set(items.map((item) => String(item).trim()).filter(Boolean)))

      const workspaceApi = createWorkspaceApiClient({ token })
      const composeResult = await workspaceApi.composeMediaPack(String(workspace.id), {
        includeDeck: true,
        deckSize: undefined,
        deckIntent: 'sermon_presentation',
      })
      const sermon = (composeResult as any)?.sermon || composeResult
      const deck = (composeResult as any)?.deck || (composeResult as any)?.deckResult || null
      sermonId = String(sermon?.id || sermon?.sermonId || '')
      
      // Step 1: Generate Slides
      setCurrentStep('Generating slide deck...')
      deckId = deck?.id || null
      
      // Wait for deck to be ready
      if (!deckId) {
        throw new Error('Deck generation did not return a deck id')
      }
      await pollDeckStatus(deckId)
      setCompletedSteps(prev => [...prev, 'slides'])
      
      // Step 2: Generate Images
      setCurrentStep('Generating sermon images...')
      await slidesApi.generateImage({
        sermonId: sermonId || undefined,
        workspaceId: workspace.id,
        prompt: autoPrompts.image,
        provider: 'local',
        preset: 'modern',
      }, token)
      setCompletedSteps(prev => [...prev, 'images'])
      
      // Step 3: Generate Audio
      setCurrentStep('Generating audio narration...')
      const narrationResponse = await slidesApi.generateNarrationScript(
        {
          language: workspace.language || workspace.metadata?.language || 'en',
          title: sermonSummary.title,
          passage: sermonSummary.passage,
          theme: sermonSummary.theme,
          manuscript: sermonSummary.manuscript || autoPrompts.audio,
          keyPoints: narrationKeyPoints,
          applications: narrationApplications,
          narrationPrompt: autoPrompts.audio,
          maxChars: MAX_NARRATION_CHARACTERS,
        },
        token,
      )
      const generatedNarration = String(narrationResponse?.text || '').trim()
      const narrationText = (generatedNarration || sermonSummary.manuscript || autoPrompts.audio || '').slice(
        0,
        MAX_NARRATION_CHARACTERS,
      )
      const audio = await slidesApi.generateAudio({
        sermonId: sermonId || undefined,
        workspaceId: workspace.id,
        text: narrationText,
        provider: 'local',
        narrationPrompt: autoPrompts.audio,
      }, token)
      audioId = audio.id
      setCompletedSteps(prev => [...prev, 'audio'])
      
      // Step 4: Generate Video (if we have deck and audio)
      if (deckId && audioId) {
        setCurrentStep('Composing final video...')
        try {
          await slidesApi.generateVideo({
            deckId: deckId || undefined,
            audioId: audioId || undefined,
            sermonId: sermonId || undefined,
            workspaceId: workspace.id,
            resolution: '1920x1080',
          }, token)
          setCompletedSteps(prev => [...prev, 'video'])
        } catch (err) {
          console.warn('Video generation failed, continuing:', err)
          setCurrentStep('Video unavailable, continuing...')
        }
      }
      
      setCurrentStep('Complete! All media generated.')
    } catch (err: any) {
      console.warn('Failed to generate all media:', err)
      setCurrentStep(`Error: ${err.message || 'Generation failed'}`)
    } finally {
      setGeneratingAll(false)
    }
  }

  const pollDeckStatus = async (deckId: string, maxAttempts = 30): Promise<void> => {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      const deck = await slidesApi.getDeck(deckId, token)
      if (deck.status === 'ready') return
      if (deck.status === 'failed') throw new Error('Deck generation failed')
    }
    throw new Error('Deck generation timeout')
  }

  const mediaTypes = [
    { id: 'slides', label: 'Slide Deck', icon: FileText, color: 'purple', description: 'PowerPoint presentation' },
    { id: 'images', label: 'Images', icon: ImageIcon, color: 'blue', description: 'Sermon visuals' },
    { id: 'audio', label: 'Audio', icon: Mic, color: 'green', description: 'Narration & podcast' },
    { id: 'video', label: 'Video', icon: Video, color: 'orange', description: 'Full sermon video' },
  ]

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="cyber-panel rounded-2xl p-8 bg-gradient-to-br from-purple-900/20 to-pink-900/20">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Sermon Production Studio</h2>
            <p className="text-gray-300 mb-4">
              Transform your sermon into core church-ready media assets
            </p>
            <div className="flex flex-wrap gap-2">
              {mediaTypes.map(type => (
                <div
                  key={type.id}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                    completedSteps.includes(type.id)
                      ? `bg-${type.color}-500/20 text-${type.color}-200 border border-${type.color}-400/40`
                      : 'bg-white/5 text-gray-400 border border-white/10'
                  }`}
                >
                  <type.icon className="w-3 h-3" />
                  {type.label}
                  {completedSteps.includes(type.id) && <span>✓</span>}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Creates sermon deck, images, audio, and video readiness. Social and music tools are available below.
            </p>
          </div>
          <button
            onClick={handleGenerateAll}
            disabled={generatingAll}
            className="cyber-button px-6 py-3 rounded-xl flex items-center gap-2 text-lg font-semibold"
          >
            {generatingAll ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {currentStep}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Core Media Package
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generation Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slides - Primary Feature */}
        <div className="lg:col-span-2">
          <SlideGenerationPanel 
            workspace={workspace} 
            token={token}
            onGenerated={() => setRefreshKey(prev => prev + 1)}
          />
        </div>

        {/* Images */}
        <div className="lg:col-span-2">
          <ImageGenerationPanel
            workspaceId={workspace.id}
            workspaceData={{
              title: sermonSummary.title,
              theme: sermonSummary.theme,
              mainPassage: sermonSummary.passage,
            }}
            token={token}
            autoPrompt={autoPrompts.image}
            autoPromptFields={autoPrompts.imageFields}
            promptOptions={studyMediaPrompts.imageOptions}
            onGenerated={() => setRefreshKey((prev) => prev + 1)}
          />
        </div>

        {/* Audio */}
        <div className="lg:col-span-2">
          <AudioGenerationPanel
            workspaceId={workspace.id}
            workspace={workspace}
            token={token}
            autoText={sermonSummary.manuscript || autoPrompts.audio}
            narrationPrompt={autoPrompts.audio}
            narrationPromptOptions={studyMediaPrompts.audioOptions}
            onQueued={(payload) => {
              setOptimisticMediaItems((prev) => {
                const deduped = prev.filter((item) => item.id !== payload.id)
                return [payload, ...deduped].slice(0, 8)
              })
              setRefreshKey((prev) => prev + 1)
            }}
            onGenerated={() => setRefreshKey((prev) => prev + 1)}
          />
        </div>

        {/* Optional media extras */}
        <div className="lg:col-span-2 border border-white/10 rounded-2xl bg-black/15">
          <button
            type="button"
            className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
            onClick={() => setShowOptionalMedia((prev) => !prev)}
          >
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Optional media extras</p>
              <h3 className="text-lg font-semibold text-white">Theme song and social pack</h3>
              <p className="text-sm text-gray-300">
                Helpful extras for church promotion. Safe to skip if you just want the sermon package.
              </p>
            </div>
            <span className="text-sm text-cyan-200">{showOptionalMedia ? 'Hide' : 'Show'}</span>
          </button>
          {showOptionalMedia && (
            <div className="space-y-4 p-5 pt-0">
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowMusicTools((prev) => !prev)}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 text-left hover:bg-black/30 transition-colors"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Theme song</p>
                  <h4 className="mt-1 text-base font-semibold text-white">
                    {showMusicTools ? 'Hide music tools' : 'Open music tools'}
                  </h4>
                  <p className="mt-2 text-sm text-gray-300">
                    Optional worship music for the sermon package.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSocialTools((prev) => !prev)}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 text-left hover:bg-black/30 transition-colors"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Social pack</p>
                  <h4 className="mt-1 text-base font-semibold text-white">
                    {showSocialTools ? 'Hide social tools' : 'Open social tools'}
                  </h4>
                  <p className="mt-2 text-sm text-gray-300">
                    Optional quotes, thumbnails, and post copy.
                  </p>
                </button>
              </div>

              {showMusicTools && (
                <SermonMusicGenerator
                  workspace={workspace}
                  sermonId={workspace.sermonId}
                  token={token}
                  suggestedPrompt={autoPrompts.music}
                  suggestedPromptOptions={studyMediaPrompts.musicOptions}
                  onGenerated={() => setRefreshKey((prev) => prev + 1)}
                />
              )}

              {showSocialTools && (
                <div className="border border-white/10 rounded-xl p-6 bg-black/20 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Share2 className="w-6 h-6 text-cyan-300" />
                    <h3 className="text-lg font-semibold">Social Media Kit</h3>
                  </div>

                  <div className="border border-cyan-400/40 bg-cyan-500/10 text-cyan-100 text-sm rounded-xl px-4 py-3">
                    <p className="font-medium mb-1">Sermon Promotion Assets</p>
                    <p className="text-xs text-cyan-200/80">
                      Generate quote graphics and thumbnails for social media
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="border border-cyan-400/25 bg-cyan-500/10 rounded-xl p-3">
                      <p className="text-xs uppercase tracking-widest text-cyan-200/80">Church Branding Defaults</p>
                      <p className="text-xs text-cyan-100/90 mt-1">
                        {churchSettingsLoading ? 'Loading defaults...' : 'Managed from Settings → Church Settings'}
                      </p>
                    </div>

                    <div className="border border-white/10 rounded-xl p-4 bg-black/20 space-y-3">
                      <label className="text-xs uppercase tracking-widest text-gray-400">
                        Per-Run Event Overrides
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
                          placeholder="Event title"
                          value={eventOverrides.eventTitle}
                          onChange={(e) => setEventOverrides((prev) => ({ ...prev, eventTitle: e.target.value }))}
                        />
                        <input
                          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
                          placeholder="Event subtitle"
                          value={eventOverrides.eventSubtitle}
                          onChange={(e) => setEventOverrides((prev) => ({ ...prev, eventSubtitle: e.target.value }))}
                        />
                        <div className="relative">
                          <input
                            id="social-service-date"
                            type="date"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 pr-10 text-sm"
                            value={eventOverrides.serviceDate}
                            onChange={(e) => setEventOverrides((prev) => ({ ...prev, serviceDate: e.target.value }))}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-200"
                            onClick={() => {
                              const input = document.getElementById('social-service-date') as HTMLInputElement | null
                              if (!input) return
                              if (typeof input.showPicker === 'function') input.showPicker()
                              else input.focus()
                            }}
                            aria-label="Open date picker"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            id="social-service-time"
                            type="time"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 pr-10 text-sm"
                            value={eventOverrides.serviceTime}
                            onChange={(e) => setEventOverrides((prev) => ({ ...prev, serviceTime: e.target.value }))}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-200"
                            onClick={() => {
                              const input = document.getElementById('social-service-time') as HTMLInputElement | null
                              if (!input) return
                              if (typeof input.showPicker === 'function') input.showPicker()
                              else input.focus()
                            }}
                            aria-label="Open time picker"
                          >
                            <Clock3 className="w-4 h-4" />
                          </button>
                        </div>
                        <select
                          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
                          value={eventOverrides.timezone || 'America/New_York'}
                          onChange={(e) => setEventOverrides((prev) => ({ ...prev, timezone: e.target.value }))}
                        >
                          {US_TIMEZONES.map((zone) => (
                            <option key={zone.value} value={zone.value}>
                              {zone.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300">
                          <span className="block uppercase tracking-widest text-[10px] text-gray-500 mb-1">Generated CTA</span>
                          {generatedSocialMeta.ctaText}
                        </div>
                        <div className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300">
                          <span className="block uppercase tracking-widest text-[10px] text-gray-500 mb-1">Generated Hashtags</span>
                          {generatedSocialMeta.hashtags}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-300">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={eventOverrides.showLogo} onChange={(e) => setEventOverrides((prev) => ({ ...prev, showLogo: e.target.checked }))} />Show logo</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={eventOverrides.showAddress} onChange={(e) => setEventOverrides((prev) => ({ ...prev, showAddress: e.target.checked }))} />Show address</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={eventOverrides.showWebsite} onChange={(e) => setEventOverrides((prev) => ({ ...prev, showWebsite: e.target.checked }))} />Show website</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={eventOverrides.showPhone} onChange={(e) => setEventOverrides((prev) => ({ ...prev, showPhone: e.target.checked }))} />Show phone</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={eventOverrides.showServiceTime} onChange={(e) => setEventOverrides((prev) => ({ ...prev, showServiceTime: e.target.checked }))} />Show service time</label>
                        <select
                          value={eventOverrides.preset}
                          onChange={(e) => setEventOverrides((prev) => ({ ...prev, preset: e.target.value as 'minimal' | 'bold' | 'announcement' }))}
                          className="bg-black/40 border border-white/10 rounded-lg px-2 py-1"
                        >
                          <option value="minimal">Minimal</option>
                          <option value="bold">Bold</option>
                          <option value="announcement">Announcement</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
                        Output Pack
                      </label>
                      <select
                        value={socialMode}
                        onChange={(e) => setSocialMode(e.target.value as SocialPackMode)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
                      >
                        <option value="auto_multi_network">All networks — Instagram, Facebook, WhatsApp, YouTube, X</option>
                        <option value="core4">Core 4 — Instagram, Facebook, WhatsApp</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
                        Background Image Source
                      </label>
                      <select
                        value={socialBackgroundProvider}
                        onChange={(e) => setSocialBackgroundProvider(e.target.value as SocialBackgroundProvider)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm mb-2"
                      >
                        <option value="local">Local Generated</option>
                        <option value="openai">OpenAI Generated</option>
                      </select>
                      {socialBackgroundProvider === 'local' ? (
                        <select
                          value={socialBackgroundPreset}
                          onChange={(e) => setSocialBackgroundPreset(e.target.value as SocialBackgroundPreset)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
                        >
                          <option value="cyberpunk">Cyberpunk Neon</option>
                          <option value="modern">Modern Geometric</option>
                          <option value="aurora">Aurora Glow</option>
                          <option value="minimal">Minimal Studio</option>
                        </select>
                      ) : (
                        <p className="text-xs text-gray-400">
                          OpenAI generation may incur usage cost.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
                        Creative Direction
                      </label>
                      <select
                        value={socialPromptId}
                        onChange={(e) => {
                          setSocialPromptId(e.target.value)
                          const match = resolvedSocialOptions.find((item: SocialPromptOption) => item.id === e.target.value)
                          if (!match?.prompt) return
                          if (match.promptType === 'visual_prompt') setSocialVisualPrompt(match.prompt)
                          if (match.promptType === 'caption_copy') setSocialCaption(sanitizeSocialCaptionCopy(match.prompt))
                          if (match.promptType === 'quote_candidate') setSocialQuote(match.prompt)
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm"
                      >
                        {resolvedSocialOptions.map((option: SocialPromptOption) => (
                          <option key={option.id} value={option.id}>
                            {option.promptType === 'visual_prompt' ? 'Visual Prompt' : option.promptType === 'caption_copy' ? 'Caption Copy' : 'Quote Candidate'} · {option.label}{option.description ? ` — ${option.description}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
                        Visual Prompt
                      </label>
                      <textarea
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm min-h-[72px]"
                        value={socialVisualPrompt}
                        onChange={(e) => setSocialVisualPrompt(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
                        Featured Quote
                      </label>
                      <textarea
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm min-h-[80px]"
                        value={socialQuote}
                        onChange={(e) => setSocialQuote(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
                        Social Caption
                      </label>
                      <textarea
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm min-h-[60px]"
                        value={socialCaption}
                        onChange={(e) => setSocialCaption(sanitizeSocialCaptionCopy(e.target.value))}
                      />
                      <p className="text-[11px] text-gray-500 mt-1">
                        Used as post copy/meta context. It does not select a target platform.
                      </p>
                    </div>

                    <button
                      onClick={handleGenerateSocialPack}
                      className="w-full cyber-button text-sm px-4 py-3 rounded-xl flex items-center justify-center gap-2"
                      disabled={socialGenerating}
                    >
                      {socialGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                      {socialGenerating ? 'Generating Social Pack...' : 'Generate Social Pack'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Video */}
        <div className="lg:col-span-2">
          <VideoGenerationPanel
            workspaceId={workspace.id}
            token={token}
            videoPrompt={autoPrompts.video}
            promptOptions={studyMediaPrompts.videoOptions}
          />
        </div>

      </div>

        {/* Media Library */}
        <div className="cyber-panel rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Media Library</h3>
        <MediaGallery 
          workspace={workspace}
          workspaceId={workspace.id} 
          token={token}
          key={refreshKey}
          filter={libraryFilter}
          onFilterChange={setLibraryFilter}
          showOptionalTypes={showOptionalMedia}
          optimisticItems={optimisticMediaItems}
          onMediaDeleted={({ id }) => {
            setOptimisticMediaItems((prev) => prev.filter((item) => item.id !== id))
          }}
        />
      </div>
    </div>
  )
}
