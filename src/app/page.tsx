import LandingHero from '@/components/landing/LandingHero'
import LandingStats from '@/components/landing/LandingStats'
import LandingQuote from '@/components/landing/LandingQuote'
import LandingFeatures from '@/components/landing/LandingFeatures'
import LandingFooter from '@/components/landing/LandingFooter'
import { inter } from '@/components/landing/fonts'
import { HERO_IMAGE_SRC } from '@/components/landing/hero-image'
import '@/components/landing/landing.css'

export default function LandingPage() {
  return (
    <div className={`${inter.variable} home-page`}>
      {/*
        The hero photo is the LCP element but is painted as a CSS background
        layer, so the browser cannot discover it until the stylesheet is
        parsed. Preloading it lets the fetch start with the document.
      */}
      <link
        rel="preload"
        as="image"
        href={HERO_IMAGE_SRC}
        fetchPriority="high"
      />

      <LandingHero />
      <LandingStats />
      <LandingQuote />
      <LandingFeatures />
      <LandingFooter />
    </div>
  )
}
