import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import LegalFolders from '../components/LegalFolders'
import { openCookiePreferences } from '../lib/consent'

const ITEMS = [
  {
    id: 'overview',
    title: 'Overview',
    content: (
      <p>
        Opportunistic (“we”) provides scholarship and job matching. This policy explains what we collect, why, how long
        we keep it, and your rights. We apply a <strong>GDPR-grade baseline for every user worldwide</strong>, and we
        respect stricter local rules where they apply (including UK GDPR, POPIA in South Africa, and similar frameworks).
        This is practical compliance guidance for our product — not formal legal advice for your jurisdiction.
      </p>
    ),
  },
  {
    id: 'lawful',
    title: 'Lawful bases',
    content: (
      <ul className="legal-list">
        <li>
          <strong>Contract</strong>
          <span>Creating your account, matching, and delivering the service you request</span>
        </li>
        <li>
          <strong>Consent</strong>
          <span>Optional cookies (analytics/marketing), email digests you opt into</span>
        </li>
        <li>
          <strong>Legitimate interests</strong>
          <span>Security, abuse prevention, service reliability — balanced against your rights</span>
        </li>
        <li>
          <strong>Legal obligation</strong>
          <span>Where we must retain or disclose data under applicable law</span>
        </li>
      </ul>
    ),
  },
  {
    id: 'store',
    title: 'What we store',
    content: (
      <ul className="legal-list">
        <li>
          <strong>Account</strong>
          <span>Email and auth credentials via Supabase Auth</span>
        </li>
        <li>
          <strong>Profile</strong>
          <span>Name, country, headline, bio, qualifications, and skills you enter</span>
        </li>
        <li>
          <strong>Matches</strong>
          <span>Title, URL, source, reasoning, score, and save/dismiss state</span>
        </li>
        <li>
          <strong>Technical</strong>
          <span>Consent cookie, session cookies needed for login, optional analytics if you allow them</span>
        </li>
      </ul>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    content: (
      <>
        <p>
          We use a consent cookie (<code>opp_consent</code>) to remember your choice for up to 12 months. Necessary
          cookies keep authentication secure. Preferences, analytics, and marketing cookies load <strong>only</strong>{' '}
          after you opt in. You can change your mind anytime.
        </p>
        <ul className="legal-list" style={{ marginTop: '0.85rem' }}>
          <li>
            <strong>Necessary</strong>
            <span>Auth session, security, storing this consent</span>
          </li>
          <li>
            <strong>Preferences</strong>
            <span>Optional UI memory beyond consent</span>
          </li>
          <li>
            <strong>Analytics</strong>
            <span>Usage measurement — scripts blocked until allowed</span>
          </li>
          <li>
            <strong>Marketing</strong>
            <span>Ad / remarketing tags — scripts blocked until allowed</span>
          </li>
        </ul>
        <div className="legal-callout">
          <p>
            <button type="button" className="linkish" onClick={() => openCookiePreferences()}>
              Open cookie preferences
            </button>{' '}
            — or use “Cookie settings” in the footer.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'use',
    title: 'How we use it',
    content: (
      <p>
        Your profile powers matching and reasoned tips. We do not sell personal data. We do not use your qualifications
        to build advertising profiles unless you explicitly allow marketing cookies and a future ad partner is disclosed
        here.
      </p>
    ),
  },
  {
    id: 'transfers',
    title: 'International transfers',
    content: (
      <p>
        Infrastructure may process data in regions used by our providers (for example Supabase and Brevo). Where data
        leaves your country, we rely on appropriate safeguards recognized under GDPR-style rules (such as standard
        contractual clauses offered by those providers) and minimize what we store.
      </p>
    ),
  },
  {
    id: 'retention',
    title: 'Retention',
    content: (
      <p>
        Account and match data stay while your account is active. If you delete your data in Settings, we remove profile,
        qualifications, skills, matches, and search history from the app database. Auth-account purge may also be
        requested at hello@opportunistic.online. Consent records may be kept as proof of choice for up to the cookie
        lifetime or as required by law.
      </p>
    ),
  },
  {
    id: 'rights',
    title: 'Your rights',
    content: (
      <>
        <p>
          Depending on where you live, you may have rights to access, correct, delete, restrict, object, port data, and
          withdraw consent. We honour these as a global baseline. You can edit your profile anytime and delete your data
          from Settings.
        </p>
        <div className="legal-callout">
          <p>
            Open <Link to="/settings">Settings</Link> → Delete my data. For other requests:{' '}
            <a href="mailto:hello@opportunistic.online">hello@opportunistic.online</a>
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    content: (
      <p>
        Opportunistic is not directed at children under 16 (or the higher digital-consent age in your country). Do not
        create an account if you are under that age. If we learn we hold such data, we will delete it.
      </p>
    ),
  },
  {
    id: 'sharing',
    title: 'Processors & sharing',
    content: (
      <p>
        We share data with processors who help run the service: Supabase (auth/database), Brevo (transactional email when
        enabled), and hosting (GitHub Pages). Listings open on third-party sites with their own policies. We do not sell
        personal data.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    content: (
      <p>
        Privacy questions or rights requests:{' '}
        <a href="mailto:hello@opportunistic.online">hello@opportunistic.online</a>
      </p>
    ),
  },
]

export default function Privacy() {
  const location = useLocation()
  const section = new URLSearchParams(location.search).get('section') || 'overview'

  useEffect(() => {
    document.title = 'Privacy Policy — Opportunistic'
  }, [])

  return (
    <div className="page legal-page">
      <SiteHeader />
      <main>
        <section className="legal-hero">
          <div className="container legal-hero-inner">
            <p className="eyebrow">Legal</p>
            <h1>Privacy Policy</h1>
            <p className="lede">
              Global data-protection baseline, working cookie controls, and clear rights — updated for Opportunistic.
            </p>
            <div className="legal-meta">
              <span className="info-chip">Updated August 7, 2026</span>
              <Link className="legal-switch" to="/terms">
                View Terms of Use →
              </Link>
            </div>
          </div>
        </section>

        <LegalFolders items={ITEMS} initialId={section} />
      </main>
      <SiteFooter />
    </div>
  )
}
