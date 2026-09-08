import type { Metadata } from 'next'
import { jost } from '@/components/landing/fonts'
import { SiteNav } from '@/components/site-nav/SiteNav'
import { HeroSection } from './_components/HeroSection'
import { ProblemSection } from './_components/ProblemSection'
import { TopographySection } from './_components/TopographySection'
import { ApproachSection } from './_components/ApproachSection'
import { ShiftSection } from './_components/ShiftSection'
import { CloserSection } from './_components/CloserSection'
import { PhilosophyMotion } from './_components/PhilosophyMotion'
import './philosophy.css'

export const metadata: Metadata = {
  title: 'Philosophy — SkinAudit',
  description:
    'Skincare was never just a list of products. Your skin experiences a routine as a system.',
}

/**
 * The Philosophy page. A single scroll of six sections, each with its own
 * generative backdrop. Stays a Server Component; scroll-driven motion is
 * added by the <PhilosophyMotion /> client island (GSAP + ScrollTrigger),
 * which seeds its own from-state so copy is never stranded if it fails to
 * run. `jost.variable` puts `--font-jost` in scope (Cormorant is already
 * global via the root layout); philosophy.css is namespaced under `.page`.
 */
/**
 * Critical, structure-only slice of philosophy.css, inlined so the hero is
 * laid out correctly on the very first paint — including after a client-side
 * route change, when the route stylesheet can apply a frame *after* the DOM
 * commits. The hero's arrival animation now lives in <PhilosophyMotion />
 * (GSAP seeds its from-state before paint) rather than a CSS `animation …
 * both`, which is what snapped the already-visible headline back to an
 * offset/faded state — "scrambled, off-centre until refresh". Keep these
 * rules in sync with philosophy.css (the full sheet still owns colour, type
 * and motion).
 */
const CRITICAL_HERO_CSS = `
.page *, .page *::before, .page *::after { box-sizing: border-box; margin: 0; padding: 0; }
.page { --gap-x: clamp(1.5rem, 6vw, 6rem); }
.page .hero { position: relative; isolation: isolate; overflow: hidden;
  padding: clamp(5.5rem, 11vh, 8rem) var(--gap-x) clamp(5rem, 13vh, 9rem); }
.page .hero-inner { display: flex; flex-direction: column; gap: clamp(2.5rem, 6vh, 4.5rem); }
.page .inner { position: relative; z-index: 2; }
.page .hero-lead { font-size: clamp(2.25rem, 5.4vw, 5rem); line-height: 1.06;
  letter-spacing: -0.02em; max-width: 15ch; }
.page .hero-system { font-size: clamp(1.75rem, 3.9vw, 3.5rem); line-height: 1.15;
  letter-spacing: -0.01em; max-width: 20ch; }
.page .hero-cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(2rem, 5vw, 5rem); align-items: start; padding-top: clamp(1rem, 3vh, 2.5rem); }
@media (max-width: 760px) { .page .hero-cols { grid-template-columns: 1fr; } }
`

export default function PhilosophyPage() {
  return (
    <div className={`${jost.variable} page`}>
      <style>{CRITICAL_HERO_CSS}</style>
      <PhilosophyMotion />
      <SiteNav current="philosophy" />
      <HeroSection />
      <ProblemSection />
      <TopographySection />
      <ApproachSection />
      <ShiftSection />
      <CloserSection />

      <div className="foot">
        <span>SkinAudit</span>
        <span>Skincare Intelligence</span>
      </div>
    </div>
  )
}
