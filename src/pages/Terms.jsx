import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import LegalFolders from '../components/LegalFolders'

const ITEMS = [
  {
    id: 'role',
    title: 'Our role',
    content: (
      <>
        <p>
          Opportunistic is a discovery platform. We surface third-party scholarship and job listings based on your
          profile. We are not the issuer, employer, or grantor of any opportunity shown on the site.
        </p>
        <div className="legal-callout">
          <p>
            Always finish applications on the official source listing. Opportunistic explains fit; the source owns
            eligibility and outcomes.
          </p>
        </div>
      </>
    ),
  },
  {
    id: 'accuracy',
    title: 'Accuracy',
    content: (
      <p>
        Listings can become outdated after indexing. Always verify eligibility, deadlines, and application steps on the
        source website before applying. Match scores, reasoning, and tips are advisory — they are not guarantees of
        acceptance, funding, or employment.
      </p>
    ),
  },
  {
    id: 'account',
    title: 'Your account',
    content: (
      <ul className="legal-list">
        <li>
          <strong>Accuracy</strong>
          <span>You are responsible for the truthfulness of information you submit</span>
        </li>
        <li>
          <strong>Others’ data</strong>
          <span>Do not upload someone else’s personal data without permission</span>
        </li>
        <li>
          <strong>Fair use</strong>
          <span>We may suspend accounts that abuse matching or attempt to scrape the service</span>
        </li>
      </ul>
    ),
  },
  {
    id: 'liability',
    title: 'Liability',
    content: (
      <p>
        To the fullest extent permitted by law, Opportunistic is not liable for decisions made based on surfaced
        listings, including closed opportunities, inaccurate third-party content, or unsuccessful applications.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes',
    content: (
      <p>
        We may update these terms as the product evolves. The “Updated” date at the top of this page reflects the latest
        revision. Continued use after changes means you accept the revised terms.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    content: (
      <p>
        Questions about these terms: <a href="mailto:hello@opportunistic.online">hello@opportunistic.online</a>
      </p>
    ),
  },
]

export default function Terms() {
  const location = useLocation()
  const section = new URLSearchParams(location.search).get('section') || 'role'

  useEffect(() => {
    document.title = 'Terms of Use — Opportunistic'
  }, [])

  return (
    <div className="page legal-page">
      <SiteHeader />
      <main>
        <section className="legal-hero">
          <div className="container legal-hero-inner">
            <p className="eyebrow">Legal</p>
            <h1>Terms of Use</h1>
            <p className="lede">
              The rules for using Opportunistic as a discovery layer — not as the issuer of any opportunity.
            </p>
            <div className="legal-meta">
              <span className="info-chip">Updated August 7, 2026</span>
              <Link className="legal-switch" to="/privacy">
                View Privacy Policy →
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
