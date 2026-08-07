import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import InteractiveCard from '../components/InteractiveCard'
import PageBackdrop from '../components/PageBackdrop'
import { prefersReducedMotion, revealOnScroll } from '../lib/animations'

gsap.registerPlugin(useGSAP, ScrollTrigger)

export default function Landing() {
  const root = useRef(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('.hero-brand', { y: 28, opacity: 0, duration: 0.55 })
        .from('.hero-copy h1', { y: 36, opacity: 0, duration: 0.55 }, '-=0.25')
        .from('.hero-copy .lede', { y: 24, opacity: 0, duration: 0.45 }, '-=0.28')
        .from('.hero-copy .cta-row', { y: 18, opacity: 0, duration: 0.4 }, '-=0.25')
        .from(
          '.float-card',
          { x: 50, opacity: 0, stagger: 0.12, duration: 0.55, ease: 'power2.out' },
          '-=0.35',
        )

      gsap.to('.float-card', {
        y: '+=12',
        duration: 2.4,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        stagger: 0.35,
      })

      gsap.to('.orbit', {
        rotate: 360,
        duration: 48,
        repeat: -1,
        ease: 'none',
      })

      revealOnScroll(root.current)
    },
    { scope: root },
  )

  useEffect(() => {
    document.title = 'Opportunistic'
  }, [])

  return (
    <PageBackdrop image="home.jpg" className="landing">
      <div ref={root}>
        <SiteHeader />

        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy glass-panel">
              <img className="hero-brand" src={`${import.meta.env.BASE_URL}logo.png`} alt="Opportunistic" />
              <h1>Match scholarships and jobs to a real profile.</h1>
              <p className="lede">
                Enter skills and qualifications. Opportunistic ranks openings and explains the fit on every card.
              </p>
              <div className="cta-row">
                <Link className="btn" to="/auth?mode=signup">
                  Create profile
                </Link>
                <Link className="btn btn-ghost" to="/how-it-works">
                  See the system
                </Link>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="orbit">
                <img src={`${import.meta.env.BASE_URL}mark.svg`} alt="" />
              </div>
              <InteractiveCard className="float-card float-a">
                <p className="eyebrow">Scholarship</p>
                <strong>94% match</strong>
                <p>Fits your CS degree + region</p>
              </InteractiveCard>
              <InteractiveCard className="float-card float-b">
                <p className="eyebrow">Job</p>
                <strong>React · Junior</strong>
                <p>Reasoning on every card</p>
              </InteractiveCard>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container teaser-grid">
            <InteractiveCard className="teaser" data-reveal="left">
              <p className="eyebrow">System</p>
              <h2>How matching runs</h2>
              <p>Profile feed → search → scored results with reasons.</p>
              <Link className="text-link" to="/how-it-works">
                Open console →
              </Link>
            </InteractiveCard>
            <InteractiveCard className="teaser" data-reveal="right">
              <p className="eyebrow">Modules</p>
              <h2>What ships in v1</h2>
              <p>Scholarships, jobs by country, profile editor, deletion.</p>
              <Link className="text-link" to="/features">
                View modules →
              </Link>
            </InteractiveCard>
            <InteractiveCard className="teaser" data-reveal="up">
              <p className="eyebrow">Brief</p>
              <h2>Why this exists</h2>
              <p>Link dumps ignore your record. We don’t.</p>
              <Link className="text-link" to="/about">
                Read brief →
              </Link>
            </InteractiveCard>
          </div>
        </section>

        <section className="section">
          <div className="container cta-panel glass-panel" data-reveal="scale">
            <h2>Start with your profile.</h2>
            <p>Onboarding takes a few minutes. Matching runs when you finish.</p>
            <Link className="btn" to="/auth?mode=signup">
              Get started
            </Link>
          </div>
        </section>

        <SiteFooter />
      </div>
    </PageBackdrop>
  )
}
