import { useEffect } from 'react'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

export default function Terms() {
  useEffect(() => {
    document.title = 'Terms of Use — Opportunistic'
  }, [])

  return (
    <div className="page">
      <SiteHeader />
      <main className="container narrow prose">
        <h1>Terms of Use</h1>
        <p>Last updated: August 7, 2026</p>
        <p>
          Opportunistic is a discovery platform. We surface third-party scholarship and job listings based on your
          profile. We are not the issuer, employer, or grantor of any opportunity shown on the site.
        </p>
        <h2>Accuracy</h2>
        <p>
          Listings can become outdated after indexing. Always verify eligibility, deadlines, and application steps on
          the source website before applying. Match scores and reasoning are advisory, not guarantees of acceptance.
        </p>
        <h2>Your account</h2>
        <p>
          You are responsible for the accuracy of information you submit. Do not upload others&apos; personal data
          without permission. We may suspend accounts that abuse the matching system or attempt to scrape the service.
        </p>
        <h2>Liability</h2>
        <p>
          To the fullest extent permitted by law, Opportunistic is not liable for decisions made based on surfaced
          listings, including closed opportunities, inaccurate third-party content, or unsuccessful applications.
        </p>
        <h2>Contact</h2>
        <p>
          <a href="mailto:hello@opportunistic.online">hello@opportunistic.online</a>
        </p>
      </main>
      <SiteFooter />
    </div>
  )
}
