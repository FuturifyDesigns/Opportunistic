/**
 * Live job feed from public APIs + country-aware scoring.
 * Sources: Remotive (remote), Arbeitnow (EU board). Results are real postings with official URLs.
 * Only keeps jobs that match the selected country or are open remote/worldwide.
 */

import i18n from '../i18n'
import { countryFitScore, jobFitsSelectedCountry } from './countryMatch'
import { evaluateJobListing } from './skillMatch'
import { assertAllowed } from './rateLimit'

function mapRemotive(job, profile) {
  const country = profile.country || ''
  const location = job.candidate_required_location || job.job_type || 'Remote'
  if (!jobFitsSelectedCountry(location, country)) return null

  const locHits = countryFitScore(location, country)
  const tags = Array.isArray(job.tags) ? job.tags : []
  const evaled = evaluateJobListing(
    {
      title: job.title,
      description: job.description || '',
      tags,
      company: job.company_name || '',
      location,
      source: 'Remotive',
      url: job.url || job.job_url,
    },
    profile,
    { countryFitHint: locHits },
  )

  // Drop weak / unrelated live postings so the feed stays accurate
  if (!evaled.hasSignal || evaled.match_score < 52) return null

  return {
    title: job.title,
    url: job.url || job.job_url,
    company: job.company_name || null,
    source:
      locHits >= 3 && country
        ? `Remotive · ${country}`
        : `Remotive · ${job.category || 'Remote'}`,
    reasoning: evaled.reasoning,
    match_score: evaled.match_score,
    scorecard: evaled.scorecard,
    location,
    published: job.publication_date || null,
    feed: 'remotive',
    country_fit: locHits,
  }
}

function mapArbeitnow(job, profile) {
  const country = profile.country || ''
  const location = job.location || ''
  if (!jobFitsSelectedCountry(location, country)) return null

  const locHits = countryFitScore(location, country)
  const tags = Array.isArray(job.tags) ? job.tags : []
  const evaled = evaluateJobListing(
    {
      title: job.title,
      description: job.description || '',
      tags,
      company: job.company_name || '',
      location,
      source: 'Arbeitnow',
      url: job.url,
    },
    profile,
    { countryFitHint: locHits },
  )

  if (!evaled.hasSignal || evaled.match_score < 52) return null

  return {
    title: job.title,
    url: job.url,
    company: job.company_name || null,
    source: 'Arbeitnow',
    reasoning: evaled.reasoning,
    match_score: evaled.match_score,
    scorecard: evaled.scorecard,
    location: location || null,
    published: job.created_at || null,
    feed: 'arbeitnow',
    country_fit: locHits,
  }
}

async function fetchRemotive(query) {
  assertAllowed('remotive', { limit: 4, windowMs: 60_000 })
  const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query || 'developer')}&limit=50`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Remotive ${res.status}`)
  const data = await res.json()
  return Array.isArray(data.jobs) ? data.jobs : []
}

async function fetchArbeitnow(query) {
  assertAllowed('arbeitnow', { limit: 4, windowMs: 60_000 })
  const url = `https://www.arbeitnow.com/api/job-board-api`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Arbeitnow ${res.status}`)
  const data = await res.json()
  const jobs = Array.isArray(data.data) ? data.data : []
  const q = String(query || '').toLowerCase()
  if (!q) return jobs.slice(0, 60)
  const filtered = jobs.filter((j) => {
    const hay = `${j.title} ${j.company_name} ${(j.tags || []).join(' ')} ${j.location || ''}`.toLowerCase()
    return q.split(/\s+/).some((w) => w.length > 2 && hay.includes(w))
  })
  return (filtered.length ? filtered : jobs).slice(0, 60)
}

function scoreBoard(profile, { title, source, location, url, extraText = '' }) {
  // Board portals are search links — score field/location fit only, not fake skill hits.
  const evaled = evaluateJobListing(
    {
      title,
      description: `${title} ${extraText}`,
      tags: [],
      company: '',
      location: location || profile.country || '',
      source,
      url,
    },
    profile,
    { countryFitHint: profile.country ? 3 : 1 },
  )
  return evaled
}

/** Country-targeted search board links (always available as fallback / supplement). */
export function buildCountryJobBoards(profile) {
  const field = profile.field || 'jobs'
  const skills = (profile.skills || []).slice(0, 2).map((s) => s.skill_name || s)
  const query = encodeURIComponent([field, ...skills].filter(Boolean).join(' '))
  const country = profile.country || ''
  const countryQ = encodeURIComponent(country)
  const slug = String(skills[0] || field)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'jobs'

  const countryLabel = country || i18n.t('reasons.yourCountry')

  const boards = [
    {
      title: i18n.t('reasons.indeedTitle', { field, country: countryLabel }),
      url: `https://www.indeed.com/jobs?q=${query}&l=${countryQ}`,
      company: null,
      source: 'Indeed',
      location: country || null,
      feed: 'board',
      country_fit: country ? 3 : 0,
      extra: `Indeed jobs ${field} ${country}`,
    },
    {
      title: i18n.t('reasons.linkedinTitle', { field }),
      url: `https://www.linkedin.com/jobs/search/?keywords=${query}&location=${countryQ}`,
      company: null,
      source: 'LinkedIn',
      location: country || null,
      feed: 'board',
      country_fit: country ? 3 : 0,
      extra: `LinkedIn jobs ${field} ${country}`,
    },
    {
      title: i18n.t('reasons.remoteTitle', { field }),
      url: `https://remoteok.com/remote-${slug}-jobs`,
      company: null,
      source: 'Remote OK',
      location: 'Remote',
      feed: 'board',
      country_fit: 1,
      extra: `Remote ${field} ${slug}`,
    },
    {
      title: i18n.t('reasons.reliefTitle', { country: country || i18n.t('reasons.region') }),
      url: `https://reliefweb.int/jobs?search=${countryQ}%20${query}`,
      company: null,
      source: 'ReliefWeb',
      location: country || null,
      feed: 'board',
      country_fit: country ? 3 : 0,
      extra: `ReliefWeb humanitarian development ${field} ${country}`,
    },
  ]

  return boards.map((b) => {
    const evaled = scoreBoard(profile, {
      title: b.title,
      source: b.source,
      location: b.location,
      url: b.url,
      extraText: b.extra,
    })
    // Boards are search portals — keep them but score from profile fit
    let score = evaled.match_score
    if (b.source === 'ReliefWeb' && !/public|health|development|social|education|humanitarian|policy/i.test(field)) {
      score = Math.min(score, 58)
    }
    return {
      title: b.title,
      url: b.url,
      company: null,
      source: b.source,
      reasoning: evaled.reasoning,
      match_score: Math.max(40, Math.min(92, score)),
      scorecard: evaled.scorecard,
      location: b.location,
      feed: b.feed,
      country_fit: b.country_fit,
    }
  })
}

/**
 * Fetch live jobs and merge with country board links.
 * Live API results are hard-filtered to the selected country (or open remote).
 */
export async function fetchLiveJobs(profile) {
  const country = profile.country || ''
  const query = [profile.field, ...(profile.skills || []).slice(0, 3).map((s) => s.skill_name || s)]
    .filter(Boolean)
    .join(' ')

  const errors = []
  let live = []
  let fetched = 0
  let dropped = 0

  try {
    const remotive = await fetchRemotive(query)
    fetched += remotive.length
    for (const j of remotive) {
      const mapped = mapRemotive(j, profile)
      if (mapped) live.push(mapped)
      else dropped += 1
    }
  } catch (e) {
    errors.push(`Remotive: ${e.message}`)
  }

  try {
    const arbeitnow = await fetchArbeitnow(country ? `${query} ${country}` : query)
    fetched += arbeitnow.length
    for (const j of arbeitnow) {
      const mapped = mapArbeitnow(j, profile)
      if (mapped) live.push(mapped)
      else dropped += 1
    }
  } catch (e) {
    errors.push(`Arbeitnow: ${e.message}`)
  }

  const seen = new Set()
  live = live.filter((j) => {
    if (!j.url || seen.has(j.url)) return false
    seen.add(j.url)
    return true
  })

  live.sort((a, b) => {
    const score = (b.match_score || 0) - (a.match_score || 0)
    if (score) return score
    return (b.country_fit || 0) - (a.country_fit || 0)
  })

  const topLive = live.slice(0, 28)
  const boards = buildCountryJobBoards(profile)

  return {
    jobs: [...topLive, ...boards].sort((a, b) => (b.match_score || 0) - (a.match_score || 0)),
    meta: {
      live: topLive.length,
      boards: boards.length,
      fetched,
      dropped,
      errors,
      query,
      country: country || null,
    },
  }
}
