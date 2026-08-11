import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import InteractiveCard from '../components/InteractiveCard'
import PageBackdrop from '../components/PageBackdrop'
import LiveFeaturePreview from '../components/LiveFeaturePreview'
import { prefersReducedMotion, revealOnScroll } from '../lib/animations'

gsap.registerPlugin(useGSAP, ScrollTrigger)

export default function Features() {
  const root = useRef(null)
  const { t, i18n } = useTranslation()

  const FEATURES = [
    {
      side: 'left',
      eyebrow: t('features.scholarshipEyebrow'),
      title: t('features.scholarshipTitle'),
      body: t('features.scholarshipBody'),
      points: [t('features.scholarshipPoint1'), t('features.scholarshipPoint2'), t('features.scholarshipPoint3')],
      preview: 'scholarship',
    },
    {
      side: 'right',
      eyebrow: t('features.jobEyebrow'),
      title: t('features.jobTitle'),
      body: t('features.jobBody'),
      points: [t('features.jobPoint1'), t('features.jobPoint2'), t('features.jobPoint3')],
      preview: 'job',
    },
    {
      side: 'left',
      eyebrow: t('features.profileEyebrow'),
      title: t('features.profileTitle'),
      body: t('features.profileBody'),
      points: [t('features.profilePoint1'), t('features.profilePoint2'), t('features.profilePoint3')],
      preview: 'profile',
    },
    {
      side: 'right',
      eyebrow: t('features.privacyEyebrow'),
      title: t('features.privacyTitle'),
      body: t('features.privacyBody'),
      points: [t('features.privacyPoint1'), t('features.privacyPoint2'), t('features.privacyPoint3')],
      preview: 'privacy',
    },
  ]

  const gridCards = [
    [t('features.gridReasonTitle'), t('features.gridReasonBody')],
    [t('features.gridMobileTitle'), t('features.gridMobileBody')],
  ]

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
    document.title = t('features.metaTitle')
  }, [t, i18n.language])

  return (
    <PageBackdrop image="features.jpg">
      <div ref={root}>
        <SiteHeader />
        <main>
          <section className="page-hero container">
            <div className="glass-panel hero-copy-block">
              <p className="eyebrow">{t('features.eyebrow')}</p>
              <h1>{t('features.title')}</h1>
              <p className="lede">{t('features.lede')}</p>
            </div>
          </section>

          <section className="section">
            <div className="container feature-zigzags">
              {FEATURES.map((f) => (
                <div key={f.preview} className={`feature-zigzag ${f.side === 'right' ? 'flip' : ''}`}>
                  <div className="zig-copy glass-panel">
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
                    <LiveFeaturePreview kind={f.preview} title={f.eyebrow} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="container card-grid">
              {gridCards.map(([title, body], i) => (
                <InteractiveCard key={title} className="grid-card" data-reveal={i % 2 ? 'right' : 'left'}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </InteractiveCard>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="container cta-panel glass-panel" data-reveal="up">
              <h2>{t('features.ctaTitle')}</h2>
              <p>{t('features.ctaBody')}</p>
              <div className="cta-row" style={{ justifyContent: 'center' }}>
                <Link className="btn" to="/how-it-works">
                  {t('features.ctaHow')}
                </Link>
                <Link className="btn btn-auth" to="/auth?mode=signup">
                  <span>{t('features.ctaSignup')}</span>
                  <span className="btn-auth-shine" aria-hidden="true" />
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
