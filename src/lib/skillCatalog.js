/**
 * Suggested skills keyed by degree/certificate field.
 * Matching uses word boundaries so “BSc Literature” never matches CS via “cs”.
 * Catalog aims to cover common global degree / certificate fields.
 */

const CATALOG = [
  // —— Computing & digital ——
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
      'information security',
      'network engineering',
      'full stack',
      'web development',
      'mobile development',
      'game development',
      'programming',
      'computer applications',
      'computer studies',
    ],
    shortKeys: ['cs', 'se', 'it', 'cis', 'bca', 'mca'],
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
      'statistical science',
      'machine learning',
      'artificial intelligence',
      'data engineering',
      'big data',
      'actuarial science',
      'quantitative methods',
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

  // —— Literature, languages, humanities ——
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
      'african literature',
      'world literature',
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
      'linguistics',
      'languages',
      'modern languages',
      'language studies',
      'translation',
      'interpreting',
      'applied linguistics',
      'french',
      'spanish',
      'german',
      'portuguese',
      'arabic',
      'chinese',
      'japanese',
      'swahili',
      'setswana',
      'isiZulu',
      'afrikaans',
      'foreign languages',
    ],
    skills: [
      'Translation',
      'Interpretation',
      'Academic writing',
      'Cross-cultural communication',
      'Proofreading',
      'Language teaching basics',
      'Research methods',
      'Presentation skills',
      'Listening comprehension',
      'Terminology management',
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
      'cultural studies',
      'theology',
      'religious studies',
      'divinity',
      'archaeology',
      'museum studies',
      'heritage studies',
      'african studies',
      'gender studies',
      'area studies',
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

  // —— Media & creative ——
  {
    keys: [
      'journalism',
      'media studies',
      'mass communication',
      'communications',
      'communication studies',
      'film studies',
      'film production',
      'broadcasting',
      'digital media',
      'publishing',
      'multimedia',
      'radio',
      'television',
      'media production',
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
    keys: [
      'fine art',
      'fine arts',
      'visual arts',
      'graphic design',
      'industrial design',
      'product design',
      'interior design',
      'illustration',
      'photography',
      'fashion',
      'fashion design',
      'textile design',
      'music',
      'musicology',
      'theatre',
      'drama',
      'performing arts',
      'dance',
      'animation',
      'game design',
      'ui design',
      'ux design',
      'interaction design',
    ],
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
      'Prototyping',
    ],
  },
  {
    keys: ['marketing', 'digital marketing', 'advertising', 'brand management', 'public relations', 'branding'],
    shortKeys: ['pr'],
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
      'Brand strategy',
    ],
  },

  // —— Social sciences ——
  {
    keys: [
      'psychology',
      'counselling',
      'counseling',
      'clinical psychology',
      'organisational psychology',
      'organizational psychology',
      'sociology',
      'social work',
      'anthropology',
      'political science',
      'politics',
      'government',
      'public policy',
      'public administration',
      'international relations',
      'development studies',
      'peace studies',
      'geography',
      'human geography',
      'demography',
      'criminology',
      'criminal justice',
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

  // —— Business & economics ——
  {
    keys: [
      'business',
      'business administration',
      'business management',
      'commerce',
      'management',
      'mba',
      'administration',
      'entrepreneurship',
      'human resources',
      'human resource management',
      'supply chain',
      'logistics',
      'operations',
      'operations management',
      'project management',
      'office administration',
      'secretarial studies',
      'retail management',
      'international business',
    ],
    shortKeys: ['hr', 'bba', 'bcom'],
    skills: [
      'Excel',
      'Financial analysis',
      'Market research',
      'Presentation skills',
      'Project management',
      'CRM tools',
      'Negotiation',
      'Operations basics',
      'Stakeholder communication',
    ],
  },
  {
    keys: [
      'finance',
      'accounting',
      'economics',
      'banking',
      'investment',
      'financial management',
      'chartered accounting',
      'taxation',
      'audit',
      'auditing',
    ],
    shortKeys: ['cfa', 'acca', 'cpa'],
    skills: [
      'Excel',
      'Financial modeling',
      'Accounting principles',
      'QuickBooks / Sage',
      'Budgeting',
      'Risk analysis',
      'Auditing basics',
      'Power BI',
      'Financial reporting',
    ],
  },

  // —— Law ——
  {
    keys: [
      'law',
      'legal studies',
      'paralegal',
      'jurisprudence',
      'llb',
      'llm',
      'criminal law',
      'commercial law',
      'international law',
      'human rights',
    ],
    skills: [
      'Legal research',
      'Contract review',
      'Case analysis',
      'Legal writing',
      'Compliance basics',
      'Negotiation',
      'Document drafting',
      'Citation of cases',
    ],
  },

  // —— Education ——
  {
    keys: [
      'education',
      'teaching',
      'pedagogy',
      'early childhood',
      'early childhood education',
      'primary education',
      'secondary education',
      'curriculum',
      'curriculum studies',
      'special education',
      'inclusive education',
      'educational psychology',
      'adult education',
      'teacher training',
      'bed',
      'med',
    ],
    skills: [
      'Lesson planning',
      'Classroom management',
      'Curriculum design',
      'Assessment design',
      'Educational technology',
      'Mentoring',
      'Public speaking',
      'Differentiated instruction',
    ],
  },

  // —— Health & medicine ——
  {
    keys: [
      'medicine',
      'medical science',
      'nursing',
      'midwifery',
      'health',
      'health science',
      'health sciences',
      'pharmacy',
      'pharmacology',
      'public health',
      'clinical',
      'clinical medicine',
      'biomedical',
      'biomedical science',
      'physiotherapy',
      'physical therapy',
      'occupational therapy',
      'dentistry',
      'dental',
      'radiography',
      'medical laboratory',
      'laboratory science',
      'nutrition',
      'dietetics',
      'epidemiology',
      'veterinary',
      'veterinary science',
      'veterinary medicine',
      'optometry',
      'speech therapy',
      'audiology',
    ],
    shortKeys: ['mbbs', 'md', 'bsn'],
    skills: [
      'Patient care',
      'Clinical documentation',
      'Medical research literacy',
      'Public health basics',
      'Lab safety',
      'Health education',
      'EMR familiarity',
      'First aid / CPR',
      'Ethics & confidentiality',
    ],
  },

  // —— Natural & physical sciences ——
  {
    keys: [
      'biology',
      'biological sciences',
      'chemistry',
      'chemical sciences',
      'physics',
      'biochemistry',
      'microbiology',
      'biotechnology',
      'molecular biology',
      'genetics',
      'neuroscience',
      'environmental science',
      'environmental studies',
      'ecology',
      'geology',
      'earth science',
      'earth sciences',
      'oceanography',
      'meteorology',
      'astronomy',
      'mathematics',
      'applied mathematics',
      'pure mathematics',
      'natural science',
      'natural sciences',
      'life sciences',
      'forensic science',
      'materials science',
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
      'Statistical literacy',
    ],
  },

  // —— Engineering (by branch) ——
  {
    keys: ['electrical', 'electronic', 'electronics', 'electrical engineering', 'electronic engineering', 'mechatronic', 'mechatronics', 'telecommunications', 'telecom'],
    skills: [
      'Circuit design',
      'MATLAB',
      'Embedded C',
      'PCB basics',
      'Power systems',
      'Signal processing',
      'AutoCAD Electrical',
      'Troubleshooting',
      'Instrumentation',
    ],
  },
  {
    keys: [
      'mechanical',
      'mechanical engineering',
      'industrial engineering',
      'manufacturing',
      'manufacturing engineering',
      'automotive',
      'automotive engineering',
      'aerospace',
      'aeronautical',
      'aerospace engineering',
    ],
    skills: [
      'SolidWorks',
      'AutoCAD',
      'MATLAB',
      'Thermodynamics',
      'Manufacturing processes',
      'Project management',
      'Quality control',
      'CNC basics',
      'GD&T basics',
    ],
  },
  {
    keys: [
      'civil',
      'civil engineering',
      'construction',
      'construction management',
      'architecture',
      'architectural studies',
      'quantity surveying',
      'structural engineering',
      'urban planning',
      'town planning',
      'surveying',
      'geomatics',
    ],
    skills: [
      'AutoCAD',
      'Revit',
      'Structural analysis',
      'Project scheduling',
      'Quantity surveying basics',
      'Site supervision',
      'Microsoft Project',
      'Building codes awareness',
    ],
  },
  {
    keys: [
      'chemical engineering',
      'process engineering',
      'petroleum engineering',
      'mining',
      'mining engineering',
      'metallurgy',
      'materials engineering',
      'nuclear engineering',
      'environmental engineering',
      'biomedical engineering',
      'systems engineering',
      'engineering',
    ],
    skills: [
      'Process analysis',
      'MATLAB / Aspen basics',
      'Safety & HSE',
      'Technical reporting',
      'Project management',
      'Quality assurance',
      'Data analysis',
      'Problem solving',
      'CAD familiarity',
    ],
  },

  // —— Agriculture & environment ——
  {
    keys: [
      'agriculture',
      'agricultural science',
      'agricultural economics',
      'agronomy',
      'animal science',
      'animal husbandry',
      'forestry',
      'horticulture',
      'fisheries',
      'aquaculture',
      'soil science',
      'food science',
      'food technology',
      'wildlife management',
      'natural resource management',
    ],
    skills: [
      'Field assessment',
      'Crop / livestock knowledge',
      'Report writing',
      'Data collection',
      'Safety protocols',
      'Extension / outreach',
      'GIS basics',
      'Project planning',
      'Sustainable practices',
    ],
  },

  // —— Hospitality, tourism, sport ——
  {
    keys: [
      'hospitality',
      'hospitality management',
      'tourism',
      'tourism management',
      'hotel management',
      'culinary',
      'culinary arts',
      'chef',
      'event management',
      'events management',
      'catering',
    ],
    skills: [
      'Customer service',
      'Operations coordination',
      'Event planning',
      'Communication',
      'Problem solving',
      'Cash handling',
      'Team leadership',
      'Vendor management',
      'Food safety awareness',
    ],
  },
  {
    keys: [
      'sport science',
      'sports science',
      'exercise science',
      'kinesiology',
      'physical education',
      'coaching',
      'sports management',
      'recreation',
    ],
    skills: [
      'Training program design',
      'Fitness assessment',
      'Coaching communication',
      'Injury awareness',
      'Motivation techniques',
      'Performance tracking',
      'First aid',
      'Team leadership',
    ],
  },

  // —— Library, information, archives ——
  {
    keys: [
      'library science',
      'library studies',
      'information science',
      'archival studies',
      'records management',
      'knowledge management',
    ],
    skills: [
      'Cataloguing',
      'Information literacy',
      'Database searching',
      'Records management',
      'Research support',
      'Digital archiving',
      'Customer service',
      'Metadata basics',
    ],
  },

  // —— Trades & vocational ——
  {
    keys: [
      'plumbing',
      'electrical installation',
      'carpentry',
      'welding',
      'automotive repair',
      'mechanic',
      'mechanics',
      'building construction',
      'bricklaying',
      'fitting and turning',
      'boiler making',
      'technical studies',
      'vocational',
      'trade certificate',
      'artisan',
    ],
    skills: [
      'Technical troubleshooting',
      'Hand tools & equipment',
      'Safety (HSE)',
      'Blueprint reading',
      'Measurement accuracy',
      'Maintenance routines',
      'Customer communication',
      'Quality finishing',
    ],
  },

  // —— Aviation, maritime, transport ——
  {
    keys: [
      'aviation',
      'piloting',
      'aeronautics',
      'aircraft maintenance',
      'maritime',
      'nautical',
      'shipping',
      'transport',
      'transportation',
      'logistics management',
    ],
    skills: [
      'Safety procedures',
      'Regulatory compliance',
      'Operational checklists',
      'Navigation basics',
      'Technical reporting',
      'Situational awareness',
      'Team coordination',
      'Emergency response',
    ],
  },

  // —— Real estate, insurance ——
  {
    keys: ['real estate', 'property studies', 'property management', 'insurance', 'actuarial practice', 'estate agency'],
    skills: [
      'Client advising',
      'Contract literacy',
      'Market appraisal',
      'Negotiation',
      'Compliance basics',
      'CRM / pipeline tracking',
      'Report writing',
      'Risk assessment',
    ],
  },

  // —— Social care & community ——
  {
    keys: [
      'community development',
      'community studies',
      'youth work',
      'social care',
      'disability studies',
      'family studies',
      'development practice',
      'ngo management',
      'humanitarian studies',
    ],
    skills: [
      'Community engagement',
      'Needs assessment',
      'Case management',
      'Facilitation',
      'Report writing',
      'Stakeholder mapping',
      'Safeguarding awareness',
      'Project coordination',
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

/** Soft cues when no catalog row hits — still better than generic-only. */
const HEURISTICS = [
  {
    test: /\b(engineer|engineering)\b/,
    skills: [
      'Technical reporting',
      'Problem solving',
      'CAD familiarity',
      'Project management',
      'Data analysis',
      'Safety awareness',
      'MATLAB basics',
      'Teamwork',
    ],
  },
  {
    test: /\b(science|sciences|scientific)\b/,
    skills: [
      'Research methods',
      'Data analysis',
      'Scientific writing',
      'Lab / field methods',
      'Report writing',
      'Critical thinking',
      'Statistics basics',
    ],
  },
  {
    test: /\b(art|arts|design|creative)\b/,
    skills: [
      'Concept development',
      'Portfolio building',
      'Visual communication',
      'Critique / feedback',
      'Project delivery',
      'Adobe / Canva basics',
      'Client communication',
    ],
  },
  {
    test: /\b(study|studies|research)\b/,
    skills: [
      'Academic writing',
      'Research methods',
      'Critical thinking',
      'Citation & referencing',
      'Presentation skills',
      'Literature review',
      'Analysis',
    ],
  },
  {
    test: /\b(management|admin|administration|business)\b/,
    skills: [
      'Excel',
      'Project coordination',
      'Communication',
      'Organisation',
      'Stakeholder management',
      'Report writing',
      'Problem solving',
    ],
  },
  {
    test: /\b(health|care|clinical|medical|nursing)\b/,
    skills: [
      'Patient / client care',
      'Documentation',
      'Ethics & confidentiality',
      'Team communication',
      'Health education',
      'Safety protocols',
    ],
  },
  {
    test: /\b(tech|technology|digital|computing)\b/,
    skills: [
      'Problem solving',
      'Digital literacy',
      'Documentation',
      'Basic scripting awareness',
      'Troubleshooting',
      'Collaboration tools',
    ],
  },
  {
    test: /\b(teach|teaching|education|pedagog)\b/,
    skills: [
      'Lesson planning',
      'Classroom management',
      'Assessment',
      'Communication',
      'Mentoring',
      'Educational technology',
    ],
  },
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

function matchScore(entry, fieldNorm) {
  let best = 0
  for (const k of [...(entry.keys || []), ...(entry.shortKeys || [])]) {
    if (!fieldHasKey(fieldNorm, k)) continue
    const score = String(k).trim().length
    if (score > best) best = score
  }
  return best
}

function heuristicSkills(fieldNorm) {
  const found = new Set()
  for (const h of HEURISTICS) {
    if (h.test.test(fieldNorm)) h.skills.forEach((s) => found.add(s))
  }
  return [...found]
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

  const found = new Set()

  if (ranked.length) {
    const byField = new Map()
    for (const row of ranked) {
      const cur = byField.get(row.fieldNorm) || []
      cur.push(row)
      byField.set(row.fieldNorm, cur)
    }

    for (const rows of byField.values()) {
      const top = Math.max(...rows.map((r) => r.score))
      rows
        .filter((r) => r.score >= top - 2)
        .forEach((r) => r.entry.skills.forEach((s) => found.add(s)))
    }
  } else {
    // Unknown field: use heuristics, then soft skills
    for (const fieldNorm of norms) {
      heuristicSkills(fieldNorm).forEach((s) => found.add(s))
    }
    if (!found.size) FALLBACK.forEach((s) => found.add(s))
    else FALLBACK.slice(0, 4).forEach((s) => found.add(s))
  }

  return [...found]
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
