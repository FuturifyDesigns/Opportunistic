import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import InteractiveCard from '../components/InteractiveCard'
import { prefersReducedMotion, revealOnScroll } from '../lib/animations'

gsap.registerPlugin(useGSAP, ScrollTrigger)

export default function About() {
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
    document.title = 'About — Opportunistic'
  }, [])

  return (
    <div ref={root} className="page">
      <SiteHeader />
      <main>
        <section className="page-hero container">
          <p className="eyebrow">About</p>
          <h1>A worldwide path finder — not a local-only portal.</h1>
          <p className="lede">
            Opportunistic helps people turn skills and qualifications into ranked scholarships and jobs, with the
            reasoning shown up front.
          </p>
        </section>

        <section className="section">
          <div className="container about-grid">
            <InteractiveCard className="about-card" data-reveal="left">
              <h2>The problem</h2>
              <p>
                Opportunity boards dump links. Search engines dump more. Neither knows your degree, skills, or country
                well enough to say <em>why</em> something fits.
              </p>
            </InteractiveCard>
            <InteractiveCard className="about-card" data-reveal="right">
              <h2>Our approach</h2>
              <p>
                One profile powers two matchers. Results store title, source, score, and a plain-language reason —
                first-class fields, not an afterthought.
              </p>
            </InteractiveCard>
            <InteractiveCard className="about-card wide" data-reveal="up">
              <h2>What we are not</h2>
              <p>
                We are not the issuer of any scholarship or the employer behind any job. We surface third-party listings
                and expect you to verify eligibility on the source site.
              </p>
            </InteractiveCard>
          </div>
        </section>

        <section className="section section-band">
          <div className="container cta-panel" data-reveal="scale">
            <h2>Build your profile today</h2>
            <div className="cta-row" style={{ justifyContent: 'center' }}>
              <Link className="btn" to="/auth?mode=signup">
                Get started
              </Link>
              <Link className="btn btn-ghost" to="/how-it-works">
                How it works
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
