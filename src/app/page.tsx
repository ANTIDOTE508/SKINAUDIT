'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import LandingNav from '@/components/landing/LandingNav'
import LandingHero from '@/components/landing/LandingHero'
import LandingQuote from '@/components/landing/LandingQuote'
import LandingFeatures from '@/components/landing/LandingFeatures'
import LandingFooter from '@/components/landing/LandingFooter'

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const bodyRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const quoteRef = useRef<HTMLDivElement>(null)
  const taglineRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const nav      = navRef.current
    const headline = headlineRef.current
    const body     = bodyRef.current
    const cta      = ctaRef.current
    const stats    = statsRef.current
    const quote    = quoteRef.current
    const tagline  = taglineRef.current
    const features = featuresRef.current

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo(nav,      { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.8 })
        .fromTo(headline, { opacity: 0, y: 36  }, { opacity: 1, y: 0, duration: 1.1 }, '-=0.3')
        .fromTo(body,     { opacity: 0, y: 20  }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
        .fromTo(cta,      { opacity: 0, y: 14  }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
        .fromTo(stats,    { opacity: 0, y: 20  }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.4')
        .fromTo(quote,    { opacity: 0, y: 16  }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.3')
        .fromTo(tagline,  { opacity: 0 },         { opacity: 1, duration: 0.9 },        '-=0.2')
        .fromTo(features, { opacity: 0, y: 28  }, { opacity: 1, y: 0, duration: 0.9 }, '-=0.5')
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={rootRef}
      className="bg-obsidian-950 text-alabaster-100 min-h-screen"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <LandingNav navRef={navRef} />
      <LandingHero headlineRef={headlineRef} bodyRef={bodyRef} ctaRef={ctaRef} statsRef={statsRef} />
      <LandingQuote quoteRef={quoteRef} />
      <LandingFeatures taglineRef={taglineRef} featuresRef={featuresRef} />
      <LandingFooter />
    </div>
  )
}
