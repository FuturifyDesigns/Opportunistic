/** Profile-aware matching: country-eligible scholarships + live/web job feeds. */

import { LISTING_CATALOG } from './listingCatalog'
import { SCHOLARSHIP_PROGRAMS, isScholarshipEligible } from './scholarshipPrograms'
import { fetchLiveJobs, buildCountryJobBoards } from './jobFeed'
import { resolveGoal } from './goal'
import { evaluateScholarship } from './skillMatch'

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

export function summarizeProfile(profile, qualifications, skills) {
  const quals = (qualifications || []).filter((q) => q.field?.trim())
  const sk = (skills || []).filter((s) => s.skill_name?.trim())
  const primary = quals[0]
  const advanced = sk.filter((s) => ['advanced', 'expert'].includes(s.proficiency))
  return {
    country: profile?.country || null,
    headline: profile?.headline?.trim() || null,
    goal: resolveGoal(profile || {}),
    quals,
    skills: sk,
    primary,
    field: primary?.field?.trim() || sk[0]?.skill_name || 'your field',
    advanced,
    year: primary?.year || null,
    institution: primary?.institution?.trim() || null,
  }
}

/**
 * Scholarships allowed for the user’s country (strict eligibility filter).
 */
export function buildScholarshipMatches(profile, qualifications, skills) {
  const summary = summarizeProfile(profile, qualifications || [], skills || [])
  const regions = regionHints(summary.country || '')
  return SCHOLARSHIP_PROGRAMS.filter((p) => isScholarshipEligible(p, summary.country))
    .map((item) => {
      const listing = LISTING_CATALOG[item.id]
      const evaled = evaluateScholarship(item, summary, regions)
      return {
        title: item.title,
        url: item.url || listing?.url,
        source: item.source,
        reasoning: evaled.reasoning,
        match_score: evaled.match_score,
        deadline: null,
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
