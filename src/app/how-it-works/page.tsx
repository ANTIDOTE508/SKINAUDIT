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
export default function HowItWorksPage() {
  return (
    <div className={`${jost.variable} page`}>
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
