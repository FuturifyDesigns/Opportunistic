import { supabase } from './supabase'
import { buildScholarshipMatches, buildLiveJobMatches } from './matcher'

function sourceKey(row) {
  return String(row.source || '').toLowerCase() + '|' + String(row.url || '').toLowerCase()
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Rebuild matches from the live profile + web job feeds.
 * Scholarships are filtered to programs eligible for the user’s country.
 * Jobs prefer live API postings, scored to skills/field, with country board searches.
 */
export async function runMatchingForUser(userId) {
  if (!userId) throw new Error('Missing user')

  const [{ data: profile, error: pErr }, { data: qualifications }, { data: skills }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('qualifications').select('*').eq('user_id', userId),
      supabase.from('skills').select('*').eq('user_id', userId),
    ])

  if (pErr) throw pErr
  if (!profile) throw new Error('Profile not found')

  const scholarshipPayload = buildScholarshipMatches(profile, qualifications || [], skills || [])
  const { jobs: jobPayload, meta: jobMeta } = await buildLiveJobMatches(
    profile,
    qualifications || [],
    skills || [],
  )

  if (!scholarshipPayload.length && !jobPayload.length) {
    throw new Error('Matcher produced no results — check profile data')
  }

  await supabase.from('search_runs').insert([
    {
      user_id: userId,
      type: 'scholarship',
      status: 'running',
      notes: `country=${profile.country || 'n/a'}; programs=${scholarshipPayload.length}`,
    },
    {
      user_id: userId,
      type: 'job',
      status: 'running',
      notes: `live=${jobMeta?.live ?? 0}; boards=${jobMeta?.boards ?? 0}; dropped=${jobMeta?.dropped ?? 0}; country=${jobMeta?.country || profile.country || ''}; q=${jobMeta?.query || ''}`,
    },
  ])

  const [{ data: prevSch }, { data: prevJobs }] = await Promise.all([
    supabase.from('scholarship_matches').select('title, source, url, saved, dismissed').eq('user_id', userId),
    supabase.from('job_matches').select('title, source, url, saved, dismissed').eq('user_id', userId),
  ])

  const savedSch = new Set((prevSch || []).filter((r) => r.saved).map(sourceKey))
  const dismissedSch = new Set((prevSch || []).filter((r) => r.dismissed).map(sourceKey))
  const savedJobs = new Set((prevJobs || []).filter((r) => r.saved).map(sourceKey))
  const dismissedJobs = new Set((prevJobs || []).filter((r) => r.dismissed).map(sourceKey))

  await Promise.all([
    supabase.from('scholarship_matches').delete().eq('user_id', userId),
    supabase.from('job_matches').delete().eq('user_id', userId),
  ])

  const scholarshipRows = scholarshipPayload.map((m) => ({
    user_id: userId,
    title: m.title,
    url: m.url,
    source: m.source,
    reasoning: m.reasoning,
    match_score: m.match_score,
    deadline: m.deadline ?? null,
    saved: savedSch.has(sourceKey(m)),
    dismissed: dismissedSch.has(sourceKey(m)),
  }))

  const jobRows = jobPayload.map((m) => ({
    user_id: userId,
    title: m.title,
    url: m.url,
    company: m.company ?? null,
    source: m.source,
    // Persist location inside reasoning so cards/detail keep country context without a DB migration.
    reasoning: m.location
      ? `${m.location} · ${m.reasoning}`
      : m.reasoning,
    match_score: m.match_score,
    saved: savedJobs.has(sourceKey(m)),
    dismissed: dismissedJobs.has(sourceKey(m)),
  }))

  if (scholarshipRows.length) {
    const { error: sErr } = await supabase.from('scholarship_matches').insert(scholarshipRows)
    if (sErr) throw sErr
  }
  if (jobRows.length) {
    const { error: jErr } = await supabase.from('job_matches').insert(jobRows)
    if (jErr) throw jErr
  }

  const stamp = new Date().toISOString()
  await supabase.from('search_runs').insert([
    {
      user_id: userId,
      type: 'scholarship',
      status: 'done',
      notes: `saved=${scholarshipRows.length} @ ${stamp}`,
    },
    {
      user_id: userId,
      type: 'job',
      status: 'done',
      notes: `saved=${jobRows.length}; live=${jobMeta?.live ?? 0} @ ${stamp}`,
    },
  ])

  // Best-effort stamp for weekly auto-refresh (ignore if column missing until migration applied)
  await supabase.from('profiles').update({ updated_at: stamp }).eq('user_id', userId)

  try {
    localStorage.setItem(`opp_last_match_${userId}`, stamp)
    localStorage.setItem(`opp_last_match_meta_${userId}`, JSON.stringify(jobMeta || {}))
  } catch {
    /* ignore */
  }

  return {
    scholarships: scholarshipRows.filter((r) => !r.dismissed).length,
    jobs: jobRows.filter((r) => !r.dismissed).length,
    meta: jobMeta,
    refreshedAt: stamp,
  }
}

export function getLastMatchAt(userId) {
  try {
    return localStorage.getItem(`opp_last_match_${userId}`)
  } catch {
    return null
  }
}

export function getLastMatchMeta(userId) {
  try {
    const raw = localStorage.getItem(`opp_last_match_meta_${userId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** True if matches are older than 7 days (or never run). */
export function shouldWeeklyRefresh(userId) {
  const last = getLastMatchAt(userId)
  if (!last) return true
  const age = Date.now() - new Date(last).getTime()
  return Number.isNaN(age) || age >= WEEK_MS
}
