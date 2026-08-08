import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const imgDir = 'C:/Users/Leonm/AppData/Roaming/Cursor/User/workspaceStorage/1786035915124/images'
const files = fs
  .readdirSync(imgDir)
  .map((name) => {
    const full = path.join(imgDir, name)
    const st = fs.statSync(full)
    return { name, full, mtime: st.mtimeMs, size: st.size }
  })
  .sort((a, b) => b.mtime - a.mtime)
  .slice(0, 15)

for (const f of files) {
  console.log(`${new Date(f.mtime).toISOString()} | ${f.size} | ${f.name}`)
}

for (const p of ['public/favicon.png', 'public/mark.png', 'public/logo.png', 'public/apple-touch-icon.png']) {
  try {
    const m = await sharp(p).metadata()
    console.log('asset', p, m.width, m.height, 'alpha', m.hasAlpha)
  } catch (e) {
    console.log('asset', p, e.message)
  }
}
