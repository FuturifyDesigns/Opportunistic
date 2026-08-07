/**
 * Country fit helpers for live job feeds.
 * Prefer postings in the user's selected country; allow open remote/worldwide roles.
 */

const WORLDWIDE_MARKERS = [
  'worldwide',
  'world wide',
  'anywhere',
  'anywhere in the world',
  'remote',
  'fully remote',
  'work from anywhere',
  'global',
  'international',
  'all countries',
  'any location',
]

/** Extra search terms that mean the same country in job boards / APIs. */
const COUNTRY_ALIASES = {
  'united states': ['usa', 'u.s.', 'u.s.a', 'us', 'united states of america', 'america'],
  'united kingdom': ['uk', 'u.k.', 'britain', 'great britain', 'england', 'scotland', 'wales'],
  'south africa': ['rsa', 'za'],
  'united arab emirates': ['uae', 'dubai', 'abu dhabi'],
  'czech republic': ['czechia', 'czech'],
  'south korea': ['korea', 'republic of korea'],
  'ivory coast': ["côte d'ivoire", 'cote divoire', "cote d'ivoire"],
  'congo': ['democratic republic of the congo', 'drc', 'republic of the congo'],
  botswana: ['bw', 'gaborone'],
  namibia: ['na', 'windhoek'],
  nigeria: ['ng', 'lagos', 'abuja'],
  kenya: ['ke', 'nairobi'],
  ghana: ['gh', 'accra'],
  germany: ['de', 'deutschland'],
  france: ['fr'],
  canada: ['ca'],
  australia: ['au'],
  india: ['in', 'bharat'],
  china: ['cn', 'prc'],
  japan: ['jp'],
  brazil: ['br', 'brasil'],
}

function normalize(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s.+#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function aliasTerms(country) {
  const c = normalize(country)
  const extras = COUNTRY_ALIASES[c] || []
  return [c, ...extras.map(normalize)].filter(Boolean)
}

export function isWorldwideRemote(location = '') {
  const loc = normalize(location)
  if (!loc) return true
  return WORLDWIDE_MARKERS.some((m) => loc.includes(m))
}

export function locationMentionsCountry(location = '', country = '') {
  if (!country) return false
  const loc = normalize(location)
  if (!loc) return false
  const terms = aliasTerms(country)
  return terms.some((term) => {
    if (!term) return false
    if (term.length <= 2) {
      // short codes: whole-word style
      return new RegExp(`(?:^|\\s)${term}(?:\\s|$)`).test(loc)
    }
    return loc.includes(term)
  })
}

/**
 * Score how well a job location fits the selected country.
 * 3 = explicit country match, 1 = open remote/worldwide, 0 = other country / mismatch.
 */
export function countryFitScore(location, country) {
  if (!country) return 1
  if (locationMentionsCountry(location, country)) return 3
  if (isWorldwideRemote(location)) return 1
  return 0
}

/** Hard gate: only keep jobs for the selected country (or open remote). */
export function jobFitsSelectedCountry(location, country) {
  if (!country) return true
  return countryFitScore(location, country) > 0
}
