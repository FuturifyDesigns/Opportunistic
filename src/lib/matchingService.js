import { supabase } from './supabase'
import { buildScholarshipMatches, buildLiveJobMatches } from './matcher'
import { resolveGoal } from './goal'

function sourceKey(row) {
  return String(row.source || '').toLowerCase() + '|' + String(row.url || '').toLowerCase()
}

const DAY_MS = 24 * 60 * 60 * 1000

/** How long between automatic web re-scans (countdown on the dashboard). */
export const REFRESH_INTERVAL_MS = DAY_MS

function scheduleKey(userId) {
  return `opp_match_schedule_${userId}`
}

function lastMatchKey(userId) {
  return `opp_last_match_${userId}`
}

/** Strict focus: only keep the match types the user asked for. */
function applyGoalFocus(goal, scholarships, jobs) {
  const sortedSch = [...scholarships].sort((a, b) => b.match_score - a.match_score)
  const sortedJobs = [...jobs].sort((a, b) => b.match_score - a.match_score)
  if (goal === 'scholarships') return { scholarships: sortedSch, jobs: [] }
  if (goal === 'jobs') return { scholarships: [], jobs: sortedJobs }
  return { scholarships: sortedSch, jobs: sortedJobs }
}

/**
 * Rebuild matches from the live profile + web job feeds.
 * @param {string} userId
 * @param {{ reason?: 'scheduled' | 'profile' | 'initial' | 'manual' }} [options]
 * - scheduled/initial: advances the daily auto-refresh countdown
 * - profile/manual: refreshes cards now but keeps the existing daily schedule
 */
export async function runMatchingForUser(userId, options = {}) {
  if (!userId) throw new Error('Missing user')
  const reason = options.reason || 'manual'

  const [{ data: profile, error: pErr }, { data: qualifications }, { data: skills }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('qualifications').select('*').eq('user_id', userId),
      supabase.from('skills').select('*').eq('user_id', userId),
    ])

  if (pErr) throw pErr
  if (!profile) throw new Error('Profile not found')

  const goal = resolveGoal(profile)
  const wantScholarships = goal !== 'jobs'
  const wantJobs = goal !== 'scholarships'

  const scholarshipPayload = wantScholarships
    ? buildScholarshipMatches(profile, qualifications || [], skills || [])
    : []
  const { jobs: jobPayload, meta: jobMeta } = wantJobs
    ? await buildLiveJobMatches(profile, qualifications || [], skills || [])
    : { jobs: [], meta: { live: 0, boards: 0, skipped: true, goal } }

  const focused = applyGoalFocus(goal, scholarshipPayload, jobPayload)

  if (!focused.scholarships.length && !focused.jobs.length) {
    throw new Error('Matcher produced no results — check profile data')
  }

  await supabase.from('search_runs').insert([
    {
      user_id: userId,
      type: 'scholarship',
      status: 'running',
      notes: `goal=${goal}; country=${profile.country || 'n/a'}; programs=${focused.scholarships.length}`,
    },
    {
      user_id: userId,
      type: 'job',
      status: 'running',
      notes: `goal=${goal}; live=${jobMeta?.live ?? 0}; boards=${jobMeta?.boards ?? 0}; dropped=${jobMeta?.dropped ?? 0}; country=${jobMeta?.country || profile.country || ''}; q=${jobMeta?.query || ''}`,
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

  const stamp = new Date().toISOString()

  const scholarshipRows = focused.scholarships.map((row) => {
    const key = sourceKey(row)
    return {
      user_id: userId,
      title: row.title,
      url: row.url,
      source: row.source || null,
      reasoning: row.reasoning || '',
      match_score: row.match_score,
      deadline: row.deadline || null,
      saved: savedSch.has(key),
      dismissed: dismissedSch.has(key),
      found_at: stamp,
    }
  })
  const jobRows = focused.jobs.map((row) => {
    const key = sourceKey(row)
    return {
      user_id: userId,
      title: row.title,
      url: row.url,
      company: row.company || null,
      source: row.source || null,
      reasoning: row.reasoning || '',
      match_score: row.match_score,
      saved: savedJobs.has(key),
      dismissed: dismissedJobs.has(key),
      found_at: stamp,
    }
  })

  await Promise.all([
    supabase.from('scholarship_matches').delete().eq('user_id', userId),
    supabase.from('job_matches').delete().eq('user_id', userId),
  ])

  if (scholarshipRows.length) {
    const { error: sErr } = await supabase.from('scholarship_matches').insert(scholarshipRows)
    if (sErr) throw sErr
  }
  if (jobRows.length) {
    const { error: jErr } = await supabase.from('job_matches').insert(jobRows)
    if (jErr) throw jErr
  }

  await supabase.from('search_runs').insert([
    {
      user_id: userId,
      type: 'scholarship',
      status: 'done',
      notes: `goal=${goal}; saved=${scholarshipRows.length} @ ${stamp}`,
    },
    {
      user_id: userId,
      type: 'job',
      status: 'done',
      notes: `goal=${goal}; saved=${jobRows.length}; live=${jobMeta?.live ?? 0} @ ${stamp}`,
    },
  ])

  await supabase.from('profiles').update({ updated_at: stamp }).eq('user_id', userId)

  try {
    localStorage.setItem(lastMatchKey(userId), stamp)
    localStorage.setItem(`opp_last_match_meta_${userId}`, JSON.stringify({ ...(jobMeta || {}), goal, reason }))
    localStorage.setItem(`opp_goal_${userId}`, goal)

    const existingSchedule = localStorage.getItem(scheduleKey(userId))
    const advanceSchedule = reason === 'scheduled' || reason === 'initial' || !existingSchedule
    if (advanceSchedule) {
      localStorage.setItem(scheduleKey(userId), stamp)
    }
  } catch {
    /* ignore */
  }

  return {
    scholarships: scholarshipRows.filter((r) => !r.dismissed).length,
    jobs: jobRows.filter((r) => !r.dismissed).length,
    meta: { ...(jobMeta || {}), goal, reason },
    refreshedAt: stamp,
  }
}

export function getLastMatchAt(userId) {
  try {
    return localStorage.getItem(lastMatchKey(userId))
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

/** Anchor for the daily auto-scan clock (separate from last manual rematch). */
export function getScheduleAnchor(userId) {
  try {
    const scheduled = localStorage.getItem(scheduleKey(userId))
    if (scheduled) return scheduled
    // Migrate older clients that only stored last match.
    const last = getLastMatchAt(userId)
    if (last) {
      localStorage.setItem(scheduleKey(userId), last)
      return last
    }
    return null
  } catch {
    return null
  }
}

/** True when the daily auto-scan is due (or never ran). */
export function shouldWeeklyRefresh(userId) {
  const next = getNextRefreshAt(userId)
  if (!next) return true
  return Date.now() >= next
}

/**
 * Timestamp (ms) of the next automatic scan.
 * Profile rematches do not move this — only scheduled/initial scans do.
 */
export function getNextRefreshAt(userId) {
  if (!userId) return null
  const anchor = getScheduleAnchor(userId)
  if (!anchor) return null
  const last = new Date(anchor).getTime()
  if (Number.isNaN(last)) return null
  return last + REFRESH_INTERVAL_MS
}
