/**
 * Generates unique, actionable tips for a specific listing + live profile.
 * Tips reshuffle whenever profile skills/quals/country/headline or match score change.
 */

import i18n from '../i18n'
import { tipsFromScorecard } from './skillMatch'

function hashSeed(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function pickUnique(pool, count, rand) {
  const copy = [...pool]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  const seen = new Set()
  const out = []
  for (const tip of copy) {
    const key = tip.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(tip)
    if (out.length >= count) break
  }
  return out
}

function topSkills(skills = [], n = 3) {
  return [...skills]
    .filter((s) => s.skill_name?.trim())
    .sort((a, b) => {
      const rank = { expert: 4, advanced: 3, intermediate: 2, beginner: 1 }
      return (rank[b.proficiency] || 0) - (rank[a.proficiency] || 0)
    })
    .slice(0, n)
}

function weakSkills(skills = []) {
  return skills.filter((s) => ['beginner', 'intermediate'].includes(s.proficiency || 'intermediate'))
}

function profileFingerprint(profile, qualifications, skills) {
  return [
    profile?.country || '',
    profile?.headline || '',
    profile?.full_name || '',
    profile?.updated_at || '',
    (qualifications || []).map((q) => `${q.field}|${q.year}|${q.institution}`).join(';'),
    (skills || []).map((s) => `${s.skill_name}|${s.proficiency}`).join(';'),
  ].join('::')
}

function tt(key, opts) {
  return i18n.t(`tips.${key}`, opts)
}

function scholarshipPool({ profile, listing, field, skills, quals, country, score, advanced, weak }) {
  const skillNames = skills.map((s) => s.skill_name)
  const skillList = skillNames.slice(0, 3).join(', ') || field
  const primary = quals[0]
  const inst = primary?.institution
  const tips = []

  tips.push(
    tt('sLeadership', {
      place: country || tt('yourCommunity'),
      source: listing.source,
    }),
  )
  tips.push(
    tt('sModules', {
      field,
      location: listing.location || tt('host'),
    }),
  )
  if (skillList) {
    tips.push(tt('sEssaySkills', { skills: skillList }))
  }
  if (advanced.length) {
    tips.push(
      tt('sAdvanced', {
        skill: advanced[0].skill_name,
        level: advanced[0].proficiency,
        intensity: listing.level || tt('postgraduate'),
      }),
    )
  }
  if (weak.length) {
    tips.push(tt('sWeak', { skill: weak[0].skill_name }))
  }
  if (inst) {
    tips.push(tt('sRefereeInst', { institution: inst }))
  } else {
    tips.push(tt('sRefereeGeneric'))
  }
  tips.push(tt('sCalendar', { deadline: listing.deadlineLabel || tt('officialClose') }))
  tips.push(tt('sOffline'))
  tips.push(
    tt('sAlumni', {
      place: country || tt('yourRegion'),
      source: listing.source,
    }),
  )
  tips.push(tt('sScore', { score: Math.round(score) }))
  tips.push(tt('sHeadline', { headline: profile?.headline || field }))
  tips.push(tt('sPitch', { source: listing.source }))
  tips.push(tt('sProof'))
  tips.push(
    tt('sEligibility', {
      source: listing.source,
      country: country || tt('country'),
    }),
  )
  tips.push(tt('sBio', { location: listing.location || tt('hostCountry') }))
  if (listing.id === 'chevening') {
    tips.push(tt('sCheveningCourses', { field }))
    tips.push(tt('sCheveningNet', { place: country || tt('home') }))
  }
  if (listing.id === 'daad') {
    tips.push(tt('sDaadFilter', { field }))
    tips.push(tt('sDaadLang'))
  }
  if (listing.id === 'mastercard') {
    tips.push(tt('sMastercardApply', { field }))
    tips.push(tt('sMastercardNeed', { place: country || tt('yourCommunity') }))
  }
  if (listing.id === 'fulbright') {
    tips.push(tt('sFulbrightPage', { country: country || tt('yourNationality') }))
    tips.push(tt('sFulbrightObj', { field }))
  }
  if (listing.id === 'gates') {
    tips.push(tt('sGates', { field }))
  }
  if (listing.id === 'unesco' || listing.id === 'african_union') {
    tips.push(tt('sTheme', { source: listing.source }))
  }

  return tips
}

function jobPool({ profile, listing, field, skills, quals, country, score, advanced, weak }) {
  const skillNames = skills.map((s) => s.skill_name)
  const primarySkill = skillNames[0] || field
  const tips = []

  tips.push(tt('jResume', { skill: primarySkill, field, source: listing.source }))
  tips.push(
    tt('jProof', {
      skills: skillNames.slice(0, 2).join(' / ') || field,
    }),
  )
  if (advanced.length) {
    tips.push(
      tt('jAdvanced', {
        skills: advanced
          .map((s) => s.skill_name)
          .slice(0, 2)
          .join(' and '),
      }),
    )
  }
  if (weak.length) {
    tips.push(tt('jWeak', { skill: weak[0].skill_name }))
  }
  tips.push(
    tt('jAlerts', {
      source: listing.source,
      field,
      country: country || tt('targetLocation'),
    }),
  )
  tips.push(tt('jTarget', { field, country: country || tt('yourMarket') }))
  tips.push(tt('jCover'))
  tips.push(tt('jReferrals'))
  tips.push(tt('jLoom', { source: listing.source }))
  tips.push(tt('jConfidence', { score: Math.round(score) }))
  tips.push(tt('jTranslate', { field: quals[0]?.field || field }))
  tips.push(tt('jLog'))
  if (listing.id === 'linkedin') {
    tips.push(tt('jLinkedinOpen', { skill: primarySkill }))
    tips.push(tt('jLinkedinComment', { field }))
  }
  if (listing.id === 'indeed') {
    tips.push(tt('jIndeed', { country: country || tt('yourCityCountry') }))
  }
  if (listing.id === 'remoteok') {
    tips.push(tt('jRemoteOk', { country: country || tt('someRegions') }))
    tips.push(tt('jRemoteRate'))
  }
  if (listing.id === 'glassdoor') {
    tips.push(tt('jGlassdoor'))
  }
  if (listing.id === 'reliefweb') {
    tips.push(tt('jReliefImpact', { place: country || tt('yourRegion') }))
    tips.push(tt('jReliefLang'))
  }
  if (profile?.headline) {
    tips.push(tt('jHeadline', { headline: profile.headline, source: listing.source }))
  }

  return tips
}

/**
 * @returns {{ tips: string[], seed: string, generatedAt: string }}
 */
export function generateWinTips({
  kind = 'scholarship',
  profile = null,
  qualifications = [],
  skills = [],
  listing = null,
  match = null,
  scorecard = null,
  count = 6,
} = {}) {
  const quals = (qualifications || []).filter((q) => q.field?.trim())
  const sk = (skills || []).filter((s) => s.skill_name?.trim())
  const field = quals[0]?.field?.trim() || sk[0]?.skill_name || tt('yourField')
  const country = profile?.country || null
  const score = Number(match?.match_score) || 50
  const advanced = topSkills(
    sk.filter((s) => ['advanced', 'expert'].includes(s.proficiency)),
    3,
  )
  const weak = weakSkills(sk)
  const listingSafe = listing || {
    id: 'generic',
    source: match?.source || tt('thisOpportunity'),
    location: '',
    level: '',
    deadlineLabel: '',
  }

  const ctx = {
    profile,
    listing: listingSafe,
    field,
    skills: sk,
    quals,
    country,
    score,
    advanced,
    weak,
  }

  const plain = tipsFromScorecard(scorecard, { kind, country, field })
  const pool = [...plain, ...(kind === 'job' ? jobPool(ctx) : scholarshipPool(ctx))]
  const seed = [
    kind,
    listingSafe.id,
    match?.id || match?.url || '',
    profileFingerprint(profile, quals, sk),
    Math.round(score),
    i18n.language,
    (scorecard?.matched || []).join(','),
  ].join('|')

  const rand = mulberry32(hashSeed(seed))
  return {
    tips: pickUnique(pool, count, rand),
    seed,
    generatedAt: new Date().toISOString(),
  }
}
