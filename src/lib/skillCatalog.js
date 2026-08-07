/** Suggested skills keyed by degree/certificate field keywords. */

const CATALOG = [
  {
    keys: ['computer', 'software', 'information technology', 'it ', 'informatics', 'computing', 'cs'],
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
    keys: ['data science', 'analytics', 'statistics', 'machine learning', 'ai'],
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
    keys: ['electrical', 'electronic', 'mechatronic'],
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
    keys: ['mechanical', 'industrial engineering', 'manufacturing'],
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
    keys: ['civil', 'construction', 'architecture'],
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
    keys: ['business', 'commerce', 'management', 'mba', 'administration'],
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
    keys: ['finance', 'accounting', 'economics', 'banking'],
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
    keys: ['marketing', 'communications', 'media', 'journalism'],
    skills: [
      'Content writing',
      'Social media',
      'SEO basics',
      'Canva / Adobe',
      'Campaign planning',
      'Analytics (GA)',
      'Copywriting',
      'Public speaking',
    ],
  },
  {
    keys: ['medicine', 'nursing', 'health', 'pharmacy', 'public health', 'clinical'],
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
    keys: ['education', 'teaching', 'pedagogy'],
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
    keys: ['law', 'legal', 'paralegal'],
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
    keys: ['biology', 'chemistry', 'physics', 'science', 'environmental'],
    skills: [
      'Lab techniques',
      'Scientific writing',
      'Data analysis',
      'Research methods',
      'Field work',
      'Report writing',
      'Safety protocols',
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
  'Leadership',
]

export function suggestSkillsForFields(fields = []) {
  const blob = fields.map((f) => String(f || '').toLowerCase()).join(' | ')
  const found = new Set()

  CATALOG.forEach((entry) => {
    if (entry.keys.some((k) => blob.includes(k.trim()))) {
      entry.skills.forEach((s) => found.add(s))
    }
  })

  if (!found.size) FALLBACK.forEach((s) => found.add(s))
  return [...found]
}

export function suggestSkillsFromQualifications(qualifications = []) {
  return suggestSkillsForFields(qualifications.map((q) => q.field))
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
  // Title-case short tokens only when all-lowercase
  if (trimmed === trimmed.toLowerCase() && trimmed.length <= 24 && !trimmed.includes('.')) {
    return trimmed.replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return trimmed
}

