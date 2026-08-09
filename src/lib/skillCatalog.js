/**
 * Suggested skills keyed by degree/certificate field.
 * Matching uses word boundaries so “BSc Literature” never matches CS via “cs”.
 */

const CATALOG = [
  {
    keys: [
      'computer science',
      'software engineering',
      'software development',
      'information technology',
      'information systems',
      'informatics',
      'computing',
      'computer engineering',
      'cybersecurity',
      'cyber security',
      'full stack',
      'web development',
      'programming',
    ],
    // Short tokens matched only as whole words (never inside BSc/MSc)
    shortKeys: ['cs', 'se', 'it', 'cis'],
    skills: [
      'JavaScript',
      'TypeScript',
      'React',
      'Node.js',
      'Python',
      'Java',
      'SQL',
      'Git',
      'REST APIs',
      'Cloud (AWS/Azure/GCP)',
      'Data structures',
      'UI/UX basics',
    ],
  },
  {
    keys: [
      'data science',
      'data analytics',
      'business analytics',
      'statistics',
      'machine learning',
      'artificial intelligence',
      'data engineering',
      'big data',
    ],
    shortKeys: ['ai', 'ml'],
    skills: [
      'Python',
      'R',
      'SQL',
      'Pandas',
      'Machine learning',
      'Data visualization',
      'Statistics',
      'Excel',
      'Jupyter',
      'ETL basics',
    ],
  },
  {
    keys: [
      'literature',
      'english literature',
      'comparative literature',
      'literary studies',
      'creative writing',
      'english language',
      'english studies',
      'letters',
    ],
    skills: [
      'Close reading',
      'Literary analysis',
      'Academic writing',
      'Critical thinking',
      'Research methods',
      'Editing / proofreading',
      'Citation & referencing',
      'Textual analysis',
      'Content writing',
      'Presentation skills',
      'Archival research',
      'Argumentation',
    ],
  },
  {
    keys: [
      'humanities',
      'liberal arts',
      'philosophy',
      'history',
      'classics',
      'classical studies',
      'linguistics',
      'languages',
      'modern languages',
      'language studies',
      'translation',
      'cultural studies',
      'theology',
      'religious studies',
    ],
    skills: [
      'Academic writing',
      'Critical thinking',
      'Research methods',
      'Source analysis',
      'Citation & referencing',
      'Argumentation',
      'Archival research',
      'Presentation skills',
      'Editing / proofreading',
      'Comparative analysis',
    ],
  },
  {
    keys: [
      'journalism',
      'media studies',
      'mass communication',
      'communications',
      'communication studies',
      'film studies',
      'broadcasting',
      'digital media',
      'publishing',
    ],
    skills: [
      'News writing',
      'Interviewing',
      'Editing',
      'Storytelling',
      'Research',
      'Social media',
      'Fact-checking',
      'Public speaking',
      'Content production',
      'AP / house style',
    ],
  },
  {
    keys: ['marketing', 'digital marketing', 'advertising', 'brand management', 'public relations', 'pr '],
    skills: [
      'Content writing',
      'Social media',
      'SEO basics',
      'Canva / Adobe',
      'Campaign planning',
      'Analytics (GA)',
      'Copywriting',
      'Market research',
      'Public speaking',
    ],
  },
  {
    keys: [
      'psychology',
      'counselling',
      'counseling',
      'sociology',
      'social work',
      'anthropology',
      'political science',
      'politics',
      'international relations',
      'development studies',
      'geography',
    ],
    skills: [
      'Research methods',
      'Qualitative analysis',
      'Quantitative analysis',
      'Report writing',
      'Interviewing',
      'Critical thinking',
      'SPSS / stats basics',
      'Case notes',
      'Presentation skills',
      'Ethics awareness',
    ],
  },
  {
    keys: ['fine art', 'fine arts', 'visual arts', 'graphic design', 'design', 'illustration', 'photography', 'fashion', 'music', 'theatre', 'drama', 'performing arts'],
    skills: [
      'Visual composition',
      'Adobe Creative Suite',
      'Concept development',
      'Portfolio building',
      'Critique / feedback',
      'Project delivery',
      'Client communication',
      'Typography basics',
      'Creative direction',
    ],
  },
  {
    keys: ['electrical', 'electronic', 'electronics', 'mechatronic', 'mechatronics'],
    skills: [
      'Circuit design',
      'MATLAB',
      'Embedded C',
      'PCB basics',
      'Power systems',
      'Signal processing',
      'AutoCAD Electrical',
      'Troubleshooting',
    ],
  },
  {
    keys: ['mechanical', 'industrial engineering', 'manufacturing', 'automotive'],
    skills: [
      'SolidWorks',
      'AutoCAD',
      'MATLAB',
      'Thermodynamics',
      'Manufacturing processes',
      'Project management',
      'Quality control',
      'CNC basics',
    ],
  },
  {
    keys: ['civil', 'construction', 'architecture', 'quantity surveying', 'structural engineering'],
    skills: [
      'AutoCAD',
      'Revit',
      'Structural analysis',
      'Project scheduling',
      'Quantity surveying basics',
      'Site supervision',
      'Microsoft Project',
    ],
  },
  {
    keys: ['business', 'commerce', 'management', 'mba', 'administration', 'entrepreneurship', 'human resources', 'hr ', 'supply chain', 'operations'],
    skills: [
      'Excel',
      'Financial analysis',
      'Market research',
      'Presentation skills',
      'Project management',
      'CRM tools',
      'Negotiation',
      'Operations basics',
    ],
  },
  {
    keys: ['finance', 'accounting', 'economics', 'banking', 'actuarial', 'investment'],
    skills: [
      'Excel',
      'Financial modeling',
      'Accounting principles',
      'QuickBooks / Sage',
      'Budgeting',
      'Risk analysis',
      'Auditing basics',
      'Power BI',
    ],
  },
  {
    keys: ['medicine', 'nursing', 'health', 'pharmacy', 'public health', 'clinical', 'biomedical', 'physiotherapy', 'dentistry', 'midwifery'],
    skills: [
      'Patient care',
      'Clinical documentation',
      'Medical research literacy',
      'Public health basics',
      'Lab safety',
      'Health education',
      'EMR familiarity',
      'First aid / CPR',
    ],
  },
  {
    keys: ['education', 'teaching', 'pedagogy', 'early childhood', 'curriculum'],
    skills: [
      'Lesson planning',
      'Classroom management',
      'Curriculum design',
      'Assessment design',
      'Educational technology',
      'Mentoring',
      'Public speaking',
    ],
  },
  {
    keys: ['law', 'legal', 'paralegal', 'jurisprudence', 'llb', 'llm'],
    skills: [
      'Legal research',
      'Contract review',
      'Case analysis',
      'Legal writing',
      'Compliance basics',
      'Negotiation',
      'Document drafting',
    ],
  },
  {
    keys: [
      'biology',
      'chemistry',
      'physics',
      'biochemistry',
      'microbiology',
      'biotechnology',
      'environmental science',
      'environmental studies',
      'ecology',
      'geology',
      'mathematics',
      'applied mathematics',
      'natural science',
    ],
    skills: [
      'Lab techniques',
      'Scientific writing',
      'Data analysis',
      'Research methods',
      'Field work',
      'Report writing',
      'Safety protocols',
      'Experiment design',
    ],
  },
  {
    keys: ['agriculture', 'agronomy', 'veterinary', 'animal science', 'forestry', 'horticulture'],
    skills: [
      'Field assessment',
      'Crop / livestock knowledge',
      'Report writing',
      'Data collection',
      'Safety protocols',
      'Extension / outreach',
      'GIS basics',
      'Project planning',
    ],
  },
  {
    keys: ['hospitality', 'tourism', 'hotel management', 'culinary', 'event management'],
    skills: [
      'Customer service',
      'Operations coordination',
      'Event planning',
      'Communication',
      'Problem solving',
      'Cash handling',
      'Team leadership',
      'Vendor management',
    ],
  },
]

const FALLBACK = [
  'Communication',
  'Teamwork',
  'Problem solving',
  'Time management',
  'Microsoft Office',
  'Research',
  'Writing',
  'Critical thinking',
]

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeField(field) {
  return String(field || '')
    .toLowerCase()
    .replace(/[+]/g, ' ')
    .replace(/[^a-z0-9.\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Whole-word / phrase match — never match “cs” inside “bsc”. */
function fieldHasKey(fieldNorm, key) {
  const k = String(key || '')
    .toLowerCase()
    .trim()
  if (!k || !fieldNorm) return false

  if (k.includes(' ')) {
    return fieldNorm.includes(k)
  }

  const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(k)}(?:$|[^a-z0-9])`, 'i')
  return re.test(fieldNorm)
}

function entryMatchesField(entry, fieldNorm) {
  const longHit = (entry.keys || []).some((k) => fieldHasKey(fieldNorm, k))
  if (longHit) return true
  return (entry.shortKeys || []).some((k) => fieldHasKey(fieldNorm, k))
}

/**
 * Score how specifically an entry matches a field (longer key wins).
 * Prevents vague overlaps from drowning out the best category.
 */
function matchScore(entry, fieldNorm) {
  let best = 0
  for (const k of [...(entry.keys || []), ...(entry.shortKeys || [])]) {
    if (!fieldHasKey(fieldNorm, k)) continue
    const score = String(k).trim().length
    if (score > best) best = score
  }
  return best
}

export function suggestSkillsForFields(fields = []) {
  const norms = fields.map(normalizeField).filter(Boolean)
  if (!norms.length) return [...FALLBACK]

  const ranked = []

  for (const fieldNorm of norms) {
    for (const entry of CATALOG) {
      const score = matchScore(entry, fieldNorm)
      if (score > 0) ranked.push({ entry, score, fieldNorm })
    }
  }

  if (!ranked.length) return [...FALLBACK]

  // Per field, keep only the strongest category (and near-ties within 2 chars)
  const byField = new Map()
  for (const row of ranked) {
    const cur = byField.get(row.fieldNorm) || []
    cur.push(row)
    byField.set(row.fieldNorm, cur)
  }

  const found = new Set()
  for (const rows of byField.values()) {
    const top = Math.max(...rows.map((r) => r.score))
    rows
      .filter((r) => r.score >= top - 2)
      .forEach((r) => r.entry.skills.forEach((s) => found.add(s)))
  }

  return found.size ? [...found] : [...FALLBACK]
}

export function suggestSkillsFromQualifications(qualifications = []) {
  return suggestSkillsForFields((qualifications || []).map((q) => q.field))
}

/** Fix common typos before save / display so reasoning stays accurate. */
const SKILL_ALIASES = {
  reacct: 'React',
  reactjs: 'React',
  'react.js': 'React',
  node: 'Node.js',
  nodejs: 'Node.js',
  'node.js': 'Node.js',
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  py: 'Python',
  python: 'Python',
  fullstack: 'Full stack developer',
  'full-stack': 'Full stack developer',
  'full stack': 'Full stack developer',
}

export function normalizeSkillName(name = '') {
  const trimmed = String(name).trim().replace(/\s+/g, ' ')
  if (!trimmed) return ''
  const alias = SKILL_ALIASES[trimmed.toLowerCase()]
  if (alias) return alias
  if (trimmed === trimmed.toLowerCase() && trimmed.length <= 24 && !trimmed.includes('.')) {
    return trimmed.replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return trimmed
}

/** Catalog list for “is this a suggested pick?” checks on Profile. */
export function allCatalogSkills() {
  const set = new Set(FALLBACK)
  CATALOG.forEach((e) => e.skills.forEach((s) => set.add(s)))
  return [...set]
}
