'use client'

import { useEffect, useMemo, useState } from 'react'
import { slidesApi } from '@/lib/slides-api'

const SLIDES_BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_SLIDES_API_URL || 'http://localhost:3001/api/v1').replace(
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

type LocalBackgroundPreset = 'cyberpunk' | 'modern' | 'aurora' | 'minimal'

const LOCAL_BACKGROUND_PRESET_OPTIONS: Array<{ value: LocalBackgroundPreset; label: string }> = [
  { value: 'cyberpunk', label: 'Cyberpunk Neon' },
  { value: 'modern', label: 'Modern Geometric' },
  { value: 'aurora', label: 'Aurora Glow' },
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
    layoutKey: 'point_bullets_v1',
    boxes: [
      { field: 'title', x: 8, y: 4, w: 84, h: 24, variant: 'title' },
      { field: 'bullets', x: 10, y: 32, w: 80, h: 52, variant: 'body', multiline: true },
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
]

const getLayoutForTemplate = (layoutKey?: string | null) =>
  slideLayouts.find((layout) => layout.layoutKey === layoutKey)

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
  const [globalImagePreset, setGlobalImagePreset] = useState<LocalBackgroundPreset>('cyberpunk')
  const [generatingAllBackgrounds, setGeneratingAllBackgrounds] = useState(false)
  const previewScale = columns === 1 ? 1 : columns === 2 ? 0.62 : 0.48

  const fontOptions = useMemo(
    () => ['Montserrat', 'Inter', 'Playfair Display', 'Source Sans Pro', 'Lora', 'Merriweather', 'Poppins', 'Roboto'],
    []
  )

  const fontSizeOptions = useMemo(() => [18, 22, 26, 32, 36, 42, 48, 54, 64, 72, 84], [])

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
          backgroundOpacity: 0.55,
        }
      case 'subtitle':
        return {
          fontFamily: bodyFont,
          fontSize: 28,
          color: '#E5E5E5',
          align: 'center',
          verticalAlign: 'middle',
          backgroundColor: '#000000',
          backgroundOpacity: 0.45,
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
          backgroundOpacity: 0.55,
        }
      case 'message':
        return {
          fontFamily: bodyFont,
          fontSize: 24,
          color: '#FFFFFF',
          align: 'center',
          verticalAlign: 'middle',
          backgroundColor: '#000000',
          backgroundOpacity: 0.6,
        }
      default:
        return {
          fontFamily: bodyFont,
          fontSize: 22,
          color: '#FFFFFF',
          align: 'left',
          verticalAlign: 'top',
          backgroundColor: '#000000',
          backgroundOpacity: 0.5,
        }
    }
  }

  const normalizeFieldStyle = (variant: SlideFieldBox['variant'], style?: FieldStyle): FieldStyle => {
    const base = defaultStyleForField(variant)
    const candidate = { ...base, ...(style || {}) }
    // Don't clamp font sizes - let defaults apply as-is
    return {
      ...candidate,
      backgroundOpacity: Math.max(0.4, Math.min(1, Number(candidate.backgroundOpacity ?? base.backgroundOpacity ?? 0.55))),
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
          const fieldKeys = layout?.boxes?.map((box) => box.field) || Object.keys(slide.content || {})
          const resolvedSlideImageUrl = imagePreviews[slide.id] || resolveSlidesAssetUrl(slide.imageUrl)

          return (
            <div key={slide.id} className="border border-white/10 rounded-xl p-4 bg-black/30 hover:bg-black/40">
              <div className="mb-2">
                <p className="text-sm font-medium">Slide {idx + 1}</p>
                <p className="text-xs text-gray-500">{slide.type}</p>
              </div>
              <div
                className="relative w-full rounded-md border border-white/10 overflow-hidden"
                style={{
                  aspectRatio: '16 / 9',
                  background: resolvedSlideImageUrl
                    ? undefined
                    : `linear-gradient(140deg, ${hexToRgba(deck?.theme?.primaryColor || '#1D4ED8', 0.14)} 0%, ${hexToRgba(deck?.theme?.secondaryColor || '#0f172a', 0.18)} 55%, rgba(248,250,252,0.96) 100%)`,
                }}
              >
                {resolvedSlideImageUrl && (
                  <>
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${resolvedSlideImageUrl})` }}
                    />
                    <div className="absolute inset-0 bg-slate-900/20" />
                  </>
                )}
                {(() => {
                // Calculate cumulative overflow from title boxes to push content down
                let cumulativeOverflow = 0
                return layout?.boxes?.map((box, boxIndex) => {
                  const value = contentDrafts[slide.id]?.[box.field] || ''
                  const style = styleDrafts[slide.id]?.[box.field] || defaultStyleForField(box.variant)
                  const fieldScale = getPreviewFieldScale(box.variant, value, box.multiline)

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
                  }

                  return (
                    <div
                      key={box.field}
                      className="absolute flex rounded-lg shadow-lg"
                      style={{
                        left: `${box.x}%`,
                        top: `${currentTop}%`,
                        width: `${box.w}%`,
                        height: `${dynamicHeight}%`,
                        backgroundColor: style.backgroundColor
                          ? hexToRgba(style.backgroundColor, style.backgroundOpacity ?? 1)
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
