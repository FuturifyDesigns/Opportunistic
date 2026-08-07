import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

export default function Terms() {
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

        <section className="container legal-layout">
          <aside className="legal-toc" aria-label="On this page">
            <p className="jarvis-caption">On this page</p>
            <a href="#role">Our role</a>
            <a href="#accuracy">Accuracy</a>
            <a href="#account">Your account</a>
            <a href="#liability">Liability</a>
            <a href="#changes">Changes</a>
            <a href="#contact">Contact</a>
          </aside>

          <article className="legal-body">
            <section id="role" className="legal-block">
              <h2>Our role</h2>
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
            </section>

            <section id="accuracy" className="legal-block">
              <h2>Accuracy</h2>
              <p>
                Listings can become outdated after indexing. Always verify eligibility, deadlines, and application steps
                on the source website before applying. Match scores, reasoning, and tips are advisory — they are not
                guarantees of acceptance, funding, or employment.
              </p>
            </section>

            <section id="account" className="legal-block">
              <h2>Your account</h2>
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
            </section>

            <section id="liability" className="legal-block">
              <h2>Liability</h2>
              <p>
                To the fullest extent permitted by law, Opportunistic is not liable for decisions made based on surfaced
                listings, including closed opportunities, inaccurate third-party content, or unsuccessful applications.
              </p>
            </section>

            <section id="changes" className="legal-block">
              <h2>Changes</h2>
              <p>
                We may update these terms as the product evolves. The “Updated” date at the top of this page reflects the
                latest revision. Continued use after changes means you accept the revised terms.
              </p>
            </section>

            <section id="contact" className="legal-block">
              <h2>Contact</h2>
              <p>
                Questions about these terms:{' '}
                <a href="mailto:hello@opportunistic.online">hello@opportunistic.online</a>
              </p>
            </section>
          </article>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
