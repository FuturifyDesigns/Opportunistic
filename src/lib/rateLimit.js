/**
 * Simple client-side rate gate for outbound third-party fetches.
 * Not a substitute for server limits — stops accidental burst loops in the browser.
 */

const buckets = new Map()

/**
 * @param {string} key
 * @param {{ limit?: number, windowMs?: number }} [opts]
 * @returns {boolean} true if the call is allowed
 */
export function allowRequest(key, { limit = 6, windowMs = 60_000 } = {}) {
  const now = Date.now()
  let bucket = buckets.get(key)
  if (!bucket || now - bucket.start >= windowMs) {
    bucket = { start: now, count: 0 }
    buckets.set(key, bucket)
  }
  if (bucket.count >= limit) return false
  bucket.count += 1
  return true
}

export function assertAllowed(key, opts) {
  if (!allowRequest(key, opts)) {
    throw new Error('Too many requests — try again in a minute.')
  }
}
