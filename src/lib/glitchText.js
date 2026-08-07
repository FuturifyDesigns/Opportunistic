const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*'

function canUsePointer() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Freeze horizontal size so scramble glyphs can’t reflow parents / cards.
 *  Never lock height — that clips descenders (g, y, etc.). */
function lockWordBox(span) {
  if (!span || span.dataset.locked === '1') return
  const rect = span.getBoundingClientRect()
  if (rect.width <= 0) return
  const w = `${Math.ceil(rect.width + 1)}px`
  span.style.setProperty('--gt-w', w)
  span.style.width = w
  span.style.minWidth = w
  span.style.maxWidth = w
  span.style.height = 'auto'
  span.style.minHeight = '0'
  span.dataset.locked = '1'
}

function lockAllWords(el) {
  el.querySelectorAll('.gt-word').forEach(lockWordBox)
}

function scrambleWord(span) {
  if (span._gtBusy || prefersReducedMotion() || !canUsePointer()) return
  const orig = span.dataset.o || span.textContent || ''
  if (!orig.trim()) return

  lockWordBox(span)
  span._gtBusy = true
  span.classList.add('is-scrambling')

  // Scramble only the overlay layer — base text stays for layout size.
  let fx = span.querySelector('.gt-fx')
  if (!fx) {
    fx = document.createElement('span')
    fx.className = 'gt-fx'
    fx.setAttribute('aria-hidden', 'true')
    span.appendChild(fx)
  }

  let i = 0
  const id = window.setInterval(() => {
    fx.textContent = orig
      .split('')
      .map((ch, j) => {
        if (ch === ' ' || ch === '\u00a0') return ch
        if (j < i) return orig[j]
        return GLYPHS[(Math.random() * GLYPHS.length) | 0]
      })
      .join('')
    i += 0.55
    if (i >= orig.length) {
      window.clearInterval(id)
      fx.textContent = ''
      span.classList.remove('is-scrambling')
      span._gtBusy = false
    }
  }, 28)
}

function clearEnhanced(el) {
  if (el.dataset.glitch !== '1') return
  const orig = el.dataset.gtOriginal
  if (orig != null) {
    el.textContent = orig
  }
  delete el.dataset.glitch
  delete el.dataset.gtOriginal
  el.classList.remove('gt-heading')
}

function isSkippable(el) {
  if (!el || el.nodeType !== 1) return true
  if (el.closest('[data-no-glitch], button, input, textarea, select, a.btn, .nav-start-logo, .glitch-mark')) {
    return true
  }
  const kids = [...el.childNodes]
  const complex = kids.some(
    (n) => n.nodeType === 1 && !(n.classList && n.classList.contains('gt-word')),
  )
  return complex
}

/**
 * Split plain-text headings into word spans with Futurify-style scramble on hover.
 * Layout size is locked so cards / parents never jitter.
 */
export function enhanceHeading(el) {
  if (!el || el.dataset.glitch === '1') return
  if (prefersReducedMotion()) return
  if (isSkippable(el)) return

  const text = el.textContent ?? ''
  if (!text.trim()) return

  el.dataset.gtOriginal = text
  el.dataset.glitch = '1'
  el.classList.add('gt-heading')
  el.textContent = ''

  const parts = text.split(/(\s+)/)
  parts.forEach((part) => {
    if (!part) return
    if (/^\s+$/.test(part)) {
      el.appendChild(document.createTextNode(part))
      return
    }
    const span = document.createElement('span')
    span.className = 'gt-word'
    span.dataset.o = part

    const base = document.createElement('span')
    base.className = 'gt-base'
    base.textContent = part
    span.appendChild(base)

    const fx = document.createElement('span')
    fx.className = 'gt-fx'
    fx.setAttribute('aria-hidden', 'true')
    span.appendChild(fx)

    span.addEventListener('mouseenter', () => scrambleWord(span))
    el.appendChild(span)
  })

  // Measure after layout so width lock matches real glyphs.
  requestAnimationFrame(() => {
    lockAllWords(el)
    requestAnimationFrame(() => lockAllWords(el))
  })
}

const SELECTOR = [
  'h1',
  'h2',
  'h3',
  'h4',
  '.eyebrow',
  '.jarvis-caption',
  '.brand-word',
  '.about-section-title',
  '.ob-process-title',
  '.auth-orb-core strong',
  '.auth-orb-core em',
].join(', ')

export function clearAllGlitchEnhancements(root = document) {
  root.querySelectorAll('[data-glitch="1"]').forEach((el) => clearEnhanced(el))
}

export function enhanceAllHeadings(root = document) {
  if (prefersReducedMotion()) return
  root.querySelectorAll(SELECTOR).forEach((el) => {
    if (el.dataset.glitch === '1') {
      const hasWords = el.querySelector('.gt-word')
      if (!hasWords) {
        clearEnhanced(el)
      } else {
        lockAllWords(el)
        return
      }
    }
    enhanceHeading(el)
  })
}

export function createHeadingGlitchObserver(root) {
  let scheduled = false
  const run = () => {
    scheduled = false
    enhanceAllHeadings(root)
  }
  const schedule = () => {
    if (scheduled) return
    scheduled = true
    window.requestAnimationFrame(run)
  }

  enhanceAllHeadings(root)
  // Only watch structure — never characterData (scramble would retrigger and jitter).
  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type !== 'childList') continue
      // Ignore our own scramble overlay text nodes / fx updates
      const t = m.target
      if (t?.closest?.('.gt-word, .gt-fx, .gt-base')) continue
      if (m.addedNodes.length === 0 && m.removedNodes.length === 0) continue
      const onlyGlitch =
        [...m.addedNodes, ...m.removedNodes].every(
          (n) =>
            n.nodeType === 3 ||
            (n.nodeType === 1 && n.classList && (n.classList.contains('gt-fx') || n.classList.contains('gt-word') || n.classList.contains('gt-base'))),
        )
      if (onlyGlitch && m.target?.classList?.contains('gt-heading')) continue
      schedule()
      return
    }
  })
  obs.observe(root, { childList: true, subtree: true })
  return () => obs.disconnect()
}
