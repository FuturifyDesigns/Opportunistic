export const HEADLINE_SEP = ' · '
export const HEADLINE_MIN_PART = 3

export function parseHeadlineParts(value) {
  const parts = String(value || '')
    .split(/\s*[·•,]\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
  return parts.length ? parts : ['']
}

export function joinHeadlineParts(parts) {
  return (parts || [])
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(HEADLINE_SEP)
}

export function canOpenHeadlinePart(part) {
  return String(part || '').trim().length >= HEADLINE_MIN_PART
}

export function finalizeHeadline(value) {
  return joinHeadlineParts(parseHeadlineParts(value))
}
