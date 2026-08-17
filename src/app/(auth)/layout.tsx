'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import Image from 'next/image'
import SkinauditLogo from '@/components/ui/SkinauditLogo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const headlineRef = useRef<HTMLDivElement>(null)
  const taglineRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const headline = headlineRef.current
    const tagline = taglineRef.current

    const ctx = gsap.context(() => {
      const words = headline?.querySelectorAll('.headline-word')
      if (words && words.length > 0) {
        gsap.fromTo(
          words,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out', delay: 0.3 }
        )
      }
      if (tagline) {
        gsap.fromTo(
          tagline,
          { opacity: 0 },
          { opacity: 1, duration: 0.8, ease: 'power2.out', delay: 0.9 }
        )
      }
    })

    return () => ctx.revert()
  }, [])

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — full-bleed photo ── */}
      <div className="hidden lg:block lg:w-[55%] relative overflow-hidden">
        <Image
          src="/images/signin/bg-login-shadow-wall.webp"
          alt=""
          aria-hidden
          fill
          priority
          sizes="55vw"
          style={{ objectFit: 'cover', objectPosition: 'center center' }}
        />

        {/* Overlay 1 — radial vignette: darkens corners and edges, preserves centre */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.18) 60%, rgba(0,0,0,0.52) 100%)',
          }}
        />

        {/* Overlay 2 — vertical gradient: lifts top, anchors bottom for text legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.04) 45%, rgba(0,0,0,0.62) 100%)',
          }}
        />

        {/* Overlay 3 — right-edge shadow: panel separation, feathered over last 18% of width */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, transparent 82%, rgba(0,0,0,0.38) 100%)',
          }}
        />

        {/* Bottom-left headline */}
        <div
          ref={headlineRef}
          className="absolute z-10"
          style={{ bottom: '22%', left: '2.5rem' }}
        >
          {['Observe.', 'Understand.', 'Refine.'].map((line) => (
            <p
              key={line}
              className="headline-word opacity-0"
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 300,
                fontSize: 'clamp(2rem, 3.2vw, 3rem)',
                lineHeight: 1.15,
                color: '#f5f4f0',
                margin: 0,
              }}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Bottom-right tagline */}
        <p
          ref={taglineRef}
          className="absolute z-10 opacity-0"
          style={{
            bottom: '2rem',
            right: '2.5rem',
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.75rem',
            lineHeight: 1.6,
            color: 'rgba(245,244,240,0.7)',
            textAlign: 'right',
          }}
        >
          Understanding
          <br />
          is the new skincare.
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div
        className="flex-1 flex flex-col justify-center px-8 md:px-12 lg:px-16 py-12"
        style={{ backgroundColor: 'var(--color-obsidian-950)' }}
      >
        {/* Mobile wordmark */}
        <div className="lg:hidden mb-10">
          <SkinauditLogo />
        </div>

        <div className="w-full max-w-sm mx-auto">{children}</div>
      </div>
    </div>
  )
}
