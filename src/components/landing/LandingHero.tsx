'use client'

import Link from 'next/link'
import Image from 'next/image'

interface LandingHeroProps {
  headlineRef: React.RefObject<HTMLHeadingElement | null>
  bodyRef: React.RefObject<HTMLParagraphElement | null>
  ctaRef: React.RefObject<HTMLDivElement | null>
  statsRef: React.RefObject<HTMLDivElement | null>
}

const STATS = [
  { value: '2,400+', label: 'ingredient interactions mapped' },
  { value: '87%', label: 'of routines carry a silent conflict' },
  { value: '3.2×', label: 'better results with sequencing awareness' },
] as const

export default function LandingHero({ headlineRef, bodyRef, ctaRef, statsRef }: LandingHeroProps) {
  return (
    <div className="relative">
      <div
        className="flex flex-row items-center gap-4 sm:gap-6 lg:gap-0 pt-8 md:pt-12"
        style={{ minHeight: 'clamp(320px, 62vh, 620px)' }}
      >
        {/* Copy */}
        <div className="flex flex-col shrink-0 pl-6 sm:pl-10 md:pl-16" style={{ width: 'min(58%, 460px)' }}>
          <h1
            ref={headlineRef}
            className="opacity-0 leading-[1.1] text-sienna-300 mb-5"
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 300,
              fontSize: 'clamp(1.7rem, 5vw, 3.4rem)',
            }}
          >
            Skincare
            <br />
            intelligence.
            <br />
            Finally.
          </h1>

          <p
            ref={bodyRef}
            className="opacity-0 leading-[1.65] text-alabaster-400 mb-8"
            style={{ fontSize: '13px', maxWidth: '340px' }}
          >
            SkinAudit helps you understand how your skincare regimen works together, so you can
            make more informed choices.
          </p>

          <div ref={ctaRef} className="opacity-0">
            <Link
              href="/signin"
              className="inline-flex items-center gap-3 text-alabaster-100 hover:text-alabaster-50 uppercase transition-all duration-300"
              style={{
                fontSize: '10px',
                letterSpacing: '0.2em',
                padding: '13px 24px',
                background: 'rgba(30, 27, 24, 0.85)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '4px',
              }}
            >
              START YOUR AUDIT
              <svg width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden>
                <path
                  d="M0 5h11M8 1l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Full-bleed image, right-aligned to viewport edge, no frame — stays right of the copy and glued to the viewport edge at every breakpoint */}
        <div className="relative grow self-stretch">
          <Image
            src="/images/landing/bg-landing-skincare-pile.webp"
            alt="A curated pile of premium skincare products"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            style={{ objectFit: 'cover', objectPosition: '100% 50%' }}
          />

          {/* Edge fades — dissolve the image into the page rather than cropping it */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to right, #0a0908 0%, rgba(10,9,8,0.55) 8%, rgba(10,9,8,0) 26%)',
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, #0a0908 0%, rgba(10,9,8,0) 22%)',
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(10,9,8,0.4) 0%, rgba(10,9,8,0) 18%)',
            }}
          />
        </div>
      </div>

      {/* Stats bar — overlaps the bottom edge of the hero image */}
      <div
        ref={statsRef}
        className="opacity-0 relative z-10 grid grid-cols-3 mx-6 md:mx-16"
        style={{
          marginTop: '-56px',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '6px',
          background: 'rgba(10,9,8,0.88)',
        }}
      >
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className="px-3 md:px-6 py-6 md:py-8 text-center relative"
          >
            {i > 0 && (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 -translate-y-1/2"
                style={{
                  width: '1px',
                  height: '56%',
                  background: 'rgba(255,255,255,0.1)',
                }}
              />
            )}
            <div
              className="text-sienna-300 mb-2"
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 300,
                fontSize: 'clamp(1.4rem, 2.4vw, 2rem)',
              }}
            >
              {stat.value}
            </div>
            <div
              className="text-alabaster-400 leading-snug"
              style={{ fontSize: '10px', letterSpacing: '0.02em' }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
