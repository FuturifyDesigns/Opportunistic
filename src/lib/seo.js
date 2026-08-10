/**
 * Keeps crawlable metadata correct during client-side navigation.
 * Titles stay owned by each page (they are translated); this syncs the tags
 * Google reads from the rendered DOM: description, canonical, robots, OG/Twitter.
 */

import { DEFAULT_OG_IMAGE, SITE_URL, seoForPath } from './seoRoutes.js'

function upsert(selector, create) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  return el
}

function setMetaName(name, content) {
  if (!content) return
  const el = upsert(`meta[name="${name}"]`, () => {
    const m = document.createElement('meta')
    m.setAttribute('name', name)
    return m
  })
  el.setAttribute('content', content)
}

function setMetaProperty(property, content) {
  if (!content) return
  const el = upsert(`meta[property="${property}"]`, () => {
    const m = document.createElement('meta')
    m.setAttribute('property', property)
    return m
  })
  el.setAttribute('content', content)
}

export function applySeo(pathname = '/') {
  if (typeof document === 'undefined') return

  const route = seoForPath(pathname)
  const canonical = route.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${route.path}`

  const link = upsert('link[rel="canonical"]', () => {
    const l = document.createElement('link')
    l.setAttribute('rel', 'canonical')
    return l
  })
  link.setAttribute('href', canonical)

  setMetaName('robots', route.index ? 'index, follow, max-image-preview:large' : 'noindex, follow')
  setMetaProperty('og:url', canonical)
  setMetaProperty('og:image', DEFAULT_OG_IMAGE)
  setMetaName('twitter:image', DEFAULT_OG_IMAGE)

  if (route.description) {
    setMetaName('description', route.description)
    setMetaProperty('og:description', route.description)
    setMetaName('twitter:description', route.description)
  }
}

/** Mirror the page title into OG/Twitter once a page has set document.title. */
export function syncSocialTitle() {
  if (typeof document === 'undefined') return
  const title = document.title
  if (!title) return
  setMetaProperty('og:title', title)
  setMetaName('twitter:title', title)
}
