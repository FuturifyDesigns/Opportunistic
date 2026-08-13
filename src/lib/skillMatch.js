/**
 * Profile ↔ listing fit engine: skill scorecards, readable reasons, accurate scores.
 */

import i18n from '../i18n'
import { stripInternalMarkup } from './internalMarkup'

const SCORECARD_START = '[[opp_scorecard]]'
const SCORECARD_END = '[[/opp_scorecard]]'

const PROFICIENCY_WEIGHT = {
  beginner: 0.7,
  intermediate: 1,
  advanced: 1.2,
  expert: 1.35,
}

/** Common aliases so “JS” still matches “JavaScript” in job text. */
const ALIAS_GROUPS = [
  ['javascript', 'js', 'ecmascript', 'es6', 'node', 'nodejs', 'node.js'],
  ['typescript', 'ts'],
  ['react', 'reactjs', 'react.js', 'nextjs', 'next.js'],
  ['vue', 'vuejs', 'vue.js', 'nuxt'],
  ['angular', 'angularjs'],
  ['python', 'django', 'flask', 'fastapi'],
  ['java', 'spring', 'jvm'],
  ['csharp', 'c#', '.net', 'dotnet'],
  ['cpp', 'c++'],
  ['sql', 'postgres', 'postgresql', 'mysql', 'sqlite', 'mssql'],
  ['aws', 'amazon web services', 's3', 'ec2'],
  ['azure', 'microsoft azure'],
  ['gcp', 'google cloud'],
  ['docker', 'kubernetes', 'k8s', 'containers'],
  ['git', 'github', 'gitlab'],
  ['html', 'html5', 'css', 'css3', 'sass', 'scss'],
  ['mobile', 'android', 'ios', 'flutter', 'react native'],
  ['ui', 'ux', 'figma', 'design'],
  ['data', 'analytics', 'excel', 'tableau', 'power bi', 'pandas'],
  ['machine learning', 'ml', 'ai', 'deep learning', 'nlp'],
  ['communication', 'writing', 'presentation'],
  ['leadership', 'management', 'project management', 'agile', 'scrum'],
  ['marketing', 'seo', 'content'],
  ['finance', 'accounting', 'excel'],
  ['healthcare', 'nursing', 'public health'],
  ['education', 'teaching', 'curriculum'],
]

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[+]/g, (ch) => (ch === '+' ? 'plus' : 'sharp'))
    .replace(/[^a-z0-9.#+\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function tokenInText(token, hay) {
  const t = norm(token)
  if (!t || t.length < 2) return false
  if (t.length <= 3) {
    const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(t)}(?:$|[^a-z0-9])`, 'i')
    return re.test(hay)
  }
  return hay.includes(t)
}

function expandTerms(skillName) {
  const base = norm(skillName)
  const terms = new Set([base])
  for (const group of ALIAS_GROUPS) {
    if (group.some((g) => base.includes(g) || g.includes(base))) {
      group.forEach((g) => terms.add(g))
    }
  }
  // Also split multi-word skills
  base.split(/\s+/).filter((w) => w.length > 2).forEach((w) => terms.add(w))
  return [...terms]
}

function skillHitStrength(skillName, hay) {
  const terms = expandTerms(skillName)
  let best = 0
  for (const term of terms) {
    if (!tokenInText(term, hay)) continue
    // Longer / more specific terms score higher
    const strength = Math.min(1, 0.55 + term.length / 24)
    if (strength > best) best = strength
  }
  return best
}

function fieldFit(field, hay, itemFields = []) {
  const f = norm(field)
  if (!f) return 0
  let score = 0
  if (skillHitStrength(f, hay) > 0) score = 72
  const words = f.split(/\s+/).filter((w) => w.length > 2)
  let hits = 0
  for (const w of words) {
    if (tokenInText(w, hay)) hits += 1
  }
  if (words.length) score = Math.max(score, Math.round((hits / words.length) * 88))
  const specific = (itemFields || []).filter((x) => x && x !== 'any').map(norm)
  if (specific.some((s) => f.includes(s) || s.includes(f) || skillHitStrength(s, f) > 0)) {
    score = Math.max(score, 90)
  }
  return Math.min(100, score)
}

function locationFit(location, country, countryFitHint = null) {
  if (countryFitHint != null) {
    // countryMatch scale ~0–3+
    return Math.max(0, Math.min(100, Math.round(Number(countryFitHint) * 28)))
  }
  const loc = norm(location)
  const c = norm(country)
  if (!c) return 50
  if (!loc) return 40
  if (loc.includes(c) || c.includes(loc)) return 95
  if (/remote|worldwide|global|anywhere|work from home/.test(loc)) return 68
  return 28
}

/**
 * Build per-skill scorecard against listing text.
 */
export function buildSkillScorecard(skills = [], listingText = '', options = {}) {
  const hay = norm(listingText)
  const list = (skills || []).filter((s) => s.skill_name?.trim())
  const cards = list.map((s) => {
    const name = s.skill_name.trim()
    const level = s.proficiency || 'intermediate'
    const weight = PROFICIENCY_WEIGHT[level] || 1
    const hit = skillHitStrength(name, hay)
    const raw = Math.round(hit * 100 * weight)
    const score = Math.max(0, Math.min(100, raw))
    let status = 'missing'
    if (score >= 70) status = 'strong'
    else if (score >= 35) status = 'partial'
    return { name, level, score, status }
  })

  const matched = cards.filter((c) => c.status !== 'missing')
  const gaps = cards.filter((c) => c.status === 'missing')
  const denom = cards.reduce((a, c) => a + (PROFICIENCY_WEIGHT[c.level] || 1), 0) || 1
  const skillOverall = Math.round(
    cards.reduce((a, c) => a + c.score * (PROFICIENCY_WEIGHT[c.level] || 1), 0) / denom,
  )

  return {
    version: 1,
    skills: cards.sort((a, b) => b.score - a.score),
    matched: matched.map((c) => c.name),
    gaps: gaps.map((c) => c.name),
    skillOverall: list.length ? skillOverall : options.noSkillsFallback ?? 35,
  }
}

function readableJobReason({ title, company, scorecard, fieldScore, locScore, country, location }) {
  const t = (key, opts) => i18n.t(`reasons.${key}`, opts)
  const lines = []
  const matched = scorecard.matched || []
  const gaps = scorecard.gaps || []
  const total = (scorecard.skills || []).length

  if (matched.length && total) {
    lines.push(
      t('skillMatchStrong', {
        count: matched.length,
        total,
        skills: matched.slice(0, 3).join(', '),
        title: title || t('thisRole'),
      }),
    )
  } else if (total) {
    lines.push(t('skillMatchWeak', { title: title || t('thisRole') }))
  } else {
    lines.push(t('skillMatchNoSkills', { title: title || t('thisRole') }))
  }

  if (fieldScore >= 60) lines.push(t('fieldAligns'))
  else if (fieldScore >= 35) lines.push(t('fieldPartial'))
  else lines.push(t('fieldWeak'))

  if (locScore >= 80) lines.push(t('locStrong', { place: country || location || t('yourArea') }))
  else if (locScore >= 55) lines.push(t('locRemoteOk', { place: country || t('yourArea') }))
  else if (country) lines.push(t('locCheck', { place: country }))

  if (gaps.length) {
    lines.push(t('skillGaps', { skills: gaps.slice(0, 3).join(', ') }))
  }

  if (company) lines.push(t('employerLine', { company }))
  lines.push(t('verifyOfficial'))
  return lines.join(' ')
}

function readableScholarshipReason({ item, summary, scorecard, fieldScore }) {
  const t = (key, opts) => i18n.t(`reasons.${key}`, opts)
  const lines = []
  const matched = scorecard.matched || []

  lines.push(t('schIntro', { title: item.title, focus: item.focus || '' }))

  if (summary.primary) {
    lines.push(
      t('schQual', {
        kind: summary.primary.type === 'certificate' ? t('certificate') : t('degree'),
        field: summary.primary.field,
        institution: summary.institution ? t('fromInstitution', { institution: summary.institution }) : '',
      }),
    )
  }

  if (item.focus) {
    lines.push(t('focusField', { field: item.focus }))
  }

  if (fieldScore >= 70) lines.push(t('schFieldStrong'))
  else if (fieldScore >= 40) lines.push(t('schFieldOk'))
  else lines.push(t('schFieldWeak'))

  if (matched.length) {
    lines.push(t('schSkills', { skills: matched.slice(0, 4).join(', ') }))
  }

  if (summary.country) {
    lines.push(t('schCountry', { country: summary.country }))
  }

  lines.push(t('officialUrl'))
  return lines.join(' ')
}

/**
 * Score a job listing against the user profile summary.
 */
export function evaluateJobListing(
  {
    title = '',
    description = '',
    tags = [],
    company = '',
    location = '',
    source = '',
    url = '',
  },
  summary,
  { countryFitHint = null } = {},
) {
  const listingText = [title, company, description, ...(tags || []), source].join(' ')
  const scorecard = buildSkillScorecard(summary.skills || [], listingText)
  const fieldScore = fieldFit(summary.field, norm(listingText))
  const locScore = locationFit(location, summary.country, countryFitHint)

  const skillPart = scorecard.skillOverall
  const hasSignal = scorecard.matched.length > 0 || fieldScore >= 40

  let matchScore = Math.round(skillPart * 0.5 + fieldScore * 0.22 + locScore * 0.2 + (hasSignal ? 8 : 0))

  if (summary.goal === 'jobs') matchScore += 4
  if (summary.goal === 'scholarships') matchScore -= 10
  if (!summary.skills?.length) matchScore -= 6
  if (!summary.quals?.length) matchScore -= 3
  if (!hasSignal) matchScore = Math.min(matchScore, 48)

  matchScore = Math.max(28, Math.min(97, matchScore))

  const fullScorecard = {
    ...scorecard,
    overall: matchScore,
    field: { label: summary.field || '', score: fieldScore },
    location: { label: location || summary.country || '', score: locScore },
    kind: 'job',
  }

  const reasoning = readableJobReason({
    title,
    company,
    scorecard: fullScorecard,
    fieldScore,
    locScore,
    country: summary.country,
    location,
  })

  return {
    match_score: matchScore,
    reasoning: packReasoning(reasoning, fullScorecard),
    scorecard: fullScorecard,
    hasSignal,
  }
}

/**
 * Score a scholarship program against the user profile.
 */
export function evaluateScholarship(item, summary, regions = []) {
  const listingText = [item.title, item.focus, item.source, ...(item.fields || []), ...(item.regions || [])].join(
    ' ',
  )
  const scorecard = buildSkillScorecard(summary.skills || [], listingText, { noSkillsFallback: 45 })
  const fieldScore = fieldFit(summary.field, norm(listingText), item.fields)

  let matchScore = 38
  const regionHit = (item.regions || []).filter((r) => regions.includes(r) && r !== 'global')
  matchScore += Math.min(24, regionHit.length * 8)
  if ((item.regions || []).includes('global')) matchScore += 3
  matchScore += Math.round(fieldScore * 0.28)
  matchScore += Math.round(scorecard.skillOverall * 0.18)
  matchScore += Math.min(10, (summary.quals || []).length * 3)
  matchScore += Math.min(8, (summary.advanced || []).length * 3)

  const c = norm(summary.country)
  if ((item.countries || []).some((x) => x !== '*' && x !== '*africa' && c.includes(norm(x)))) {
    matchScore += 10
  }

  if (summary.goal === 'scholarships') matchScore += 8
  if (summary.goal === 'jobs') matchScore -= 12
  if (!summary.skills?.length) matchScore -= 4
  if (!summary.quals?.length) matchScore -= 6

  matchScore = Math.max(30, Math.min(97, Math.round(matchScore)))

  const fullScorecard = {
    ...scorecard,
    overall: matchScore,
    field: { label: summary.field || '', score: fieldScore },
    location: { label: summary.country || '', score: regionHit.length ? 86 : 55 },
    kind: 'scholarship',
  }

  const reasoning = readableScholarshipReason({
    item,
    summary,
    scorecard: fullScorecard,
    fieldScore,
  })

  return {
    match_score: matchScore,
    reasoning: packReasoning(reasoning, fullScorecard),
    scorecard: fullScorecard,
  }
}

export function packReasoning(text, scorecard) {
  if (!scorecard) return String(text || '')
  try {
    return `${String(text || '').trim()}\n\n${SCORECARD_START}${JSON.stringify(scorecard)}${SCORECARD_END}`
  } catch {
    return String(text || '')
  }
}

export function unpackReasoning(reasoning = '') {
  const raw = String(reasoning || '')
  const start = raw.indexOf(SCORECARD_START)
  const end = raw.indexOf(SCORECARD_END)
  if (start === -1 || end === -1 || end <= start) {
    return { text: stripInternalMarkup(raw), scorecard: null }
  }
  const json = raw.slice(start + SCORECARD_START.length, end)
  let scorecard = null
  try {
    scorecard = JSON.parse(json)
  } catch {
    scorecard = null
  }
  const text = stripInternalMarkup(`${raw.slice(0, start)} ${raw.slice(end + SCORECARD_END.length)}`)
  return { text, scorecard }
}

/** Simple tips derived from a scorecard (plain language). */
export function tipsFromScorecard(scorecard, { kind = 'job', country = '', field = '' } = {}) {
  if (!scorecard) return []
  const tips = []
  const matched = scorecard.matched || []
  const gaps = scorecard.gaps || []

  if (matched.length) {
    tips.push(
      i18n.t('tips.plainLeadSkills', {
        skills: matched.slice(0, 2).join(' and '),
      }),
    )
  }
  if (gaps.length) {
    tips.push(
      i18n.t('tips.plainCloseGap', {
        skill: gaps[0],
      }),
    )
  }
  if (scorecard.field?.score >= 60) {
    tips.push(i18n.t('tips.plainField', { field: scorecard.field.label || field }))
  }
  if (kind === 'job') {
    tips.push(i18n.t('tips.plainResume', { skills: matched.slice(0, 2).join(', ') || field }))
    tips.push(i18n.t('tips.plainApply', { place: country || i18n.t('tips.yourMarket') }))
  } else {
    tips.push(i18n.t('tips.plainEssay', { field: field || scorecard.field?.label || '' }))
    tips.push(i18n.t('tips.plainDeadline'))
  }
  tips.push(i18n.t('tips.plainVerify'))
  return tips.filter(Boolean)
}
