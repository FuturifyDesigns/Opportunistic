/** Curated boards + profile-aware reasoning until SearXNG Edge Function ships. */

const SCHOLARSHIP_SOURCES = [
  {
    title: 'Chevening Scholarships',
    url: 'https://www.chevening.org/scholarships/',
    source: 'Chevening',
    fields: ['any'],
    regions: ['global', 'commonwealth'],
  },
  {
    title: 'DAAD Scholarships Database',
    url: 'https://www.daad.de/en/studying-in-germany/scholarships/',
    source: 'DAAD',
    fields: ['engineering', 'science', 'computer', 'business', 'any'],
    regions: ['global', 'africa', 'europe'],
  },
  {
    title: 'Mastercard Foundation Scholars Program',
    url: 'https://mastercardfdn.org/en/scholarships/',
    source: 'Mastercard Foundation',
    fields: ['any'],
    regions: ['africa', 'botswana', 'global'],
  },
  {
    title: 'Fulbright Foreign Student Program',
    url: 'https://foreign.fulbrightonline.org/',
    source: 'Fulbright',
    fields: ['any'],
    regions: ['global'],
  },
  {
    title: 'UNESCO Fellowships',
    url: 'https://www.unesco.org/en/fellowships',
    source: 'UNESCO',
    fields: ['education', 'science', 'culture', 'any'],
    regions: ['global'],
  },
  {
    title: 'Gates Cambridge Scholarship',
    url: 'https://www.gatescambridge.org/',
    source: 'Gates Cambridge',
    fields: ['any'],
    regions: ['global'],
  },
  {
    title: 'African Union Scholarship Portal',
    url: 'https://au.int/',
    source: 'African Union',
    fields: ['any'],
    regions: ['africa', 'botswana', 'southern africa'],
  },
  {
    title: 'ScholarshipPortal — Europe',
    url: 'https://www.scholarshipportal.com/',
    source: 'ScholarshipPortal',
    fields: ['any'],
    regions: ['europe', 'global'],
  },
]

const JOB_SOURCES = [
  {
    titleTemplate: '{field} roles — LinkedIn',
    urlTemplate: 'https://www.linkedin.com/jobs/search/?keywords={query}',
    company: 'Multiple employers',
    source: 'LinkedIn',
  },
  {
    titleTemplate: '{field} jobs — Indeed',
    urlTemplate: 'https://www.indeed.com/jobs?q={query}&l={country}',
    company: 'Multiple employers',
    source: 'Indeed',
  },
  {
    titleTemplate: 'Remote {field} openings — Remote OK',
    urlTemplate: 'https://remoteok.com/remote-{slug}-jobs',
    company: 'Remote employers',
    source: 'Remote OK',
  },
  {
    titleTemplate: '{field} careers — Glassdoor',
    urlTemplate: 'https://www.glassdoor.com/Job/jobs.htm?sc.keyword={query}',
    company: 'Multiple employers',
    source: 'Glassdoor',
  },
  {
    titleTemplate: '{country} opportunities — ReliefWeb Jobs',
    urlTemplate: 'https://reliefweb.int/jobs',
    company: 'NGOs & agencies',
    source: 'ReliefWeb',
  },
]

function slugify(value) {
  return String(value || 'jobs')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function regionHints(country = '') {
  const c = country.toLowerCase()
  const hints = ['global']
  if (c.includes('botswana') || c.includes('namibia') || c.includes('south africa') || c.includes('zambia') || c.includes('zimbabwe')) {
    hints.push('africa', 'southern africa', 'botswana')
  } else if (c.includes('nigeria') || c.includes('ghana') || c.includes('kenya') || c.includes('africa')) {
    hints.push('africa')
  } else if (c.includes('united kingdom') || c.includes('germany') || c.includes('france') || c.includes('europe')) {
    hints.push('europe')
  }
  return hints
}

function primaryField(qualifications = [], skills = []) {
  const fromQual = qualifications.map((q) => q.field).filter(Boolean)
  const fromSkill = skills.map((s) => s.skill_name).filter(Boolean)
  return fromQual[0] || fromSkill[0] || 'professional development'
}

function scoreScholarship(item, profile, qualifications, skills) {
  const regions = regionHints(profile.country)
  const blob = `${qualifications.map((q) => q.field).join(' ')} ${skills.map((s) => s.skill_name).join(' ')}`.toLowerCase()
  let score = 55
  if (item.regions.some((r) => regions.includes(r))) score += 18
  if (item.fields.some((f) => f === 'any' || blob.includes(f))) score += 15
  if (profile.country) score += 5
  if (qualifications.length) score += 4
  if (skills.length) score += 3
  return Math.min(98, score)
}

function reasonScholarship(item, profile, qualifications, skills) {
  const field = primaryField(qualifications, skills)
  const skillBits = skills.slice(0, 2).map((s) => s.skill_name).join(' + ')
  const country = profile.country || 'your region'
  const quals = qualifications[0]
    ? `${qualifications[0].type === 'degree' ? 'degree' : 'certificate'} in ${qualifications[0].field}`
    : `background in ${field}`
  return `Matches your ${quals}${skillBits ? ` and ${skillBits}` : ''}; ${item.source} listings often welcome applicants from ${country}.`
}

function reasonJob(source, profile, qualifications, skills) {
  const field = primaryField(qualifications, skills)
  const skillBits = skills.slice(0, 3).map((s) => s.skill_name).join(', ')
  const country = profile.country || 'your selected country'
  return `Aligned with your ${field} profile${skillBits ? ` (${skillBits})` : ''} and filtered toward openings relevant to ${country}.`
}

export function buildScholarshipMatches(profile, qualifications, skills) {
  return SCHOLARSHIP_SOURCES.map((item) => {
    const match_score = scoreScholarship(item, profile, qualifications, skills)
    return {
      title: item.title,
      url: item.url,
      source: item.source,
      reasoning: reasonScholarship(item, profile, qualifications, skills),
      match_score,
      deadline: null,
    }
  }).sort((a, b) => b.match_score - a.match_score)
}

export function buildJobMatches(profile, qualifications, skills) {
  const field = primaryField(qualifications, skills)
  const query = encodeURIComponent([field, ...skills.slice(0, 2).map((s) => s.skill_name)].filter(Boolean).join(' '))
  const country = encodeURIComponent(profile.country || '')
  const slug = slugify(skills[0]?.skill_name || field)

  return JOB_SOURCES.map((item, index) => {
    const match_score = Math.min(96, 62 + skills.length * 4 + qualifications.length * 3 - index)
    return {
      title: item.titleTemplate.replace('{field}', field).replace('{country}', profile.country || 'Local'),
      url: item.urlTemplate
        .replace('{query}', query)
        .replace('{country}', country)
        .replace('{slug}', slug),
      company: item.company,
      source: item.source,
      reasoning: reasonJob(item, profile, qualifications, skills),
      match_score,
    }
  }).sort((a, b) => b.match_score - a.match_score)
}
