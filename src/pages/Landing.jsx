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
    document.title = 'Opportunistic — Scholarships & jobs that fit'
  }, [])

  return (
    <PageBackdrop image="home.jpg" className="landing">
      <div ref={root}>
        <SiteHeader />

        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy glass-panel">
              <img className="hero-brand" src={`${import.meta.env.BASE_URL}logo.png`} alt="Opportunistic" />
              <h1>Opportunities matched to who you actually are.</h1>
              <p className="lede">
                Build one profile. Get scholarships and jobs ranked with reasons you can read — not mystery lists.
              </p>
              <div className="cta-row">
                <Link className="btn btn-auth" to="/auth?mode=signup">
                  <span>Create your profile</span>
                  <span className="btn-auth-shine" aria-hidden="true" />
                </Link>
                <Link className="btn btn-ghost" to="/how-it-works">
                  Watch how it works
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
              <p className="eyebrow">Product tour</p>
              <h2>See the matching flow</h2>
              <p>An animated walkthrough: profile → search → reasoned results.</p>
              <Link className="text-link" to="/how-it-works">
                Open how it works →
              </Link>
            </InteractiveCard>
            <InteractiveCard className="teaser" data-reveal="right">
              <p className="eyebrow">Capabilities</p>
              <h2>What you get</h2>
              <p>Two engines, visible scores, privacy-first deletion, worldwide by design.</p>
              <Link className="text-link" to="/features">
                Explore features →
              </Link>
            </InteractiveCard>
            <InteractiveCard className="teaser" data-reveal="up">
              <p className="eyebrow">Story</p>
              <h2>Why Opportunistic</h2>
              <p>Built so applicants everywhere get fit explained — not noise.</p>
              <Link className="text-link" to="/about">
                Read about us →
              </Link>
            </InteractiveCard>
          </div>
        </section>

        <section className="section">
          <div className="container cta-panel glass-panel" data-reveal="scale">
            <h2>Start with your story.</h2>
            <p>A few minutes to onboard. Matching begins when your profile is complete.</p>
            <Link className="btn btn-auth" to="/auth?mode=signup">
              <span>Get started free</span>
              <span className="btn-auth-shine" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <SiteFooter />
      </div>
    </PageBackdrop>
  )
}
