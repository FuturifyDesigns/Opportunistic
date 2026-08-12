import { supabase } from './supabase'

/** Free-tier friendly: one small JPEG per user. */
export const AVATAR_BUCKET = 'avatars'
export const AVATAR_OUTPUT_SIZE = 512
export const AVATAR_MAX_INPUT_BYTES = 8 * 1024 * 1024
export const AVATAR_JPEG_QUALITY = 0.82

export function avatarObjectPath(userId) {
  return `${userId}/avatar.jpg`
}

export function publicAvatarUrl(userId, cacheBust) {
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(avatarObjectPath(userId))
  const base = data?.publicUrl
  if (!base) return null
  return cacheBust ? `${base}?v=${encodeURIComponent(String(cacheBust))}` : base
}

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file'))
      return
    }
    if (!/^image\/(jpeg|png|webp|gif|jpg)$/i.test(file.type) && !/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
      reject(new Error('Use a JPG, PNG, or WebP image'))
      return
    }
    if (file.size > AVATAR_MAX_INPUT_BYTES) {
      reject(new Error('Image is too large (max 8MB)'))
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image'))
    }
    img.src = url
  })
}

/**
 * Draw the visible square crop from an image given zoom/pan/rotation.
 * viewportSize = CSS size of the square editor.
 */
export function renderAvatarBlob({
  image,
  zoom,
  offsetX,
  offsetY,
  rotation = 0,
  viewportSize,
  outputSize = AVATAR_OUTPUT_SIZE,
  quality = AVATAR_JPEG_QUALITY,
}) {
  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas unavailable'))

  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, outputSize, outputSize)

  const scale = outputSize / viewportSize
  const rot = ((rotation % 360) + 360) % 360
  const rad = (rot * Math.PI) / 180

  // Same transform as the editor preview, scaled to output pixels.
  const base = Math.min(viewportSize / image.naturalWidth, viewportSize / image.naturalHeight)
  const drawScale = base * zoom * scale

  ctx.save()
  ctx.translate(outputSize / 2 + offsetX * scale, outputSize / 2 + offsetY * scale)
  ctx.rotate(rad)
  ctx.scale(drawScale, drawScale)
  ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)
  ctx.restore()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not export image'))
          return
        }
        if (blob.size > 520000) {
          // Retry at lower quality if somehow over bucket cap
          canvas.toBlob(
            (smaller) => {
              if (!smaller) reject(new Error('Could not export image'))
              else resolve(smaller)
            },
            'image/jpeg',
            0.7,
          )
          return
        }
        resolve(blob)
      },
      'image/jpeg',
      quality,
    )
  })
}

export async function uploadAvatar(userId, blob) {
  if (!userId || !blob) throw new Error('Missing avatar upload data')
  const path = avatarObjectPath(userId)
  const { error: upErr } = await supabase.storage.from(AVATAR_BUCKET).upload(path, blob, {
    upsert: true,
    contentType: 'image/jpeg',
    cacheControl: '3600',
  })
  if (upErr) throw upErr

  const url = publicAvatarUrl(userId, Date.now())
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('user_id', userId)
    .select('*')
    .maybeSingle()
  if (error) throw error
  return data
}

export async function removeAvatar(userId) {
  if (!userId) throw new Error('Missing user')
  const path = avatarObjectPath(userId)
  await supabase.storage.from(AVATAR_BUCKET).remove([path])
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('user_id', userId)
    .select('*')
    .maybeSingle()
  if (error) throw error
  return data
}
