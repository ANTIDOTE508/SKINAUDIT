import type { Metadata } from 'next'
import { jost } from '@/components/landing/fonts'
import { SiteNav } from '@/components/site-nav/SiteNav'
import { HowItWorksMotion } from './_components/HowItWorksMotion'
import { HeroSection } from './_components/HeroSection'
import { StepSection } from './_components/StepSection'
import { STEPS } from './_components/steps'
import { PrincipleSection } from './_components/PrincipleSection'
import { CloserSection } from './_components/CloserSection'
import './how-it-works.css'

export const metadata: Metadata = {
  title: 'How It Works — SkinAudit',
  description:
    'Your routine, understood in context. SkinAudit brings the different parts of your skincare routine into one place.',
}

/**
 * The How It Works page — a single scroll: hero, five steps, the
 * principle, a closer. Structure, class names and copy are 1:1 with
 * templates/how_it_works.html.
 *
 * Stays a Server Component. Each heavy backdrop SVG is kept verbatim in a
 * `_components/art/*Markup.ts` string and injected via
 * dangerouslySetInnerHTML (same approach as /philosophy) so the artwork is
 * pixel-identical to the comp. Scroll-driven motion is added by the
 * <HowItWorksMotion /> client island (GSAP + ScrollTrigger), which seeds
 * its own from-state so copy is never stranded if it fails to run.
 *
 * `jost.variable` puts `--font-jost` in scope; `--font-cormorant` and
 * `--font-dm-mono` are already global via the root layout. how-it-works.css
 * is namespaced under `.page`.
 */
/**
 * Critical, structure-only slice of how-it-works.css, inlined so the hero is
 * laid out correctly on the very first paint — including after a client-side
 * route change, when the route stylesheet can apply a frame *after* the DOM
 * commits. Without this, <HowItWorksMotion />'s `gsap.set('.hero-lead .wi',
 * { yPercent: 112 })` ran while `.w { overflow: hidden }` was not yet in
 * effect, so the headline words dropped un-masked and the block looked
 * scrambled / off-centre until a refresh. Keep these rules in sync with
 * how-it-works.css (the full sheet still owns colour, type and motion).
 */
const CRITICAL_HERO_CSS = `
.page *, .page *::before, .page *::after { box-sizing: border-box; margin: 0; padding: 0; }
.page { --gap-x: clamp(1.5rem, 6vw, 6rem); }
.page .hero { position: relative; isolation: isolate; overflow: hidden;
  padding: clamp(5.5rem, 11vh, 8rem) var(--gap-x) clamp(4.5rem, 11vh, 8rem); }
.page .hero-inner { display: flex; flex-direction: column; gap: clamp(2rem, 5vh, 3.5rem); }
.page .inner { position: relative; z-index: 2; }
.page .hero-lead { font-size: clamp(2.25rem, 5.6vw, 5.25rem); line-height: 1.04;
  letter-spacing: -0.025em; max-width: 16ch; }
.page .hero-cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(2rem, 5vw, 5rem); align-items: end; padding-top: clamp(1rem, 3vh, 2.25rem); }
.page .w { display: inline-block; overflow: hidden; vertical-align: bottom;
  padding-bottom: 0.16em; margin-bottom: -0.16em; }
.page .wi { display: block; }
@media (max-width: 760px) { .page .hero-cols { grid-template-columns: 1fr; } }
`

export default function HowItWorksPage() {
  return (
    <div className={`${jost.variable} page`}>
      <style>{CRITICAL_HERO_CSS}</style>
      <HowItWorksMotion />
      <SiteNav current="how-it-works" />
      <HeroSection />

      {STEPS.map((step) => (
        <StepSection key={step.num} {...step} />
      ))}

      <PrincipleSection />
      <CloserSection />

      <div className="foot">
        <span>SkinAudit</span>
        <span>Skincare Intelligence</span>
      </div>
    </div>
  )
}
