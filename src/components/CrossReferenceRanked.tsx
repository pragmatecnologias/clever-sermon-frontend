'use client'

import { useState, useEffect, useMemo } from 'react'
import { BookOpen } from 'lucide-react'
import axios from 'axios'

interface RankedCrossReference {
  reference: string
  category: string
  tier?: string
  relevanceScore: number
  connectionExplanation?: string
  explanation?: string
  themes?: string[]
  relatedPassages?: string[]
  text?: string
}

interface CrossReferenceRankedProps {
  verse: string
  token: string
  onVerseClick?: (reference: string) => void
  onReferencesLoaded?: (count: number) => void
}

export default function CrossReferenceRanked({ verse, token, onReferencesLoaded }: CrossReferenceRankedProps) {
  const [references, setReferences] = useState<RankedCrossReference[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReference, setSelectedReference] = useState<RankedCrossReference | null>(null)
  const [addedRefs, setAddedRefs] = useState<string[]>([])
  const [fullPassageTitle, setFullPassageTitle] = useState('')
  const [fullPassageVerses, setFullPassageVerses] = useState<Array<{ reference: string; text: string }>>([])
  const [fullPassageLoading, setFullPassageLoading] = useState(false)
  const [relatedReferences, setRelatedReferences] = useState<RankedCrossReference[]>([])
  const [relatedLoading, setRelatedLoading] = useState(false)

  useEffect(() => {
    if (verse) fetchRankedReferences()
  }, [verse])

  const normalizeCategory = (category: string) => {
    const key = String(category || '').toLowerCase()
    const map: Record<string, string> = {
      direct_quote: 'quotation',
      direct_quotation: 'quotation',
      explicit_fulfillment: 'prophetic_fulfillment',
      thematic_parallel: 'thematic',
      thematic_echo: 'thematic',
      typological: 'typology',
      typological_pattern: 'typology',
      general_thematic: 'thematic',
      parallel_narrative: 'narrative_continuation',
    }
    return map[key] || key || 'thematic'
  }

  const normalizeTier = (tier: string | undefined, score: number) => {
    const key = String(tier || '').toLowerCase()
    if (key === 'primary' || key === 'secondary' || key === 'illustrative') return key
    if (score >= 80) return 'primary'
    if (score >= 62) return 'secondary'
    return 'illustrative'
  }

  const extractBookToken = (reference: string) => {
    const raw = String(reference || '').trim()
    const dotted = raw.match(/^([1-3]?[A-Za-z]+)\./)
    if (dotted) return dotted[1].toLowerCase()
    const standard = raw.match(/^((?:[1-3]\s*)?[A-Za-z]+)/)
    return standard ? standard[1].toLowerCase().replace(/\s+/g, '') : ''
  }

  const canonicalLaneKey = (reference: string): 'ot' | 'gospels' | 'pauline' | 'general_epistles' | 'other' => {
    const book = extractBookToken(reference)
    if (!book) return 'other'

    const otBooks = new Set([
      'gen', 'genesis', 'exod', 'exodus', 'lev', 'leviticus', 'num', 'numbers', 'deut', 'deuteronomy',
      'josh', 'joshua', 'judg', 'judges', 'ruth', '1sam', '2sam', '1kgs', '2kgs', '1chr', '2chr',
      'ezra', 'neh', 'esth', 'job', 'ps', 'prov', 'eccl', 'song', 'isa', 'jer', 'lam', 'ezek', 'dan',
      'hos', 'joel', 'amos', 'obad', 'jonah', 'mic', 'nah', 'hab', 'zeph', 'hag', 'zech', 'mal',
      'genesis', 'exodo', 'levitico', 'numeros', 'deuteronomio', 'josue', 'jueces', 'rut', '1samuel',
      '2samuel', '1reyes', '2reyes', '1cronicas', '2cronicas', 'esdras', 'nehemias', 'ester', 'salmos',
      'proverbios', 'eclesiastes', 'cantares', 'isaias', 'jeremias', 'lamentaciones', 'ezequiel',
      'daniel', 'oseas', 'abdias', 'jonas', 'miqueas', 'naum', 'habacuc', 'sofonias', 'hageo', 'zacarias', 'malaquias',
    ])

    const gospelBooks = new Set(['matt', 'matthew', 'mark', 'luke', 'john', 'mateo', 'marcos', 'lucas', 'juan'])
    const paulineBooks = new Set([
      'rom', 'romans', '1cor', '2cor', 'gal', 'eph', 'phil', 'col', '1thess', '2thess', '1tim', '2tim', 'titus', 'phlm',
      'romanos', '1corintios', '2corintios', 'galatas', 'efesios', 'filipenses', 'colosenses',
      '1tesalonicenses', '2tesalonicenses', '1timoteo', '2timoteo', 'tito', 'filemon',
    ])
    const generalBooks = new Set([
      'acts', 'heb', 'jas', '1pet', '2pet', '1john', '2john', '3john', 'jude', 'rev',
      'hechos', 'hebreos', 'santiago', '1pedro', '2pedro', '1juan', '2juan', '3juan', 'judas', 'apocalipsis',
    ])

    if (gospelBooks.has(book)) return 'gospels'
    if (paulineBooks.has(book)) return 'pauline'
    if (generalBooks.has(book)) return 'general_epistles'
    if (otBooks.has(book)) return 'ot'
    return 'other'
  }

  const tokenize = (text: string) =>
    String(text || '')
      .toLowerCase()
      .replace(/[^a-záéíóúñü0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 3)

  const buildEvidenceExplanation = (sourceText: string, targetText: string, category: string, sourceVerse: string) => {
    const sourceTokens = tokenize(sourceText)
    const targetTokens = tokenize(targetText)
    const shared = Array.from(new Set(sourceTokens.filter((token) => targetTokens.includes(token)))).slice(0, 3)
    const sharedLabel = shared.length ? ` Shared terms: ${shared.join(', ')}.` : ''
    const categoryPhrase: Record<string, string> = {
      quotation: 'Direct textual parallel.',
      typology: 'Typological correspondence.',
      prophetic_fulfillment: 'Promise/fulfillment movement.',
      narrative_continuation: 'Narrative continuation.',
      interpretive_tension: 'Interpretive tension for doctrinal balance.',
      lexical: 'Lexical continuity.',
      thematic: 'Thematic support.',
    }
    return `${categoryPhrase[category] || 'Thematic support.'} Connected to ${sourceVerse}.${sharedLabel}`
  }

  const toChapterReference = (reference: string) => {
    const raw = String(reference || '').trim().replace(/\u2013|\u2014/g, '-')
    const dotted = raw.match(/^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)/)
    if (dotted) {
      const bookMap: Record<string, string> = {
        Matt: 'Matthew', Mark: 'Mark', Luke: 'Luke', John: 'John', Acts: 'Acts', Rom: 'Romans', '1Cor': '1 Corinthians',
        '2Cor': '2 Corinthians', Gal: 'Galatians', Eph: 'Ephesians', Phil: 'Philippians', Col: 'Colossians', '1Thess': '1 Thessalonians',
        '2Thess': '2 Thessalonians', '1Tim': '1 Timothy', '2Tim': '2 Timothy', Titus: 'Titus', Phlm: 'Philemon', Heb: 'Hebrews',
        Jas: 'James', '1Pet': '1 Peter', '2Pet': '2 Peter', '1John': '1 John', '2John': '2 John', '3John': '3 John',
        Jude: 'Jude', Rev: 'Revelation', Ps: 'Psalms', Prov: 'Proverbs', Isa: 'Isaiah', Jer: 'Jeremiah', Ezek: 'Ezekiel',
        Gen: 'Genesis', Exod: 'Exodus', Lev: 'Leviticus', Num: 'Numbers', Deut: 'Deuteronomy', Josh: 'Joshua', Judg: 'Judges',
        Ruth: 'Ruth', Dan: 'Daniel', Hos: 'Hosea', Joel: 'Joel', Amos: 'Amos', Obad: 'Obadiah', Jonah: 'Jonah', Mic: 'Micah',
        Nah: 'Nahum', Hab: 'Habakkuk', Zeph: 'Zephaniah', Hag: 'Haggai', Zech: 'Zechariah', Mal: 'Malachi',
      }
      const book = bookMap[dotted[1]] || dotted[1]
      return `${book} ${dotted[2]}`
    }
    const standard = raw.match(/^(.*?)\s+(\d+)(?::\d+(?:-\d+)?)?$/)
    return standard ? `${standard[1].trim()} ${standard[2]}` : raw
  }

  const fetchRankedReferences = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scripture/cross-references-ranked`, {
        params: { verse },
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.references)
          ? response.data.references
          : []
      const normalized = data.map((item: RankedCrossReference) => ({
        ...item,
        category: normalizeCategory(item.category),
        tier: normalizeTier(item.tier, item.relevanceScore),
      }))
      if (normalized.length > 0) {
        setReferences(normalized)
        setSelectedReference(normalized[0] || null)
        onReferencesLoaded?.(normalized.length)
      } else {
        const sourcePassageResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scripture/passage`, {
          params: { reference: verse },
          headers: { Authorization: `Bearer ${token}` },
        })
        const sourcePassageText = Array.isArray(sourcePassageResponse.data?.verses)
          ? sourcePassageResponse.data.verses.map((v: any) => String(v?.text || '')).join(' ')
          : ''

        const rawFallback = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scripture/cross-references`, {
          params: { verse },
          headers: { Authorization: `Bearer ${token}` },
        })
        const fallbackList: string[] = Array.isArray(rawFallback.data) ? rawFallback.data : []
        const detailsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scripture/cross-reference-details`, {
          params: { verse },
          headers: { Authorization: `Bearer ${token}` },
        })
        const detailRows: Array<{ reference: string; category?: string | null }> = Array.isArray(detailsResponse.data)
          ? detailsResponse.data
          : []
        const detailMap = new Map(detailRows.map((row) => [row.reference, normalizeCategory(String(row.category || ''))]))

        const sourceLane = canonicalLaneKey(verse)
        const grouped = {
          ot: fallbackList.filter((ref) => canonicalLaneKey(ref) === 'ot'),
          gospels: fallbackList.filter((ref) => canonicalLaneKey(ref) === 'gospels'),
          pauline: fallbackList.filter((ref) => canonicalLaneKey(ref) === 'pauline'),
          general_epistles: fallbackList.filter((ref) => canonicalLaneKey(ref) === 'general_epistles'),
          other: fallbackList.filter((ref) => canonicalLaneKey(ref) === 'other'),
        }
        const laneQuota =
          sourceLane === 'pauline'
            ? { pauline: 8, gospels: 4, general_epistles: 4, ot: 4 }
            : { pauline: 5, gospels: 5, general_epistles: 4, ot: 6 }

        const balanced: string[] = []
        ;(['pauline', 'gospels', 'general_epistles', 'ot'] as const).forEach((lane) => {
          balanced.push(...grouped[lane].slice(0, laneQuota[lane]))
        })
        balanced.push(...grouped.other.slice(0, 4))
        const topFallback = Array.from(new Set([...balanced, ...fallbackList])).slice(0, 20)

        const passages = await Promise.all(
          topFallback.map(async (reference) => {
            try {
              const passageResp = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scripture/passage`, {
                params: { reference },
                headers: { Authorization: `Bearer ${token}` },
              })
              const verses = Array.isArray(passageResp.data?.verses) ? passageResp.data.verses : []
              const text = String(verses?.[0]?.text || '').trim()
              return { reference, text }
            } catch {
              return { reference, text: '' }
            }
          }),
        )
        const textMap = new Map(passages.map((item) => [item.reference, item.text]))

        const fallbackNormalized: RankedCrossReference[] = topFallback.map((ref, idx) => {
          const category = detailMap.get(ref) || 'thematic'
          const targetText = textMap.get(ref) || ''
          const explanation = buildEvidenceExplanation(sourcePassageText, targetText, category, verse)
          return {
            reference: ref,
            category,
            tier: idx < 5 ? 'primary' : idx < 12 ? 'secondary' : 'illustrative',
            relevanceScore: Math.max(30, 82 - idx * 3),
            connectionExplanation: explanation,
            explanation,
            themes: [],
            relatedPassages: [verse],
            text: targetText,
          }
        })
        setReferences(fallbackNormalized)
        setSelectedReference(fallbackNormalized[0] || null)
        onReferencesLoaded?.(fallbackNormalized.length)
      }
    } catch (error) {
      console.error('Failed to fetch ranked cross-references:', error)
      setReferences([])
      setSelectedReference(null)
      onReferencesLoaded?.(0)
    } finally {
      setLoading(false)
    }
  }

  const sections = useMemo(() => {
    const primary = references.filter((ref) => ref.tier === 'primary').slice(0, 6)
    const thematic = references
      .filter((ref) => ['thematic', 'narrative_continuation', 'interpretive_tension'].includes(ref.category))
      .slice(0, 8)
    const lexical = references.filter((ref) => ref.category === 'lexical').slice(0, 8)
    return { primary, thematic, lexical }
  }, [references])

  const canonicalDevelopment = useMemo(() => {
    const grouped: Record<'ot' | 'gospels' | 'pauline' | 'general_epistles', RankedCrossReference[]> = {
      ot: [],
      gospels: [],
      pauline: [],
      general_epistles: [],
    }

    references.forEach((ref) => {
      const lane = canonicalLaneKey(ref.reference)
      if (lane === 'other') return
      grouped[lane].push(ref)
    })

    return [
      { key: 'ot', label: 'OT', refs: grouped.ot.slice(0, 4) },
      { key: 'gospels', label: 'Gospels', refs: grouped.gospels.slice(0, 4) },
      { key: 'pauline', label: 'Pauline', refs: grouped.pauline.slice(0, 4) },
      { key: 'general_epistles', label: 'General Epistles', refs: grouped.general_epistles.slice(0, 4) },
    ]
  }, [references])

  const tierClass = (tier?: string) => {
    const key = String(tier || '').toLowerCase()
    if (key === 'primary') return 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40'
    if (key === 'secondary') return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
    return 'bg-gray-500/20 text-gray-200 border-gray-400/40'
  }

  const categoryLabel = (category: string) => {
    const map: Record<string, string> = {
      thematic: 'Thematic',
      quotation: 'Quotation',
      typology: 'Typology',
      prophetic_fulfillment: 'Prophetic Fulfillment',
      narrative_continuation: 'Narrative Continuation',
      interpretive_tension: 'Interpretive Tension',
      lexical: 'Lexical',
    }
    return map[category] || 'Thematic'
  }

  const openFullPassageInline = async () => {
    if (!selectedReference) return
    setFullPassageLoading(true)
    setFullPassageVerses([])
    try {
      const chapterReference = toChapterReference(selectedReference.reference)
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scripture/passage`, {
        params: { reference: chapterReference },
        headers: { Authorization: `Bearer ${token}` },
      })
      const verses = Array.isArray(response.data?.verses) ? response.data.verses : []
      setFullPassageTitle(response.data?.reference || chapterReference)
      setFullPassageVerses(
        verses.map((v: any) => ({
          reference: String(v?.reference || ''),
          text: String(v?.text || ''),
        })),
      )
    } catch (error) {
      console.error('Failed to load full passage', error)
      setFullPassageTitle(selectedReference.reference)
      setFullPassageVerses([])
    } finally {
      setFullPassageLoading(false)
    }
  }

  const exploreRelatedInline = async () => {
    if (!selectedReference) return
    setRelatedLoading(true)
    setRelatedReferences([])
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/scripture/cross-references-ranked`, {
        params: { verse: selectedReference.reference },
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = Array.isArray(response.data) ? response.data : []
      const normalized = data
        .map((item: RankedCrossReference) => ({
          ...item,
          category: normalizeCategory(item.category),
          tier: normalizeTier(item.tier, item.relevanceScore),
        }))
        .filter((item: RankedCrossReference) => item.reference !== selectedReference.reference)
        .slice(0, 8)
      setRelatedReferences(normalized)
    } catch (error) {
      console.error('Failed to load related verses', error)
      setRelatedReferences([])
    } finally {
      setRelatedLoading(false)
    }
  }

  const renderReferenceCard = (ref: RankedCrossReference) => (
    <button
      key={ref.reference}
      type="button"
      onClick={() => setSelectedReference(ref)}
      className={`w-full text-left border rounded-lg p-3 transition-colors ${
        selectedReference?.reference === ref.reference
          ? 'border-cyan-400/60 bg-cyan-500/10'
          : 'border-white/10 bg-black/20 hover:bg-black/35'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <p className="text-sm font-medium text-cyan-100">{ref.reference}</p>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${tierClass(ref.tier)}`}>
            {String(ref.tier || 'illustrative')}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/20 text-gray-200">
            {categoryLabel(ref.category)}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-300 mt-2">
        {ref.connectionExplanation || ref.explanation || 'Connection explanation unavailable.'}
      </p>
      {ref.text ? (
        <p className="text-xs text-gray-400 italic border-l-2 border-gray-600 pl-3 mt-2 line-clamp-3">
          {ref.text}
        </p>
      ) : null}
    </button>
  )

  if (loading) {
    return <p className="text-sm text-gray-300">Loading cross references...</p>
  }

  if (!references.length) {
    return <p className="text-sm text-gray-300">No Scripture cross references found yet.</p>
  }

  return (
    <div className="space-y-4">
      <div className="border border-white/10 rounded-xl p-4 bg-black/20">
        <p className="text-xs uppercase tracking-widest text-cyan-200/80">1. Primary Scripture Cross References</p>
        <div className="mt-3 grid md:grid-cols-2 gap-2">{sections.primary.map(renderReferenceCard)}</div>
      </div>

      <div className="border border-white/10 rounded-xl p-4 bg-black/20">
        <p className="text-xs uppercase tracking-widest text-cyan-200/80">2. Thematic Cross References</p>
        <div className="mt-3 grid md:grid-cols-2 gap-2">{sections.thematic.map(renderReferenceCard)}</div>
      </div>

      <div className="border border-white/10 rounded-xl p-4 bg-black/20">
        <p className="text-xs uppercase tracking-widest text-cyan-200/80">3. Lexical Cross References</p>
        {sections.lexical.length ? (
          <div className="mt-3 grid md:grid-cols-2 gap-2">{sections.lexical.map(renderReferenceCard)}</div>
        ) : (
          <p className="text-xs text-gray-300 mt-2">No lexical overlaps detected for this passage.</p>
        )}
      </div>

      <div className="border border-white/10 rounded-xl p-4 bg-black/20">
        <p className="text-xs uppercase tracking-widest text-cyan-200/80">4. Canonical Development</p>
        {canonicalDevelopment.some((lane) => lane.refs.length > 0) ? (
          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-start">
            {canonicalDevelopment.map((lane, idx) => (
              <div key={lane.key} className="contents">
                <div className="border border-white/10 rounded-lg p-3 bg-black/30 min-h-[140px]">
                  <p className="text-[11px] uppercase tracking-widest text-cyan-200/80">{lane.label}</p>
                  <div className="mt-2 space-y-2">
                    {lane.refs.length ? lane.refs.map((ref) => (
                      <button
                        key={ref.reference}
                        type="button"
                        onClick={() => setSelectedReference(ref)}
                        className={`w-full text-left text-xs rounded-md border px-2 py-1.5 transition-colors ${
                          selectedReference?.reference === ref.reference
                            ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-100'
                            : 'border-white/10 bg-black/30 text-gray-200 hover:bg-black/50'
                        }`}
                      >
                        {ref.reference}
                      </button>
                    )) : (
                      <p className="text-xs text-gray-500">No references</p>
                    )}
                  </div>
                </div>
                {idx < canonicalDevelopment.length - 1 ? (
                  <div className="hidden lg:flex items-center justify-center text-cyan-300/80 pt-12">→</div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-300 mt-2">Canonical progression will appear as references accumulate.</p>
        )}
      </div>

      {selectedReference ? (
        <div className="border border-cyan-400/30 rounded-xl p-4 bg-cyan-500/10">
          <p className="text-xs uppercase tracking-widest text-cyan-200/80">Reference Details</p>
          <p className="text-sm text-cyan-100 font-semibold mt-1">{selectedReference.reference}</p>
          {selectedReference.text ? <p className="text-sm text-gray-100 mt-2">{selectedReference.text}</p> : null}
          <p className="text-xs text-gray-200 mt-2">
            {selectedReference.connectionExplanation || selectedReference.explanation || 'No explanation available.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="cyber-outline text-xs px-3 py-1 rounded-full"
              onClick={() => {
                setAddedRefs((prev) => (prev.includes(selectedReference.reference) ? prev : [...prev, selectedReference.reference]))
              }}
            >
              {addedRefs.includes(selectedReference.reference) ? 'Added to Sermon' : 'Add to Sermon References'}
            </button>
            <button
              type="button"
              className="cyber-outline text-xs px-3 py-1 rounded-full"
              onClick={openFullPassageInline}
            >
              Open Full Passage
            </button>
            <button
              type="button"
              className="cyber-outline text-xs px-3 py-1 rounded-full"
              onClick={exploreRelatedInline}
            >
              Explore Related Verses
            </button>
          </div>
          {(fullPassageLoading || fullPassageVerses.length > 0) ? (
            <div className="mt-4 border border-white/15 rounded-lg p-3 bg-black/20">
              <p className="text-[11px] uppercase tracking-widest text-cyan-200/80">
                Full Passage: {fullPassageTitle || selectedReference.reference}
              </p>
              {fullPassageLoading ? (
                <p className="text-xs text-gray-300 mt-2">Loading passage...</p>
              ) : (
                <div className="mt-2 max-h-64 overflow-y-auto pr-1 space-y-2">
                  {fullPassageVerses.length ? fullPassageVerses.map((verseItem, index) => (
                    <p key={`${verseItem.reference}-${index}`} className="text-xs text-gray-200 leading-relaxed">
                      <span className="text-cyan-200 mr-1">{verseItem.reference}</span>
                      {verseItem.text}
                    </p>
                  )) : (
                    <p className="text-xs text-gray-300">No chapter text available for this reference.</p>
                  )}
                </div>
              )}
            </div>
          ) : null}
          {(relatedLoading || relatedReferences.length > 0) ? (
            <div className="mt-4 border border-white/15 rounded-lg p-3 bg-black/20">
              <p className="text-[11px] uppercase tracking-widest text-cyan-200/80">Related Verses (Inline)</p>
              {relatedLoading ? (
                <p className="text-xs text-gray-300 mt-2">Loading related references...</p>
              ) : (
                <div className="mt-2 grid md:grid-cols-2 gap-2">
                  {relatedReferences.map((item) => (
                    <button
                      key={item.reference}
                      type="button"
                      onClick={() => setSelectedReference(item)}
                      className="text-left border border-white/10 rounded-md px-2 py-1.5 bg-black/30 hover:bg-black/45 transition-colors"
                    >
                      <p className="text-xs text-cyan-100">{item.reference}</p>
                      <p className="text-[11px] text-gray-300 mt-1 line-clamp-2">
                        {item.connectionExplanation || item.explanation || 'Related reference'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
