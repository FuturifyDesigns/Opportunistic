import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import HowItWorksDemo from '../components/HowItWorksDemo'
import { prefersReducedMotion, revealOnScroll } from '../lib/animations'

gsap.registerPlugin(useGSAP, ScrollTrigger)

export default function HowItWorks() {
  const root = useRef(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('.page-hero > *', { y: 28, opacity: 0, stagger: 0.08, duration: 0.5, ease: 'power2.out' })
      revealOnScroll(root.current)
    },
    { scope: root },
  )

  useEffect(() => {
    document.title = 'How it works — Opportunistic'
  }, [])

  return (
    <div ref={root} className="page">
      <SiteHeader />
      <main>
        <section className="page-hero container">
          <p className="eyebrow">How it works</p>
          <h1>From profile to reasoned matches.</h1>
          <p className="lede">
            Watch a live example of the flow. Click the steps or let the demo cycle — this is what happens after you
            sign up.
          </p>
        </section>

        <section className="section">
          <div className="container" data-reveal="up">
            <HowItWorksDemo />
          </div>
        </section>

        <section className="section section-band">
          <div className="container detail-rows">
            <article className="detail-row" data-reveal="left">
              <div>
                <p className="eyebrow">Cadence</p>
                <h2>Refresh when it matters</h2>
              </div>
              <p>
                Matching runs on profile creation, when you edit qualifications, skills, or country, and on a weekly
                schedule — not on every dashboard visit.
              </p>
            </article>
            <article className="detail-row" data-reveal="right">
              <div>
                <p className="eyebrow">Trust</p>
                <h2>Third-party, clearly labeled</h2>
              </div>
              <p>
                We surface listings from real boards and portals. Always verify deadlines on the source site. Past
                deadlines are filtered out of your dashboard.
              </p>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="container cta-panel" data-reveal="scale">
            <h2>Ready to try it with your profile?</h2>
            <p>Create an account and finish onboarding to generate your first matches.</p>
            <div className="cta-row" style={{ justifyContent: 'center' }}>
              <Link className="btn" to="/auth?mode=signup">
                Get started
              </Link>
              <Link className="btn btn-ghost" to="/features">
                See features
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
