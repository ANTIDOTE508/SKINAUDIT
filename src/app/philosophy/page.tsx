import type { Metadata } from 'next'
import { jost } from '@/components/landing/fonts'
import { PhilosophyNav } from './_components/PhilosophyNav'
import { HeroSection } from './_components/HeroSection'
import { ProblemSection } from './_components/ProblemSection'
import { TopographySection } from './_components/TopographySection'
import { ApproachSection } from './_components/ApproachSection'
import { ShiftSection } from './_components/ShiftSection'
import { CloserSection } from './_components/CloserSection'
import './philosophy.css'

export const metadata: Metadata = {
  title: 'Philosophy — SkinAudit',
  description:
    "Skincare was never just a list of products. Your skin experiences a routine as a system.",
}

/**
 * The Philosophy page. A single scroll of six sections, each with its own
 * generative backdrop. Fully static — every animation is CSS-driven, so
 * this stays a Server Component. `jost.variable` puts `--font-jost` in
 * scope (Cormorant is already global via the root layout); philosophy.css
 * is namespaced under `.page`.
 */
export default function PhilosophyPage() {
  return (
    <div className={`${jost.variable} page`}>
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
