import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

export default function Privacy() {
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
              How Opportunistic collects, uses, and protects the information you share to get matched.
            </p>
            <div className="legal-meta">
              <span className="info-chip">Updated August 7, 2026</span>
              <Link className="legal-switch" to="/terms">
                View Terms of Use →
              </Link>
            </div>
          </div>
        </section>

        <section className="container legal-layout">
          <aside className="legal-toc" aria-label="On this page">
            <p className="jarvis-caption">On this page</p>
            <a href="#overview">Overview</a>
            <a href="#store">What we store</a>
            <a href="#use">How we use it</a>
            <a href="#rights">Your rights</a>
            <a href="#sharing">Sharing</a>
            <a href="#contact">Contact</a>
          </aside>

          <article className="legal-body">
            <section id="overview" className="legal-block">
              <h2>Overview</h2>
              <p>
                Opportunistic collects the information you provide to generate scholarship and job matches: email
                address, country, full name, headline, bio, qualifications, and skills. We use this data to create and
                refresh personalized matches and (if enabled) email digests.
              </p>
            </section>

            <section id="store" className="legal-block">
              <h2>What we store</h2>
              <ul className="legal-list">
                <li>
                  <strong>Account</strong>
                  <span>Credentials via Supabase Auth</span>
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
                  <strong>Search runs</strong>
                  <span>History used for reliability and debugging</span>
                </li>
              </ul>
            </section>

            <section id="use" className="legal-block">
              <h2>How we use it</h2>
              <p>
                Your profile powers matching only. We do not use your qualifications or skills to sell ads against your
                identity. Match tips and scores are generated from the data you choose to keep on your profile.
              </p>
            </section>

            <section id="rights" className="legal-block">
              <h2>Your rights</h2>
              <p>
                You can edit your profile at any time and delete your data from Settings. Deletion removes your profile
                and cascades to qualifications, skills, and matches. We treat GDPR-level consent and deletion rights as
                the baseline for every user worldwide.
              </p>
              <div className="legal-callout">
                <p>
                  Ready to leave? Open <Link to="/settings">Settings</Link> and use delete account — we do not keep a
                  shadow copy of your match history after deletion completes.
                </p>
              </div>
            </section>

            <section id="sharing" className="legal-block">
              <h2>Sharing</h2>
              <p>
                We do not sell personal data. Listings open on third-party sites; those sites have their own privacy
                policies. Email delivery (when enabled) uses Brevo with unsubscribe on every message.
              </p>
            </section>

            <section id="contact" className="legal-block">
              <h2>Contact</h2>
              <p>
                Questions about privacy:{' '}
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
