/** Onboarding / profile focus: both | scholarships | jobs */

export const GOAL_VALUES = ['both', 'scholarships', 'jobs']

export function normalizeGoal(value) {
  if (value === 'scholarships' || value === 'jobs' || value === 'both') return value
  return 'both'
}

export function parseGoalFromBio(bio = '') {
  const m = String(bio).match(/\[opp_goal:(both|scholarships|jobs)\]/i)
  return m ? normalizeGoal(m[1]) : null
}

export function stripGoalTag(bio = '') {
  return String(bio || '')
    .replace(/\[opp_goal:(both|scholarships|jobs)\]\s*/gi, '')
    .trim()
}

export function withGoalTag(bio, goal) {
  const clean = stripGoalTag(bio)
  const g = normalizeGoal(goal)
  return clean ? `[opp_goal:${g}] ${clean}` : `[opp_goal:${g}]`
}

/** Prefer DB column, then stable bio tag, then legacy English bio phrases. */
export function resolveGoal(profile = {}) {
  if (profile?.goal) return normalizeGoal(profile.goal)
  const tagged = parseGoalFromBio(profile?.bio)
  if (tagged) return tagged
  const blob = `${profile?.bio || ''} ${profile?.headline || ''}`.toLowerCase()
  if (blob.includes('primarily for scholarships') || blob.includes('mostly scholarships')) {
    return 'scholarships'
  }
  if (blob.includes('primarily for jobs') || blob.includes('mostly jobs')) {
    return 'jobs'
  }
  return 'both'
}

export function goalLabelKey(goal) {
  const g = normalizeGoal(goal)
  if (g === 'scholarships') return 'onboarding.goalScholarships'
  if (g === 'jobs') return 'onboarding.goalJobs'
  return 'onboarding.goalBoth'
}

export function defaultBioForGoal(goal, t) {
  const g = normalizeGoal(goal)
  const text =
    g === 'scholarships'
      ? t('onboarding.bioScholarships')
      : g === 'jobs'
        ? t('onboarding.bioJobs')
        : t('onboarding.bioBoth')
  return withGoalTag(text, g)
}

/**
 * Upsert profile row. Includes `goal` when present; retries without the column
 * if migration 003 has not been applied yet (goal still stored in bio tag).
 */
export async function upsertProfile(supabase, row) {
  const payload = { ...row }
  if (payload.goal != null) {
    const goal = normalizeGoal(payload.goal)
    payload.goal = goal
    if (payload.bio != null) payload.bio = withGoalTag(payload.bio, goal)
  }

  const { error } = await supabase.from('profiles').upsert(payload)
  if (!error) return { error: null }

  const missingGoalCol =
    error.code === '42703' || /column.*goal|goal.*does not exist/i.test(error.message || '')

  if (payload.goal != null && missingGoalCol) {
    const { goal: _drop, ...withoutGoal } = payload
    return supabase.from('profiles').upsert(withoutGoal).then(({ error: e }) => ({ error: e }))
  }

  return { error }
}

/**
 * Partial update. Same goal-column fallback as upsertProfile.
 */
export async function updateProfile(supabase, userId, fields) {
  const payload = { ...fields }
  if (payload.goal != null) {
    const goal = normalizeGoal(payload.goal)
    payload.goal = goal
    if (payload.bio != null) payload.bio = withGoalTag(payload.bio, goal)
  }

  const { error } = await supabase.from('profiles').update(payload).eq('user_id', userId)
  if (!error) return { error: null }

  const missingGoalCol =
    error.code === '42703' || /column.*goal|goal.*does not exist/i.test(error.message || '')

  if (payload.goal != null && missingGoalCol) {
    const { goal: _drop, ...withoutGoal } = payload
    return supabase
      .from('profiles')
      .update(withoutGoal)
      .eq('user_id', userId)
      .then(({ error: e }) => ({ error: e }))
  }

  return { error }
}
