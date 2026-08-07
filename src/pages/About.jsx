import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import PageBackdrop from '../components/PageBackdrop'
import { prefersReducedMotion, revealOnScroll } from '../lib/animations'

gsap.registerPlugin(useGSAP, ScrollTrigger)

export default function About() {
  const root = useRef(null)
  const { t, i18n } = useTranslation()

  const PRINCIPLES = [
    {
      num: '01',
      title: t('about.p1Title'),
      body: t('about.p1Body'),
    },
    {
      num: '02',
      title: t('about.p2Title'),
      body: t('about.p2Body'),
    },
    {
      num: '03',
      title: t('about.p3Title'),
      body: t('about.p3Body'),
    },
  ]

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
    document.title = t('about.metaTitle')
  }, [t, i18n.language])

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
              <p className="eyebrow">{t('about.eyebrow')}</p>
              <h1>{t('about.title')}</h1>
              <p className="lede">{t('about.lede')}</p>
            </div>
            <div className="about-hero-rule" aria-hidden="true" />
          </section>

          <section className="about-mission section">
            <div className="container about-mission-grid">
              <div data-reveal="left">
                <p className="jarvis-caption">{t('about.ideaCaption')}</p>
                <h2>{t('about.ideaTitle')}</h2>
              </div>
              <div className="about-mission-body" data-reveal="right">
                <p>{t('about.ideaBody1')}</p>
                <p>{t('about.ideaBody2')}</p>
              </div>
            </div>
          </section>

          <section className="about-principles section">
            <div className="container">
              <p className="jarvis-caption">{t('about.rulesCaption')}</p>
              <h2 className="about-section-title">{t('about.rulesTitle')}</h2>
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
                <p className="jarvis-caption">{t('about.areCaption')}</p>
                <h2>{t('about.areTitle')}</h2>
                <ul className="about-checklist">
                  <li>{t('about.areItem1')}</li>
                  <li>{t('about.areItem2')}</li>
                  <li>{t('about.areItem3')}</li>
                </ul>
              </article>
              <article className="about-split-panel muted-panel" data-reveal="up">
                <p className="jarvis-caption">{t('about.notCaption')}</p>
                <h2>{t('about.notTitle')}</h2>
                <ul className="about-checklist">
                  <li>{t('about.notItem1')}</li>
                  <li>{t('about.notItem2')}</li>
                  <li>{t('about.notItem3')}</li>
                </ul>
              </article>
            </div>
          </section>

          <section className="section about-maker">
            <div className="container about-maker-inner" data-reveal="scale">
              <div>
                <p className="jarvis-caption">{t('about.studioCaption')}</p>
                <h2>{t('about.studioTitle')}</h2>
                <p>{t('about.studioBody')}</p>
              </div>
              <a
                className="btn btn-ghost"
                href="https://futurifydesigns.com"
                target="_blank"
                rel="noreferrer"
              >
                {t('about.studioCta')}
              </a>
            </div>
          </section>

          <section className="section">
            <div className="container about-cta" data-reveal="up">
              <h2>{t('about.ctaTitle')}</h2>
              <p>{t('about.ctaBody')}</p>
              <div className="cta-row">
                <Link className="btn" to="/auth?mode=signup">
                  {t('about.ctaCreate')}
                </Link>
                <Link className="btn btn-ghost" to="/how-it-works">
                  {t('about.ctaHow')}
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
