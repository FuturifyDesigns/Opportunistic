import fs from 'fs'
import { normalizeFieldName, normalizeSkillName, allCatalogSkills } from '../src/lib/skillCatalog.js'
import { generateTypoVariants, buildAliasTable, FIELD_ALIASES } from '../src/lib/spellCorrect.js'

const src = fs.readFileSync(new URL('../src/lib/skillCatalog.js', import.meta.url), 'utf8')
const catalogBlocks = [...src.matchAll(/keys:\s*\[([\s\S]*?)\]/g)]
const fields = new Set()
for (const b of catalogBlocks) {
  for (const m of b[1].matchAll(/'([^']+)'/g)) fields.add(m[1].toLowerCase())
}
const fieldList = [...fields]

const must = [
  ['bed science', 'BEd Science'],
  ['social science', 'Social Science'],
  ['soil science', 'Soil Science'],
  ['baking', 'Baking'],
  ['banking', 'Banking'],
  ['food sceince', 'Food Science'],
  ['computor science', 'Computer Science'],
  ['literatue', 'Literature'],
  ['hisotry', 'History'],
  ['psycology', 'Psychology'],
  ['forensics', 'Forensic Science'],
  ['polisci', 'Political Science'],
  ['musci', 'Music'],
  ['pyhton', 'Python'],
]

let fail = 0
for (const [raw, want] of must) {
  const got = raw === 'pyhton' ? normalizeSkillName(raw) : normalizeFieldName(raw)
  if (got !== want) {
    fail += 1
    console.log('FAIL', raw, '=>', got, 'want', want)
  }
}

// Auto-coverage: each field's generated typo that uniquely maps should correct
let covered = 0
let missed = 0
const table = buildAliasTable(FIELD_ALIASES, fieldList)
console.log('auto+manual aliases', Object.keys(table).length)

for (const f of fieldList) {
  if (f.length < 5) continue
  const samples = generateTypoVariants(f).slice(0, 12)
  for (const typo of samples) {
    if (typo === f) continue
    const got = normalizeFieldName(typo).toLowerCase()
    // Accept if corrects to field, or to a word contained in field, or stays as other valid field
    if (got === f || f.split(' ').includes(got) || fieldList.includes(got)) {
      covered += 1
    } else if (got === typo) {
      missed += 1
    } else {
      // wrong correction
      fail += 1
      if (fail < 25) console.log('WRONG', typo, '=>', got, 'from', f)
    }
  }
}

console.log({ covered, missed, fail, fields: fieldList.length })
if (fail) process.exitCode = 1
else console.log('ALL CRITICAL PASSED')
