const SEP = ' · '

function wantsNextPart(value) {
  return /(?:[,;|/]|·)\s*$/.test(value) || /\s{2,}$/.test(value)
}

export function formatHeadline(value, { trailing = true } = {}) {
  const raw = String(value || '')
  if (!raw) return ''

  const keepTrailing = trailing && wantsNextPart(raw)
  const parts = raw
    .split(/\s*[·•|,;]\s*|\s+\/\s+|\s{2,}|\s+-\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (!parts.length) return ''
  return keepTrailing ? `${parts.join(SEP)}${SEP}` : parts.join(SEP)
}

export function finalizeHeadline(value) {
  return formatHeadline(value, { trailing: false }).trim()
}

export function nextHeadlineValue(raw, selectionStart) {
  const value = formatHeadline(raw)
  let caret = value.length
  if (typeof selectionStart === 'number' && selectionStart < String(raw || '').length) {
    caret = Math.min(value.length, formatHeadline(raw.slice(0, selectionStart)).length)
  }
  return { value, caret }
}

export function applyHeadlineCaret(el, caret) {
  if (!el || typeof caret !== 'number' || typeof el.setSelectionRange !== 'function') return
  requestAnimationFrame(() => {
    try {
      el.setSelectionRange(caret, caret)
    } catch {
      /* ignore unmounted or unsupported inputs */
    }
  })
}
