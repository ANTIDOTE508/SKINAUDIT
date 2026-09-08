import type { Metadata } from 'next'
import { jost } from '@/components/landing/fonts'
import { SiteNav } from '@/components/site-nav/SiteNav'
import { AboutField } from './_components/art/AboutField'
import { AboutMotion } from './_components/AboutMotion'
import { HeroSection } from './_components/HeroSection'
import { Section } from './_components/Section'
import { SECTIONS } from './_components/sections'
import { JournalSection } from './_components/JournalSection'
import './about.css'

export const metadata: Metadata = {
  title: 'About — SkinAudit',
  description:
    'SkinAudit is an independent skincare intelligence platform, built to help people understand the routines they already have and make more informed choices.',
}

/**
 * The About page — a single centred column over one page-spanning "field"
 * backdrop: hero, four sections, foot. Structure, class names and copy are
 * 1:1 with templates/about.html.
 *
 * Stays a Server Component. The heavy field SVG is kept verbatim in
 * `_components/art/aboutFieldMarkup.ts` and injected via
 * dangerouslySetInnerHTML (same approach as /philosophy) so the artwork is
 * pixel-identical to the comp. Scroll-driven motion is added by the
 * <AboutMotion /> client island (GSAP + ScrollTrigger), which seeds its
 * own from-state so copy is never stranded if it fails to run.
 *
 * `jost.variable` puts `--font-jost` in scope; `--font-cormorant` is
 * already global via the root layout. about.css is namespaced under
 * `.page`. The top nav is the shared <SiteNav />, with About marked
 * current.
 */
export default function AboutPage() {
  return (
    <div className={`${jost.variable} page about-page`}>
      <AboutMotion />
      <AboutField />
      <div className="field-veil" />

      <div className="shell">
        <SiteNav current="about" />

        <HeroSection />

        {SECTIONS.map((section) => (
          <Section key={section.heading} {...section} />
        ))}

        <JournalSection />

        <div className="foot">
          <span>SkinAudit</span>
          <span>Skincare Intelligence</span>
        </div>
      </div>
    </div>
  )
}
