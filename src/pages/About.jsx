import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import PageBackdrop from '../components/PageBackdrop'
import { prefersReducedMotion, revealOnScroll } from '../lib/animations'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const PRINCIPLES = [
  {
    num: '01',
    title: 'Profile first',
    body: 'Degrees, skills, and country are the source of truth. Matches rebuild when you change them.',
  },
  {
    num: '02',
    title: 'Reasons on every card',
    body: 'A score without an explanation is noise. We write why a listing fits — in plain language.',
  },
  {
    num: '03',
    title: 'You finish on the source',
    body: 'We discover and rank. You apply on the official scholarship or employer site.',
  },
]

export default function About() {
  const root = useRef(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('.about-hero-mark', { y: 24, opacity: 0, duration: 0.5 })
        .from('.about-hero-copy > *', { y: 28, opacity: 0, stagger: 0.08, duration: 0.5 }, '-=0.25')
        .from('.about-hero-rule', { scaleX: 0, duration: 0.55 }, '-=0.2')

      gsap.from('.about-principle', {
        y: 36,
        opacity: 0,
        stagger: 0.12,
        duration: 0.55,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.about-principles', start: 'top 78%' },
      })

      revealOnScroll(root.current)
    },
    { scope: root },
  )

  useEffect(() => {
    document.title = 'About — Opportunistic'
  }, [])

  return (
    <PageBackdrop image="about.jpg">
      <div ref={root} className="about-page">
        <SiteHeader />
        <main>
          <section className="about-hero container">
            <img
              className="about-hero-mark"
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt=""
              width="120"
              height="120"
            />
            <div className="about-hero-copy">
              <p className="eyebrow">About Opportunistic</p>
              <h1>Scholarships and jobs, matched with reasons.</h1>
              <p className="lede">
                Built for people who are tired of scrolling generic boards. Enter what you’ve studied and what you can
                do — we rank openings and say why they fit.
              </p>
            </div>
            <div className="about-hero-rule" aria-hidden="true" />
          </section>

          <section className="about-mission section">
            <div className="container about-mission-grid">
              <div data-reveal="left">
                <p className="jarvis-caption">The idea</p>
                <h2>Matching should feel like a briefing, not a dump of links.</h2>
              </div>
              <div className="about-mission-body" data-reveal="right">
                <p>
                  Search engines and opportunity boards show volume. They rarely know your Computer Science degree, your
                  React skills, or that you’re applying from Botswana — and they almost never explain the fit.
                </p>
                <p>
                  Opportunistic keeps one living profile and runs scholarship and job matching against it. Every result
                  carries a score, a source, and a reason you can actually use.
                </p>
              </div>
            </div>
          </section>

          <section className="about-principles section">
            <div className="container">
              <p className="jarvis-caption">How we work</p>
              <h2 className="about-section-title">Three rules we don’t break</h2>
              <div className="about-principle-list">
                {PRINCIPLES.map((item) => (
                  <article key={item.num} className="about-principle">
                    <span className="about-principle-num">{item.num}</span>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="section">
            <div className="container about-split">
              <article className="about-split-panel" data-reveal="up">
                <p className="jarvis-caption">What we are</p>
                <h2>A discovery layer</h2>
                <ul className="about-checklist">
                  <li>Profile-aware scholarship and job matches</li>
                  <li>Playbook tips unique to your skills and goals</li>
                  <li>Save, dismiss, and rematch when your profile changes</li>
                </ul>
              </article>
              <article className="about-split-panel muted-panel" data-reveal="up">
                <p className="jarvis-caption">What we are not</p>
                <h2>Not the issuer</h2>
                <ul className="about-checklist">
                  <li>We don’t grant scholarships or hire anyone</li>
                  <li>We don’t guarantee acceptance or funding</li>
                  <li>Always verify deadlines on the official listing</li>
                </ul>
              </article>
            </div>
          </section>

          <section className="section about-maker">
            <div className="container about-maker-inner" data-reveal="scale">
              <div>
                <p className="jarvis-caption">Studio</p>
                <h2>Built by Futurify Designs</h2>
                <p>
                  Opportunistic™ is a Futurify Designs product — designed to feel precise, calm, and useful, not like
                  another template board.
                </p>
              </div>
              <a
                className="btn btn-ghost"
                href="https://futurifydesigns.com"
                target="_blank"
                rel="noreferrer"
              >
                Visit Futurify Designs
              </a>
            </div>
          </section>

          <section className="section">
            <div className="container about-cta" data-reveal="up">
              <h2>Ready to hand it your profile?</h2>
              <p>Create an account, confirm skills from your degree, and open ranked matches with reasons.</p>
              <div className="cta-row">
                <Link className="btn" to="/auth?mode=signup">
                  Create profile
                </Link>
                <Link className="btn btn-ghost" to="/how-it-works">
                  See how it works
                </Link>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    </PageBackdrop>
  )
}
