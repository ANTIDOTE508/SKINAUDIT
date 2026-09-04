import type { Metadata } from 'next'
import { jost } from '@/components/landing/fonts'
import { PhilosophyNav } from './_components/PhilosophyNav'
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
    "Skincare was never just a list of products. Your skin experiences a routine as a system.",
}

/**
 * The Philosophy page. A single scroll of six sections, each with its own
 * generative backdrop. Stays a Server Component; scroll-driven motion is
 * added by the <PhilosophyMotion /> client island (GSAP + ScrollTrigger),
 * which seeds its own from-state so copy is never stranded if it fails to
 * run. `jost.variable` puts `--font-jost` in scope (Cormorant is already
 * global via the root layout); philosophy.css is namespaced under `.page`.
 */
export default function PhilosophyPage() {
  return (
    <div className={`${jost.variable} page`}>
      <PhilosophyMotion />
      <PhilosophyNav />
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
