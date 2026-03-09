export type BibleBook = {
  name: string
  aliases: string[]
}

export const normalizeBibleKey = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '')

export const BIBLE_BOOKS: BibleBook[] = [
  { name: 'Genesis', aliases: ['gen', 'ge', 'gn', 'genesis'] },
  { name: 'Exodus', aliases: ['ex', 'exo', 'exod', 'exodo'] },
  { name: 'Leviticus', aliases: ['lev', 'lv', 'le', 'levitico'] },
  { name: 'Numbers', aliases: ['num', 'nm', 'nb', 'numeros'] },
  { name: 'Deuteronomy', aliases: ['deut', 'dt', 'deu', 'deuteronomio'] },
  { name: 'Joshua', aliases: ['josh', 'jos', 'jsh'] },
  { name: 'Judges', aliases: ['judg', 'jdg', 'jg'] },
  { name: 'Ruth', aliases: ['ru', 'rth'] },
  { name: '1 Samuel', aliases: ['1 sam', '1sam', '1sa', 'i sam', 'first samuel'] },
  { name: '2 Samuel', aliases: ['2 sam', '2sam', '2sa', 'ii sam', 'second samuel'] },
  { name: '1 Kings', aliases: ['1 kgs', '1kings', '1ki', 'i kings', 'first kings'] },
  { name: '2 Kings', aliases: ['2 kgs', '2kings', '2ki', 'ii kings', 'second kings'] },
  { name: '1 Chronicles', aliases: ['1 chr', '1chron', '1ch', 'i chron', 'first chronicles'] },
  { name: '2 Chronicles', aliases: ['2 chr', '2chron', '2ch', 'ii chron', 'second chronicles'] },
  { name: 'Ezra', aliases: ['ezr', 'ez'] },
  { name: 'Nehemiah', aliases: ['neh', 'ne'] },
  { name: 'Esther', aliases: ['est', 'es'] },
  { name: 'Job', aliases: ['job'] },
  { name: 'Psalms', aliases: ['ps', 'psa', 'psalm'] },
  { name: 'Proverbs', aliases: ['prov', 'pr', 'prv'] },
  { name: 'Ecclesiastes', aliases: ['eccl', 'ecc', 'ec'] },
  { name: 'Song of Solomon', aliases: ['song', 'song of songs', 'sos', 'ss', 'canticles'] },
  { name: 'Isaiah', aliases: ['isa', 'is', 'isaias'] },
  { name: 'Jeremiah', aliases: ['jer', 'je', 'jeremias'] },
  { name: 'Lamentations', aliases: ['lam', 'la'] },
  { name: 'Ezekiel', aliases: ['ezek', 'eze'] },
  { name: 'Daniel', aliases: ['dan', 'da', 'dn'] },
  { name: 'Hosea', aliases: ['hos', 'ho'] },
  { name: 'Joel', aliases: ['jl'] },
  { name: 'Amos', aliases: ['am'] },
  { name: 'Obadiah', aliases: ['obad', 'ob'] },
  { name: 'Jonah', aliases: ['jon', 'jh'] },
  { name: 'Micah', aliases: ['mic', 'mc'] },
  { name: 'Nahum', aliases: ['nah', 'na'] },
  { name: 'Habakkuk', aliases: ['hab', 'hb'] },
  { name: 'Zephaniah', aliases: ['zeph', 'zep', 'zp'] },
  { name: 'Haggai', aliases: ['hag', 'hg'] },
  { name: 'Zechariah', aliases: ['zech', 'zec', 'zc'] },
  { name: 'Malachi', aliases: ['mal', 'ml'] },
  { name: 'Matthew', aliases: ['matt', 'mt', 'mateo'] },
  { name: 'Mark', aliases: ['mrk', 'mk', 'marcos'] },
  { name: 'Luke', aliases: ['luk', 'lk', 'lucas'] },
  { name: 'John', aliases: ['jn', 'jhn', 'joh', 'juan'] },
  { name: 'Acts', aliases: ['act', 'ac', 'hechos'] },
  { name: 'Romans', aliases: ['rom', 'ro', 'rm', 'romanos'] },
  { name: '1 Corinthians', aliases: ['1 cor', '1cor', '1co', 'i cor', 'first corinthians'] },
  { name: '2 Corinthians', aliases: ['2 cor', '2cor', '2co', 'ii cor', 'second corinthians'] },
  { name: 'Galatians', aliases: ['gal', 'ga', 'galatas'] },
  { name: 'Ephesians', aliases: ['eph', 'ep', 'efesios'] },
  { name: 'Philippians', aliases: ['phil', 'php', 'ph', 'filipenses'] },
  { name: 'Colossians', aliases: ['col', 'co', 'colosenses'] },
  { name: '1 Thessalonians', aliases: ['1 thess', '1thess', '1th', 'i thess', 'first thessalonians'] },
  { name: '2 Thessalonians', aliases: ['2 thess', '2thess', '2th', 'ii thess', 'second thessalonians'] },
  { name: '1 Timothy', aliases: ['1 tim', '1tim', '1ti', 'i tim', 'first timothy'] },
  { name: '2 Timothy', aliases: ['2 tim', '2tim', '2ti', 'ii tim', 'second timothy'] },
  { name: 'Titus', aliases: ['tit', 'ti', 'tito'] },
  { name: 'Philemon', aliases: ['philem', 'phm', 'pm'] },
  { name: 'Hebrews', aliases: ['heb', 'he', 'hebreos'] },
  { name: 'James', aliases: ['jas', 'jm', 'ja', 'santiago'] },
  { name: '1 Peter', aliases: ['1 pet', '1pet', '1pe', 'i pet', 'first peter'] },
  { name: '2 Peter', aliases: ['2 pet', '2pet', '2pe', 'ii pet', 'second peter'] },
  { name: '1 John', aliases: ['1 john', '1john', '1jn', 'i john', 'first john'] },
  { name: '2 John', aliases: ['2 john', '2john', '2jn', 'ii john', 'second john'] },
  { name: '3 John', aliases: ['3 john', '3john', '3jn', 'iii john', 'third john'] },
  { name: 'Jude', aliases: ['jud', 'jd'] },
  { name: 'Revelation', aliases: ['rev', 're', 'rv', 'apocalypse', 'apocalipsis'] },
]

export const getBibleBookMatches = (query: string) => {
  const normalized = normalizeBibleKey(query)
  if (!normalized) return []

  return BIBLE_BOOKS.filter((book) => {
    const normalizedName = normalizeBibleKey(book.name)
    if (normalizedName.startsWith(normalized)) return true
    return book.aliases.some((alias) => normalizeBibleKey(alias).startsWith(normalized))
  }).map((book) => book.name)
}

const levenshteinDistance = (value: string, compare: string) => {
  const a = value.split('')
  const b = compare.split('')
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[a.length][b.length]
}

export const getBibleBookFuzzyMatches = (query: string, limit = 5) => {
  const normalized = normalizeBibleKey(query)
  if (!normalized) return []

  const threshold = normalized.length <= 4 ? 1 : normalized.length <= 6 ? 2 : 3
  const scored = BIBLE_BOOKS.map((book) => {
    const labels = [book.name, ...book.aliases]
    const distances = labels.map((label) => levenshteinDistance(normalizeBibleKey(label), normalized))
    const bestDistance = Math.min(...distances)
    return { book, distance: bestDistance }
  })
    .filter((entry) => entry.distance <= threshold)
    .sort((a, b) => a.distance - b.distance)

  return scored.slice(0, limit).map((entry) => entry.book.name)
}

export const BOOK_CHAPTER_COUNTS: Record<string, number> = {
  genesis: 50,
  exodus: 40,
  leviticus: 27,
  numbers: 36,
  deuteronomy: 34,
  joshua: 24,
  judges: 21,
  ruth: 4,
  '1samuel': 31,
  '2samuel': 24,
  '1kings': 22,
  '2kings': 25,
  '1chronicles': 29,
  '2chronicles': 36,
  ezra: 10,
  nehemiah: 13,
  esther: 10,
  job: 42,
  psalms: 150,
  proverbs: 31,
  ecclesiastes: 12,
  songofsolomon: 8,
  isaiah: 66,
  jeremiah: 52,
  lamentations: 5,
  ezekiel: 48,
  daniel: 12,
  hosea: 14,
  joel: 3,
  amos: 9,
  obadiah: 1,
  jonah: 4,
  micah: 7,
  nahum: 3,
  habakkuk: 3,
  zephaniah: 3,
  haggai: 2,
  zechariah: 14,
  malachi: 4,
  matthew: 28,
  mark: 16,
  luke: 24,
  john: 21,
  acts: 28,
  romans: 16,
  '1corinthians': 16,
  '2corinthians': 13,
  galatians: 6,
  ephesians: 6,
  philippians: 4,
  colossians: 4,
  '1thessalonians': 5,
  '2thessalonians': 3,
  '1timothy': 6,
  '2timothy': 4,
  titus: 3,
  philemon: 1,
  hebrews: 13,
  james: 5,
  '1peter': 5,
  '2peter': 3,
  '1john': 5,
  '2john': 1,
  '3john': 1,
  jude: 1,
  revelation: 22,
}

export const getBibleBookChapterCount = (bookName: string) => {
  const normalized = normalizeBibleKey(bookName)
  return BOOK_CHAPTER_COUNTS[normalized] || null
}

type BibleBookMatch = {
  book: BibleBook
  alias: string
  normalizedAlias: string
}

type BibleBookMatchResult = {
  book: BibleBook
  remainder: string
  isFuzzy: boolean
}

export const matchBibleBookFromInput = (input: string): BibleBookMatchResult | null => {
  const cleaned = input.trim()
  if (!cleaned) return null
  const normalizedInput = normalizeBibleKey(cleaned)
  const bookPartMatch = cleaned.match(/^[^\d]*/)
  const bookPart = bookPartMatch?.[0]?.trim() || cleaned
  const normalizedBookPart = normalizeBibleKey(bookPart)
  let bestMatch: BibleBookMatch | null = null
  let usedFuzzy = false

  BIBLE_BOOKS.forEach((book) => {
    const labels = [book.name, ...book.aliases]
    labels.forEach((alias) => {
      const normalizedAlias = normalizeBibleKey(alias)
      if (!normalizedAlias) return
      if (normalizedInput.startsWith(normalizedAlias)) {
        if (!bestMatch || normalizedAlias.length > bestMatch.normalizedAlias.length) {
          bestMatch = { book, alias, normalizedAlias }
        }
      }
    })
  })

  if (!bestMatch && normalizedBookPart) {
    const fuzzyMatches = getBibleBookFuzzyMatches(normalizedBookPart, 1)
    if (fuzzyMatches.length) {
      const fuzzyBook = BIBLE_BOOKS.find((book) => book.name === fuzzyMatches[0])
      if (fuzzyBook) {
        bestMatch = {
          book: fuzzyBook,
          alias: fuzzyBook.name,
          normalizedAlias: normalizeBibleKey(fuzzyBook.name),
        }
        usedFuzzy = true
      }
    }
  }

  if (!bestMatch) return null

  const matched = bestMatch as BibleBookMatch
  const escapedAlias = matched.alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const aliasPattern = new RegExp(`^${escapedAlias}\\s*`, 'i')
  const remainder = usedFuzzy ? cleaned.slice(bookPart.length).trim() : cleaned.replace(aliasPattern, '').trim()

  return {
    book: matched.book,
    remainder,
    isFuzzy: usedFuzzy,
  }
}
