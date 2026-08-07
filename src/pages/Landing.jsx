import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const FEATURES = [
  {
    title: 'One profile, two engines',
    body: 'Build your qualifications and skills once. We match scholarships and jobs from the same living profile.',
  },
  {
    title: 'Reasoning you can read',
    body: 'Every result shows why it fits — field, experience, country eligibility — not a black-box ranking.',
  },
  {
    title: 'Fresh on change, not on spam',
    body: 'Matches refresh when you edit your profile and on a weekly cadence. No pointless re-search button.',
  },
]

export default function Landing() {
  const root = useRef(null)

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) return

      gsap.from('.hero-brand', { y: 24, opacity: 0, duration: 0.55, ease: 'power2.out' })
      gsap.from('.hero-copy > *', {
        y: 28,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        delay: 0.12,
        ease: 'power2.out',
      })
      gsap.from('.hero-visual', {
        scale: 0.94,
        opacity: 0,
        duration: 0.7,
        delay: 0.15,
        ease: 'power2.out',
      })

      gsap.utils.toArray('.feature-block').forEach((el) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 85%' },
          y: 36,
          opacity: 0,
          duration: 0.45,
          ease: 'power2.out',
        })
      })
    },
    { scope: root },
  )

  useEffect(() => {
    document.title = 'Opportunistic — Scholarships & jobs that fit'
  }, [])

  return (
    <div ref={root} className="page landing">
      <SiteHeader />

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <img
              className="hero-brand"
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Opportunistic"
            />
            <h1>Opportunities matched to who you actually are.</h1>
            <p>
              Build a profile of your skills and qualifications. We surface scholarships and jobs worldwide —
              with a clear reason for every match.
            </p>
            <div className="cta-row">
              <Link className="btn" to="/auth?mode=signup">
                Create your profile
              </Link>
              <a className="btn btn-ghost" href="#how">
                See how it works
              </a>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="orbit">
              <img src={`${import.meta.env.BASE_URL}mark.svg`} alt="" />
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="section">
        <div className="container">
          <p className="eyebrow">How it works</p>
          <h2>Profile in. Fit explained. Links you can trust.</h2>
          <div className="feature-stack">
            {FEATURES.map((f) => (
              <article key={f.title} className="feature-block">
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-band">
        <div className="container split">
          <div>
            <p className="eyebrow">Worldwide by design</p>
            <h2>Built for applicants everywhere — not locked to one country TLD.</h2>
          </div>
          <p>
            Pick your country, add degrees and skills, and get ranked scholarship and job links with reasoning
            visible by default. Mobile-first, privacy-aware, and honest about third-party listings.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container cta-panel">
          <h2>Start with your story.</h2>
          <p>It takes a few minutes. Matching begins when your profile is complete.</p>
          <Link className="btn" to="/auth?mode=signup">
            Get started free
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
