import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import HowItWorksDemo from '../components/HowItWorksDemo'
import PageBackdrop from '../components/PageBackdrop'
import { prefersReducedMotion, revealOnScroll } from '../lib/animations'

gsap.registerPlugin(useGSAP, ScrollTrigger)

export default function HowItWorks() {
  const root = useRef(null)
  const { t, i18n } = useTranslation()

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('.page-hero > *', { y: 28, opacity: 0, stagger: 0.08, duration: 0.5, ease: 'power2.out' })
      revealOnScroll(root.current)
    },
    { scope: root },
  )

  useEffect(() => {
    document.title = t('howItWorks.metaTitle')
  }, [t, i18n.language])

  return (
    <PageBackdrop image="how.jpg">
      <div ref={root}>
        <SiteHeader />
        <main>
          <section className="page-hero container">
            <div className="glass-panel hero-copy-block">
              <p className="eyebrow">{t('howItWorks.eyebrow')}</p>
              <h1>{t('howItWorks.title')}</h1>
              <p className="lede">{t('howItWorks.lede')}</p>
            </div>
          </section>

          <section className="section">
            <div className="container" data-reveal="up">
              <HowItWorksDemo />
            </div>
          </section>

          <section className="section">
            <div className="container detail-rows">
              <article className="detail-row glass-panel" data-reveal="left">
                <div>
                  <p className="eyebrow">{t('howItWorks.cadenceEyebrow')}</p>
                  <h2>{t('howItWorks.cadenceTitle')}</h2>
                </div>
                <p>{t('howItWorks.cadenceBody')}</p>
              </article>
              <article className="detail-row glass-panel" data-reveal="right">
                <div>
                  <p className="eyebrow">{t('howItWorks.trustEyebrow')}</p>
                  <h2>{t('howItWorks.trustTitle')}</h2>
                </div>
                <p>{t('howItWorks.trustBody')}</p>
              </article>
            </div>
          </section>

          <section className="section">
            <div className="container cta-panel glass-panel" data-reveal="scale">
              <h2>{t('howItWorks.ctaTitle')}</h2>
              <p>{t('howItWorks.ctaBody')}</p>
              <div className="cta-row" style={{ justifyContent: 'center' }}>
                <Link className="btn btn-auth" to="/auth?mode=signup">
                  <span>{t('howItWorks.ctaStart')}</span>
                  <span className="btn-auth-shine" aria-hidden="true" />
                </Link>
                <Link className="btn btn-ghost" to="/features">
                  {t('howItWorks.ctaFeatures')}
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
