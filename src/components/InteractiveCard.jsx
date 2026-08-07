import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { prefersReducedMotion } from '../lib/animations'

gsap.registerPlugin(useGSAP)

export default function InteractiveCard({
  children,
  className = '',
  as: Tag = 'article',
  ...props
}) {
  const ref = useRef(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el || prefersReducedMotion()) return

      const onMove = (e) => {
        // Scramble hover must not drive card tilt (avoids position jumps).
        if (e.target?.closest?.('.gt-word, .gt-heading')) return
        const r = el.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        gsap.to(el, {
          rotateY: x * 10,
          rotateX: -y * 10,
          y: -4,
          duration: 0.35,
          ease: 'power2.out',
          transformPerspective: 800,
          overwrite: 'auto',
        })
        const shine = el.querySelector('.card-shine')
        if (shine) {
          gsap.to(shine, {
            opacity: 0.35,
            backgroundPosition: `${50 + x * 40}% ${50 + y * 40}%`,
            duration: 0.3,
            overwrite: 'auto',
          })
        }
      }

      const onLeave = () => {
        gsap.to(el, {
          rotateY: 0,
          rotateX: 0,
          y: 0,
          duration: 0.45,
          ease: 'power3.out',
          overwrite: 'auto',
        })
        const shine = el.querySelector('.card-shine')
        if (shine) gsap.to(shine, { opacity: 0, duration: 0.35, overwrite: 'auto' })
      }

      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)
      return () => {
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerleave', onLeave)
      }
    },
    { scope: ref },
  )

  return (
    <Tag ref={ref} className={`interactive-card ${className}`.trim()} {...props}>
      <span className="card-shine" aria-hidden="true" />
      <div className="interactive-card-inner">{children}</div>
    </Tag>
  )
}
