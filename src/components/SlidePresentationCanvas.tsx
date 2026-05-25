'use client'

import type { ReactNode } from 'react'

// ─── Types ─────────────────────────────────────────────────

interface SlideFields {
  title?: string
  subtitle?: string
  body?: string
  reference?: string
  message?: string
  lines?: string[]
  bullets?: string[]
  content?: Record<string, unknown>
}

interface SlideData {
  id: string
  type?: string
  layoutKey?: string | null
  content?: SlideFields | null
  speakerNotes?: string | null
  imageUrl?: string | null
}

interface StylePreset {
  fontPack: string
  headingFont: string
  bodyFont: string
  accentFont: string
  bgGradient: string
  textColor: string
  accentColor: string
  overlayFrom: string
}

// ─── Style Presets ────────────────────────────────────────

const PRESETS: Record<string, StylePreset> = {
  warm_pastoral: {
    fontPack: 'warm_pastoral',
    headingFont: '"Playfair Display", Georgia, serif',
    bodyFont: '"Inter", system-ui, sans-serif',
    accentFont: '"Lora", Georgia, serif',
    bgGradient: 'linear-gradient(160deg, #1C1917 0%, #292524 30%, #44403C 70%, #1C1917 100%)',
    textColor: '#FEF3C7',
    accentColor: '#F59E0B',
    overlayFrom: 'rgba(28,25,23,0.55)',
  },
  modern_church: {
    fontPack: 'modern_church',
    headingFont: '"Montserrat", Arial, sans-serif',
    bodyFont: '"Inter", system-ui, sans-serif',
    accentFont: '"Inter", system-ui, sans-serif',
    bgGradient: 'linear-gradient(160deg, #0F172A 0%, #1E3A5F 40%, #1E40AF 80%, #0F172A 100%)',
    textColor: '#F8FAFC',
    accentColor: '#38BDF8',
    overlayFrom: 'rgba(15,23,42,0.50)',
  },
  hopeful_prophecy: {
    fontPack: 'hopeful_prophecy',
    headingFont: '"Merriweather", Georgia, serif',
    bodyFont: '"Source Sans 3", system-ui, sans-serif',
    accentFont: '"Merriweather", Georgia, serif',
    bgGradient: 'linear-gradient(160deg, #0C1929 0%, #0F2B4A 40%, #1A3A5C 80%, #0C1929 100%)',
    textColor: '#F8FAFC',
    accentColor: '#FCD34D',
    overlayFrom: 'rgba(12,25,41,0.50)',
  },
  scripture_elegant: {
    fontPack: 'scripture_elegant',
    headingFont: '"Cormorant Garamond", Georgia, serif',
    bodyFont: '"Lato", system-ui, sans-serif',
    accentFont: '"Libre Baskerville", Georgia, serif',
    bgGradient: 'linear-gradient(160deg, #1C1917 0%, #292524 30%, #3B3226 70%, #1C1917 100%)',
    textColor: '#FEF3C7',
    accentColor: '#D97706',
    overlayFrom: 'rgba(28,25,23,0.50)',
  },
  youth_contemporary: {
    fontPack: 'youth_contemporary',
    headingFont: '"Poppins", Arial, sans-serif',
    bodyFont: '"Inter", system-ui, sans-serif',
    accentFont: '"Inter", system-ui, sans-serif',
    bgGradient: 'linear-gradient(160deg, #0F0F1A 0%, #1A1030 40%, #312E81 80%, #0F0F1A 100%)',
    textColor: '#F8FAFC',
    accentColor: '#A78BFA',
    overlayFrom: 'rgba(15,15,26,0.50)',
  },
}

function resolvePreset(visualStyle?: string | null): StylePreset {
  const key = String(visualStyle || 'modern_church')
  if (key.includes('pastoral') || key.includes('spanish')) return PRESETS.warm_pastoral
  if (key.includes('prophecy')) return PRESETS.hopeful_prophecy
  if (key.includes('elegant') || key.includes('scripture') || key.includes('worship') || key.includes('bible')) return PRESETS.scripture_elegant
  if (key.includes('youth') || key.includes('modern')) return PRESETS.youth_contemporary
  return PRESETS.modern_church
}

// ─── Layout Renderers ─────────────────────────────────────

function CinematicTitle({ slide, preset, imageUrl }: { slide: SlideData; preset: StylePreset; imageUrl?: string | null }) {
  const f = slide.content || {}
  const title = String(f.title || '')
  const subtitle = String(f.subtitle || '')
  const reference = String(f.reference || '')

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {imageUrl && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${preset.overlayFrom} 0%, rgba(0,0,0,0.4) 100%)` }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${preset.accentColor}44, transparent)` }} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '6% 7%', position: 'relative', zIndex: 1 }}>
        {title && <h1 style={{ fontFamily: preset.headingFont, fontSize: 'clamp(40px, 5.6vw, 70px)', fontWeight: 700, color: preset.textColor, lineHeight: 1.1, margin: 0, marginBottom: subtitle ? '0.3em' : '0.5em', letterSpacing: '-0.01em' }}>{title}</h1>}
        {subtitle && <p style={{ fontFamily: preset.bodyFont, fontSize: 'clamp(18px, 2.2vw, 28px)', fontWeight: 300, color: `${preset.textColor}cc`, lineHeight: 1.3, margin: 0, marginBottom: reference ? '1.2em' : '0' }}>{subtitle}</p>}
        {reference && <p style={{ fontFamily: preset.accentFont, fontSize: 'clamp(16px, 1.8vw, 24px)', fontWeight: 400, color: preset.accentColor, letterSpacing: '0.05em', margin: 0 }}>{reference}</p>}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${preset.accentColor}33, transparent)` }} />
    </div>
  )
}

function ScriptureImmersive({ slide, preset, imageUrl }: { slide: SlideData; preset: StylePreset; imageUrl?: string | null }) {
  const f = slide.content || {}
  const lines = Array.isArray(f.lines) ? f.lines : f.body ? [f.body] : []
  const reference = String(f.reference || '')
  const text = lines.length ? lines.join(' ') : String(f.title || '')

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: preset.bgGradient }}>
      {imageUrl && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.35 }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${preset.accentColor}10 0%, transparent 70%)` }} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '7% 10%', position: 'relative', zIndex: 1 }}>
        <span style={{ fontFamily: preset.accentFont, fontSize: 'clamp(48px, 7vw, 96px)', color: `${preset.accentColor}22`, lineHeight: 0, marginBottom: '-0.15em', userSelect: 'none' }}>&ldquo;</span>
        <p style={{ fontFamily: preset.accentFont, fontSize: 'clamp(28px, 3.4vw, 44px)', fontWeight: 400, color: preset.textColor, lineHeight: 1.45, textAlign: 'center', maxWidth: '90%', margin: 0, fontStyle: 'italic' }}>{text}</p>
        {reference && <p style={{ fontFamily: preset.bodyFont, fontSize: 'clamp(16px, 1.8vw, 22px)', fontWeight: 600, color: preset.accentColor, marginTop: '1.2em', letterSpacing: '0.06em' }}>{reference}</p>}
      </div>
    </div>
  )
}

function BigIdeaStatement({ slide, preset, imageUrl }: { slide: SlideData; preset: StylePreset; imageUrl?: string | null }) {
  const f = slide.content || {}
  const title = String(f.title || f.body || '')

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: preset.bgGradient }}>
      {imageUrl && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.3 }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${preset.overlayFrom} 0%, rgba(0,0,0,0.3) 100%)` }} />
      <div style={{ position: 'absolute', left: '5%', top: '50%', right: '5%', transform: 'translateY(-50%)', zIndex: 1 }}>
        <div style={{ width: '48px', height: '3px', background: preset.accentColor, marginBottom: '0.8em', opacity: 0.8 }} />
        <p style={{ fontFamily: preset.headingFont, fontSize: 'clamp(36px, 4.8vw, 62px)', fontWeight: 700, color: preset.textColor, lineHeight: 1.15, margin: 0, letterSpacing: '-0.01em' }}>{title}</p>
        <div style={{ width: '48px', height: '3px', background: preset.accentColor, marginTop: '0.8em', opacity: 0.4 }} />
      </div>
    </div>
  )
}

function PointDeclaration({ slide, preset, imageUrl }: { slide: SlideData; preset: StylePreset; imageUrl?: string | null }) {
  const f = slide.content || {}
  const title = String(f.title || '')
  const body = String(f.body || '')
  const reference = String(f.reference || '')

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: preset.bgGradient }}>
      {imageUrl && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.3 }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${preset.overlayFrom} 0%, rgba(0,0,0,0.3) 100%)` }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: `${preset.accentColor}18` }} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '7% 9% 7% 10%', position: 'relative', zIndex: 1 }}>
        {title && <h2 style={{ fontFamily: preset.headingFont, fontSize: 'clamp(32px, 4.2vw, 54px)', fontWeight: 700, color: preset.textColor, lineHeight: 1.15, margin: 0, marginBottom: body ? '0.4em' : '0' }}>{title}</h2>}
        {body && <p style={{ fontFamily: preset.bodyFont, fontSize: 'clamp(22px, 2.6vw, 34px)', fontWeight: 300, color: `${preset.textColor}bb`, lineHeight: 1.35, margin: 0, maxWidth: '88%' }}>{body}</p>}
        {reference && <p style={{ fontFamily: preset.bodyFont, fontSize: 'clamp(14px, 1.6vw, 20px)', fontWeight: 600, color: preset.accentColor, marginTop: '1.5em', letterSpacing: '0.04em' }}>{reference}</p>}
      </div>
    </div>
  )
}

function ApplicationSteps({ slide, preset, imageUrl }: { slide: SlideData; preset: StylePreset; imageUrl?: string | null }) {
  const f = slide.content || {}
  const bullets = Array.isArray(f.bullets) ? f.bullets.filter(Boolean) : []
  const title = String(f.title || '')

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: preset.bgGradient }}>
      {imageUrl && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.25 }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${preset.overlayFrom} 0%, rgba(0,0,0,0.35) 100%)` }} />
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '6% 8%', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: '3%', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
          {bullets.slice(0, 3).map((bullet, i) => (
            <div key={i} style={{ flex: '1 1 28%', minWidth: '200px', background: `${preset.accentColor}0D`, borderRadius: '4px', padding: '3% 3%', borderLeft: `3px solid ${preset.accentColor}`, textAlign: 'center' }}>
              <p style={{ fontFamily: preset.bodyFont, fontSize: 'clamp(20px, 2.4vw, 30px)', fontWeight: 600, color: preset.textColor, lineHeight: 1.25, margin: 0 }}>{String(bullet).trim()}</p>
            </div>
          ))}
        </div>
      </div>
      {title && <p style={{ position: 'absolute', bottom: '8%', left: '8%', fontFamily: preset.bodyFont, fontSize: 'clamp(16px, 1.8vw, 22px)', fontWeight: 600, color: preset.accentColor, letterSpacing: '0.04em', margin: 0, zIndex: 1 }}>{title}</p>}
    </div>
  )
}

function ReflectionQuestion({ slide, preset, imageUrl }: { slide: SlideData; preset: StylePreset; imageUrl?: string | null }) {
  const f = slide.content || {}
  const title = String(f.title || f.body || f.message || '')

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: preset.bgGradient }}>
      {imageUrl && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.3 }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${preset.accentColor}08 0%, transparent 60%)` }} />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '10%', position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: preset.headingFont, fontSize: 'clamp(28px, 3.8vw, 50px)', fontWeight: 400, color: preset.textColor, lineHeight: 1.25, textAlign: 'center', maxWidth: '85%', margin: 0, fontStyle: 'italic' }}>{title}</p>
      </div>
    </div>
  )
}

function AppealInvitation({ slide, preset, imageUrl }: { slide: SlideData; preset: StylePreset; imageUrl?: string | null }) {
  const f = slide.content || {}
  const title = String(f.title || f.message || '')
  const body = String(f.body || '')

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {imageUrl && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${preset.overlayFrom} 0%, rgba(0,0,0,0.4) 100%)` }} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '8%', position: 'relative', zIndex: 1, textAlign: 'center' }}>
        {title && <h2 style={{ fontFamily: preset.headingFont, fontSize: 'clamp(32px, 4.4vw, 56px)', fontWeight: 700, color: preset.textColor, lineHeight: 1.15, margin: 0, marginBottom: body ? '0.5em' : '0' }}>{title}</h2>}
        {body && <p style={{ fontFamily: preset.bodyFont, fontSize: 'clamp(20px, 2.4vw, 30px)', fontWeight: 300, color: `${preset.textColor}cc`, lineHeight: 1.3, margin: 0 }}>{body}</p>}
      </div>
    </div>
  )
}

function ClosingBlessing({ slide, preset, imageUrl }: { slide: SlideData; preset: StylePreset; imageUrl?: string | null }) {
  const f = slide.content || {}
  const title = String(f.title || f.body || f.message || '')

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: preset.bgGradient }}>
      {imageUrl && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.35 }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center top, ${preset.accentColor}0C 0%, transparent 65%)` }} />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '10%', position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: preset.accentFont, fontSize: 'clamp(24px, 3.2vw, 42px)', fontWeight: 400, color: preset.textColor, lineHeight: 1.3, textAlign: 'center', maxWidth: '85%', margin: 0, fontStyle: 'italic' }}>{title}</p>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${preset.accentColor}22, transparent)` }} />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────

const LAYOUT_RENDERERS: Record<string, (props: { slide: SlideData; preset: StylePreset; imageUrl?: string | null }) => ReactNode> = {
  cinematic_title: CinematicTitle,
  title_centered_v1: CinematicTitle,
  scripture_focus: ScriptureImmersive,
  scripture_centered_v1: ScriptureImmersive,
  big_idea_center: BigIdeaStatement,
  point_hero: PointDeclaration,
  point_with_support: PointDeclaration,
  point_statement: PointDeclaration,
  support_verse: PointDeclaration,
  split_support: PointDeclaration,
  application_steps: ApplicationSteps,
  application_bullets_v1: ApplicationSteps,
  reflection_question: ReflectionQuestion,
  appeal_minimal: AppealInvitation,
  invitation_centered_v1: AppealInvitation,
  closing_blessing: ClosingBlessing,
}

function resolveLayoutRenderer(layoutKey?: string | null, slideType?: string) {
  // Try exact match first
  if (layoutKey && LAYOUT_RENDERERS[layoutKey]) return LAYOUT_RENDERERS[layoutKey]
  // Map by slide type
  const typeMap: Record<string, string> = {
    title: 'cinematic_title',
    scripture: 'scripture_focus',
    big_idea: 'big_idea_center',
    point: 'point_hero',
    application: 'application_steps',
    reflection: 'reflection_question',
    appeal: 'appeal_minimal',
    invitation: 'appeal_minimal',
    closing: 'closing_blessing',
    story_moment: 'point_hero',
    sermon_point: 'point_hero',
    supporting_verse: 'point_hero',
  }
  const fallbackKey = typeMap[String(slideType || '')]
  if (fallbackKey && LAYOUT_RENDERERS[fallbackKey]) return LAYOUT_RENDERERS[fallbackKey]
  return PointDeclaration
}

interface Props {
  slide: SlideData
  visualStyle?: string | null
  className?: string
}

export default function SlidePresentationCanvas({ slide, visualStyle, className = '' }: Props) {
  const preset = resolvePreset(visualStyle)
  const Renderer = resolveLayoutRenderer(slide.layoutKey, slide.type)

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        overflow: 'hidden',
        background: preset.bgGradient,
      }}
    >
      <Renderer slide={slide} preset={preset} imageUrl={slide.imageUrl} />
    </div>
  )
}

export { resolvePreset, PRESETS }
export type { SlideData, StylePreset }
