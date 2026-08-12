import fs from 'fs'
import path from 'path'

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const REF = process.env.SUPABASE_PROJECT_REF || 'xtvrjamnorcaevnvvnez'
const file = process.argv[2]
if (!TOKEN || !file) {
  console.error('Usage: SUPABASE_ACCESS_TOKEN=... node ops/run-sql.mjs <file.sql>')
  process.exit(1)
}
const sql = fs.readFileSync(path.resolve(file), 'utf8')
const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
})
const text = await res.text()
console.log(res.status, text.slice(0, 4000))
if (!res.ok) process.exit(1)
