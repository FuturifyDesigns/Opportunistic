/**
 * Accurate typo correction for degree fields and skill names.
 * Prefer exact / alias hits; fuzzy only when the candidate is clearly closest.
 */

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function levenshtein(a = '', b = '') {
  const s = String(a)
  const t = String(b)
  if (s === t) return 0
  if (!s.length) return t.length
  if (!t.length) return s.length
  const rows = s.length + 1
  const cols = t.length + 1
  const prev = new Array(cols)
  const cur = new Array(cols)
  for (let j = 0; j < cols; j += 1) prev[j] = j
  for (let i = 1; i < rows; i += 1) {
    cur[0] = i
    const sc = s.charCodeAt(i - 1)
    for (let j = 1; j < cols; j += 1) {
      const cost = sc === t.charCodeAt(j - 1) ? 0 : 1
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j < cols; j += 1) prev[j] = cur[j]
  }
  return prev[cols - 1]
}

function maxDistanceFor(len) {
  if (len <= 3) return 0
  if (len <= 5) return 1
  if (len <= 8) return 2
  if (len <= 12) return 3
  return 4
}

function titleCaseWords(s) {
  return String(s)
    .split(/\s+/)
    .map((w) => {
      if (!w) return w
      if (/^[A-Z0-9.+/-]+$/.test(w) && w.length <= 5) return w // keep BSc, LLM, CAD
      if (w.includes('/')) return w.split('/').map((p) => titleCaseWords(p)).join('/')
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    })
    .join(' ')
}

/**
 * Pick best dictionary match. Returns null if ambiguous or not close enough.
 */
export function bestFuzzyMatch(input, dictionary, { minLen = 3 } = {}) {
  const raw = String(input || '').trim()
  if (!raw || raw.length < minLen) return null
  const needle = raw.toLowerCase()

  // Exact (case-insensitive)
  for (const cand of dictionary) {
    if (String(cand).toLowerCase() === needle) return cand
  }

  // Starts-with / contains strong hints for longer needles
  const prefixHits = dictionary.filter((cand) => {
    const c = String(cand).toLowerCase()
    return c.startsWith(needle) || needle.startsWith(c)
  })
  if (prefixHits.length === 1 && Math.abs(prefixHits[0].length - raw.length) <= 4) {
    return prefixHits[0]
  }

  let best = null
  let bestDist = Infinity
  let second = Infinity
  const limit = maxDistanceFor(needle.length)

  for (const cand of dictionary) {
    const c = String(cand)
    const cl = c.toLowerCase()
    // Skip wildly different lengths
    if (Math.abs(cl.length - needle.length) > limit + 1) continue
    const d = levenshtein(needle, cl)
    if (d < bestDist) {
      second = bestDist
      bestDist = d
      best = c
    } else if (d < second) {
      second = d
    }
  }

  if (!best || bestDist > limit) return null
  // Ambiguous: two equally close candidates
  if (bestDist === second) return null
  // Require clear win when distance > 1
  if (bestDist > 1 && second - bestDist < 1) return null
  return best
}

/** Common hard aliases (faster + safer than fuzzy for known typos). */
export const FIELD_ALIASES = {
  literatue: 'literature',
  literatuer: 'literature',
  litrature: 'literature',
  litterature: 'literature',
  literatre: 'literature',
  engish: 'english',
  englsh: 'english',
  enlish: 'english',
  computor: 'computer',
  computre: 'computer',
  compuer: 'computer',
  comuter: 'computer',
  scince: 'science',
  sciense: 'science',
  sience: 'science',
  engneering: 'engineering',
  engeneering: 'engineering',
  engineerng: 'engineering',
  enginering: 'engineering',
  buisness: 'business',
  bussiness: 'business',
  busines: 'business',
  managment: 'management',
  managemnt: 'management',
  mangement: 'management',
  psycology: 'psychology',
  pyschology: 'psychology',
  psychlogy: 'psychology',
  physcology: 'psychology',
  sociolgy: 'sociology',
  socioloy: 'sociology',
  matematics: 'mathematics',
  mathmatics: 'mathematics',
  maths: 'mathematics',
  mathamatics: 'mathematics',
  chemisty: 'chemistry',
  chemstry: 'chemistry',
  bioligy: 'biology',
  biologoy: 'biology',
  physcis: 'physics',
  phisics: 'physics',
  accouting: 'accounting',
  accountancy: 'accounting',
  acounting: 'accounting',
  econmics: 'economics',
  economicks: 'economics',
  finace: 'finance',
  finnance: 'finance',
  marketting: 'marketing',
  markering: 'marketing',
  jornalism: 'journalism',
  journalisim: 'journalism',
  philosphy: 'philosophy',
  philosohy: 'philosophy',
  architechture: 'architecture',
  architeture: 'architecture',
  nurshing: 'nursing',
  nusing: 'nursing',
  pharmasy: 'pharmacy',
  pharamacy: 'pharmacy',
  medicin: 'medicine',
  medecine: 'medicine',
  educaton: 'education',
  educasion: 'education',
  teeching: 'teaching',
  teachng: 'teaching',
  hospitallity: 'hospitality',
  hospitatlity: 'hospitality',
  agriculure: 'agriculture',
  agricultur: 'agriculture',
  enviromental: 'environmental',
  enviornmental: 'environmental',
  enviroment: 'environment',
  informtion: 'information',
  tecnology: 'technology',
  techology: 'technology',
  tehnology: 'technology',
  softwear: 'software',
  softwre: 'software',
  programing: 'programming',
  programming: 'programming',
  cybersecuity: 'cybersecurity',
  cybersecuirty: 'cybersecurity',
  artifical: 'artificial',
  inteligence: 'intelligence',
  statistcs: 'statistics',
  statistiks: 'statistics',
  politcal: 'political',
  goverment: 'government',
  internationl: 'international',
  comunication: 'communication',
  communicationss: 'communications',
  journlism: 'journalism',
  phsyiotherapy: 'physiotherapy',
  physio: 'physiotherapy',
  veterinay: 'veterinary',
  vetinary: 'veterinary',
  linguisitcs: 'linguistics',
  lingustics: 'linguistics',
  theolgy: 'theology',
  archeology: 'archaeology',
  archaelogy: 'archaeology',
}

export const SKILL_TYPO_ALIASES = {
  reacct: 'React',
  reactjs: 'React',
  'react.js': 'React',
  node: 'Node.js',
  nodejs: 'Node.js',
  'node.js': 'Node.js',
  js: 'JavaScript',
  javascript: 'JavaScript',
  javascrpt: 'JavaScript',
  javscript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  typescrpt: 'TypeScript',
  py: 'Python',
  python: 'Python',
  pythn: 'Python',
  pyhton: 'Python',
  fullstack: 'Full stack developer',
  'full-stack': 'Full stack developer',
  'full stack': 'Full stack developer',
  excel: 'Excel',
  exel: 'Excel',
  excell: 'Excel',
  sql: 'SQL',
  myql: 'SQL',
  mysql: 'SQL',
  postgres: 'SQL',
  postgresql: 'SQL',
  git: 'Git',
  githb: 'Git',
  github: 'Git',
  comunication: 'Communication',
  communicaton: 'Communication',
  teamork: 'Teamwork',
  teamword: 'Teamwork',
  leadrship: 'Leadership',
  leadersip: 'Leadership',
  writting: 'Writing',
  reseach: 'Research',
  reserach: 'Research',
  'problem solving': 'Problem solving',
  problemsolving: 'Problem solving',
  'problem-solving': 'Problem solving',
  'time-management': 'Time management',
  timemanagement: 'Time management',
  powerpoint: 'Microsoft Office',
  word: 'Microsoft Office',
  'ms office': 'Microsoft Office',
  msoffice: 'Microsoft Office',
  canva: 'Canva / Adobe',
  photoshop: 'Adobe Creative Suite',
  illustrator: 'Adobe Creative Suite',
  figma: 'Prototyping',
  autocad: 'AutoCAD',
  'auto cad': 'AutoCAD',
  solidworks: 'SolidWorks',
  'solid works': 'SolidWorks',
  matlab: 'MATLAB',
  pandas: 'Pandas',
  jupiter: 'Jupyter',
  jupyter: 'Jupyter',
  'powerbi': 'Power BI',
  'power bi': 'Power BI',
  spss: 'SPSS / stats basics',
  quickbooks: 'QuickBooks / Sage',
  sage: 'QuickBooks / Sage',
}

const DEGREE_PREFIX_RE =
  /^(b\.?\s*sc|bsc|b\.?\s*a|ba|b\.?\s*eng|beng|b\.?\s*tech|btech|b\.?\s*com|bcom|bba|bca|ll\.?\s*b|llb|m\.?\s*sc|msc|m\.?\s*a|ma|m\.?\s*eng|meng|mba|mca|m\.?\s*phil|mphil|ph\.?\s*d|phd|dphil|pgdip|pgcert|hnd|hnc|diploma|certificate|cert|nd|nc)\b[. ]*/i

function formatDegreePrefix(prefixRaw) {
  const p = String(prefixRaw || '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, '')
  const map = {
    bsc: 'BSc',
    ba: 'BA',
    beng: 'BEng',
    btech: 'BTech',
    bcom: 'BCom',
    bba: 'BBA',
    bca: 'BCA',
    llb: 'LLB',
    msc: 'MSc',
    ma: 'MA',
    meng: 'MEng',
    mba: 'MBA',
    mca: 'MCA',
    mphil: 'MPhil',
    phd: 'PhD',
    dphil: 'DPhil',
    pgdip: 'PGDip',
    pgcert: 'PGCert',
    hnd: 'HND',
    hnc: 'HNC',
    diploma: 'Diploma',
    certificate: 'Certificate',
    cert: 'Certificate',
    nd: 'ND',
    nc: 'NC',
  }
  return map[p] || titleCaseWords(prefixRaw.trim())
}

function correctToken(token, dictionary, aliases) {
  const lower = token.toLowerCase()
  if (aliases[lower]) return aliases[lower]
  const hit = bestFuzzyMatch(token, dictionary, { minLen: 4 })
  return hit || token
}

/**
 * Correct a degree / field string against known field keys.
 * Preserves degree prefixes (BSc, BA, MSc…).
 */
export function correctFieldName(input, fieldDictionary = []) {
  const trimmed = String(input || '').trim().replace(/\s+/g, ' ')
  if (!trimmed) return ''

  let prefix = ''
  let rest = trimmed
  const m = trimmed.match(DEGREE_PREFIX_RE)
  if (m) {
    prefix = formatDegreePrefix(m[1])
    rest = trimmed.slice(m[0].length).trim()
  }

  if (!rest) return prefix || trimmed

  const dict = fieldDictionary.length
    ? fieldDictionary
    : []

  // Full-phrase alias / fuzzy first
  const restLower = rest.toLowerCase()
  if (FIELD_ALIASES[restLower]) {
    const fixed = titleCaseWords(FIELD_ALIASES[restLower])
    return prefix ? `${prefix} ${fixed}` : fixed
  }

  const phraseHit = bestFuzzyMatch(rest, dict, { minLen: 4 })
  if (phraseHit) {
    const fixed = titleCaseWords(phraseHit)
    return prefix ? `${prefix} ${fixed}` : fixed
  }

  // Word-by-word correction (computor science → computer science)
  const words = rest.split(/\s+/)
  const singleWordDict = [
    ...new Set(
      dict
        .flatMap((d) => String(d).toLowerCase().split(/\s+/))
        .filter((w) => w.length >= 4),
    ),
  ]
  // Prefer original dictionary phrases as display when reassembled
  const correctedWords = words.map((w) => {
    const low = w.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (FIELD_ALIASES[low]) return FIELD_ALIASES[low]
    if (w.length <= 3) return w // keep of, and, BA fragments
    const hit = bestFuzzyMatch(low, singleWordDict, { minLen: 4 })
    return hit || w
  })

  let assembled = correctedWords.join(' ')
  // If word-wise fix now matches a known phrase, snap to canonical phrase casing
  const snap = bestFuzzyMatch(assembled, dict, { minLen: 4 })
  if (snap && levenshtein(assembled.toLowerCase(), snap.toLowerCase()) <= 2) {
    assembled = snap
  }

  const body = titleCaseWords(assembled)
  return prefix ? `${prefix} ${body}` : body
}

/**
 * Correct a skill name against aliases + skill dictionary.
 */
export function correctSkillName(input, skillDictionary = []) {
  const trimmed = String(input || '').trim().replace(/\s+/g, ' ')
  if (!trimmed) return ''

  const lower = trimmed.toLowerCase()
  if (SKILL_TYPO_ALIASES[lower]) return SKILL_TYPO_ALIASES[lower]

  // Exact catalog match (preserve catalog casing)
  for (const s of skillDictionary) {
    if (String(s).toLowerCase() === lower) return s
  }

  const fuzzy = bestFuzzyMatch(trimmed, skillDictionary, { minLen: 3 })
  if (fuzzy) return fuzzy

  // Word-wise for multi-word custom skills against catalog tokens
  if (trimmed.includes(' ') && skillDictionary.length) {
    const tokens = [
      ...new Set(skillDictionary.flatMap((s) => String(s).toLowerCase().split(/[^a-z0-9+#.]+/)).filter((w) => w.length >= 4)),
    ]
    const parts = trimmed.split(/\s+/).map((p) => {
      const low = p.toLowerCase()
      if (SKILL_TYPO_ALIASES[low]) return SKILL_TYPO_ALIASES[low]
      return bestFuzzyMatch(low, tokens, { minLen: 4 }) || p
    })
    const joined = parts.join(' ')
    const again = bestFuzzyMatch(joined, skillDictionary, { minLen: 4 })
    if (again) return again
  }

  if (trimmed === trimmed.toLowerCase() && trimmed.length <= 28 && !trimmed.includes('.')) {
    return titleCaseWords(trimmed)
  }
  return trimmed
}
