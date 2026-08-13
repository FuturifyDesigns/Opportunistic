import i18n from '../i18n'

function hashSeed(...parts) {
  const s = parts.filter((p) => p != null && p !== '').join('|').toLowerCase()
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pick(seed, list) {
  if (!list?.length) return ''
  return list[seed % list.length]
}

function andList(items) {
  const list = (items || []).map((x) => String(x || '').trim()).filter(Boolean)
  if (!list.length) return ''
  if (list.length === 1) return list[0]
  if (list.length === 2) return `${list[0]} and ${list[1]}`
  return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`
}

function titleHint(title) {
  const t = String(title || '').toLowerCase()
  if (/engineer|developer|software|rails|frontend|backend|full[-\s]?stack|devops|programmer/.test(t)) {
    return 'engineering'
  }
  if (/account|financ|audit|tax|payable|receivable|bookkeep|controller|treasur/.test(t)) {
    return 'finance and accounting'
  }
  if (/nurs|health|clinic|medical|hospital|pharma|caregiver/.test(t)) return 'health'
  if (/teach|lectur|school|education|curriculum|tutor/.test(t)) return 'education'
  if (/market|seo|content|brand|social media|copywrit/.test(t)) return 'marketing'
  if (/design|ux|ui|figma|product design/.test(t)) return 'design'
  if (/data|analyst|machine learning|ml\b|statistic/.test(t)) return 'data'
  if (/scholar|fellowship|masters|master’s|phd|bursary/.test(t)) return 'study funding'
  return ''
}

function skillsHint(names) {
  const blob = (names || []).join(' ').toLowerCase()
  if (/excel|account|financ|audit|bookkeep|model/.test(blob)) return 'finance and accounting'
  if (/react|python|java|javascript|sql|aws|docker|git|node/.test(blob)) return 'software and tech'
  if (/nurs|health|clinic|care|pharma/.test(blob)) return 'health'
  if (/teach|curriculum|lesson/.test(blob)) return 'education'
  if (/market|seo|content|brand/.test(blob)) return 'marketing'
  if (/figma|design|ux|ui/.test(blob)) return 'design'
  return ''
}

function tt(key, opts) {
  return i18n.t(`reasons.${key}`, opts)
}

/**
 * Listing-specific plain-English why. Same listing stays stable; different
 * listings get different sentence shapes and facts.
 */
export function explainMatch({
  kind = 'job',
  title = '',
  company = '',
  location = '',
  source = '',
  country = '',
  scorecard = null,
  focus = '',
  qualification = '',
} = {}) {
  const matched = scorecard?.matched || []
  const gaps = scorecard?.gaps || []
  const field = scorecard?.field?.label || ''
  const fieldScore = Number(scorecard?.field?.score) || 0
  const locLabel = location || scorecard?.location?.label || ''
  const locScore = Number(scorecard?.location?.score) || 0
  const topSkill = (scorecard?.skills || []).filter((s) => (s.score || 0) >= 35)[0]
  const seed = hashSeed(kind, title, company, source, locLabel, matched.join(','))

  if (kind === 'scholarship') {
    return explainScholarship({
      seed,
      title,
      source,
      country,
      focus,
      qualification,
      field,
      fieldScore,
      matched,
      locLabel,
    })
  }

  return explainJob({
    seed,
    title,
    company,
    source,
    country,
    locLabel,
    locScore,
    field,
    fieldScore,
    matched,
    gaps,
    topSkill,
  })
}

function explainJob({
  seed,
  title,
  company,
  source,
  country,
  locLabel,
  locScore,
  field,
  fieldScore,
  matched,
  gaps,
  topSkill,
}) {
  const locBit = locLabel ? tt('jobLocBit', { place: locLabel }) : ''
  const coBit = company ? tt('jobCoBit', { company }) : ''
  const skillNames = andList(matched.slice(0, 3))
  const titleDom = titleHint(title)
  const skillDom = skillsHint(matched)
  const mismatch = Boolean(titleDom && skillDom && titleDom !== skillDom)

  const openers = [
    company
      ? tt('jobOpenCompany', { company, title: title || tt('thisRole'), loc: locBit })
      : tt('jobOpenTitle', { title: title || tt('thisRole'), loc: locBit, source: source || tt('thisBoard') }),
    tt('jobOpenRole', { title: title || tt('thisRole'), company: coBit, loc: locBit }),
    source
      ? tt('jobOpenSource', { source, title: title || tt('thisRole'), company: coBit, loc: locBit })
      : tt('jobOpenTitle', { title: title || tt('thisRole'), loc: locBit, source: tt('thisBoard') }),
  ]

  let skillsLine = ''
  if (mismatch) {
    skillsLine = tt('jobMismatch', {
      titleHint: titleDom,
      skillHint: skillDom,
      skills: skillNames || tt('yourListedSkills'),
    })
  } else if (topSkill && (topSkill.score || 0) >= 85 && skillNames) {
    skillsLine = tt('jobSkillStar', {
      skill: topSkill.name,
      score: Math.round(topSkill.score),
      more: matched.length > 1 ? tt('jobSkillStarMore', { skills: andList(matched.slice(1, 3)) }) : '',
    })
  } else if (matched.length >= 2) {
    skillsLine = pick(seed, [
      tt('jobSkillsAll', { skills: skillNames }),
      tt('jobSkillsShow', { skills: skillNames, title: title || tt('thisRole') }),
    ])
  } else if (matched.length === 1) {
    skillsLine = tt('jobSkillsOne', { skill: matched[0], title: title || tt('thisRole') })
  } else {
    skillsLine = tt('jobSkillsNone', { title: title || tt('thisRole') })
  }

  let fitLine = ''
  if (field && fieldScore >= 60 && locScore >= 70 && locLabel) {
    fitLine = tt('jobFieldLocGood', { field, place: locLabel, country: country || tt('yourArea') })
  } else if (field && fieldScore >= 60 && locLabel && locScore < 45) {
    fitLine = tt('jobFieldOkLocWeak', { field, place: locLabel, country: country || tt('yourArea') })
  } else if (locLabel && locScore >= 60) {
    fitLine = tt('jobLocOk', { place: locLabel, country: country || tt('yourArea') })
  } else if (locLabel && country) {
    fitLine = tt('jobLocCheck', { place: locLabel, country })
  } else if (field && fieldScore >= 50) {
    fitLine = tt('jobFieldOnly', { field })
  } else if (gaps.length) {
    fitLine = tt('jobGaps', { skills: andList(gaps.slice(0, 2)) })
  }

  return [pick(seed, openers), skillsLine, fitLine].filter(Boolean).join(' ')
}

function explainScholarship({
  seed,
  title,
  source,
  country,
  focus,
  qualification,
  field,
  fieldScore,
  matched,
  locLabel,
}) {
  const skillNames = andList(matched.slice(0, 3))
  const openers = [
    focus
      ? tt('schOpenFocus', { title: title || tt('thisAward'), source: source || tt('thisProgram'), focus })
      : tt('schOpenSimple', { title: title || tt('thisAward'), source: source || tt('thisProgram') }),
    source
      ? tt('schOpenSource', { source, title: title || tt('thisAward'), country: country || locLabel || tt('yourArea') })
      : tt('schOpenSimple', { title: title || tt('thisAward'), source: tt('thisProgram') }),
  ]

  let academic = ''
  if (qualification) {
    academic = tt('schQualLine', { qualification, field: field || tt('yourField') })
  } else if (field && fieldScore >= 70) {
    academic = tt('schFieldStrongLine', { field })
  } else if (field) {
    academic = tt('schFieldOkLine', { field })
  }

  let extra = ''
  if (skillNames) extra = tt('schSkillsLine', { skills: skillNames })
  else if (country) extra = tt('schCountryLine', { country })

  return [pick(seed, openers), academic, extra].filter(Boolean).join(' ')
}

export function shortMatchReason(input, maxSentences = 2) {
  const text = explainMatch(input)
  if (!text) return ''
  return text
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, maxSentences)
    .join(' ')
}
