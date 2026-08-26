'use client'

import Link from 'next/link'
import LandingNav from './LandingNav'
import { useHeroParallax } from './useHeroParallax'

export default function LandingHero() {
  const { line1, line2, finally_, subRow } = useHeroParallax()

  return (
    <section className="hero" id="hero">
      <LandingNav />

      <div className="hero-overlay" aria-hidden="true" />

      <div className="hero-hed">
        <span className="hed-line" ref={line1}>
          Skincare
        </span>
        <span className="hed-line" ref={line2}>
          Intelligence.
        </span>
        <span className="hed-finally" ref={finally_}>
          Finally.
        </span>
      </div>

      <div className="hero-sub-row" ref={subRow}>
        <p className="hero-sub">
          SkinAudit helps you understand how your skincare regimen works together, so you can make
          more informed choices.
        </p>
        <div>
          <Link className="cta" href="/onboarding">
            Start Your Audit <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      <div className="scroll-hint" aria-hidden="true">
        <div className="scroll-hint-line" />
        <span className="scroll-hint-label">Scroll</span>
      </div>
    </section>
  )
}
