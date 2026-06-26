'use client'

import Link from 'next/link'
import Image from 'next/image'

interface LandingHeroProps {
  headlineRef: React.RefObject<HTMLHeadingElement | null>
  bodyRef: React.RefObject<HTMLParagraphElement | null>
  ctaRef: React.RefObject<HTMLDivElement | null>
}

export default function LandingHero({ headlineRef, bodyRef, ctaRef }: LandingHeroProps) {
  return (
    <div className="relative overflow-hidden shrink-0" style={{ flex: '1 1 0', minHeight: 0 }}>
      {/* Background image */}
      <Image
        src="/images/landing/landing.jpg"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        style={{
          objectFit: 'cover',
          objectPosition: '55% 20%',
          transform: 'scale(1.2)',
          transformOrigin: '55% 25%',
        }}
      />

      {/* Left overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to right, #0a0908 35%, #0a090895 55%, #0a090818 100%)',
        }}
      />

      {/* Bottom overlay */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: '60%',
          background: 'linear-gradient(to top, #0a0908 0%, #0a0908 45%, transparent 100%)',
        }}
      />

      {/* Copy */}
      <div
        className="relative z-10 flex flex-col px-6 md:px-16"
        style={{ maxWidth: '500px', paddingTop: '18vh' }}
      >
        <h1
          ref={headlineRef}
          className="opacity-0 leading-[1.1] text-alabaster-50 mb-5"
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: 'clamp(2rem, 3.2vw, 2.8rem)',
          }}
        >
          Understanding
          <br />
          is the new
          <br />
          skincare.
        </h1>

        <p
          ref={bodyRef}
          className="opacity-0 leading-[1.65] text-alabaster-400 mb-8"
          style={{ fontSize: '12px', maxWidth: '300px' }}
        >
          SkinAudit helps you understand how your skincare regimen works together, so you can make
          more informed choices.
        </p>

        <div ref={ctaRef} className="opacity-0">
          <Link
            href="/signin"
            className="inline-flex items-center gap-3 text-alabaster-100 hover:text-alabaster-50 uppercase transition-all duration-300"
            style={{
              fontSize: '10px',
              letterSpacing: '0.2em',
              padding: '11px 22px',
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
    </div>
  )
}
