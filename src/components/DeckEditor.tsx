'use client'

import { useEffect, useMemo, useState } from 'react'
import { slidesApi } from '@/lib/slides-api'
import { resolveDeckBackgroundPreset } from '../../../../shared/deck-composition.contract'

const SLIDES_BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1').replace(
  /\/api\/v1\/?$/,
  '',
)

const resolveSlidesAssetUrl = (value?: string | null): string => {
  const normalized = String(value || '').trim()
  if (!normalized) return ''
  if (/^(blob:|data:|https?:\/\/)/i.test(normalized)) return normalized
  return `${SLIDES_BACKEND_BASE_URL}${normalized.startsWith('/') ? '' : '/'}${normalized}`
}

const hexToRgba = (hex: string, opacity: number) => {
  const safeHex = hex.replace('#', '')
  const normalized =
    safeHex.length === 3
      ? safeHex
          .split('')
          .map((char) => char + char)
          .join('')
      : safeHex
  const bigint = parseInt(normalized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

interface Slide {
  id: string
  orderIndex: number
  type: string
  layoutKey: string
  content: Record<string, any>
  speakerNotes?: string
  imagePrompt?: string
  contentImagePrompt?: string
  imageProvider?: string
  imageStatus?: string
  imageUrl?: string
  contentImageProvider?: string
  contentImageStatus?: string
  contentImageUrl?: string
  templateId?: string
}

interface SlideFieldBox {
  field: string
  x: number
  y: number
  w: number
  h: number
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'reference' | 'message'
  multiline?: boolean
}

interface SlideLayout {
  layoutKey: string
  boxes: SlideFieldBox[]
}

type LayoutFamily =
  | 'title'
  | 'scripture'
  | 'big_idea'
  | 'point'
  | 'story'
  | 'application'
  | 'reflection'
  | 'appeal'
  | 'closing'
  | 'social'
  | 'default'

type LocalBackgroundPreset = 'worship' | 'biblical' | 'cyberpunk' | 'modern' | 'aurora' | 'minimal' | 'nature'
type DeckVisualStyle =
  | 'auto'
  | 'reverent_worship'
  | 'warm_pastoral'
  | 'evangelistic_invitation'
  | 'hopeful_prophecy'
  | 'bible_study_clean'
  | 'youth_modern'
  | 'spanish_church_warm'

const LOCAL_BACKGROUND_PRESET_OPTIONS: Array<{ value: LocalBackgroundPreset; label: string }> = [
  { value: 'worship', label: 'Worship Light' },
  { value: 'biblical', label: 'Biblical Horizon' },
  { value: 'cyberpunk', label: 'Cyberpunk Neon' },
  { value: 'modern', label: 'Modern Geometric' },
  { value: 'aurora', label: 'Aurora Glow' },
  { value: 'nature', label: 'Nature Warmth' },
  { value: 'minimal', label: 'Minimal Studio' },
]

const slideLayouts: SlideLayout[] = [
  {
    layoutKey: 'title_centered_v1',
    boxes: [
      { field: 'title', x: 8, y: 22, w: 84, h: 18, variant: 'title' },
      { field: 'subtitle', x: 12, y: 45, w: 76, h: 12, variant: 'subtitle' },
    ],
  },
  {
    layoutKey: 'title_content_v1',
    boxes: [
      { field: 'title', x: 8, y: 4, w: 84, h: 24, variant: 'title' },
      { field: 'bullets', x: 10, y: 32, w: 80, h: 52, variant: 'body', multiline: true },
    ],
  },
  {
    layoutKey: 'cinematic_title',
    boxes: [
      { field: 'title', x: 8, y: 22, w: 84, h: 18, variant: 'title' },
      { field: 'subtitle', x: 12, y: 45, w: 76, h: 12, variant: 'subtitle' },
    ],
  },
  {
    layoutKey: 'scripture_focus',
    boxes: [
      { field: 'reference', x: 10, y: 10, w: 80, h: 9, variant: 'reference' },
      { field: 'lines', x: 10, y: 23, w: 80, h: 62, variant: 'body', multiline: true },
    ],
  },
  {
    layoutKey: 'big_idea_center',
    boxes: [
      { field: 'title', x: 8, y: 24, w: 84, h: 16, variant: 'title' },
      { field: 'subtitle', x: 12, y: 44, w: 76, h: 16, variant: 'subtitle' },
    ],
  },
  {
    layoutKey: 'point_with_support',
    boxes: [
      { field: 'title', x: 8, y: 4, w: 84, h: 18, variant: 'title' },
      { field: 'bullets', x: 10, y: 24, w: 80, h: 60, variant: 'body', multiline: true },
    ],
  },
  {
    layoutKey: 'story_moment',
    boxes: [
      { field: 'title', x: 8, y: 8, w: 84, h: 18, variant: 'title' },
      { field: 'body', x: 10, y: 32, w: 80, h: 44, variant: 'body', multiline: true },
    ],
  },
  {
    layoutKey: 'point_bullets_v1',
    boxes: [
      { field: 'title', x: 8, y: 4, w: 84, h: 24, variant: 'title' },
      { field: 'bullets', x: 10, y: 32, w: 80, h: 52, variant: 'body', multiline: true },
    ],
  },
  {
    layoutKey: 'point_statement',
    boxes: [
      { field: 'title', x: 8, y: 8, w: 84, h: 20, variant: 'title' },
      { field: 'bullets', x: 12, y: 34, w: 76, h: 42, variant: 'body', multiline: true },
    ],
  },
  {
    layoutKey: 'support_verse',
    boxes: [
      { field: 'title', x: 8, y: 6, w: 84, h: 18, variant: 'title' },
      { field: 'bullets', x: 10, y: 28, w: 80, h: 56, variant: 'body', multiline: true },
    ],
  },
  {
    layoutKey: 'section_header_v1',
    boxes: [
      { field: 'title', x: 12, y: 30, w: 76, h: 18, variant: 'title' },
      { field: 'subtitle', x: 18, y: 52, w: 64, h: 12, variant: 'subtitle' },
    ],
  },
  {
    layoutKey: 'scripture_centered_v1',
    boxes: [
      { field: 'reference', x: 10, y: 10, w: 80, h: 9, variant: 'reference' },
      { field: 'lines', x: 10, y: 23, w: 80, h: 62, variant: 'body', multiline: true },
    ],
  },
  {
    layoutKey: 'application_bullets_v1',
    boxes: [
      { field: 'title', x: 8, y: 4, w: 84, h: 18, variant: 'title' },
      { field: 'bullets', x: 10, y: 24, w: 80, h: 60, variant: 'body', multiline: true },
    ],
  },
  {
    layoutKey: 'invitation_centered_v1',
    boxes: [
      { field: 'title', x: 8, y: 20, w: 84, h: 14, variant: 'title' },
      { field: 'message', x: 12, y: 38, w: 76, h: 40, variant: 'message', multiline: true },
    ],
  },
  {
    layoutKey: 'reflection_question',
    boxes: [
      { field: 'title', x: 8, y: 18, w: 84, h: 14, variant: 'title' },
      { field: 'body', x: 12, y: 40, w: 76, h: 32, variant: 'body', multiline: true },
    ],
  },
  {
    layoutKey: 'appeal_minimal',
    boxes: [
      { field: 'title', x: 8, y: 18, w: 84, h: 14, variant: 'title' },
      { field: 'message', x: 12, y: 40, w: 76, h: 32, variant: 'message', multiline: true },
    ],
  },
  {
    layoutKey: 'closing_blessing',
    boxes: [
      { field: 'title', x: 8, y: 18, w: 84, h: 14, variant: 'title' },
      { field: 'body', x: 12, y: 40, w: 76, h: 32, variant: 'body', multiline: true },
    ],
  },
  {
    layoutKey: 'social_square',
    boxes: [
      { field: 'title', x: 8, y: 18, w: 84, h: 18, variant: 'title' },
      { field: 'subtitle', x: 12, y: 42, w: 76, h: 18, variant: 'subtitle' },
    ],
  },
  {
    layoutKey: 'social_story',
    boxes: [
      { field: 'title', x: 8, y: 18, w: 84, h: 18, variant: 'title' },
      { field: 'subtitle', x: 12, y: 42, w: 76, h: 18, variant: 'subtitle' },
    ],
  },
]

const getLayoutForTemplate = (layoutKey?: string | null) =>
  slideLayouts.find((layout) => layout.layoutKey === layoutKey)

const getLayoutFamily = (layoutKey?: string | null): LayoutFamily => {
  const key = String(layoutKey || '')
  if (['cinematic_title', 'title_centered_v1'].includes(key)) return 'title'
  if (['scripture_focus', 'scripture_centered_v1'].includes(key)) return 'scripture'
  if (['big_idea_center'].includes(key)) return 'big_idea'
  if (['point_with_support', 'point_statement', 'point_bullets_v1', 'support_verse'].includes(key)) return 'point'
  if (['story_moment'].includes(key)) return 'story'
  if (['application_steps', 'application_bullets_v1'].includes(key)) return 'application'
  if (['reflection_question'].includes(key)) return 'reflection'
  if (['appeal_minimal', 'invitation_centered_v1'].includes(key)) return 'appeal'
  if (['closing_blessing'].includes(key)) return 'closing'
  if (['social_square', 'social_story'].includes(key)) return 'social'
  return 'default'
}

const getVisualStylePalette = (style: DeckVisualStyle, theme?: any) => {
  const themePrimary = String(theme?.primaryColor || '#60A5FA')
  const themeSecondary = String(theme?.secondaryColor || '#1E3A8A')
  const palettes: Record<DeckVisualStyle, { top: string; mid: string; bottom: string; glow: string; text: string }> = {
    auto: { top: '#0F172A', mid: '#1E293B', bottom: '#111827', glow: 'rgba(96,165,250,0.28)', text: '#FFFFFF' },
    reverent_worship: { top: '#0F172A', mid: '#1E293B', bottom: '#030712', glow: 'rgba(245,158,11,0.20)', text: '#F8FAFC' },
    warm_pastoral: { top: '#2A1E1A', mid: '#4B3228', bottom: '#111827', glow: 'rgba(249,115,22,0.22)', text: '#FFF7ED' },
    evangelistic_invitation: { top: '#0B1020', mid: '#1E3A8A', bottom: '#0F172A', glow: 'rgba(250,204,21,0.24)', text: '#F8FAFC' },
    hopeful_prophecy: { top: '#082F49', mid: '#0F172A', bottom: '#111827', glow: 'rgba(56,189,248,0.22)', text: '#F8FAFC' },
    bible_study_clean: { top: '#F8FAFC', mid: '#EFF6FF', bottom: '#DBEAFE', glow: 'rgba(37,99,235,0.12)', text: '#0F172A' },
    youth_modern: { top: '#111827', mid: '#312E81', bottom: '#0F172A', glow: 'rgba(168,85,247,0.24)', text: '#F8FAFC' },
    spanish_church_warm: { top: '#431407', mid: '#9A3412', bottom: '#1F2937', glow: 'rgba(249,115,22,0.24)', text: '#FFF7ED' },
  }
  return {
    ...palettes[style],
    top: palettes[style].top === '#60A5FA' ? themePrimary : palettes[style].top,
    mid: palettes[style].mid === '#1E3A8A' ? themeSecondary : palettes[style].mid,
  }
}

  const buildPreviewBackdrop = (style: DeckVisualStyle, layoutKey?: string | null, theme?: any) => {
  const palette = getVisualStylePalette(style, theme)
  const family = getLayoutFamily(layoutKey)
  const isTitle = family === 'title' || family === 'social'
  const isScripture = family === 'scripture'
  const isAppeal = family === 'appeal'
  const isReflection = family === 'reflection'
  const isApplication = family === 'application'
  const isSupport = family === 'point'

  const gradient = isScripture
    ? `radial-gradient(circle at top, ${palette.glow} 0%, transparent 42%), linear-gradient(145deg, ${palette.top} 0%, ${palette.mid} 55%, ${palette.bottom} 100%)`
    : isTitle
      ? `radial-gradient(circle at 18% 18%, ${palette.glow} 0%, transparent 32%), radial-gradient(circle at 84% 16%, rgba(255,255,255,0.16) 0%, transparent 24%), linear-gradient(135deg, ${palette.top} 0%, ${palette.mid} 56%, ${palette.bottom} 100%)`
      : isAppeal
        ? `radial-gradient(circle at 70% 20%, ${palette.glow} 0%, transparent 34%), radial-gradient(circle at 18% 80%, rgba(255,255,255,0.08) 0%, transparent 26%), linear-gradient(145deg, ${palette.top} 0%, ${palette.mid} 60%, ${palette.bottom} 100%)`
        : isReflection
          ? `radial-gradient(circle at 50% 12%, rgba(255,255,255,0.08) 0%, transparent 22%), linear-gradient(150deg, ${palette.top} 0%, ${palette.mid} 52%, ${palette.bottom} 100%)`
          : isApplication
            ? `radial-gradient(circle at 78% 18%, rgba(255,255,255,0.08) 0%, transparent 20%), linear-gradient(145deg, ${palette.top} 0%, ${palette.mid} 62%, ${palette.bottom} 100%)`
            : isSupport
              ? `radial-gradient(circle at 22% 22%, rgba(255,255,255,0.07) 0%, transparent 18%), linear-gradient(145deg, ${palette.top} 0%, ${palette.mid} 55%, ${palette.bottom} 100%)`
              : `linear-gradient(140deg, ${palette.top} 0%, ${palette.mid} 55%, ${palette.bottom} 100%)`

  return {
    backgroundImage: gradient,
    color: palette.text,
  }
}

const getPreviewChromeOpacityFloor = (family: LayoutFamily, variant: SlideFieldBox['variant']) => {
  if (family === 'title') {
    if (variant === 'title') return 0.12
    if (variant === 'subtitle') return 0.08
    return 0.06
  }
  if (family === 'scripture') {
    if (variant === 'reference') return 0.10
    if (variant === 'body') return 0.05
    return 0.06
  }
  if (family === 'point') {
    if (variant === 'title') return 0.16
    if (variant === 'body') return 0.08
    return 0.07
  }
  if (family === 'story' || family === 'application') {
    if (variant === 'title') return 0.14
    if (variant === 'body' || variant === 'message') return 0.08
    return 0.06
  }
  if (family === 'reflection' || family === 'appeal' || family === 'closing') {
    if (variant === 'title') return 0.12
    if (variant === 'body' || variant === 'message') return 0.08
    return 0.06
  }
  return variant === 'title' || variant === 'reference' ? 0.10 : 0.06
}

const renderPreviewAccents = (
  family: LayoutFamily,
  palette: { top: string; mid: string; bottom: string; glow: string; text: string },
) => {
  switch (family) {
    case 'title':
      return (
        <>
          <div className="absolute left-5 top-5 h-1.5 w-20 rounded-full opacity-80" style={{ backgroundColor: palette.glow }} />
          <div className="absolute right-6 top-6 h-24 w-px opacity-50" style={{ backgroundColor: palette.text }} />
          <div className="absolute left-1/2 top-8 h-28 w-px -translate-x-1/2 opacity-35" style={{ backgroundColor: palette.text }} />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/30 to-transparent" />
        </>
      )
    case 'scripture':
      return (
        <>
          <div className="absolute left-6 top-6 h-[82%] w-1 rounded-full opacity-70" style={{ backgroundColor: palette.glow }} />
          <div className="absolute left-10 top-10 h-8 w-32 rounded-full opacity-35" style={{ backgroundColor: palette.text }} />
          <div className="absolute right-8 top-12 h-24 w-px opacity-45" style={{ backgroundColor: palette.text }} />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/18 to-transparent" />
        </>
      )
    case 'big_idea':
      return (
        <>
          <div className="absolute inset-x-14 top-14 h-px opacity-45" style={{ backgroundColor: palette.text }} />
          <div className="absolute inset-x-20 bottom-14 h-px opacity-35" style={{ backgroundColor: palette.text }} />
          <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-20" style={{ borderColor: palette.glow }} />
        </>
      )
    case 'point':
      return (
        <>
          <div className="absolute left-6 top-8 h-[76%] w-1 rounded-full opacity-75" style={{ backgroundColor: palette.glow }} />
          <div className="absolute right-8 top-10 h-10 w-28 rounded-full opacity-30" style={{ backgroundColor: palette.text }} />
          <div className="absolute inset-x-14 bottom-12 h-px opacity-30" style={{ backgroundColor: palette.text }} />
        </>
      )
    case 'story':
      return (
        <>
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/35 to-transparent" />
          <div className="absolute right-8 top-10 h-[70%] w-px opacity-40" style={{ backgroundColor: palette.text }} />
          <div className="absolute left-8 bottom-10 h-1.5 w-32 rounded-full opacity-45" style={{ backgroundColor: palette.glow }} />
        </>
      )
    case 'application':
      return (
        <>
          <div className="absolute left-6 top-8 h-[74%] w-1 rounded-full opacity-65" style={{ backgroundColor: palette.glow }} />
          <div className="absolute inset-x-12 top-12 h-px opacity-35" style={{ backgroundColor: palette.text }} />
          <div className="absolute inset-x-12 bottom-12 h-px opacity-25" style={{ backgroundColor: palette.text }} />
        </>
      )
    case 'reflection':
      return (
        <>
          <div className="absolute inset-x-20 top-12 h-px opacity-35" style={{ backgroundColor: palette.text }} />
          <div className="absolute inset-x-20 bottom-12 h-px opacity-35" style={{ backgroundColor: palette.text }} />
          <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-15" style={{ borderColor: palette.glow }} />
        </>
      )
    case 'appeal':
      return (
        <>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute left-8 top-10 h-px w-24 opacity-45" style={{ backgroundColor: palette.text }} />
          <div className="absolute right-8 top-10 h-px w-24 opacity-45" style={{ backgroundColor: palette.text }} />
          <div className="absolute left-1/2 bottom-10 h-1.5 w-36 -translate-x-1/2 rounded-full opacity-60" style={{ backgroundColor: palette.glow }} />
        </>
      )
    case 'closing':
      return (
        <>
          <div className="absolute inset-x-14 bottom-12 h-px opacity-32" style={{ backgroundColor: palette.text }} />
          <div className="absolute left-1/2 top-14 h-20 w-px -translate-x-1/2 opacity-35" style={{ backgroundColor: palette.text }} />
        </>
      )
    case 'social':
      return (
        <>
          <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-black/35 to-transparent" />
          <div className="absolute left-6 top-6 h-1.5 w-28 rounded-full opacity-75" style={{ backgroundColor: palette.glow }} />
          <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-18" style={{ borderColor: palette.text }} />
        </>
      )
    default:
      return (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/18" />
        </>
      )
  }
}

type FieldStyle = {
  fontFamily?: string
  fontSize?: number
  color?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  align?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'middle' | 'bottom'
  backgroundColor?: string
  backgroundOpacity?: number
}

interface DeckEditorProps {
  deckId: string
  token: string
  onClose?: () => void
  onExport?: () => void
}

export default function DeckEditor({ deckId, token, onClose, onExport }: DeckEditorProps) {
  const [deck, setDeck] = useState<any>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [contentDrafts, setContentDrafts] = useState<Record<string, Record<string, string>>>({})
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({})
  const [styleDrafts, setStyleDrafts] = useState<Record<string, Record<string, FieldStyle>>>({})
  const [activeField, setActiveField] = useState<{ slideId: string; field: string } | null>(null)
  const [lineSpacing, setLineSpacing] = useState(1.28)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [columns, setColumns] = useState<1 | 2 | 3>(1)
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({})
  const [globalImageProvider, setGlobalImageProvider] = useState<'local' | 'openai'>('local')
  const [globalImagePreset, setGlobalImagePreset] = useState<LocalBackgroundPreset>('worship')
  const [generatingAllBackgrounds, setGeneratingAllBackgrounds] = useState(false)
  const previewScale = columns === 1 ? 1 : columns === 2 ? 0.62 : 0.48

  const fontOptions = useMemo(
    () => ['Montserrat', 'Inter', 'Playfair Display', 'Source Sans Pro', 'Lora', 'Merriweather', 'Poppins', 'Roboto'],
    []
  )

  const fontSizeOptions = useMemo(() => [18, 22, 26, 32, 36, 42, 48, 54, 64, 72, 84], [])
  const deckVisualStyle: DeckVisualStyle = useMemo(
    () => (String(deck?.composition?.visualStyle || deck?.manifest?.visualStyle || 'auto') as DeckVisualStyle),
    [deck],
  )
  const deckPalette = useMemo(() => getVisualStylePalette(deckVisualStyle, deck?.theme), [deckVisualStyle, deck?.theme])

  useEffect(() => {
    if (globalImageProvider !== 'local') return
    const preferredPreset = resolveDeckBackgroundPreset(deckVisualStyle, String(deck?.deckIntent || 'sermon_presentation') as any) as LocalBackgroundPreset
    setGlobalImagePreset((current) => {
      if (['worship', 'biblical', 'nature'].includes(String(current))) {
        return current
      }
      return preferredPreset
    })
  }, [deckVisualStyle, deck?.deckIntent, globalImageProvider])

  useEffect(() => {
    const linkId = 'google-fonts-deck-editor'
    if (document.getElementById(linkId)) return
    const link = document.createElement('link')
    link.id = linkId
    link.rel = 'stylesheet'
    const families = fontOptions
      .map((font) => `family=${encodeURIComponent(font).replace(/%20/g, '+')}:wght@300;400;500;600;700`)
      .join('&')
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
    document.head.appendChild(link)
  }, [fontOptions])

  const defaultStyleForField = (variant?: string): FieldStyle => {
    const headingFont = deck?.theme?.fontHeading || 'Montserrat'
    const bodyFont = deck?.theme?.fontBody || 'Inter'
    const primaryColor = deck?.theme?.primaryColor || '#60A5FA'
    switch (variant) {
      case 'title':
        return {
          fontFamily: headingFont,
          fontSize: 48,
          color: '#FFFFFF',
          bold: true,
          align: 'center',
          verticalAlign: 'middle',
          backgroundColor: '#000000',
          backgroundOpacity: 0.34,
        }
      case 'subtitle':
        return {
          fontFamily: bodyFont,
          fontSize: 28,
          color: '#E5E5E5',
          align: 'center',
          verticalAlign: 'middle',
          backgroundColor: '#000000',
          backgroundOpacity: 0.24,
        }
      case 'reference':
        return {
          fontFamily: headingFont,
          fontSize: 36,
          color: primaryColor,
          bold: true,
          align: 'center',
          verticalAlign: 'middle',
          backgroundColor: '#000000',
          backgroundOpacity: 0.30,
        }
      case 'message':
        return {
          fontFamily: bodyFont,
          fontSize: 24,
          color: '#FFFFFF',
          align: 'center',
          verticalAlign: 'middle',
          backgroundColor: '#000000',
          backgroundOpacity: 0.26,
        }
      default:
        return {
          fontFamily: bodyFont,
          fontSize: 22,
          color: '#FFFFFF',
          align: 'left',
          verticalAlign: 'top',
          backgroundColor: '#000000',
          backgroundOpacity: 0.16,
        }
    }
  }

  const normalizeFieldStyle = (variant: SlideFieldBox['variant'], style?: FieldStyle): FieldStyle => {
    const base = defaultStyleForField(variant)
    const candidate = { ...base, ...(style || {}) }
    const backgroundOpacityFloor = getPreviewChromeOpacityFloor('default', variant)
    // Don't clamp font sizes - let defaults apply as-is
    return {
      ...candidate,
      backgroundOpacity: Math.max(
        backgroundOpacityFloor,
        Math.min(0.9, Number(candidate.backgroundOpacity ?? base.backgroundOpacity ?? 0.55)),
      ),
    }
  }

  const activeStyle = useMemo(() => {
    if (!activeField) return null
    const variant = slides.find((s) => s.id === activeField.slideId)?.layoutKey
    const layout = getLayoutForTemplate(variant)
    const box = layout?.boxes?.find((b) => b.field === activeField.field)
    return styleDrafts[activeField.slideId]?.[activeField.field] || defaultStyleForField(box?.variant)
  }, [activeField, styleDrafts, slides, deck])

  const updateActiveStyle = (updates: Partial<FieldStyle>) => {
    if (!activeField) return
    setStyleDrafts((prev) => {
      const currentSlide = prev[activeField.slideId] || {}
      const existing = currentSlide[activeField.field] || {}
      return {
        ...prev,
        [activeField.slideId]: {
          ...currentSlide,
          [activeField.field]: { ...existing, ...updates },
        },
      }
    })
  }

  const getPreviewFieldScale = (
    variant: SlideFieldBox['variant'],
    value: string,
    multiline: boolean | undefined,
  ) => {
    // Keep scale at 1 for single column, minimal reduction for multi-column
    if (columns === 1) return 1
    if (columns === 2) return 0.85
    return 0.75
  }

  // Dynamic font sizing for titles that are too long
  const getDynamicFontSize = (
    baseFontSize: number,
    text: string,
    variant: SlideFieldBox['variant'],
    boxWidthPercent: number,
  ): number => {
    if (!text || (variant !== 'title' && variant !== 'reference')) {
      return baseFontSize
    }

    const textLength = text.length
    // More conservative estimate: ~0.5 char width ratio for Montserrat bold
    // Box width percentage of container (preview is scaled down)
    const charsPerLine = Math.floor((boxWidthPercent * 0.9) / (baseFontSize * 0.035))

    if (textLength <= charsPerLine) {
      return baseFontSize
    }

    // Calculate font size needed to fit text on one line
    const targetFontSize = Math.floor((boxWidthPercent * 0.9) / (textLength * 0.035))
    const minFontSize = variant === 'title' ? 24 : 20
    
    return Math.max(minFontSize, Math.min(baseFontSize, targetFontSize))
  }

  // Calculate dynamic box height when title wraps
  const getDynamicBoxHeight = (
    baseHeight: number,
    text: string,
    fontSize: number,
    boxWidthPercent: number,
    variant: SlideFieldBox['variant'],
  ): { height: number; overflow: number } => {
    if (!text || (variant !== 'title' && variant !== 'reference')) {
      return { height: baseHeight, overflow: 0 }
    }

    // Estimate how many lines the text will take
    const charsPerLine = Math.floor((boxWidthPercent * 0.9) / (fontSize * 0.035))
    const estimatedLines = Math.ceil(text.length / charsPerLine)

    if (estimatedLines <= 1) {
      return { height: baseHeight, overflow: 0 }
    }

    // Each additional line adds ~5% height
    const additionalHeight = (estimatedLines - 1) * 5
    const newHeight = Math.min(baseHeight + additionalHeight, 40) // Cap at 40%
    const overflow = newHeight - baseHeight

    return { height: newHeight, overflow }
  }

  useEffect(() => {
    loadDeck()
    loadSlides()
  }, [deckId])

  useEffect(() => {
    const hasPendingImages = slides.some(
      (slide) =>
        (String(slide.imageStatus || '').toLowerCase() === 'pending' && !slide.imageUrl) ||
        (String(slide.contentImageStatus || '').toLowerCase() === 'pending' && !slide.contentImageUrl),
    )
    if (!hasPendingImages) return

    const interval = setInterval(() => {
      loadSlides()
    }, 3000)

    return () => clearInterval(interval)
  }, [slides])

  useEffect(() => {
    let cancelled = false
    const loadPreviews = async () => {
      for (const slide of slides) {
        if (String(slide.imageStatus || '').toLowerCase() !== 'ready') continue
        if (imagePreviews[slide.id]) continue
        try {
          const blob = await slidesApi.getSlideImageBlob(slide.id, token)
          if (cancelled) return
          const url = URL.createObjectURL(blob)
          setImagePreviews((prev) => ({ ...prev, [slide.id]: url }))
        } catch (err) {
          // keep fallback rendering when image fetch fails
          console.error(`Failed to load slide image preview for ${slide.id}`, err)
        }
      }
    }
    loadPreviews()
    return () => {
      cancelled = true
    }
  }, [slides, token, imagePreviews])

  useEffect(() => {
    const nextContentDrafts: Record<string, Record<string, string>> = {}
    const nextNotesDrafts: Record<string, string> = {}
    const nextStyleDrafts: Record<string, Record<string, FieldStyle>> = {}
    slides.forEach((slide) => {
      const layout = getLayoutForTemplate(slide.layoutKey)
      const fields = layout?.boxes?.map((box) => box.field) || Object.keys(slide.content || {})

      nextContentDrafts[slide.id] = {}
      const existingStyles = (slide.content?.__styles as Record<string, FieldStyle>) || {}
      nextStyleDrafts[slide.id] = {}
      fields.forEach((fieldKey: string) => {
        const value = slide.content?.[fieldKey]
        if (Array.isArray(value)) {
          nextContentDrafts[slide.id][fieldKey] = value.map((line) => `• ${String(line).trim()}`).join('\n\n')
        } else if (value !== undefined && value !== null) {
          nextContentDrafts[slide.id][fieldKey] = String(value)
        } else {
          nextContentDrafts[slide.id][fieldKey] = ''
        }
        const variant = layout?.boxes?.find((box) => box.field === fieldKey)?.variant
        nextStyleDrafts[slide.id][fieldKey] = normalizeFieldStyle(variant, existingStyles[fieldKey])
      })
      nextNotesDrafts[slide.id] = slide.speakerNotes || ''
    })
    setContentDrafts(nextContentDrafts)
    setNotesDrafts(nextNotesDrafts)
    setStyleDrafts(nextStyleDrafts)
  }, [slides])

  const loadDeck = async () => {
    try {
      const response = await slidesApi.getDeck(deckId, token)
      setDeck(response)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load deck')
    } finally {
      setLoading(false)
    }
  }

  const loadSlides = async () => {
    try {
      const response = await slidesApi.getSlides(deckId, token)
      const sortedSlides = response.sort((a: Slide, b: Slide) => a.orderIndex - b.orderIndex)
      setSlides(sortedSlides)
    } catch (err) {
      console.error('Failed to load slides', err)
    }
  }

  const saveEditingSlide = async (slideId: string) => {
    try {
      const slide = slides.find((item) => item.id === slideId)
      if (!slide) return
      const layout = getLayoutForTemplate(slide.layoutKey)
      const fields = layout?.boxes?.map((box) => box.field) || Object.keys(slide.content || {})
      const draft = contentDrafts[slideId] || {}
      const parsedContent: Record<string, any> = {}
      fields.forEach((fieldKey: string) => {
        const value = draft[fieldKey] || ''
        if (layout?.boxes?.find((b) => b.field === fieldKey)?.multiline) {
          parsedContent[fieldKey] = value
            .split('\n')
            .map((line) => line.replace(/^\s*(?:•|\d+\.)\s*/, '').trim())
            .filter(Boolean)
        } else {
          parsedContent[fieldKey] = value
        }
      })
      if (styleDrafts[slideId]) {
        parsedContent.__styles = styleDrafts[slideId]
      }
      const speakerNotes = notesDrafts[slideId] || ''
      await slidesApi.updateSlide(slideId, { content: parsedContent, speakerNotes }, token)
      setSlides((prev) =>
        prev.map((s) => (s.id === slideId ? { ...s, content: parsedContent, speakerNotes } : s))
      )
    } catch (err: any) {
      setError(err?.message || 'Failed to save slide edits')
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      await slidesApi.exportDeck(deckId, 'pptx', token)
      onExport?.()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export deck')
    } finally {
      setExporting(false)
    }
  }

  const handleGenerateAllBackgrounds = async () => {
    if (!slides.length) return
    const provider = globalImageProvider
    const preset = provider === 'local' ? globalImagePreset : undefined

    setGeneratingAllBackgrounds(true)
    setError('')
    try {
      setImagePreviews({})
      await Promise.all(
        slides.map((slide) =>
          slidesApi.generateSlideImage(slide.id, provider, token, slide.imagePrompt, preset, 'background')
        )
      )
      await loadSlides()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate background image')
    } finally {
      setGeneratingAllBackgrounds(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-red-400/40 bg-red-500/10 text-red-100 rounded-xl px-4 py-3">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold">{deck?.sermon?.title}</h2>
          <p className="text-sm text-gray-400">Theme: {deck?.theme?.name}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="cyber-tag text-cyan-200">
              Deck mode: {String(deck?.deckIntent || 'sermon_presentation').replace(/_/g, ' ')}
            </span>
            <span className="cyber-tag text-emerald-200">Slides: {slides.length || '0'}</span>
            {String(deck?.deckIntent || 'sermon_presentation') === 'sermon_presentation' && slides.length > 0 && slides.length < 8 ? (
              <span className="cyber-tag text-amber-200">Too short for a full sermon presentation</span>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          {/* Column Layout Switcher */}
          <div className="flex gap-1 border border-white/10 rounded-xl p-1 bg-black/20">
            <button
              onClick={() => setColumns(1)}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                columns === 1 ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40' : 'text-gray-400 hover:bg-white/5'
              }`}
              title="1 Column"
            >
              1
            </button>
            <button
              onClick={() => setColumns(2)}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                columns === 2 ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40' : 'text-gray-400 hover:bg-white/5'
              }`}
              title="2 Columns"
            >
              2
            </button>
            <button
              onClick={() => setColumns(3)}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                columns === 3 ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40' : 'text-gray-400 hover:bg-white/5'
              }`}
              title="3 Columns"
            >
              3
            </button>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="cyber-button px-4 py-2 rounded-xl text-sm"
          >
            {exporting ? 'Exporting...' : 'Export PPTX'}
          </button>
          {onClose && (
            <button onClick={onClose} className="cyber-outline px-4 py-2 rounded-xl text-sm">
              Close
            </button>
          )}
        </div>
      </div>

      <div className="border border-white/10 rounded-xl p-4 bg-black/20 space-y-3">
        <p className="text-sm font-medium">Background Image (All Slides)</p>
        <select
          className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 text-sm text-gray-100"
          value={globalImageProvider}
          onChange={(e) => setGlobalImageProvider(e.target.value as 'local' | 'openai')}
        >
          <option value="local">Local Generated</option>
          <option value="openai">OpenAI Generated</option>
        </select>
        {globalImageProvider === 'local' && (
          <select
            className="w-full px-3 py-2 border border-white/10 rounded-lg bg-black/40 text-sm text-gray-100"
            value={globalImagePreset}
            onChange={(e) => setGlobalImagePreset(e.target.value as LocalBackgroundPreset)}
          >
            {LOCAL_BACKGROUND_PRESET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={handleGenerateAllBackgrounds}
          disabled={generatingAllBackgrounds}
          className="w-full cyber-outline px-4 py-2 rounded-lg text-sm disabled:opacity-60"
        >
          {generatingAllBackgrounds ? 'Generating Backgrounds...' : 'Generate Backgrounds for All Slides'}
        </button>
      </div>

      {/* Text Formatting Toolbar */}
      {activeField && (
        <div className="flex flex-wrap items-center gap-2 border border-cyan-400/40 rounded-xl p-3 bg-cyan-500/10">
          <select
            className="border rounded px-2 py-1 text-sm bg-black/40 border-white/10"
            value={activeStyle?.fontFamily || ''}
            onChange={(e) => updateActiveStyle({ fontFamily: e.target.value })}
          >
            <option value="">Font</option>
            {fontOptions.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-2 py-1 text-sm bg-black/40 border-white/10"
            value={activeStyle?.fontSize || ''}
            onChange={(e) => updateActiveStyle({ fontSize: Number(e.target.value) })}
          >
            <option value="">Size</option>
            {fontSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <input
            type="color"
            className="h-8 w-10 border rounded"
            value={activeStyle?.color || '#000000'}
            onChange={(e) => updateActiveStyle({ color: e.target.value })}
          />
          <div className="h-6 w-px bg-white/20" />
          <button
            className={`px-3 py-1 rounded text-sm font-bold ${activeStyle?.bold ? 'bg-cyan-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
            onClick={() => updateActiveStyle({ bold: !activeStyle?.bold })}
            title="Bold"
          >
            B
          </button>
          <button
            className={`px-3 py-1 rounded text-sm italic ${activeStyle?.italic ? 'bg-cyan-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
            onClick={() => updateActiveStyle({ italic: !activeStyle?.italic })}
            title="Italic"
          >
            I
          </button>
          <button
            className={`px-3 py-1 rounded text-sm underline ${activeStyle?.underline ? 'bg-cyan-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
            onClick={() => updateActiveStyle({ underline: !activeStyle?.underline })}
            title="Underline"
          >
            U
          </button>
          <div className="h-6 w-px bg-white/20" />
          <button
            className={`px-3 py-1 rounded text-sm ${activeStyle?.align === 'left' ? 'bg-cyan-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
            onClick={() => updateActiveStyle({ align: 'left' })}
            title="Align Left"
          >
            ≡
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${activeStyle?.align === 'center' ? 'bg-cyan-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
            onClick={() => updateActiveStyle({ align: 'center' })}
            title="Align Center"
          >
            ≣
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${activeStyle?.align === 'right' ? 'bg-cyan-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
            onClick={() => updateActiveStyle({ align: 'right' })}
            title="Align Right"
          >
            ≡
          </button>
        </div>
      )}

      {/* Slides Grid */}
      <div className={`grid gap-4 ${
        columns === 1 ? 'grid-cols-1' :
        columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {slides.map((slide, idx) => {
          const layout = getLayoutForTemplate(slide.layoutKey)
          const layoutFamily = getLayoutFamily(slide.layoutKey)
          const fieldKeys = layout?.boxes?.map((box) => box.field) || Object.keys(slide.content || {})
          const resolvedSlideImageUrl = imagePreviews[slide.id] || resolveSlidesAssetUrl(slide.imageUrl)

          return (
            <div
              key={slide.id}
              className="border border-white/10 rounded-2xl p-4 bg-black/30 hover:bg-black/40"
              style={{
                boxShadow:
                  layoutFamily === 'title'
                    ? `0 0 0 1px rgba(255,255,255,0.03), 0 18px 46px ${deckPalette.glow}`
                    : layoutFamily === 'scripture'
                      ? `0 0 0 1px rgba(255,255,255,0.03), 0 14px 34px rgba(0,0,0,0.24)`
                      : `0 0 0 1px rgba(255,255,255,0.02), 0 12px 28px rgba(0,0,0,0.22)`,
              }}
            >
              <div className="mb-2">
                <p className="text-sm font-medium">Slide {idx + 1}</p>
                <p className="text-xs text-gray-500">{slide.type}</p>
              </div>
              <div
                className="relative w-full rounded-[18px] border border-white/10 overflow-hidden"
                style={{
                  aspectRatio: '16 / 9',
                  boxShadow:
                    layoutFamily === 'title'
                      ? `inset 0 0 0 1px rgba(255,255,255,0.06), 0 22px 60px ${deckPalette.glow}`
                      : layoutFamily === 'appeal'
                        ? `inset 0 0 0 1px rgba(255,255,255,0.06), 0 18px 44px rgba(0,0,0,0.26)`
                        : `inset 0 0 0 1px rgba(255,255,255,0.03), 0 14px 36px rgba(0,0,0,0.22)`,
                  ...(!resolvedSlideImageUrl ? buildPreviewBackdrop(deckVisualStyle, slide.layoutKey, deck?.theme) : {}),
                }}
              >
                {resolvedSlideImageUrl && (
                  <>
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${resolvedSlideImageUrl})` }}
                    />
                    <div className="absolute inset-0 bg-slate-900/18" />
                  </>
                )}
                {renderPreviewAccents(layoutFamily, deckPalette)}
                {(() => {
                // Calculate cumulative overflow from title boxes to push content down
                let cumulativeOverflow = 0
                return layout?.boxes?.map((box, boxIndex) => {
                  const value = contentDrafts[slide.id]?.[box.field] || ''
                  const style = styleDrafts[slide.id]?.[box.field] || defaultStyleForField(box.variant)
                  const fieldScale = getPreviewFieldScale(box.variant, value, box.multiline)
                  const hasBackgroundImage = Boolean(resolvedSlideImageUrl)
                  const chromeOpacityFloor = getPreviewChromeOpacityFloor(layoutFamily, box.variant)
                  const visualOpacityBoost = hasBackgroundImage
                    ? (layoutFamily === 'title' || layoutFamily === 'social' ? 0.6 : 0.42)
                    : 1

                  // Dynamic font sizing for titles
                  const baseFontSize = style.fontSize || 48
                  const dynamicFontSize = getDynamicFontSize(baseFontSize, value, box.variant, box.w)

                  // Dynamic box height for titles that wrap
                  const { height: dynamicHeight, overflow } = getDynamicBoxHeight(
                    box.h,
                    value,
                    dynamicFontSize,
                    box.w,
                    box.variant,
                  )

                  // Track overflow for pushing subsequent boxes down
                  const currentTop = box.y + cumulativeOverflow
                  if (box.variant === 'title' || box.variant === 'reference') {
                    cumulativeOverflow += overflow
                  }

                  const textStyle: React.CSSProperties = {
                    fontFamily: style.fontFamily,
                    fontSize: `${Math.max(9, dynamicFontSize * fieldScale)}px`,
                    color: style.color,
                    fontWeight: style.bold ? 700 : 400,
                    fontStyle: style.italic ? 'italic' : 'normal',
                    textDecoration: style.underline ? 'underline' : 'none',
                    textAlign: style.align,
                    lineHeight: box.multiline ? String(Math.max(1.04, lineSpacing * fieldScale)) : '1.2',
                    overflow: 'hidden',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    textShadow: box.variant === 'title' || box.variant === 'reference'
                      ? '0 2px 16px rgba(0,0,0,0.48)'
                      : '0 1px 10px rgba(0,0,0,0.28)',
                  }

                  return (
                    <div
                      key={box.field}
                      className="absolute flex"
                      style={{
                        left: `${box.x}%`,
                        top: `${currentTop}%`,
                        width: `${box.w}%`,
                        height: `${dynamicHeight}%`,
                        borderRadius: layoutFamily === 'scripture' || layoutFamily === 'reflection'
                          ? '16px'
                          : box.variant === 'title' || box.variant === 'reference'
                            ? '20px'
                            : '14px',
                        border:
                          box.variant === 'title' || box.variant === 'reference'
                            ? `1px solid ${deckPalette.glow}`
                            : layoutFamily === 'application' || layoutFamily === 'point'
                              ? `1px solid rgba(255,255,255,0.08)`
                              : '1px solid rgba(255,255,255,0.10)',
                        boxShadow: box.variant === 'title' || box.variant === 'reference'
                          ? `0 18px 44px ${deckPalette.glow}, inset 0 1px 0 rgba(255,255,255,0.12)`
                          : layoutFamily === 'appeal'
                            ? `0 14px 30px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.06)`
                            : `0 10px 24px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.06)`,
                        backgroundColor: style.backgroundColor
                          ? hexToRgba(
                              style.backgroundColor,
                              Math.max(chromeOpacityFloor, (style.backgroundOpacity ?? 1) * visualOpacityBoost),
                            )
                          : undefined,
                        backdropFilter: style.backgroundOpacity && style.backgroundOpacity > 0 ? 'blur(8px)' : undefined,
                      }}
                    >
                      {box.multiline ? (
                        <textarea
                          className="w-full resize-none bg-transparent border-0 text-xs"
                          rows={box.variant === 'body' ? 8 : 5}
                          value={value}
                          onFocus={() => setActiveField({ slideId: slide.id, field: box.field })}
                          onChange={(e) =>
                            setContentDrafts((prev) => ({
                              ...prev,
                              [slide.id]: {
                                ...(prev[slide.id] || {}),
                                [box.field]: e.target.value,
                              },
                            }))
                          }
                          onBlur={() => saveEditingSlide(slide.id)}
                          style={{
                            ...textStyle,
                            paddingLeft: `${Math.max(3, 10 * fieldScale)}px`,
                            paddingRight: `${Math.max(3, 10 * fieldScale)}px`,
                            paddingTop: `${Math.max(2, 7 * fieldScale)}px`,
                            paddingBottom: `${Math.max(2, 7 * fieldScale)}px`,
                          }}
                        />
                      ) : (
                        <input
                          className="w-full h-full bg-transparent border-0 text-xs"
                          value={value}
                          onFocus={() => setActiveField({ slideId: slide.id, field: box.field })}
                          onChange={(e) =>
                            setContentDrafts((prev) => ({
                              ...prev,
                              [slide.id]: {
                                ...(prev[slide.id] || {}),
                                [box.field]: e.target.value,
                              },
                            }))
                          }
                          onBlur={() => saveEditingSlide(slide.id)}
                          style={{
                            ...textStyle,
                            paddingLeft: `${Math.max(3, 10 * fieldScale)}px`,
                            paddingRight: `${Math.max(3, 10 * fieldScale)}px`,
                            paddingTop: `${Math.max(2, 7 * fieldScale)}px`,
                            paddingBottom: `${Math.max(2, 7 * fieldScale)}px`,
                          }}
                        />
                      )}
                    </div>
                  )
                })
                })()}
              </div>
              <div className="mt-3">
                <label className="block text-xs text-gray-400 mb-1">Speaker Notes</label>
                <textarea
                  className="w-full min-h-[60px] text-xs border border-white/10 rounded p-2 bg-black/40"
                  value={notesDrafts[slide.id] || ''}
                  onChange={(e) => setNotesDrafts((prev) => ({ ...prev, [slide.id]: e.target.value }))}
                  onBlur={() => saveEditingSlide(slide.id)}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
