import { supabase } from './supabase'
import { buildJobMatches, buildScholarshipMatches } from './matcher'

function sourceKey(row) {
  return String(row.source || '').toLowerCase()
}

/**
 * Rebuild matches from the live profile.
 * Preserves saved/dismissed flags by source so profile edits never leave stale scores,
 * and dismissed boards do not flood the dashboard again until restored.
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
  const jobPayload = buildJobMatches(profile, qualifications || [], skills || [])

  if (!scholarshipPayload.length && !jobPayload.length) {
    throw new Error('Matcher produced no results — check profile data')
  }

  await supabase.from('search_runs').insert([
    { user_id: userId, type: 'scholarship', status: 'running' },
    { user_id: userId, type: 'job', status: 'running' },
  ])

  const [{ data: prevSch }, { data: prevJobs }] = await Promise.all([
    supabase.from('scholarship_matches').select('title, source, saved, dismissed').eq('user_id', userId),
    supabase.from('job_matches').select('title, source, saved, dismissed').eq('user_id', userId),
  ])

  const savedSch = new Set((prevSch || []).filter((r) => r.saved).map(sourceKey))
  const dismissedSch = new Set((prevSch || []).filter((r) => r.dismissed).map(sourceKey))
  const savedJobs = new Set((prevJobs || []).filter((r) => r.saved).map(sourceKey))
  const dismissedJobs = new Set((prevJobs || []).filter((r) => r.dismissed).map(sourceKey))

  // Full replace so scores/reasons always match the current profile (no stale leftovers)
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
    reasoning: m.reasoning,
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

  await supabase.from('search_runs').insert([
    { user_id: userId, type: 'scholarship', status: 'done' },
    { user_id: userId, type: 'job', status: 'done' },
  ])

  return {
    scholarships: scholarshipRows.filter((r) => !r.dismissed).length,
    jobs: jobRows.filter((r) => !r.dismissed).length,
  }
}
