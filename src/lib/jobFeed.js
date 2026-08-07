/**
 * Live job feed from public APIs + country-aware scoring.
 * Sources: Remotive (remote), Arbeitnow (EU board). Results are real postings with official URLs.
 */

function skillBlob(skills = [], field = '') {
  return `${field} ${(skills || []).map((s) => s.skill_name || s).join(' ')}`.toLowerCase()
}

function overlapScore(text, blob) {
  if (!blob.trim()) return 0
  const words = blob
    .split(/[^a-z0-9+#.]/i)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length > 2)
  const uniq = [...new Set(words)]
  const hay = String(text || '').toLowerCase()
  let hits = 0
  for (const w of uniq) {
    if (hay.includes(w)) hits += 1
  }
  return hits
}

function countryMatch(location, country) {
  if (!country) return 0
  const loc = String(location || '').toLowerCase()
  const c = country.toLowerCase()
  if (!loc || loc.includes('worldwide') || loc.includes('remote') || loc.includes('anywhere')) return 1
  if (loc.includes(c)) return 3
  // Regional proxies
  if (c.includes('botswana') || c.includes('namibia') || c.includes('south africa')) {
    if (loc.includes('africa') || loc.includes('gmt+2') || loc.includes('sast')) return 2
  }
  return 0
}

function mapRemotive(job, profile) {
  const country = profile.country || ''
  const blob = skillBlob(profile.skills, profile.field)
  const text = `${job.title} ${job.company_name} ${job.description || ''} ${(job.tags || []).join(' ')}`
  const skillHits = overlapScore(text, blob)
  const locHits = countryMatch(job.candidate_required_location || job.job_type, country)
  let score = 42 + Math.min(30, skillHits * 4) + locHits * 6
  if (profile.goal === 'jobs') score += 4
  if (profile.goal === 'scholarships') score -= 4
  score = Math.max(32, Math.min(96, Math.round(score)))

  const reasons = []
  reasons.push(`Live posting from Remotive · ${job.company_name || 'Employer'}.`)
  if (skillHits) reasons.push(`Matched ${skillHits} term(s) from your skills/field against the job text.`)
  if (country) {
    reasons.push(
      locHits >= 3
        ? `Location explicitly references ${country}.`
        : locHits >= 1
          ? `Remote/worldwide role — workable from ${country} if employer allows your region.`
          : `Verify the employer accepts applicants based in ${country} before applying.`,
    )
  }
  reasons.push('Fetched from the public Remotive API — open the official URL to confirm it’s still live.')

  return {
    title: job.title,
    url: job.url || job.job_url,
    company: job.company_name || null,
    source: `Remotive · ${job.category || 'Remote'}`,
    reasoning: reasons.join(' '),
    match_score: score,
    location: job.candidate_required_location || 'Remote',
    published: job.publication_date || null,
    feed: 'remotive',
  }
}

function mapArbeitnow(job, profile) {
  const country = profile.country || ''
  const blob = skillBlob(profile.skills, profile.field)
  const text = `${job.title} ${job.company_name} ${job.description || ''} ${(job.tags || []).join(' ')} ${job.location || ''}`
  const skillHits = overlapScore(text, blob)
  const locHits = countryMatch(job.location, country)
  let score = 40 + Math.min(28, skillHits * 4) + locHits * 7
  if (profile.goal === 'jobs') score += 3
  score = Math.max(30, Math.min(94, Math.round(score)))

  const reasons = []
  reasons.push(`Live posting from Arbeitnow · ${job.company_name || 'Employer'}.`)
  if (skillHits) reasons.push(`Skills/field overlap score: ${skillHits} hits.`)
  if (country) {
    reasons.push(
      locHits >= 3
        ? `Listed location aligns with ${country}.`
        : `Listed in ${job.location || 'EU/remote'} — confirm visa/remote eligibility from ${country}.`,
    )
  }
  reasons.push('Fetched from the public Arbeitnow job board API.')

  return {
    title: job.title,
    url: job.url,
    company: job.company_name || null,
    source: 'Arbeitnow',
    reasoning: reasons.join(' '),
    match_score: score,
    location: job.location || null,
    published: job.created_at || null,
    feed: 'arbeitnow',
  }
}

async function fetchRemotive(query) {
  const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query || 'developer')}&limit=30`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Remotive ${res.status}`)
  const data = await res.json()
  return Array.isArray(data.jobs) ? data.jobs : []
}

async function fetchArbeitnow(query) {
  const url = `https://www.arbeitnow.com/api/job-board-api`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Arbeitnow ${res.status}`)
  const data = await res.json()
  const jobs = Array.isArray(data.data) ? data.data : []
  const q = String(query || '').toLowerCase()
  if (!q) return jobs.slice(0, 40)
  const filtered = jobs.filter((j) => {
    const hay = `${j.title} ${j.company_name} ${(j.tags || []).join(' ')}`.toLowerCase()
    return q.split(/\s+/).some((w) => w.length > 2 && hay.includes(w))
  })
  return (filtered.length ? filtered : jobs).slice(0, 40)
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

  return [
    {
      title: `${field} jobs in ${country || 'your country'} — Indeed`,
      url: `https://www.indeed.com/jobs?q=${query}&l=${countryQ}`,
      company: null,
      source: 'Indeed',
      reasoning: `Country-filtered Indeed search for “${decodeURIComponent(query)}” near ${country || 'your location'}. Open results and apply only to listings that match your skills.`,
      match_score: country ? 78 : 55,
      feed: 'board',
    },
    {
      title: `${field} roles — LinkedIn Jobs`,
      url: `https://www.linkedin.com/jobs/search/?keywords=${query}&location=${countryQ}`,
      company: null,
      source: 'LinkedIn',
      reasoning: `LinkedIn search biased to ${country || 'your country'} with your field/skills as keywords.`,
      match_score: country ? 76 : 54,
      feed: 'board',
    },
    {
      title: `Remote ${field} — Remote OK`,
      url: `https://remoteok.com/remote-${slug}-jobs`,
      company: null,
      source: 'Remote OK',
      reasoning: `Remote-first board filtered by skill slug “${slug}” so ${country || 'your country'} isn’t a hard blocker.`,
      match_score: 70,
      feed: 'board',
    },
    {
      title: `${country || 'Regional'} humanitarian & development jobs — ReliefWeb`,
      url: `https://reliefweb.int/jobs?search=${countryQ}%20${query}`,
      company: null,
      source: 'ReliefWeb',
      reasoning: `ReliefWeb jobs search including ${country || 'region'} — useful for development, health, and NGO tracks.`,
      match_score: /public|health|development|social|education|humanitarian|policy/i.test(field) ? 74 : 48,
      feed: 'board',
    },
  ]
}

/**
 * Fetch live jobs and merge with country board links.
 * @returns {{ jobs: object[], meta: { live: number, boards: number, errors: string[] } }}
 */
export async function fetchLiveJobs(profile) {
  const query = [profile.field, ...(profile.skills || []).slice(0, 3).map((s) => s.skill_name || s)]
    .filter(Boolean)
    .join(' ')

  const errors = []
  let live = []

  try {
    const remotive = await fetchRemotive(query)
    live = live.concat(remotive.map((j) => mapRemotive(j, profile)))
  } catch (e) {
    errors.push(`Remotive: ${e.message}`)
  }

  try {
    const arbeitnow = await fetchArbeitnow(query)
    live = live.concat(arbeitnow.map((j) => mapArbeitnow(j, profile)))
  } catch (e) {
    errors.push(`Arbeitnow: ${e.message}`)
  }

  // Dedupe by URL
  const seen = new Set()
  live = live.filter((j) => {
    if (!j.url || seen.has(j.url)) return false
    seen.add(j.url)
    return true
  })

  live.sort((a, b) => b.match_score - a.match_score)
  const topLive = live.slice(0, 24)
  const boards = buildCountryJobBoards(profile)

  return {
    jobs: [...topLive, ...boards].sort((a, b) => b.match_score - a.match_score),
    meta: {
      live: topLive.length,
      boards: boards.length,
      errors,
      query,
      country: profile.country || null,
    },
  }
}
