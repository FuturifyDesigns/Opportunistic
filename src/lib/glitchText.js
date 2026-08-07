const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*'

function canUsePointer() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function scrambleWord(span) {
  if (span._gtBusy || prefersReducedMotion() || !canUsePointer()) return
  const orig = span.dataset.o || span.textContent || ''
  if (!orig.trim()) return

  span._gtBusy = true
  let i = 0
  const id = window.setInterval(() => {
    span.textContent = orig
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
      span.textContent = orig
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
}

function isSkippable(el) {
  if (!el || el.nodeType !== 1) return true
  if (el.closest('[data-no-glitch], button, input, textarea, select, a.btn, .nav-start-logo, .glitch-mark')) {
    return true
  }
  // Skip headings that contain nested interactive / rich nodes (except our spans)
  const kids = [...el.childNodes]
  const complex = kids.some(
    (n) => n.nodeType === 1 && !(n.classList && n.classList.contains('gt-word')),
  )
  return complex
}

/**
 * Split plain-text headings into word spans with Futurify-style scramble on hover.
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
    span.textContent = part
    span.dataset.o = part
    span.addEventListener('mouseenter', () => scrambleWord(span))
    el.appendChild(span)
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

export function enhanceAllHeadings(root = document) {
  if (prefersReducedMotion()) return
  root.querySelectorAll(SELECTOR).forEach((el) => {
    // Re-enhance if React wiped our spans
    if (el.dataset.glitch === '1') {
      const hasWords = el.querySelector('.gt-word')
      if (!hasWords) {
        clearEnhanced(el)
      } else {
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
  const obs = new MutationObserver(schedule)
  obs.observe(root, { childList: true, subtree: true, characterData: true })
  return () => obs.disconnect()
}
