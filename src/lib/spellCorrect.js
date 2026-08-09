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
  if (len <= 8) return 1
  if (len <= 12) return 2
  return 2
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

function sharedPrefixLen(a, b) {
  const n = Math.min(a.length, b.length)
  let i = 0
  while (i < n && a[i] === b[i]) i += 1
  return i
}

/** Per-word guard: stops social↔soil, bed↔food, plan↔planning, baking↔banking. */
function tokensCompatible(a, b) {
  const aw = String(a).toLowerCase().trim().split(/\s+/).filter(Boolean)
  const bw = String(b).toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (!aw.length || !bw.length) return false

  // Prefer same word count; allow only simple pluralization at the phrase level
  if (aw.length !== bw.length) {
    const joinedA = aw.join(' ')
    const joinedB = bw.join(' ')
    if (joinedA + 's' === joinedB || joinedB + 's' === joinedA) return true
    if (joinedA + 'es' === joinedB || joinedB + 'es' === joinedA) return true
    return false
  }

  for (let i = 0; i < aw.length; i += 1) {
    const x = aw[i]
    const y = bw[i]
    if (x === y) continue
    if (x[0] !== y[0]) return false

    const d = levenshtein(x, y)
    const limit = maxDistanceFor(Math.min(x.length, y.length))
    if (d > limit) return false

    // Short / medium words: keep a solid shared stem so baking≠banking, plan≠plant loosely
    if (d > 0) {
      const stem = Math.min(3, Math.floor(Math.min(x.length, y.length) * 0.5))
      if (sharedPrefixLen(x, y) < Math.max(2, stem)) return false
    }
    // Never expand a short token into a much longer one (plan→planning)
    if (Math.abs(x.length - y.length) > limit + 1) return false
  }
  return true
}

function isSimpleVariant(needle, cand) {
  if (cand === needle + 's' || needle === cand + 's') return true
  if (cand === needle + 'es' || needle === cand + 'es') return true
  if (cand === needle + 'ing' && needle.length >= 5) return true
  return false
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

  // Safe prefix / plural variants only (not plan→planning)
  const variantHits = dictionary.filter((cand) => {
    const c = String(cand).toLowerCase()
    return isSimpleVariant(needle, c)
  })
  if (variantHits.length === 1) return variantHits[0]
  if (variantHits.length > 1) {
    variantHits.sort((a, b) => String(a).length - String(b).length)
    return variantHits[0]
  }

  const prefixHits = dictionary.filter((cand) => {
    const c = String(cand).toLowerCase()
    if (!(c.startsWith(needle) || needle.startsWith(c))) return false
    if (Math.min(c.length, needle.length) < 5) return false
    return Math.abs(c.length - needle.length) <= 2
  })
  if (prefixHits.length === 1) return prefixHits[0]

  let best = null
  let bestDist = Infinity
  let second = Infinity
  const limit = maxDistanceFor(needle.length)

  for (const cand of dictionary) {
    const c = String(cand)
    const cl = c.toLowerCase()
    if (Math.abs(cl.length - needle.length) > limit + 1) continue
    if (!tokensCompatible(needle, cl)) continue
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
  if (bestDist === second) return null
  if (bestDist > 1 && second - bestDist < 1) return null
  if (needle.includes(' ') && bestDist > 2) return null
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
  sceince: 'science',
  scienece: 'science',
  engneering: 'engineering',
  engeneering: 'engineering',
  engineerng: 'engineering',
  enginering: 'engineering',
  eletrical: 'electrical',
  electical: 'electrical',
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
  'social science': 'social science',
  'social sciences': 'social sciences',
  'socail science': 'social science',
  'soical science': 'social science',
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
  nutrion: 'nutrition',
  nutrtion: 'nutrition',
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
  polisci: 'political science',
  'poli sci': 'political science',
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
  musci: 'music',
  forensics: 'forensic science',
  forensic: 'forensic science',
  geogrophy: 'geography',
  geograpy: 'geography',
  antropology: 'anthropology',
  criminolgy: 'criminology',
  biotechology: 'biotechnology',
  libary: 'library',
  grahic: 'graphic',
  tourisim: 'tourism',
  resouces: 'resources',
  studes: 'studies',
  hisotry: 'history',
  histroy: 'history',
  'plant science': 'plant science',
  'plante science': 'plant science',
  'inferior design': 'interior design',
  'electronics engineering': 'electronics engineering',
  'electronic engineering': 'electronic engineering',
  'projec management': 'project management',
  'supply chan': 'supply chain',
  'heath science': 'health science',
  frnech: 'french',
  frech: 'french',
  spanis: 'spanish',
  spanich: 'spanish',
  geologoy: 'geology',
  archealogy: 'archaeology',
  midwifry: 'midwifery',
  midwifey: 'midwifery',
  dentisty: 'dentistry',
  dentisrty: 'dentistry',
  'early childhood': 'early childhood',
  'early childhod': 'early childhood',
  'special educaton': 'special education',
  'physical educaton': 'physical education',
  'public heath': 'public health',
  'civil engneering': 'civil engineering',
  'mechanical engneering': 'mechanical engineering',
  'chemical engneering': 'chemical engineering',
  'software engneering': 'software engineering',
  'computer sceince': 'computer science',
  'data sceince': 'data science',
  'political sceince': 'political science',
  'animal sceince': 'animal science',
  'food sceince': 'food science',
  'soil sceince': 'soil science',
  'sport sceince': 'sport science',
  'sports sceince': 'sports science',
  'library sceince': 'library science',
  'health sceince': 'health science',
  'life sceince': 'life sciences',
  'life sceinces': 'life sciences',
  'material sceince': 'materials science',
  'materials sceince': 'materials science',
  'enviromental sceince': 'environmental science',
  'information tecnology': 'information technology',
  'information sytems': 'information systems',
  'human resourses': 'human resources',
  'internationl business': 'international business',
  'mass comunication': 'mass communication',
  'graphic desing': 'graphic design',
  'interior desing': 'interior design',
  'project managment': 'project management',
  'business managment': 'business management',
  'business adminstration': 'business administration',
  'public adminstration': 'public administration',
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
  html: 'HTML / CSS',
  css: 'HTML / CSS',
  'html/css': 'HTML / CSS',
  mongodb: 'MongoDB',
  mongo: 'MongoDB',
  docker: 'Docker',
  kubernetes: 'Kubernetes',
  k8s: 'Kubernetes',
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'GCP',
  linux: 'Linux',
  unix: 'Linux',
  java: 'Java',
  kotlin: 'Kotlin',
  swift: 'Swift',
  golang: 'Go',
  rust: 'Rust',
  csharp: 'C#',
  'c#': 'C#',
  'c++': 'C++',
  cpp: 'C++',
  rlang: 'R',
  tableau: 'Tableau',
  seaborn: 'Seaborn',
  tensorflow: 'TensorFlow',
  pytorch: 'PyTorch',
  sklearn: 'Scikit-learn',
  'scikit-learn': 'Scikit-learn',
  scikitlearn: 'Scikit-learn',
  wordpress: 'WordPress',
  shopify: 'Shopify',
  salesforce: 'Salesforce',
  jira: 'Jira',
  slack: 'Slack',
  sketch: 'Sketch',
  notion: 'Notion',
  'ui/ux': 'UI/UX design',
  uiux: 'UI/UX design',
  ux: 'UI/UX design',
  ui: 'UI/UX design',
  seo: 'SEO',
  sem: 'SEM / Ads',
  copywriting: 'Copywriting',
  'public speaking': 'Public speaking',
  publicspeaking: 'Public speaking',
  mentoring: 'Mentoring',
  coaching: 'Coaching',
  'critical thinking': 'Critical thinking',
  criticalthinking: 'Critical thinking',
  'data analysis': 'Data analysis',
  dataanalysis: 'Data analysis',
  'machine learning': 'Machine learning',
  machinelearning: 'Machine learning',
  ml: 'Machine learning',
  'deep learning': 'Deep learning',
  deeplearning: 'Deep learning',
  nlp: 'NLP',
  'natural language processing': 'NLP',
}

/**
 * Generate common misspellings for a canonical token/phrase.
 * Used to auto-cover every catalog field/skill — not just hand-picked ones.
 */
export function generateTypoVariants(canonical = '') {
  const w = String(canonical || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
  if (w.length < 4) return []

  const out = new Set()

  const pushWordTypos = (word, rejoin) => {
    if (word.length < 4) return
    const accept = (variant) => {
      if (!variant || variant === word || variant.length < 3) return
      // Keep a solid shared stem so banking↛baking, plan↛plant noise stays low
      const need = Math.min(4, Math.max(2, Math.floor(Math.min(word.length, variant.length) / 2)))
      if (sharedPrefixLen(word, variant) < need) return
      if (Math.abs(word.length - variant.length) > 2) return
      rejoin(variant)
    }
    for (let i = 0; i < word.length - 1; i += 1) {
      accept(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2))
    }
    for (let i = 0; i < word.length; i += 1) {
      accept(word.slice(0, i) + word.slice(i + 1))
    }
    if (/(.)\1/.test(word)) accept(word.replace(/(.)\1/g, '$1'))
    if (word.includes('ie')) accept(word.replace(/ie/g, 'ei'))
    if (word.includes('ei')) accept(word.replace(/ei/g, 'ie'))
    if (word.includes('ph')) accept(word.replace(/ph/g, 'f'))
    if (word.endsWith('ence')) accept(`${word.slice(0, -4)}ance`)
    if (word.endsWith('ance')) accept(`${word.slice(0, -4)}ence`)
    if (word.endsWith('er') && word.length >= 6) accept(`${word.slice(0, -2)}or`)
    if (word.endsWith('or') && word.length >= 6) accept(`${word.slice(0, -2)}er`)
    if (word.includes('tion')) accept(word.replace(/tion/g, 'sion'))
    if (word.includes('sion')) accept(word.replace(/sion/g, 'tion'))
  }

  const words = w.split(' ')
  if (words.length === 1) {
    pushWordTypos(w, (v) => out.add(v))
  } else {
    pushWordTypos(w.replace(/\s+/g, ''), (v) => out.add(v)) // rare: computerscience
    words.forEach((word, idx) => {
      pushWordTypos(word, (vw) => {
        const next = [...words]
        next[idx] = vw
        out.add(next.join(' '))
        out.add(vw)
      })
    })
  }

  out.delete(w)
  return [...out].filter((v) => v.length >= 3 && v !== w)
}

/**
 * Merge manual aliases with auto-generated typos for every dictionary entry.
 * Ambiguous typos (map to 2+ targets) are dropped.
 */
export function buildAliasTable(manualAliases = {}, dictionary = [], { casingMap = null } = {}) {
  const table = { ...manualAliases }
  const dictLower = dictionary.map((d) => String(d).toLowerCase())
  const dictSet = new Set(dictLower)
  const claims = new Map()

  const canonCase = (lower) => {
    if (casingMap && casingMap.has(lower)) return casingMap.get(lower)
    return lower
  }

  const claim = (typo, targetLower) => {
    const t = String(typo || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
    if (!t || t === targetLower) return
    if (t.length < 3) return
    if (dictSet.has(t)) return
    if (manualAliases[t] && String(manualAliases[t]).toLowerCase() !== targetLower) return
    if (!claims.has(t)) claims.set(t, new Set())
    claims.get(t).add(targetLower)
  }

  for (const raw of dictionary) {
    const target = String(raw).toLowerCase()
    for (const v of generateTypoVariants(target)) claim(v, target)
    const parts = target.split(/\s+/).filter(Boolean)
    if (parts.length > 1) {
      for (const part of parts) {
        if (part.length < 4) continue
        for (const v of generateTypoVariants(part)) claim(v, part)
      }
    }
  }

  for (const [typo, targets] of claims) {
    if (targets.size !== 1) continue
    if (table[typo]) continue
    table[typo] = canonCase([...targets][0])
  }

  return table
}

const aliasTableCache = new Map()

function aliasTableFor(kind, dictionary, manual) {
  const strong = `${kind}\0${[...dictionary].map((d) => String(d).toLowerCase()).sort().join('\0')}`
  if (aliasTableCache.has(strong)) return aliasTableCache.get(strong)

  let casingMap = null
  if (kind === 'skill') {
    casingMap = new Map()
    for (const s of dictionary) casingMap.set(String(s).toLowerCase(), s)
    for (const v of Object.values(manual)) {
      if (typeof v === 'string') casingMap.set(v.toLowerCase(), v)
    }
  }

  const table = buildAliasTable(manual, dictionary, { casingMap })
  aliasTableCache.set(strong, table)
  return table
}

function lookupAlias(aliases, value) {
  const key = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
  return aliases[key] || null
}

const DEGREE_PREFIX_RE =
  /^(b\.?\s*ed|bed|m\.?\s*ed|med|b\.?\s*sc|bsc|b\.?\s*a|ba|b\.?\s*eng|beng|b\.?\s*tech|btech|b\.?\s*com|bcom|bba|bca|ll\.?\s*b|llb|ll\.?\s*m|llm|m\.?\s*sc|msc|m\.?\s*a|ma|m\.?\s*eng|meng|mba|mca|m\.?\s*phil|mphil|ph\.?\s*d|phd|dphil|pgce|pgde|pgdip|pgcert|hnd|hnc|diploma|certificate|cert|nd|nc)\b[. ]*/i

function formatDegreePrefix(prefixRaw) {
  const p = String(prefixRaw || '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, '')
  const map = {
    bed: 'BEd',
    med: 'MEd',
    bsc: 'BSc',
    ba: 'BA',
    beng: 'BEng',
    btech: 'BTech',
    bcom: 'BCom',
    bba: 'BBA',
    bca: 'BCA',
    llb: 'LLB',
    llm: 'LLM',
    msc: 'MSc',
    ma: 'MA',
    meng: 'MEng',
    mba: 'MBA',
    mca: 'MCA',
    mphil: 'MPhil',
    phd: 'PhD',
    dphil: 'DPhil',
    pgce: 'PGCE',
    pgde: 'PGDE',
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

  const dict = fieldDictionary.length ? fieldDictionary : []
  const aliases = aliasTableFor('field', dict, FIELD_ALIASES)

  // Full-phrase alias / fuzzy first
  const restLower = rest.toLowerCase()
  const aliasHit = lookupAlias(aliases, restLower)
  if (aliasHit) {
    const fixed = titleCaseWords(aliasHit)
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
  const correctedWords = words.map((w) => {
    const low = w.toLowerCase().replace(/[^a-z0-9-]/g, '')
    const a = lookupAlias(aliases, low)
    if (a) return a
    if (w.length <= 3) return w
    const hit = bestFuzzyMatch(low, singleWordDict, { minLen: 4 })
    return hit || w
  })

  let assembled = correctedWords.join(' ')
  const assembledAlias = lookupAlias(aliases, assembled)
  if (assembledAlias) assembled = assembledAlias

  const snap = bestFuzzyMatch(assembled, dict, { minLen: 4 })
  if (
    snap &&
    tokensCompatible(assembled, snap) &&
    levenshtein(assembled.toLowerCase(), snap.toLowerCase()) <= maxDistanceFor(assembled.length)
  ) {
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

  const aliases = aliasTableFor('skill', skillDictionary, SKILL_TYPO_ALIASES)
  const lower = trimmed.toLowerCase()
  const aliasHit = lookupAlias(aliases, lower)
  if (aliasHit) return aliasHit

  // Exact catalog match (preserve catalog casing)
  for (const s of skillDictionary) {
    if (String(s).toLowerCase() === lower) return s
  }

  const fuzzy = bestFuzzyMatch(trimmed, skillDictionary, { minLen: 3 })
  if (fuzzy) return fuzzy

  // Word-wise for multi-word custom skills against catalog tokens
  if (trimmed.includes(' ') && skillDictionary.length) {
    const tokens = [
      ...new Set(
        skillDictionary
          .flatMap((s) => String(s).toLowerCase().split(/[^a-z0-9+#.]+/))
          .filter((w) => w.length >= 4),
      ),
    ]
    const parts = trimmed.split(/\s+/).map((p) => {
      const low = p.toLowerCase()
      return lookupAlias(aliases, low) || bestFuzzyMatch(low, tokens, { minLen: 4 }) || p
    })
    const joined = parts.join(' ')
    const joinedAlias = lookupAlias(aliases, joined)
    if (joinedAlias) return joinedAlias
    const again = bestFuzzyMatch(joined, skillDictionary, { minLen: 4 })
    if (again) return again
  }

  if (trimmed === trimmed.toLowerCase() && trimmed.length <= 28 && !trimmed.includes('.')) {
    return titleCaseWords(trimmed)
  }
  return trimmed
}
