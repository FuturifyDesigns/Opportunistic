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

const FEATURES = [
  {
    side: 'left',
    eyebrow: 'Scholarship matcher',
    title: 'Worldwide awards, ranked for you',
    body: 'Your degrees and skills drive the search. Each scholarship card shows score + why it fits.',
    points: ['Regional preference from your country', 'Reasoning visible by default', 'Deadlines filtered on read'],
  },
  {
    side: 'right',
    eyebrow: 'Job matcher',
    title: 'Roles filtered to your country',
    body: 'Same profile, second engine. Jobs respect the country you chose — with transparent fit notes.',
    points: ['Country-aware queries', 'Skills-weighted scoring', 'Save or dismiss per listing'],
  },
  {
    side: 'left',
    eyebrow: 'Profile builder',
    title: 'Guided onboarding, not a wall of fields',
    body: 'Country → about you → qualifications → skills. Editing later rematches automatically.',
    points: ['Step-by-step flow', 'Degrees & certificates', 'Proficiency levels'],
  },
  {
    side: 'right',
    eyebrow: 'Privacy baseline',
    title: 'Delete means cascade',
    body: 'GDPR-level deletion for everyone. Profile removal cascades to skills, quals, and matches.',
    points: ['Own-data RLS', 'Digest controls', 'Clear terms & privacy'],
  },
]

export default function Features() {
  const root = useRef(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('.page-hero > *', { y: 28, opacity: 0, stagger: 0.08, duration: 0.5, ease: 'power2.out' })
      revealOnScroll(root.current)

      gsap.utils.toArray('.feature-zigzag').forEach((row, i) => {
        const media = row.querySelector('.zig-media')
        const copy = row.querySelector('.zig-copy')
        const fromLeft = i % 2 === 0
        gsap.from(copy, {
          x: fromLeft ? -70 : 70,
          opacity: 0,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: { trigger: row, start: 'top 80%', toggleActions: 'play none none reverse' },
        })
        gsap.from(media, {
          x: fromLeft ? 70 : -70,
          opacity: 0,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: { trigger: row, start: 'top 80%', toggleActions: 'play none none reverse' },
        })
      })
    },
    { scope: root },
  )

  useEffect(() => {
    document.title = 'Features — Opportunistic'
  }, [])

  return (
    <div ref={root} className="page">
      <SiteHeader />
      <main>
        <section className="page-hero container">
          <p className="eyebrow">Features</p>
          <h1>Two engines. One profile. Clear reasons.</h1>
          <p className="lede">
            Scroll the capabilities — cards tilt as you explore, and each block slides in from alternating sides.
          </p>
        </section>

        <section className="section">
          <div className="container feature-zigzags">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`feature-zigzag ${f.side === 'right' ? 'flip' : ''}`}>
                <div className="zig-copy">
                  <p className="eyebrow">{f.eyebrow}</p>
                  <h2>{f.title}</h2>
                  <p>{f.body}</p>
                  <ul className="check-list">
                    {f.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div className="zig-media">
                  <InteractiveCard className="feature-showcase">
                    <p className="eyebrow">Preview</p>
                    <strong>{f.eyebrow}</strong>
                    <div className="mini-bars" aria-hidden="true">
                      <span style={{ width: `${88 - i * 6}%` }} />
                      <span style={{ width: `${72 - i * 4}%` }} />
                      <span style={{ width: `${64 - i * 5}%` }} />
                    </div>
                    <p className="muted">Hover / tilt this card</p>
                  </InteractiveCard>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section section-band">
          <div className="container card-grid">
            {[
              ['Visible reasoning', 'Why each match fits sits on the card — not behind a modal.'],
              ['Mobile-first', 'Most applicants arrive on a phone; layout and motion respect that.'],
              ['Honest ads later', 'At most 1–2 units, never inside forms or the matching flow.'],
            ].map(([t, b], i) => (
              <InteractiveCard key={t} className="grid-card" data-reveal={i % 2 ? 'right' : 'left'}>
                <h3>{t}</h3>
                <p>{b}</p>
              </InteractiveCard>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="container cta-panel" data-reveal="up">
            <h2>See it in motion</h2>
            <p>Jump to the animated walkthrough, or start building your profile.</p>
            <div className="cta-row" style={{ justifyContent: 'center' }}>
              <Link className="btn" to="/how-it-works">
                How it works
              </Link>
              <Link className="btn btn-ghost" to="/auth?mode=signup">
                Sign up
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
