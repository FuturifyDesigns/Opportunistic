import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Alternate left / right / up reveals for elements with data-reveal */
export function revealOnScroll(scope, selector = '[data-reveal]') {
  if (prefersReducedMotion()) {
    gsap.set(selector, { clearProps: 'all', opacity: 1 })
    return
  }

  const nodes = gsap.utils.toArray(scope.querySelectorAll(selector))
  nodes.forEach((el) => {
    const dir = el.dataset.reveal || 'up'
    const from = {
      left: { x: -64, y: 0 },
      right: { x: 64, y: 0 },
      up: { x: 0, y: 40 },
      down: { x: 0, y: -28 },
      scale: { x: 0, y: 24, scale: 0.94 },
    }[dir] || { x: 0, y: 40 }

    gsap.fromTo(
      el,
      { opacity: 0, ...from },
      {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none reverse',
        },
      },
    )
  })
}

export function staggerCards(scope, selector = '.interactive-card') {
  if (prefersReducedMotion()) return
  const cards = scope.querySelectorAll(selector)
  gsap.from(cards, {
    opacity: 0,
    y: 36,
    rotateX: 8,
    duration: 0.55,
    stagger: 0.08,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: cards[0] || scope,
      start: 'top 85%',
    },
  })
}
