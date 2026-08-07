/** Profile-aware matching: country-eligible scholarships + live/web job feeds. */

import i18n from '../i18n'
import { LISTING_CATALOG } from './listingCatalog'
import { SCHOLARSHIP_PROGRAMS, isScholarshipEligible } from './scholarshipPrograms'
import { fetchLiveJobs, buildCountryJobBoards } from './jobFeed'

export function regionHints(country = '') {
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

export function summarizeProfile(profile, qualifications, skills) {
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
  const specific = (itemFields || []).filter((f) => f !== 'any')
  if (!specific.length) return 0
  return specific.some((f) => blob.includes(f)) ? 2 : 0
}

function scoreScholarship(item, summary) {
  const regions = regionHints(summary.country || '')
  let score = 40
  const regionHit = (item.regions || []).filter((r) => regions.includes(r) && r !== 'global')
  score += Math.min(28, regionHit.length * 9)
  if ((item.regions || []).includes('global')) score += 3

  const overlap = fieldOverlap(item.fields, summary.field, summary.skills)
  score += overlap * 10
  if (!(item.fields || []).includes('any') && overlap === 0) score -= 8

  score += Math.min(10, summary.quals.length * 3)
  score += Math.min(14, summary.skills.length * 2)
  score += Math.min(8, summary.advanced.length * 3)
  if (summary.goal === 'scholarships') score += 5
  if (summary.goal === 'jobs') score -= 6
  if (summary.institution) score += 2
  if (!summary.skills.length) score -= 5
  if (!summary.quals.length) score -= 8

  // Exact country list boost
  const c = (summary.country || '').toLowerCase()
  if ((item.countries || []).some((x) => x !== '*' && x !== '*africa' && c.includes(x))) score += 8

  return Math.max(30, Math.min(97, Math.round(score)))
}

function reasonScholarship(item, summary) {
  const listing = LISTING_CATALOG[item.id]
  const parts = []
  const regions = regionHints(summary.country || '')

  parts.push(`${item.title}: ${item.focus}.`)
  if (listing?.summary) parts.push(listing.summary)

  if (summary.primary) {
    const yearBit = summary.year ? ` (${summary.year})` : ''
    const instBit = summary.institution
      ? i18n.t('reasons.fromInstitution', { institution: summary.institution })
      : ''
    const kind =
      summary.primary.type === 'certificate'
        ? i18n.t('reasons.certificate')
        : i18n.t('reasons.degree')
    parts.push(
      i18n.t('reasons.primarySignal', {
        kind,
        field: summary.primary.field,
        yearBit,
        instBit,
      }),
    )
  } else {
    parts.push(i18n.t('reasons.focusField', { field: summary.field }))
  }

  if (summary.skills.length) {
    parts.push(
      i18n.t('reasons.skillsFactored', {
        list: summary.skills
          .slice(0, 5)
          .map((s) => `${s.skill_name} (${s.proficiency || 'intermediate'})`)
          .join(', '),
      }),
    )
  }

  if (summary.country) {
    const regional = (item.regions || []).some((r) => regions.includes(r) && r !== 'global')
    parts.push(
      regional
        ? i18n.t('reasons.eligibilityRegional', { country: summary.country })
        : i18n.t('reasons.eligibilityOpen', { country: summary.country }),
    )
  }

  if (item.deadlineLabel) parts.push(i18n.t('reasons.timing', { deadline: item.deadlineLabel }))
  parts.push(i18n.t('reasons.officialUrl'))
  return parts.join(' ')
}

/**
 * Scholarships allowed for the user’s country (strict eligibility filter).
 */
export function buildScholarshipMatches(profile, qualifications, skills) {
  const summary = summarizeProfile(profile, qualifications || [], skills || [])
  return SCHOLARSHIP_PROGRAMS.filter((p) => isScholarshipEligible(p, summary.country))
    .map((item) => {
      const listing = LISTING_CATALOG[item.id]
      return {
        title: item.title,
        url: item.url || listing?.url,
        source: item.source,
        reasoning: reasonScholarship(item, summary),
        match_score: scoreScholarship(item, summary),
        deadline: null,
        listingId: item.id,
      }
    })
    .sort((a, b) => b.match_score - a.match_score)
}

/** Sync fallback boards only (no network). */
export function buildJobMatches(profile, qualifications, skills) {
  const summary = summarizeProfile(profile, qualifications || [], skills || [])
  return buildCountryJobBoards(summary).sort((a, b) => b.match_score - a.match_score)
}

/**
 * Live web jobs + country boards. Falls back to boards if APIs fail.
 */
export async function buildLiveJobMatches(profile, qualifications, skills) {
  const summary = summarizeProfile(profile, qualifications || [], skills || [])
  try {
    const { jobs, meta } = await fetchLiveJobs(summary)
    return { jobs, meta }
  } catch (e) {
    const boards = buildCountryJobBoards(summary)
    return {
      jobs: boards,
      meta: { live: 0, boards: boards.length, errors: [e.message], country: summary.country },
    }
  }
}
