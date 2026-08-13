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

/** Score a received recommendation against the current user's skills. */
export function evaluateRecommendation(rec, profile, qualifications = [], skills = []) {
  const summary = summarizeProfile(profile, qualifications, skills)
  const listing = listingForRecommendation(rec)
  const kind = rec?.kind === 'job' ? 'job' : 'scholarship'
  let evaled

  if (kind === 'job') {
    evaled = evaluateJobListing(
      {
        title: rec.title,
        description: listing?.summary || rec.note || rec.title,
        tags: listing?.tags || [],
        company: rec.company || '',
        location: rec.location || listing?.location || '',
        source: rec.source || listing?.source || '',
        url: rec.url,
      },
      summary,
    )
  } else {
    const program = findScholarshipProgram(rec)
    const item = program || {
      title: rec.title,
      source: rec.source || listing?.source,
      url: rec.url,
      focus: listing?.summary || listing?.focus || rec.title,
      fields: listing?.tags?.length ? listing.tags : ['any'],
      regions: ['global'],
      countries: ['*'],
    }
    evaled = evaluateScholarship(item, summary, regionHints(summary.country || ''))
  }

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
