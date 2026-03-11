export interface ImagePromptFields {
  subject: string
  environment: string
  action: string
  symbolism: string
  camera: string
  lighting: string
  style: string
  colorPalette: string
  quality: string
  negativePrompt: string
}

export interface MediaPromptEntry {
  key: 'slides' | 'image' | 'audio' | 'music' | 'video' | 'social'
  type: string
  intent: string
  prompt: string
  fields?: Record<string, string>
}

export function composeImagePrompt(fields: ImagePromptFields, isSpanish: boolean): string {
  if (isSpanish) {
    return [
      'PROMPT DE IMAGEN IA',
      '',
      `Sujeto: ${fields.subject}`,
      `Entorno: ${fields.environment}`,
      `Acción: ${fields.action}`,
      `Simbolismo: ${fields.symbolism}`,
      `Cámara: ${fields.camera}`,
      `Iluminación: ${fields.lighting}`,
      `Estilo: ${fields.style}`,
      `Paleta de color: ${fields.colorPalette}`,
      `Calidad: ${fields.quality}`,
      `Prompt negativo: ${fields.negativePrompt}`,
    ].join('\n')
  }

  return [
    'AI IMAGE PROMPT',
    '',
    `Subject: ${fields.subject}`,
    `Environment: ${fields.environment}`,
    `Action: ${fields.action}`,
    `Symbolism: ${fields.symbolism}`,
    `Camera: ${fields.camera}`,
    `Lighting: ${fields.lighting}`,
    `Style: ${fields.style}`,
    `Color palette: ${fields.colorPalette}`,
    `Quality: ${fields.quality}`,
    `Negative prompt: ${fields.negativePrompt}`,
  ].join('\n')
}

interface BuildParams {
  isSpanish: boolean
  title: string
  passage: string
  theme: string
  quoteSeed: string
  source?: {
    image?: string
    audio?: string
    music?: string
    video?: string
    social?: string
    slides?: string
  }
}

export function buildStructuredMediaPrompts(params: BuildParams): MediaPromptEntry[] {
  const { isSpanish, title, passage, theme, quoteSeed, source } = params

  const imageFields: ImagePromptFields = isSpanish
    ? {
        subject:
          `Una persona pasando de oscuridad a luz, representando transformación espiritual para "${title}".`,
        environment:
          'Interior de iglesia/catedral con vitrales, pasillo central y altar iluminado.',
        action: 'Cadenas cayendo de las manos, postura de rendición y esperanza.',
        symbolism: `Oscuridad (pecado) -> luz (gracia), basado en ${passage}.`,
        camera: 'Plano general angular, perspectiva baja, sujeto centrado.',
        lighting: 'Luz volumétrica dramática, rayos cálidos entrando por vitrales.',
        style: 'Realismo cinematográfico, composición pastoral reverente.',
        colorPalette: 'Azules profundos pasando a dorado cálido y blanco.',
        quality: '8k, alto detalle, profundidad de campo, composición limpia, sin texto.',
        negativePrompt: 'texto, marcas de agua, manos deformes, rostro duplicado, ruido, baja resolución',
      }
    : {
        subject:
          `A person transitioning from darkness into radiant light, reflecting spiritual transformation for "${title}".`,
        environment:
          'Church/cathedral interior with stained glass, center aisle, illuminated altar.',
        action: 'Chains falling from hands, posture of surrender and hope.',
        symbolism: `Darkness (sin) to light (grace), grounded in ${passage}.`,
        camera: 'Wide-angle shot, low perspective, centered subject.',
        lighting: 'Dramatic volumetric light, warm rays through stained glass.',
        style: 'Cinematic realism, reverent pastoral composition.',
        colorPalette: 'Deep blues transitioning to warm gold and white.',
        quality: '8k, ultra-detailed, depth of field, clean composition, no text.',
        negativePrompt: 'text, watermark, malformed hands, duplicate face, noise, low resolution',
      }

  const sourceImage = source?.image ? (isSpanish ? `Dirección de estudio: ${source.image}` : `Study direction: ${source.image}`) : ''
  const sourceAudio = source?.audio ? (isSpanish ? `Dirección de estudio: ${source.audio}` : `Study direction: ${source.audio}`) : ''
  const sourceMusic = source?.music ? (isSpanish ? `Dirección de estudio: ${source.music}` : `Study direction: ${source.music}`) : ''
  const sourceVideo = source?.video ? (isSpanish ? `Dirección de estudio: ${source.video}` : `Study direction: ${source.video}`) : ''
  const sourceSocial = source?.social ? (isSpanish ? `Dirección de estudio: ${source.social}` : `Study direction: ${source.social}`) : ''
  const sourceSlides = source?.slides ? (isSpanish ? `Dirección de estudio: ${source.slides}` : `Study direction: ${source.slides}`) : ''

  return isSpanish
    ? [
        {
          key: 'slides',
          type: 'Presentación',
          intent: 'Estructura de presentación',
          prompt: [
            `Objetivo: presentación del sermón "${title}" sobre ${passage}.`,
            `Enfoque teológico: ${theme}.`,
            'Estructura sugerida:',
            '- Título',
            '- Lectura bíblica',
            '- Transición por movimiento',
            '- Punto + soporte + aplicación (por cada movimiento)',
            '- Preguntas de reflexión',
            '- Invitación / oración final',
            sourceSlides,
          ].filter(Boolean).join('\n'),
        },
        {
          key: 'image',
          type: 'Visual Principal',
          intent: 'Prompt visual principal',
          prompt: [composeImagePrompt(imageFields, true), sourceImage].filter(Boolean).join('\n\n'),
          fields: imageFields as unknown as Record<string, string>,
        },
        {
          key: 'audio',
          type: 'Audio / Voz',
          intent: 'Prompt de narración o pódcast',
          prompt: [
            `Narración pastoral para "${title}" (${passage}).`,
            'Voz: cálida, clara, reverente.',
            'Ritmo: pausado, dicción congregacional, silencios breves entre secciones.',
            'Énfasis: gracia, transformación, llamado a respuesta.',
            sourceAudio,
          ].filter(Boolean).join('\n'),
        },
        {
          key: 'music',
          type: 'Canto Tema',
          intent: 'Canción tema con letra',
          prompt: [
            `Título: "${title}"`,
            'Género: adoración contemporánea',
            'Tempo: 72 bpm',
            'Tonalidad: Sol mayor',
            'Ambiente: reverente, esperanzador',
            'Estructura: verso / coro / puente',
            'Instrumentación: piano, pads ambientales, percusión suave, coro',
            `Tema: ${theme}`,
            'Objetivo: canto congregacional memorable y fácil de cantar',
            sourceMusic,
          ].filter(Boolean).join('\n'),
        },
        {
          key: 'video',
          type: 'Video',
          intent: 'Secuencia de video por escenas',
          prompt: [
            `Video para "${title}" (${passage}).`,
            'Escena 1: interior de iglesia en penumbra, figura en oración.',
            'Escena 2: rayos de luz atraviesan vitrales.',
            'Escena 3: la figura se levanta, cadenas caen, atmósfera de gracia.',
            'Escena 4: plano amplio del templo lleno de luz y comunidad.',
            'Estilo: cinematográfico, movimiento lento, iluminación dramática.',
            sourceVideo,
          ].filter(Boolean).join('\n'),
        },
        {
          key: 'social',
          type: 'Social / Promoción',
          intent: 'Prompt para pieza promocional',
          prompt: [
            `Pieza social para "${title}" (${passage}).`,
            `Cita central: "${String(quoteSeed).slice(0, 220)}"`,
            `Tema: ${theme}`,
            'Formato: gráfico 4:5, tipografía legible, jerarquía clara, CTA al final.',
            sourceSocial,
          ].filter(Boolean).join('\n'),
        },
      ]
    : [
        {
          key: 'slides',
          type: 'Slide Deck',
          intent: 'Presentation structure',
          prompt: [
            `Goal: sermon deck for "${title}" on ${passage}.`,
            `Theological focus: ${theme}.`,
            'Suggested structure:',
            '- Title',
            '- Scripture reading',
            '- Movement transition slides',
            '- Point + support + application (per movement)',
            '- Reflection questions',
            '- Closing invitation/prayer',
            sourceSlides,
          ].filter(Boolean).join('\n'),
        },
        {
          key: 'image',
          type: 'Key Visual',
          intent: 'Hero image prompt',
          prompt: [composeImagePrompt(imageFields, false), sourceImage].filter(Boolean).join('\n\n'),
          fields: imageFields as unknown as Record<string, string>,
        },
        {
          key: 'audio',
          type: 'Audio / Voiceover',
          intent: 'Narration or podcast prompt',
          prompt: [
            `Pastoral narration for "${title}" (${passage}).`,
            'Voice: warm, clear, reverent.',
            'Pacing: measured delivery, short pauses between sections.',
            'Emphasis: grace, transformation, response invitation.',
            sourceAudio,
          ].filter(Boolean).join('\n'),
        },
        {
          key: 'music',
          type: 'Theme Song',
          intent: 'Theme song with lyrics',
          prompt: [
            `Title: "${title}"`,
            'Genre: contemporary worship',
            'Tempo: 72 bpm',
            'Key: G major',
            'Mood: hopeful, reverent',
            'Structure: verse / chorus / bridge',
            'Instrumentation: piano, ambient pads, soft drums, choir',
            `Theme: ${theme}`,
            'Goal: congregationally singable and memorable',
            sourceMusic,
          ].filter(Boolean).join('\n'),
        },
        {
          key: 'video',
          type: 'Video',
          intent: 'Scene-by-scene video direction',
          prompt: [
            `Video for "${title}" (${passage}).`,
            'Scene 1: dim church interior, figure kneeling in prayer.',
            'Scene 2: sunlight breaking through stained glass.',
            'Scene 3: figure rises, chains fall, grace imagery.',
            'Scene 4: wide shot, church filled with light and community.',
            'Style: cinematic, slow motion, dramatic lighting.',
            sourceVideo,
          ].filter(Boolean).join('\n'),
        },
        {
          key: 'social',
          type: 'Social / Promo',
          intent: 'Quote graphic or promo asset',
          prompt: [
            `Social promo for "${title}" (${passage}).`,
            `Main quote: "${String(quoteSeed).slice(0, 220)}"`,
            `Theme: ${theme}`,
            'Format: 4:5 quote graphic, strong hierarchy, clear CTA.',
            sourceSocial,
          ].filter(Boolean).join('\n'),
        },
      ]
}
