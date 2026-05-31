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

export const MAX_NARRATION_CHARACTERS = 1500

function cleanHeadline(text: string, maxWords = 8): string {
  const words = String(text || '')
    .replace(/[“”"]/g, '')
    .replace(/[|/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
  return words.slice(0, maxWords).join(' ')
}

export function buildSocialHeadline(input: {
  title?: string
  passage?: string
  theme?: string
  language?: string
  planning?: {
    serviceType?: string
    ministryMode?: string
    appealStyle?: string
    bilingualMode?: string
    sermonDate?: string
  }
}): string {
  const isSpanish = String(input.language || '').toLowerCase().startsWith('es')
  const source = `${input.title || ''} ${input.passage || ''} ${input.theme || ''}`.toLowerCase()

  if (/john\s*3:16|juan\s*3:16/.test(source) || /love|grace|salvat|salvaci[oó]n|eternal life|vida eterna/.test(source)) {
    return isSpanish ? 'El amor de Dios da vida eterna' : 'God’s love gives eternal life'
  }

  if (/revelation\s*14:6-12|apocalipsis\s*14:6-12|three angels|tres a[nñ]geles|everlasting gospel|evangelio eterno/.test(source)) {
    return isSpanish ? 'El evangelio eterno sigue llamando' : 'The everlasting gospel still calls'
  }

  if (/daniel\s*7|revelation\s*12|revelation\s*18|matthew\s*24|exodus\s*20/.test(source)) {
    return isSpanish ? 'Dios llama a la fidelidad' : 'God calls His people to faithfulness'
  }

  const fallback = cleanHeadline(input.theme || input.title || input.passage || (isSpanish ? 'Mensaje del sermón' : 'Sermon message'), 7)
  return fallback || (isSpanish ? 'Mensaje del sermón' : 'Sermon message')
}

export function buildSocialCaption(input: {
  title?: string
  passage?: string
  theme?: string
  language?: string
  planning?: {
    serviceType?: string
    ministryMode?: string
    appealStyle?: string
    bilingualMode?: string
    sermonDate?: string
  }
}): string {
  const isSpanish = String(input.language || '').toLowerCase().startsWith('es')
  const planning = input.planning || {}
  const headline = buildSocialHeadline(input)
  const serviceLine = planning.serviceType
    ? isSpanish
      ? {
          sabbath_worship: 'Únase a nosotros este sábado.',
          sabbath_school: 'Únase al estudio bíblico.',
          evangelistic_meeting: 'Traiga a alguien con usted.',
          bible_study: 'Venga a estudiar la Palabra.',
          devotional: 'Reciba ánimo para el día.',
          youth: 'Jóvenes, únanse a la conversación.',
          prayer_meeting: 'Oremos juntos.',
          funeral_memorial: 'Oramos con ustedes en este momento.',
          wedding_family: 'Celebremos juntos.',
        }[planning.serviceType] || 'Únase a nosotros.'
      : {
          sabbath_worship: 'Join us this Sabbath.',
          sabbath_school: 'Join us for Bible study.',
          evangelistic_meeting: 'Bring someone with you.',
          bible_study: 'Come and study the Word.',
          devotional: 'Receive encouragement for the day.',
          youth: 'Young people, join the conversation.',
          prayer_meeting: 'Let us pray together.',
          funeral_memorial: 'We are praying with you.',
          wedding_family: 'Come celebrate with us.',
        }[planning.serviceType] || 'Join us in the Word.'
    : ''
  const appealLine = planning.appealStyle
    ? isSpanish
      ? {
          invitation: 'Responda con fe.',
          commitment: 'Tome una decisión firme.',
          reflection: 'Reflexione con oración.',
          doctrinal_clarity: 'Aférrate a la verdad.',
          pastoral_encouragement: 'Reciba ánimo y esperanza.',
          repentance_return: 'Vuelva al Padre.',
          mission_service: 'Sirva con propósito.',
        }[planning.appealStyle] || 'Responda con fe.'
      : {
          invitation: 'Respond in faith.',
          commitment: 'Make a firm decision.',
          reflection: 'Reflect prayerfully.',
          doctrinal_clarity: 'Stand on the truth.',
          pastoral_encouragement: 'Receive hope and encouragement.',
          repentance_return: 'Return to the Father.',
          mission_service: 'Serve with purpose.',
        }[planning.appealStyle] || 'Respond in faith.'
    : ''
  return `${headline}. ${serviceLine} ${appealLine}`.replace(/\s+/g, ' ').trim()
}

export function buildFallbackImagePrompt(input: {
  theme?: string
  scripture: string
  title: string
}): string {
  const theme = input.theme || 'faith'
  return `Create a cinematic worship image representing ${theme}. Biblical context: ${input.scripture}. Sermon title: "${input.title}". Church setting, inspirational, no text on image.`
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
  planning?: {
    title?: string
    seriesTitle?: string
    serviceType?: string
    ministryMode?: string
    appealStyle?: string
    bilingualMode?: string
    sermonDate?: string
    targetLengthMinutes?: number
    guardrailMode?: string
    guardrailActive?: boolean
  }
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
  const { isSpanish, title, passage, theme, quoteSeed, planning, source } = params
  const planningBlock = planning
    ? [
        planning.serviceType ? `Service type: ${planning.serviceType}` : '',
        planning.ministryMode ? `Ministry mode: ${planning.ministryMode}` : '',
        planning.appealStyle ? `Appeal style: ${planning.appealStyle}` : '',
        planning.bilingualMode ? `Bilingual support: ${planning.bilingualMode}` : '',
        planning.sermonDate ? `Sermon date: ${planning.sermonDate}` : '',
        planning.targetLengthMinutes ? `Target length: ${planning.targetLengthMinutes} minutes` : '',
        planning.guardrailMode ? `Guardrail mode: ${planning.guardrailMode}` : '',
        planning.guardrailActive ? 'Guardrail active: yes' : '',
      ].filter(Boolean).join('\n')
    : ''
  const socialHeadline = buildSocialHeadline({ title, passage, theme, language: isSpanish ? 'es' : 'en', planning })
  const socialCaption = buildSocialCaption({ title, passage, theme, language: isSpanish ? 'es' : 'en', planning })

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
            planningBlock,
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
            `Pieza social para "${socialHeadline}" (${passage}).`,
            `Cita central: "${String(quoteSeed).slice(0, 220)}"`,
            `Tema: ${theme}`,
            `Caption sugerido: ${socialCaption}`,
            planningBlock,
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
            planningBlock,
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
            `Social promo for "${socialHeadline}" (${passage}).`,
            `Main quote: "${String(quoteSeed).slice(0, 220)}"`,
            `Theme: ${theme}`,
            `Suggested caption: ${socialCaption}`,
            planningBlock,
            'Format: 4:5 quote graphic, strong hierarchy, clear CTA.',
            sourceSocial,
          ].filter(Boolean).join('\n'),
        },
      ]
}

export function sanitizeNarrationText(value: string): string {
  return String(value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function splitSentences(value: string): string[] {
  return sanitizeNarrationText(value)
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function clampNarrationText(value: string, maxChars = MAX_NARRATION_CHARACTERS): string {
  const normalizedMax = Number.isFinite(maxChars) ? Math.max(200, Math.floor(maxChars)) : MAX_NARRATION_CHARACTERS
  const sanitized = sanitizeNarrationText(value)
  if (!sanitized) return ''
  if (sanitized.length <= normalizedMax) return sanitized

  const sentences = splitSentences(sanitized)
  if (!sentences.length) {
    return sanitized.slice(0, normalizedMax).trim()
  }

  const chunks: string[] = []
  let used = 0
  for (const sentence of sentences) {
    const next = sentence.length + (chunks.length ? 1 : 0)
    if (used + next > normalizedMax) break
    chunks.push(sentence)
    used += next
  }

  if (chunks.length) {
    return chunks.join(' ').trim()
  }

  return sanitized.slice(0, normalizedMax).trim()
}
