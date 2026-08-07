import { useEffect } from 'react'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

export default function Privacy() {
  useEffect(() => {
    document.title = 'Privacy Policy — Opportunistic'
  }, [])

  return (
    <div className="page">
      <SiteHeader />
      <main className="container narrow prose">
        <h1>Privacy Policy</h1>
        <p>Last updated: August 7, 2026</p>
        <p>
          Opportunistic collects the information you provide to generate scholarship and job matches: email address,
          country, full name, headline, bio, qualifications, and skills. We use this data to create and refresh
          personalized matches and (if enabled) email digests.
        </p>
        <h2>What we store</h2>
        <ul>
          <li>Account credentials via Supabase Auth</li>
          <li>Profile, qualifications, and skills you enter</li>
          <li>Match results including title, URL, source, reasoning, and score</li>
          <li>Search run history for reliability and debugging</li>
        </ul>
        <h2>Your rights</h2>
        <p>
          You can edit your profile at any time and delete your data from Settings. Deletion removes your profile and
          cascades to qualifications, skills, and matches. We treat GDPR-level consent and deletion rights as the
          baseline for every user worldwide.
        </p>
        <h2>Sharing</h2>
        <p>
          We do not sell personal data. Listings open on third-party sites; those sites have their own privacy policies.
          Email delivery (when enabled) uses Brevo with unsubscribe on every message.
        </p>
        <h2>Contact</h2>
        <p>
          Questions: <a href="mailto:hello@opportunistic.online">hello@opportunistic.online</a>
        </p>
      </main>
      <SiteFooter />
    </div>
  )
}
