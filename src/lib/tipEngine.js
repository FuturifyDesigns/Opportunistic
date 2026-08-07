/**
 * Generates unique, actionable tips for a specific listing + live profile.
 * Tips reshuffle whenever profile skills/quals/country/headline or match score change.
 */

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

function scholarshipPool({ profile, listing, field, skills, quals, country, score, advanced, weak }) {
  const skillNames = skills.map((s) => s.skill_name)
  const skillList = skillNames.slice(0, 3).join(', ') || field
  const primary = quals[0]
  const inst = primary?.institution
  const tips = []

  tips.push(
    `Write a 150-word leadership story that starts in ${country || 'your community'} and ends with how a ${listing.source} award multiplies that impact.`,
  )
  tips.push(
    `Map your ${field} background to 3 modules on a target ${listing.location || 'host'} program — name the modules in your personal statement.`,
  )
  if (skillList) {
    tips.push(
      `In essay 1, dedicate one paragraph to how ${skillList} already produced a measurable result (numbers beat adjectives).`,
    )
  }
  if (advanced.length) {
    tips.push(
      `Lead with your ${advanced[0].skill_name} depth (${advanced[0].proficiency}) as proof you can handle ${listing.level || 'postgraduate'} intensity.`,
    )
  }
  if (weak.length) {
    tips.push(
      `Before submitting, raise ${weak[0].skill_name} with a short project or certificate — reviewers notice unfinished skill claims.`,
    )
  }
  if (inst) {
    tips.push(
      `Ask a referee from ${inst} who saw you lead, not only teach you — Chevening-style panels weight influence over grades alone.`,
    )
  } else {
    tips.push(
      `Secure two referees who can quote a specific initiative you ran — vague “hardworking student” letters sink strong profiles.`,
    )
  }
  tips.push(
    `Build a deadline reverse calendar from “${listing.deadlineLabel || 'the official close date'}” with buffers for transcripts, tests, and references.`,
  )
  tips.push(
    `Draft answers offline first, then paste into the portal — auto-save glitches erase hours of work on many scholarship forms.`,
  )
  tips.push(
    `Research 2 alumni from ${country || 'your region'} who won ${listing.source}; note what their applications emphasized and mirror the structure, not the story.`,
  )
  tips.push(
    `If your match score is ${Math.round(score)}%, treat gaps honestly in the essay — panels reward self-awareness more than perfection claims.`,
  )
  tips.push(
    `Align your headline (“${profile?.headline || field}”) with the program’s stated mission so the first screen already feels intentional.`,
  )
  tips.push(
    `Prepare a 60-second verbal pitch of your study plan for interviews: problem → your edge → ${listing.source} as the accelerator.`,
  )
  tips.push(
    `Collect proof artifacts (GitHub, reports, awards, community letters) that back every skill you listed — screenshots ready before you apply.`,
  )
  tips.push(
    `Check nationality and return-home clauses for ${listing.source} against your ${country || 'country'} status this cycle — eligibility mistakes waste strong essays.`,
  )
  tips.push(
    `Rewrite your bio so a stranger in ${listing.location || 'the host country'} understands your field in one sentence, then expand.`,
  )
  if (listing.id === 'chevening') {
    tips.push(
      `Pick three UK courses that genuinely fit ${field}, not prestige alone — Chevening rejects mismatched course trios even with strong essays.`,
    )
    tips.push(
      `Spend a full page on “networking” plans: which UK societies, labs, or policy groups you will join, and what you bring back to ${country || 'home'}.`,
    )
  }
  if (listing.id === 'daad') {
    tips.push(
      `Filter DAAD by your exact degree level and ${field}, then shortlist 2 calls — generic “Germany” applications rarely clear the first cut.`,
    )
    tips.push(
      `Decide early whether you need German or English proof for the host program, and book the test date before the call closes.`,
    )
  }
  if (listing.id === 'mastercard') {
    tips.push(
      `Apply through a partner university that teaches ${field} — Mastercard Scholars is campus-specific, not one global form.`,
    )
    tips.push(
      `Document need and leadership together: one paragraph on barriers, one on what you already changed for others in ${country || 'your community'}.`,
    )
  }
  if (listing.id === 'fulbright') {
    tips.push(
      `Use your country’s Fulbright page only — deadlines and forms for ${country || 'your nationality'} differ from the global brochure.`,
    )
    tips.push(
      `Make the research/study objective falsifiable: what question in ${field} will you answer in 12–24 months?`,
    )
  }
  if (listing.id === 'gates') {
    tips.push(
      `Cambridge fit comes first: name a supervisor or lab group relevant to ${field} before polishing the Gates statement.`,
    )
  }
  if (listing.id === 'unesco' || listing.id === 'african_union') {
    tips.push(
      `Tie your proposal to a published theme from ${listing.source}, using language from the call — thematic misalignment is a common silent reject.`,
    )
  }

  return tips
}

function jobPool({ profile, listing, field, skills, quals, country, score, advanced, weak }) {
  const skillNames = skills.map((s) => s.skill_name)
  const primarySkill = skillNames[0] || field
  const tips = []

  tips.push(
    `Rewrite your résumé summary to lead with ${primarySkill} + ${field}, then mirror the top 5 verbs from each ${listing.source} posting you open.`,
  )
  tips.push(
    `Build a 1-page “proof sheet” with 3 bullets: problem, action using ${skillNames.slice(0, 2).join(' / ') || field}, measurable result.`,
  )
  if (advanced.length) {
    tips.push(
      `Put ${advanced.map((s) => s.skill_name).slice(0, 2).join(' and ')} in the first third of your LinkedIn/About — recruiters skim, they don’t hunt.`,
    )
  }
  if (weak.length) {
    tips.push(
      `For roles requiring ${weak[0].skill_name}, add a weekend mini-project and link it — intermediate claims without evidence get filtered out.`,
    )
  }
  tips.push(
    `Set ${listing.source} alerts for “${field}” and your country (${country || 'target location'}), then apply within 48 hours of posting.`,
  )
  tips.push(
    `Target 5 companies per week that hire for ${field} in or from ${country || 'your market'}, not 50 random Easy Apply clicks.`,
  )
  tips.push(
    `In every cover note, name one concrete deliverable you would ship in the first 30 days using your current stack.`,
  )
  tips.push(
    `Ask for referrals only after you can explain the team’s product in 2 sentences — cold asks without homework burn bridges.`,
  )
  tips.push(
    `Record a 90-second Loom (or voice note) walking through a project; attach it when ${listing.source} allows message/apply extras.`,
  )
  tips.push(
    `Your current match confidence is ~${Math.round(score)}% — if under 70%, tighten skills on Profile and rematch before spraying applications.`,
  )
  tips.push(
    `Translate academic language from ${quals[0]?.field || field} into employer language: “coursework” → “delivered X under deadline”.`,
  )
  tips.push(
    `Keep a rejection log: role, missing skill, next action — patterns tell you what to learn next faster than guesswork.`,
  )
  if (listing.id === 'linkedin') {
    tips.push(
      `Turn on Open to Work (recruiters only) and pin a featured project that proves ${primarySkill}.`,
    )
    tips.push(
      `Comment thoughtfully on 3 hiring-manager posts in ${field} this week before cold-applying — warm visibility beats silent Apply.`,
    )
  }
  if (listing.id === 'indeed') {
    tips.push(
      `Use Indeed’s location filter exactly as “${country || 'your city/country'}” and sort by date — stale reposts waste energy.`,
    )
  }
  if (listing.id === 'remoteok') {
    tips.push(
      `Read the country/timezone line twice on Remote OK posts — many “remote” roles still exclude ${country || 'some regions'}.`,
    )
    tips.push(
      `Price your contractor rate and timezone overlap upfront in the first message to avoid ghosting after screens.`,
    )
  }
  if (listing.id === 'glassdoor') {
    tips.push(
      `Read the latest interview reports for that employer, then prepare 2 stories that answer the most repeated question pattern.`,
    )
  }
  if (listing.id === 'reliefweb') {
    tips.push(
      `Lead applications with field/volunteer impact in ${country || 'your region'} — ReliefWeb hiring heavily weights mission-relevant experience.`,
    )
    tips.push(
      `Match language from the vacancy (MEAL, protection, WASH, etc.) only if you can defend it — buzzword stuffing is obvious.`,
    )
  }
  if (profile?.headline) {
    tips.push(
      `Sync your public headline to “${profile.headline}” everywhere you apply so ${listing.source} screens and your CV tell one story.`,
    )
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
  count = 6,
} = {}) {
  const quals = (qualifications || []).filter((q) => q.field?.trim())
  const sk = (skills || []).filter((s) => s.skill_name?.trim())
  const field = quals[0]?.field?.trim() || sk[0]?.skill_name || 'your field'
  const country = profile?.country || null
  const score = Number(match?.match_score) || 50
  const advanced = topSkills(sk.filter((s) => ['advanced', 'expert'].includes(s.proficiency)), 3)
  const weak = weakSkills(sk)
  const listingSafe = listing || {
    id: 'generic',
    source: match?.source || 'this opportunity',
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

  const pool =
    kind === 'job' || listingSafe.kind === 'job'
      ? jobPool(ctx)
      : scholarshipPool(ctx)

  // Generic fallbacks if pool somehow thin
  while (pool.length < count) {
    pool.push(
      `Update your Opportunistic profile, save to rematch, then revisit this page — tips regenerate from your latest skills and goals.`,
    )
  }

  const seed = [
    profileFingerprint(profile, quals, sk),
    listingSafe.id || listingSafe.source || '',
    match?.id || '',
    Math.round(score),
    match?.found_at || '',
    kind,
  ].join('|')

  const rand = mulberry32(hashSeed(seed))
  const tips = pickUnique(pool, count, rand)

  return {
    tips,
    seed,
    generatedAt: new Date().toISOString(),
  }
}
