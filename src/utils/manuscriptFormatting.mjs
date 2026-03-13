const SUPPORTED_HTML_TAG_PATTERN = /<\/?(h2|h3|h4|p|ul|ol|li|blockquote|strong|em|br)\b/i

function stripTransportNoise(value) {
  return String(value || '')
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .replace(/<\|[^|>]+?\|>/g, ' ')
    .replace(/^\s*(assistant|final|response)\s*[:\-]\s*/i, '')
    .replace(/\r\n/g, '\n')
    .trim()
}

function decodeSerializedText(value) {
  return String(value || '')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\\//g, '/')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .trim()
}

function extractQuotedJsonStringField(value, key) {
  const source = stripTransportNoise(value)
  if (!source) return null

  const keyPattern = new RegExp(`"${key}"\\s*:\\s*"`, 'i')
  const match = keyPattern.exec(source)
  if (!match) return null

  let index = match.index + match[0].length
  let escaped = false
  let output = ''

  while (index < source.length) {
    const char = source[index]

    if (escaped) {
      output += `\\${char}`
      escaped = false
      index += 1
      continue
    }

    if (char === '\\') {
      escaped = true
      index += 1
      continue
    }

    if (char === '"') {
      return decodeSerializedText(output)
    }

    output += char
    index += 1
  }

  return decodeSerializedText(output)
}

function extractLeadingHtmlFragment(value) {
  const source = decodeSerializedText(stripTransportNoise(value))
  if (!source) return null

  const tagMatch = source.match(/<(h2|h3|h4|p|ul|ol|li|blockquote|strong|em|br)\b/i)
  if (!tagMatch || typeof tagMatch.index !== 'number') return null

  let fragment = source.slice(tagMatch.index).trim()
  fragment = fragment.replace(/(?:["']?\s*,\s*["']cues["']\s*:)[\s\S]*$/i, '').trim()
  fragment = fragment.replace(/["'}\]]+\s*$/, '').trim()

  return SUPPORTED_HTML_TAG_PATTERN.test(fragment) ? fragment : null
}

function extractMalformedManuscriptPayload(value) {
  const source = stripTransportNoise(value)
  if (!source) return null

  const extractedText = extractQuotedJsonStringField(source, 'text')
  if (extractedText) {
    const normalized = extractedText.trim()
    if (normalized.length >= 24 || SUPPORTED_HTML_TAG_PATTERN.test(normalized)) {
      return normalized
    }
  }

  const htmlFragment = extractLeadingHtmlFragment(source)
  if (htmlFragment) return htmlFragment

  const plainText = decodeSerializedText(source)
    .replace(/^\s*\{\s*"text"\s*:\s*/i, '')
    .replace(/^"\s*/, '')
    .replace(/"\s*,\s*"cues"[\s\S]*$/i, '')
    .replace(/"\s*\}\s*$/i, '')
    .replace(/^\s*text\s*:\s*/i, '')
    .trim()

  if (!plainText || /^[{\[]/.test(plainText)) return null
  return plainText
}

export function stripModelArtifacts(value) {
  const raw = stripTransportNoise(value)
  if (!raw) return ''

  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.text === 'string') {
      return decodeSerializedText(parsed.text)
    }
  } catch {
    // Recover malformed wrappers below.
  }

  const recovered = extractMalformedManuscriptPayload(raw)
  if (recovered) return recovered

  return decodeSerializedText(raw)
}

export function sanitizeManuscriptHtml(html) {
  return stripModelArtifacts(html)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\s(href|src)=("|\')\s*javascript:[\s\S]*?\2/gi, '')
    .trim()
}

export function ensureManuscriptRichHtml(value, markdownLikeToHtml) {
  const sanitized = sanitizeManuscriptHtml(value)
  if (!sanitized) return '<p></p>'
  if (sanitized.startsWith('{"text"')) {
    return markdownLikeToHtml ? markdownLikeToHtml('') : '<p></p>'
  }
  if (SUPPORTED_HTML_TAG_PATTERN.test(sanitized)) return sanitized
  return markdownLikeToHtml ? markdownLikeToHtml(sanitized) : `<p>${sanitized}</p>`
}
