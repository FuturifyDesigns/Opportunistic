import sharp from 'sharp'
import fs from 'fs'

const src =
  'C:/Users/Leonm/AppData/Roaming/Cursor/User/workspaceStorage/1786035915124/images/logo_upscaled_4x-6b958e90-71b2-464a-92e1-371e6e0d89ea.png'

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const out = Buffer.from(data)

for (let i = 0; i < out.length; i += 4) {
  const lum = (out[i] + out[i + 1] + out[i + 2]) / 3
  if (lum < 48) {
    out[i] = 0
    out[i + 1] = 0
    out[i + 2] = 0
    out[i + 3] = 0
  } else {
    const a = Math.max(0, Math.min(255, Math.round(((lum - 48) / (255 - 48)) * 255)))
    out[i] = 255
    out[i + 1] = 255
    out[i + 2] = 255
    out[i + 3] = a
  }
}

const transparent = await sharp(out, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png()
  .toBuffer()

const trimmed = await sharp(transparent).trim({ threshold: 8 }).png().toBuffer()
const trimMeta = await sharp(trimmed).metadata()
const pad = Math.round(Math.max(trimMeta.width, trimMeta.height) * 0.1)

async function toSquare(size, { solidBlack = false } = {}) {
  const bg = solidBlack ? { r: 0, g: 0, b: 0, alpha: 1 } : { r: 0, g: 0, b: 0, alpha: 0 }
  // Place trimmed logo on a square canvas with padding, logo fills most of the frame.
  const content = Math.round(size * 0.86)
  const logo = await sharp(trimmed)
    .resize(content, content, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  const base = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg,
    },
  })

  const composed = await base
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toBuffer()

  return composed
}

fs.mkdirSync('public/icons', { recursive: true })
fs.writeFileSync('public/favicon.png', await toSquare(512))
fs.writeFileSync('public/favicon-32.png', await toSquare(32))
fs.writeFileSync('public/apple-touch-icon.png', await toSquare(192, { solidBlack: true }))
fs.writeFileSync('public/icons/mark-white.png', await toSquare(512))

console.log('done', {
  trim: `${trimMeta.width}x${trimMeta.height}`,
  pad,
  fav: await sharp('public/favicon.png').metadata().then((m) => `${m.width}x${m.height} alpha=${m.hasAlpha}`),
})
