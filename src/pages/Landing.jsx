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
import { prefersReducedMotion, revealOnScroll } from '../lib/animations'

gsap.registerPlugin(useGSAP, ScrollTrigger)

export default function Landing() {
  const root = useRef(null)
  const { t } = useTranslation()

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
    document.title = t('landing.title')
  }, [t])

  return (
    <PageBackdrop image="home.jpg" className="landing">
      <div ref={root}>
        <SiteHeader />

        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy glass-panel">
              <img className="hero-brand" src={`${import.meta.env.BASE_URL}logo.png`} alt={t('common.brand')} />
              <h1>{t('landing.headline')}</h1>
              <p className="lede">{t('landing.lede')}</p>
              <div className="cta-row">
                <Link className="btn" to="/auth?mode=signup">
                  {t('landing.createProfile')}
                </Link>
                <Link className="btn btn-ghost" to="/how-it-works">
                  {t('landing.seeSystem')}
                </Link>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="orbit">
                <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
              </div>
              <InteractiveCard className="float-card float-a">
                <p className="eyebrow">{t('landing.scholarship')}</p>
                <strong>{t('landing.matchPct')}</strong>
                <p>{t('landing.floatA')}</p>
              </InteractiveCard>
              <InteractiveCard className="float-card float-b">
                <p className="eyebrow">{t('landing.job')}</p>
                <strong>{t('landing.floatBTitle')}</strong>
                <p>{t('landing.floatB')}</p>
              </InteractiveCard>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container teaser-grid">
            <InteractiveCard className="teaser" data-reveal="left">
              <p className="eyebrow">{t('landing.system')}</p>
              <h2>{t('landing.howMatching')}</h2>
              <p>{t('landing.howMatchingBody')}</p>
              <Link className="text-link" to="/how-it-works">
                {t('landing.openConsole')}
              </Link>
            </InteractiveCard>
            <InteractiveCard className="teaser" data-reveal="right">
              <p className="eyebrow">{t('landing.modules')}</p>
              <h2>{t('landing.whatShips')}</h2>
              <p>{t('landing.whatShipsBody')}</p>
              <Link className="text-link" to="/features">
                {t('landing.viewModules')}
              </Link>
            </InteractiveCard>
            <InteractiveCard className="teaser" data-reveal="up">
              <p className="eyebrow">{t('landing.brief')}</p>
              <h2>{t('landing.whyExists')}</h2>
              <p>{t('landing.whyExistsBody')}</p>
              <Link className="text-link" to="/about">
                {t('landing.readBrief')}
              </Link>
            </InteractiveCard>
          </div>
        </section>

        <section className="section">
          <div className="container cta-panel glass-panel" data-reveal="scale">
            <h2>{t('landing.ctaTitle')}</h2>
            <p>{t('landing.ctaBody')}</p>
            <Link className="btn" to="/auth?mode=signup">
              {t('common.getStarted')}
            </Link>
          </div>
        </section>

        <SiteFooter />
      </div>
    </PageBackdrop>
  )
}
