const SEP = ' · '

function commaPending(value) {
  return /,\s*$/.test(value) || /(?:\s*·\s*)$/.test(value)
}

export function formatHeadline(value, { trailing = true } = {}) {
  const raw = String(value || '')
  if (!raw) return ''

  const keepSep = trailing && commaPending(raw)
  const keepSpaces = trailing && !keepSep ? raw.match(/\s+$/)?.[0] || '' : ''

  const parts = raw
    .split(/[·•,]/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (!parts.length) return ''
  return `${parts.join(SEP)}${keepSep ? SEP : keepSpaces}`
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
