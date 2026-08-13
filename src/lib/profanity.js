const WORDS = [
  'anal',
  'arse',
  'arsehole',
  'ass',
  'asshat',
  'asshole',
  'asswipe',
  'bastard',
  'bitch',
  'bollocks',
  'bugger',
  'bullshit',
  'chink',
  'clit',
  'cock',
  'cocksucker',
  'coon',
  'crap',
  'cum',
  'cunt',
  'dick',
  'dickhead',
  'dildo',
  'dipshit',
  'dumbass',
  'dyke',
  'fag',
  'faggot',
  'btch',
  'fck',
  'fuck',
  'fucker',
  'fucking',
  'fuk',
  'goddamn',
  'jackass',
  'jerkoff',
  'kike',
  'knobhead',
  'minge',
  'motherfucker',
  'nigga',
  'nigger',
  'piss',
  'pissed',
  'porn',
  'porno',
  'prick',
  'pussy',
  'retard',
  'retarded',
  'shit',
  'shithead',
  'shite',
  'shitty',
  'sht',
  'slut',
  'spastic',
  'spic',
  'tit',
  'tits',
  'titties',
  'twat',
  'wank',
  'wanker',
  'whore',
]

const WORD_SET = new Set(WORDS)
const SUFFIXES = ['ing', 'ers', 'er', 'ed', 'es', 's', 'y']
const LEET = {
  0: 'o',
  1: 'i',
  3: 'e',
  4: 'a',
  5: 's',
  7: 't',
  '@': 'a',
  $: 's',
  '!': 'i',
}

function normalizeToken(raw) {
  return String(raw || '')
    .toLowerCase()
    .replace(/[@$0-9!]/g, (ch) => LEET[ch] || ch)
    .replace(/[^a-z]/g, '')
}

export function isProfaneToken(token) {
  const n = normalizeToken(token)
  if (!n || n.length < 3) return false
  if (WORD_SET.has(n)) return true
  for (const sfx of SUFFIXES) {
    if (n.length > sfx.length + 2 && n.endsWith(sfx) && WORD_SET.has(n.slice(0, -sfx.length))) {
      return true
    }
  }
  return false
}

export function splitProfanity(text) {
  const value = String(text || '')
  if (!value) return []
  const parts = []
  for (const chunk of value.match(/[A-Za-z0-9@$*#!._-]+|[^A-Za-z0-9@$*#!._-]+/g) || []) {
    const censored = /[A-Za-z0-9@$]/.test(chunk) && isProfaneToken(chunk)
    const last = parts[parts.length - 1]
    if (last && last.censored === censored) last.text += chunk
    else parts.push({ text: chunk, censored })
  }
  return parts
}
