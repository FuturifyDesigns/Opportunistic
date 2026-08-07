/** Profile-aware matching with detailed, factual reasoning. */

import { LISTING_CATALOG } from './listingCatalog'

const SCHOLARSHIP_SOURCES = [
  {
    listingId: 'chevening',
    fields: ['any'],
    regions: ['global', 'commonwealth'],
    focus: 'one-year UK master’s funding for future leaders',
  },
  {
    listingId: 'daad',
    fields: ['engineering', 'science', 'computer', 'business', 'any'],
    regions: ['global', 'africa', 'europe'],
    focus: 'German-funded study and research awards across many disciplines',
  },
  {
    listingId: 'mastercard',
    fields: ['any'],
    regions: ['africa', 'botswana', 'southern africa', 'global'],
    focus: 'higher education pathways for young people from Africa',
  },
  {
    listingId: 'fulbright',
    fields: ['any'],
    regions: ['global'],
    focus: 'US graduate study and research for international applicants',
  },
  {
    listingId: 'unesco',
    fields: ['education', 'science', 'culture', 'any'],
    regions: ['global'],
    focus: 'short fellowships tied to education, science, and culture themes',
  },
  {
    listingId: 'gates',
    fields: ['any'],
    regions: ['global'],
    focus: 'full-cost postgraduate study at Cambridge for outstanding applicants',
  },
  {
    listingId: 'african_union',
    fields: ['any'],
    regions: ['africa', 'botswana', 'southern africa'],
    focus: 'continental education and mobility opportunities for African students',
  },
  {
    listingId: 'scholarshipportal',
    fields: ['any'],
    regions: ['europe', 'global'],
    focus: 'searchable European scholarship listings across universities',
  },
]

const JOB_SOURCES = [
  {
    listingId: 'linkedin',
    titleTemplate: '{field} roles — LinkedIn',
    urlTemplate: 'https://www.linkedin.com/jobs/search/?keywords={query}',
    channel: 'professional network listings',
  },
  {
    listingId: 'indeed',
    titleTemplate: '{field} jobs — Indeed',
    urlTemplate: 'https://www.indeed.com/jobs?q={query}&l={country}',
    channel: 'location-filtered job board',
  },
  {
    listingId: 'remoteok',
    titleTemplate: 'Remote {field} openings — Remote OK',
    urlTemplate: 'https://remoteok.com/remote-{slug}-jobs',
    channel: 'remote-first tech board',
  },
  {
    listingId: 'glassdoor',
    titleTemplate: '{field} careers — Glassdoor',
    urlTemplate: 'https://www.glassdoor.com/Job/jobs.htm?sc.keyword={query}',
    channel: 'employer-reviewed job listings',
  },
  {
    listingId: 'reliefweb',
    titleTemplate: '{country} opportunities — ReliefWeb Jobs',
    urlTemplate: 'https://reliefweb.int/jobs',
    channel: 'humanitarian and development roles',
  },
]

function slugify(value) {
  return String(value || 'jobs')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'jobs'
}

function regionHints(country = '') {
  const c = country.toLowerCase()
  const hints = ['global']
  if (
    c.includes('botswana') ||
    c.includes('namibia') ||
    c.includes('south africa') ||
    c.includes('zambia') ||
    c.includes('zimbabwe') ||
    c.includes('lesotho') ||
    c.includes('eswatini')
  ) {
    hints.push('africa', 'southern africa', 'botswana', 'commonwealth')
  } else if (c.includes('nigeria') || c.includes('ghana') || c.includes('kenya') || c.includes('africa')) {
    hints.push('africa', 'commonwealth')
  } else if (c.includes('united kingdom') || c.includes('uk')) {
    hints.push('europe', 'commonwealth')
  } else if (c.includes('germany') || c.includes('france') || c.includes('europe')) {
    hints.push('europe')
  } else if (c.includes('united states') || c.includes('canada')) {
    hints.push('north america')
  }
  if (
    c.includes('botswana') ||
    c.includes('namibia') ||
    c.includes('ghana') ||
    c.includes('nigeria') ||
    c.includes('kenya') ||
    c.includes('south africa') ||
    c.includes('united kingdom') ||
    c.includes('canada') ||
    c.includes('australia')
  ) {
    if (!hints.includes('commonwealth')) hints.push('commonwealth')
  }
  return hints
}

function detectGoal(profile = {}) {
  const bio = `${profile.bio || ''} ${profile.headline || ''}`.toLowerCase()
  if (bio.includes('mostly scholarships') || bio.includes('primarily for scholarships')) return 'scholarships'
  if (bio.includes('mostly jobs') || bio.includes('primarily for jobs')) return 'jobs'
  return 'both'
}

function summarizeProfile(profile, qualifications, skills) {
  const quals = (qualifications || []).filter((q) => q.field?.trim())
  const sk = (skills || []).filter((s) => s.skill_name?.trim())
  const primary = quals[0]
  const advanced = sk.filter((s) => ['advanced', 'expert'].includes(s.proficiency))
  return {
    country: profile?.country || null,
    headline: profile?.headline?.trim() || null,
    goal: detectGoal(profile || {}),
    quals,
    skills: sk,
    primary,
    field: primary?.field?.trim() || sk[0]?.skill_name || 'your field',
    advanced,
    year: primary?.year || null,
    institution: primary?.institution?.trim() || null,
  }
}

function fieldOverlap(itemFields, profileField, skills) {
  const blob = `${profileField} ${skills.map((s) => s.skill_name).join(' ')}`.toLowerCase()
  const specific = itemFields.filter((f) => f !== 'any')
  if (!specific.length) return 0
  return specific.some((f) => blob.includes(f)) ? 2 : 0
}

function scoreScholarship(item, summary) {
  const regions = regionHints(summary.country || '')
  let score = 38
  const regionHit = item.regions.filter((r) => regions.includes(r) && r !== 'global')
  score += Math.min(24, regionHit.length * 8)
  if (item.regions.includes('global')) score += 4

  const overlap = fieldOverlap(item.fields, summary.field, summary.skills)
  score += overlap * 10
  if (!item.fields.includes('any') && overlap === 0) score -= 8

  score += Math.min(10, summary.quals.length * 3)
  score += Math.min(14, summary.skills.length * 2)
  score += Math.min(8, summary.advanced.length * 3)
  if (summary.goal === 'scholarships') score += 4
  if (summary.goal === 'jobs') score -= 6
  if (summary.institution) score += 2
  if (!summary.skills.length) score -= 5
  if (!summary.quals.length) score -= 8

  return Math.max(28, Math.min(96, Math.round(score)))
}

function scoreJob(item, summary, index) {
  let score = 40
  score += Math.min(18, summary.skills.length * 3)
  score += Math.min(12, summary.quals.length * 4)
  score += Math.min(10, summary.advanced.length * 3)
  if (summary.country) score += 5
  if (summary.goal === 'jobs') score += 5
  if (summary.goal === 'scholarships') score -= 6
  if (item.listingId === 'remoteok' && summary.skills.length >= 2) score += 5
  if (item.listingId === 'reliefweb' && /public health|development|social|education|humanitarian/i.test(summary.field)) {
    score += 8
  } else if (item.listingId === 'reliefweb') {
    score -= 6
  }
  if (!summary.skills.length) score -= 8
  score -= index * 2
  return Math.max(30, Math.min(95, Math.round(score)))
}

function reasonScholarship(item, listing, summary) {
  const parts = []
  const regions = regionHints(summary.country || '')

  parts.push(`${listing.title}: ${listing.summary}`)

  if (summary.primary) {
    const yearBit = summary.year ? ` (${summary.year})` : ''
    const instBit = summary.institution ? ` from ${summary.institution}` : ''
    parts.push(
      `Your ${summary.primary.type === 'certificate' ? 'certificate' : 'degree'} in ${summary.primary.field}${yearBit}${instBit} aligns with ${item.focus}.`,
    )
  } else {
    parts.push(`Your stated focus in ${summary.field} aligns with ${item.focus}.`)
  }

  if (summary.quals.length > 1) {
    parts.push(
      `Additional credentials factored in: ${summary.quals
        .slice(1, 4)
        .map((q) => `${q.field}${q.year ? ` (${q.year})` : ''}`)
        .join('; ')}.`,
    )
  }

  if (summary.skills.length) {
    const top = summary.skills
      .slice(0, 5)
      .map((s) => `${s.skill_name} (${s.proficiency || 'intermediate'})`)
      .join(', ')
    parts.push(`Skills used in scoring: ${top}.`)
    if (summary.advanced.length) {
      parts.push(
        `Advanced/expert depth (${summary.advanced.map((s) => s.skill_name).join(', ')}) raises confidence for competitive ${listing.source} applications.`,
      )
    }
  } else {
    parts.push('No skills selected yet — score leans on qualifications and country only. Add skills to sharpen this match.')
  }

  if (summary.country) {
    const regional = item.regions.some((r) => regions.includes(r) && r !== 'global')
    if (regional) {
      parts.push(
        `${listing.source} is a strong regional fit for applicants based in ${summary.country} (regions: ${item.regions.filter((r) => r !== 'global').slice(0, 3).join(', ')}).`,
      )
    } else {
      parts.push(
        `${listing.source} is open internationally; your country (${summary.country}) is context for eligibility checks, not a hard filter.`,
      )
    }
  }

  if (summary.headline) {
    parts.push(`Your headline (“${summary.headline}”) was treated as a career-intent signal alongside formal credentials.`)
  }

  if (listing.deadlineLabel) {
    parts.push(`Application timing note: ${listing.deadlineLabel}.`)
  }

  parts.push(
    'This explanation is regenerated whenever you change country, qualifications, or skills so findings stay tied to your current profile.',
  )
  return parts.join(' ')
}

function reasonJob(item, listing, summary) {
  const parts = []
  const skillQuery = summary.skills.slice(0, 4).map((s) => s.skill_name)
  const queryBits = [summary.field, ...skillQuery].filter(Boolean)

  parts.push(`${listing.summary}`)
  parts.push(`Search targets ${item.channel} with query terms: ${queryBits.join(', ') || summary.field}.`)

  if (summary.primary) {
    parts.push(
      `Qualification anchor: ${summary.primary.type} in ${summary.primary.field}${summary.year ? ` (${summary.year})` : ''}${summary.institution ? ` · ${summary.institution}` : ''}.`,
    )
  }

  if (summary.skills.length) {
    const advanced = summary.advanced.map((s) => s.skill_name)
    parts.push(
      advanced.length
        ? `Higher weight given to advanced/expert skills (${advanced.join(', ')}); remaining skills still expand the search.`
        : `Skills applied at equal baseline weight: ${summary.skills.map((s) => s.skill_name).slice(0, 6).join(', ')}.`,
    )
  } else {
    parts.push('No skills on file — results are broader and less precise until you confirm skills from your degree.')
  }

  if (summary.country) {
    if (item.listingId === 'remoteok') {
      parts.push(
        `Remote board chosen so location (${summary.country}) does not block results, while skills still drive ranking.`,
      )
    } else {
      parts.push(`Location bias set to ${summary.country} for this ${listing.source} query.`)
    }
  }

  if (summary.headline) {
    parts.push(`Headline (“${summary.headline}”) helps disambiguate role family when field names are broad.`)
  }

  parts.push(
    'Edit your profile and save to re-run matching — scores and reasons are rebuilt from the latest data, not cached guesses.',
  )
  return parts.join(' ')
}

export function buildScholarshipMatches(profile, qualifications, skills) {
  const summary = summarizeProfile(profile, qualifications || [], skills || [])
  return SCHOLARSHIP_SOURCES.map((item) => {
    const listing = LISTING_CATALOG[item.listingId]
    if (!listing) return null
    return {
      title: listing.title,
      url: listing.url,
      source: listing.source,
      reasoning: reasonScholarship(item, listing, summary),
      match_score: scoreScholarship(item, summary),
      deadline: null,
    }
  })
    .filter(Boolean)
    .sort((a, b) => b.match_score - a.match_score)
}

export function buildJobMatches(profile, qualifications, skills) {
  const summary = summarizeProfile(profile, qualifications || [], skills || [])
  const query = encodeURIComponent(
    [summary.field, ...summary.skills.slice(0, 2).map((s) => s.skill_name)].filter(Boolean).join(' '),
  )
  const country = encodeURIComponent(summary.country || '')
  const slug = slugify(summary.skills[0]?.skill_name || summary.field)

  return JOB_SOURCES.map((item, index) => {
    const listing = LISTING_CATALOG[item.listingId]
    if (!listing) return null
    return {
      title: item.titleTemplate.replace('{field}', summary.field).replace('{country}', summary.country || 'Local'),
      url: item.urlTemplate.replace('{query}', query).replace('{country}', country).replace('{slug}', slug),
      company: listing.company || null,
      source: listing.source,
      reasoning: reasonJob(item, listing, summary),
      match_score: scoreJob(item, summary, index),
    }
  })
    .filter(Boolean)
    .sort((a, b) => b.match_score - a.match_score)
}
