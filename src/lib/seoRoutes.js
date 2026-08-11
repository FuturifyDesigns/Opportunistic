/**
 * Single source of truth for per-route SEO metadata.
 * Used at build time (scripts/prerender.mjs) and at runtime (lib/seo.js),
 * so static HTML and the SPA never disagree.
 */

export const SITE_URL = 'https://opportunistic.online'
export const SITE_NAME = 'Opportunistic'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

const BRAND_SUFFIX = ' | Opportunistic'

export const SEO_ROUTES = [
  {
    path: '/',
    title: 'Opportunistic — Scholarships & Jobs Matched to You',
    description:
      'Opportunistic matches scholarships and jobs to your degree, skills, and country — with clear reasons on every result.',
    heading: 'Scholarships and jobs matched to your qualifications',
    body: 'Add your degrees, certificates, and skills once. Opportunistic ranks scholarships and jobs for you and explains the fit on every card.',
    changefreq: 'weekly',
    priority: '1.0',
    index: true,
  },
  {
    path: '/home',
    title: `Scholarship & Job Matching for Students${BRAND_SUFFIX}`,
    description:
      'Find scholarships and jobs that fit your degree and skills. Every match is scored and explained, so you know why it fits before you apply.',
    heading: 'Match scholarships and jobs to a real profile',
    body: 'Enter your skills and qualifications. Opportunistic ranks openings from real boards and portals and explains the fit on every card.',
    changefreq: 'weekly',
    priority: '0.9',
    index: true,
  },
  {
    path: '/how-it-works',
    title: `How Scholarship & Job Matching Works${BRAND_SUFFIX}`,
    description:
      'See how Opportunistic works: build a profile, run the matchers, and get ranked scholarships and jobs with reasoning on every card.',
    heading: 'How Opportunistic matching works',
    body: 'Profile data goes in, queries run against scholarship and job sources, and results come back scored with reasons. Matching refreshes when your profile changes and on a weekly schedule.',
    changefreq: 'monthly',
    priority: '0.8',
    index: true,
  },
  {
    path: '/features',
    title: `Features — Scholarship and Job Matchers${BRAND_SUFFIX}`,
    description:
      'Two matchers on one profile: worldwide scholarships and country-filtered jobs, with transparent scores, reasons, and saved matches.',
    heading: 'Two matchers. One profile.',
    body: 'Scholarships worldwide, jobs by country, skill scorecards on every match, guided profile building, and GDPR-style deletion.',
    changefreq: 'monthly',
    priority: '0.8',
    index: true,
  },
  {
    path: '/about',
    title: 'About Opportunistic — Scholarship & Job Matching',
    description:
      'Opportunistic exists because link dumps ignore your record. Learn what the platform does, what it does not do, and how listings are sourced.',
    heading: 'About Opportunistic',
    body: 'Opportunistic surfaces third-party scholarship and job listings and scores them against your qualifications. Always verify deadlines and eligibility on the source site.',
    changefreq: 'monthly',
    priority: '0.6',
    index: true,
  },
  {
    path: '/auth',
    title: `Sign In or Create an Account${BRAND_SUFFIX}`,
    description:
      'Sign in to Opportunistic or create a free account to build your profile and open ranked scholarship and job matches.',
    heading: 'Sign in or create your account',
    body: 'Create a free profile to start matching scholarships and jobs to your qualifications.',
    changefreq: 'monthly',
    priority: '0.5',
    index: true,
  },
  {
    path: '/privacy',
    title: `Privacy Policy${BRAND_SUFFIX}`,
    description:
      'How Opportunistic collects, stores, and deletes your data, the lawful bases we rely on, and the privacy rights available to you worldwide.',
    heading: 'Privacy Policy',
    body: 'What we store, why we store it, how long we keep it, and how to delete your account and all related data.',
    changefreq: 'yearly',
    priority: '0.3',
    index: true,
  },
  {
    path: '/terms',
    title: `Terms of Use${BRAND_SUFFIX}`,
    description:
      'The terms that apply when you use Opportunistic, including listing accuracy, acceptable use, and account responsibilities.',
    heading: 'Terms of Use',
    body: 'Opportunistic is not the issuer of any scholarship or job. Match scores and tips are advisory only.',
    changefreq: 'yearly',
    priority: '0.3',
    index: true,
  },

  // Signed-in / transactional routes — real pages, but never indexed.
  { path: '/dashboard', title: `Dashboard${BRAND_SUFFIX}`, index: false },
  { path: '/onboarding', title: `Setup${BRAND_SUFFIX}`, index: false },
  { path: '/profile', title: `Profile${BRAND_SUFFIX}`, index: false },
  { path: '/settings', title: `Settings${BRAND_SUFFIX}`, index: false },
  { path: '/admin', title: `Admin${BRAND_SUFFIX}`, index: false },
  { path: '/verified', title: `Email Verified${BRAND_SUFFIX}`, index: false },
]

export const DEFAULT_SEO = SEO_ROUTES[0]

/**
 * Origin static hosting often serves each prerendered route from
 * <route>/index.html and 301s the bare path to the trailing-slash form, so
 * canonicals and sitemap entries must use the trailing slash or they point
 * at a redirect.
 */
export function canonicalFor(pathname = '/') {
  const clean = String(pathname || '/').split('?')[0].split('#')[0]
  const trimmed = clean.replace(/\/+$/, '')
  return trimmed ? `${SITE_URL}${trimmed}/` : `${SITE_URL}/`
}

/** Match a pathname to its SEO entry (handles trailing slashes and /match/:kind/:id). */
export function seoForPath(pathname = '/') {
  const clean = String(pathname || '/').split('?')[0].split('#')[0]
  const normalized = clean.length > 1 ? clean.replace(/\/+$/, '') : '/'
  const hit = SEO_ROUTES.find((r) => r.path === normalized)
  if (hit) return hit
  if (normalized.startsWith('/match/')) {
    return { path: normalized, title: `Match detail${BRAND_SUFFIX}`, index: false }
  }
  return { path: normalized, title: DEFAULT_SEO.title, description: DEFAULT_SEO.description, index: false }
}

export const INDEXABLE_ROUTES = SEO_ROUTES.filter((r) => r.index)
