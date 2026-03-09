'use client'

import { useEffect, useMemo, useState } from 'react'
import { slidesApi } from '@/lib/slides-api'

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

const slideLayouts: SlideLayout[] = [
  {
    layoutKey: 'title_centered_v1',
    boxes: [
      { field: 'title', x: 10, y: 25, w: 80, h: 18, variant: 'title' },
      { field: 'subtitle', x: 15, y: 48, w: 70, h: 12, variant: 'subtitle' },
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
      { field: 'reference', x: 12, y: 12, w: 76, h: 10, variant: 'reference' },
      { field: 'lines', x: 12, y: 26, w: 76, h: 56, variant: 'body', multiline: true },
    ],
  },
  {
    layoutKey: 'application_bullets_v1',
    boxes: [
      { field: 'title', x: 8, y: 4, w: 84, h: 22, variant: 'title' },
      { field: 'bullets', x: 10, y: 30, w: 80, h: 52, variant: 'body', multiline: true },
    ],
  },
  {
    layoutKey: 'invitation_centered_v1',
    boxes: [
      { field: 'title', x: 10, y: 25, w: 80, h: 14, variant: 'title' },
      { field: 'message', x: 14, y: 44, w: 72, h: 32, variant: 'message', multiline: true },
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
  const [lineSpacing, setLineSpacing] = useState(1.45)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [columns, setColumns] = useState<1 | 2 | 3>(1)

  const fontOptions = useMemo(
    () => ['Playfair Display', 'Source Sans Pro', 'Lora', 'Merriweather', 'Montserrat', 'Poppins'],
    []
  )

  const fontSizeOptions = useMemo(() => [18, 22, 26, 32, 36, 42, 48, 54], [])

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
    const headingFont = deck?.theme?.fontHeading || 'Playfair Display'
    const bodyFont = deck?.theme?.fontBody || 'Source Sans Pro'
    switch (variant) {
      case 'title':
        return {
          fontFamily: headingFont,
          fontSize: 54,
          color: deck?.theme?.primaryColor || '#1D4ED8',
          bold: true,
          align: 'center',
          verticalAlign: 'middle',
          backgroundColor: '#FFFFFF',
          backgroundOpacity: 1,
        }
      case 'subtitle':
        return {
          fontFamily: bodyFont,
          fontSize: 28,
          color: '#666666',
          align: 'center',
          verticalAlign: 'middle',
          backgroundColor: '#FFFFFF',
          backgroundOpacity: 1,
        }
      case 'reference':
        return {
          fontFamily: headingFont,
          fontSize: 24,
          color: deck?.theme?.primaryColor || '#1D4ED8',
          bold: true,
          align: 'center',
          verticalAlign: 'top',
          backgroundColor: '#FFFFFF',
          backgroundOpacity: 1,
        }
      default:
        return {
          fontFamily: bodyFont,
          fontSize: 28,
          color: '#333333',
          align: 'left',
          verticalAlign: 'top',
          backgroundColor: '#FFFFFF',
          backgroundOpacity: 1,
        }
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

  useEffect(() => {
    loadDeck()
    loadSlides()
  }, [deckId])

  useEffect(() => {
    const nextContentDrafts: Record<string, Record<string, string>> = {}
    const nextNotesDrafts: Record<string, string> = {}
    const nextStyleDrafts: Record<string, Record<string, FieldStyle>> = {}
    slides.forEach((slide) => {
      const layout = getLayoutForTemplate(slide.layoutKey)
      const fields = layout?.boxes?.map((box) => box.field) || Object.keys(slide.content || {})

      nextContentDrafts[slide.id] = {}
      nextStyleDrafts[slide.id] = (slide.content?.__styles as Record<string, FieldStyle>) || {}
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
        if (!nextStyleDrafts[slide.id][fieldKey]) {
          nextStyleDrafts[slide.id][fieldKey] = defaultStyleForField(variant)
        }
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

          return (
            <div key={slide.id} className="border border-white/10 rounded-xl p-4 bg-black/30 hover:bg-black/40">
              <div className="mb-2">
                <p className="text-sm font-medium">Slide {idx + 1}</p>
                <p className="text-xs text-gray-500">{slide.type}</p>
              </div>
              <div
                className="relative w-full rounded-md border border-white/10 bg-slate-50"
                style={{ aspectRatio: '16 / 9' }}
              >
                {layout?.boxes?.map((box) => {
                  const value = contentDrafts[slide.id]?.[box.field] || ''
                  const style = styleDrafts[slide.id]?.[box.field] || defaultStyleForField(box.variant)
                  const textStyle: React.CSSProperties = {
                    fontFamily: style.fontFamily,
                    fontSize: style.fontSize ? `${style.fontSize}px` : undefined,
                    color: style.color,
                    fontWeight: style.bold ? 700 : 400,
                    fontStyle: style.italic ? 'italic' : 'normal',
                    textDecoration: style.underline ? 'underline' : 'none',
                    textAlign: style.align,
                    lineHeight: box.multiline ? String(lineSpacing) : undefined,
                  }

                  return (
                    <div
                      key={box.field}
                      className="absolute flex rounded border border-slate-200"
                      style={{
                        left: `${box.x}%`,
                        top: `${box.y}%`,
                        width: `${box.w}%`,
                        height: `${box.h}%`,
                        backgroundColor: style.backgroundColor
                          ? hexToRgba(style.backgroundColor, style.backgroundOpacity ?? 1)
                          : undefined,
                      }}
                    >
                      {box.multiline ? (
                        <textarea
                          className="w-full resize-none bg-transparent border-0 px-2 py-1 text-xs"
                          style={textStyle}
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
                        />
                      ) : (
                        <input
                          className="w-full h-full bg-transparent border-0 px-2 py-1 text-xs"
                          style={textStyle}
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
                        />
                      )}
                    </div>
                  )
                })}
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
