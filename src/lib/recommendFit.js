import { supabase } from './supabase'
import { LISTING_CATALOG, getListingBySource } from './listingCatalog'
import { SCHOLARSHIP_PROGRAMS } from './scholarshipPrograms'
import { regionHints, summarizeProfile } from './matcher'
import { evaluateJobListing, evaluateScholarship } from './skillMatch'

function parseDeadline(value) {
  if (!value) return null
  const text = String(value).trim()
  if (!text || text.length > 10) return null
  const d = new Date(text)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

export function findScholarshipProgram(rec) {
  const url = String(rec?.url || '').toLowerCase()
  const source = String(rec?.source || '').toLowerCase()
  const title = String(rec?.title || '').toLowerCase()
  return (
    SCHOLARSHIP_PROGRAMS.find((p) => p.url && url && String(p.url).toLowerCase() === url) ||
    SCHOLARSHIP_PROGRAMS.find((p) => source && String(p.source || '').toLowerCase().includes(source)) ||
    SCHOLARSHIP_PROGRAMS.find((p) => title && String(p.title || '').toLowerCase() === title) ||
    SCHOLARSHIP_PROGRAMS.find(
      (p) => title && title.length > 8 && String(p.title || '').toLowerCase().includes(title.slice(0, 18)),
    ) ||
    null
  )
}

export function listingForRecommendation(rec) {
  if (!rec) return null
  return (
    getListingBySource(rec.source) ||
    Object.values(LISTING_CATALOG).find((item) => {
      const recUrl = String(rec.url || '').toLowerCase()
      const itemUrl = String(item.url || '').toLowerCase()
      return recUrl && itemUrl && (recUrl === itemUrl || recUrl.includes(item.id))
    }) ||
    null
  )
}

export function listingKind(kind) {
  if (kind === 'job' || kind === 'jobs') return 'job'
  return 'scholarship'
}

/** Minimum overall score plus a real skill/field signal before recommending to a friend. */
export const FRIEND_FIT_MIN = 58

export function evaluateListingAgainstSummary(match, kind, summary) {
  const listing = listingForRecommendation(match)
  const k = listingKind(kind || match?.kind)
  let evaled

  if (k === 'job') {
    evaled = evaluateJobListing(
      {
        title: match?.title,
        description: listing?.summary || match?.note || match?.title,
        tags: listing?.tags || [],
        company: match?.company || '',
        location: match?.location || listing?.location || '',
        source: match?.source || listing?.source || '',
        url: match?.url,
      },
      summary,
    )
  } else {
    const program = findScholarshipProgram(match)
    const item = program || {
      title: match?.title,
      source: match?.source || listing?.source,
      url: match?.url,
      focus: listing?.summary || listing?.focus || match?.title,
      fields: listing?.tags?.length ? listing.tags : ['any'],
      regions: ['global'],
      countries: ['*'],
    }
    evaled = evaluateScholarship(item, summary, regionHints(summary.country || ''))
  }

  const matched = evaled.scorecard?.matched || []
  const fieldScore = Number(evaled.scorecard?.field?.score || 0)
  const hasSignal = Boolean(evaled.hasSignal) || matched.length > 0 || fieldScore >= 45
  return { ...evaled, hasSignal, matched }
}

/** Score a received recommendation against the current user's skills. */
export function evaluateRecommendation(rec, profile, qualifications = [], skills = []) {
  const summary = summarizeProfile(profile, qualifications, skills)
  const listing = listingForRecommendation(rec)
  const kind = rec?.kind === 'job' ? 'job' : 'scholarship'
  const evaled = evaluateListingAgainstSummary(rec, kind, summary)

  return {
    id: rec.id,
    recId: rec.id,
    recommended: true,
    kind,
    title: rec.title,
    url: rec.url,
    company: rec.company || null,
    location: rec.location || listing?.location || '',
    source: rec.source || listing?.source || null,
    deadline: rec.deadline || listing?.deadlineLabel || null,
    found_at: rec.created_at,
    match_score: evaled.match_score,
    reasoning: evaled.reasoning,
    from_name: rec.from_name,
    from_avatar: rec.from_avatar,
    from_user_id: rec.from_user_id || rec.from_user,
    note: rec.note,
    saved: false,
    dismissed: false,
  }
}

export function friendsWhoFitListing(match, kind, friends = []) {
  if (!match?.title && !match?.url) return []
  return (friends || [])
    .map((friend) => {
      const summary = summarizeProfile(
        {
          country: friend.country,
          headline: friend.headline,
          bio: friend.bio,
          goal: friend.goal,
        },
        friend.qualifications || [],
        friend.skills || [],
      )
      const evaled = evaluateListingAgainstSummary(match, kind, summary)
      return {
        ...friend,
        fit_score: evaled.match_score,
        hasSignal: evaled.hasSignal,
        matchedSkills: evaled.matched || [],
      }
    })
    .filter((friend) => friend.hasSignal && Number(friend.fit_score) >= FRIEND_FIT_MIN)
    .sort((a, b) => b.fit_score - a.fit_score)
}

export async function ensureMatchFromRecommendation(userId, recMatch) {
  if (!userId || !recMatch?.url) throw new Error('Missing recommendation')
  const kind = recMatch.kind === 'job' ? 'job' : 'scholarship'
  const table = kind === 'job' ? 'job_matches' : 'scholarship_matches'
  const { data: existing, error: findErr } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .eq('url', recMatch.url)
    .maybeSingle()
  if (findErr) throw findErr
  if (existing) return { kind, row: existing }

  const payload =
    kind === 'job'
      ? {
          user_id: userId,
          title: recMatch.title,
          url: recMatch.url,
          company: recMatch.company || null,
          source: recMatch.source || null,
          reasoning: recMatch.reasoning || '',
          match_score: recMatch.match_score || 0,
          saved: false,
          dismissed: false,
        }
      : {
          user_id: userId,
          title: recMatch.title,
          url: recMatch.url,
          source: recMatch.source || null,
          reasoning: recMatch.reasoning || '',
          match_score: recMatch.match_score || 0,
          deadline: parseDeadline(recMatch.deadline),
          saved: false,
          dismissed: false,
        }

  const { data, error } = await supabase.from(table).insert(payload).select('*').single()
  if (error) throw error
  return { kind, row: data }
}
