'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

const QUOTES = [
  {
    text: 'Your skin is not a problem to solve — it is a system to understand.',
    author: 'Skincare Intelligence Manifesto',
  },
  {
    text: 'Most routines fail silently. The ingredients are fine. The sequence is not.',
    author: 'Formulation Science',
  },
  {
    text: 'Context changes everything. A retinol that works in winter may inflame in August.',
    author: 'Chronobiology of Skin',
  },
]

const STATS = [
  { value: '2,400+', label: 'ingredient interactions mapped' },
  { value: '87%', label: 'of routines carry a silent conflict' },
  { value: '3.2×', label: 'better results with sequencing awareness' },
]

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headlineRef = useRef<HTMLDivElement>(null)
  const wordmarkRef = useRef<HTMLSpanElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const featuresRef = useRef<HTMLUListElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const quoteRef = useRef<HTMLDivElement>(null)
  const orbRef = useRef<SVGSVGElement>(null)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [quoteVisible, setQuoteVisible] = useState(true)

  // Rotate quotes every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteVisible(false)
      setTimeout(() => {
        setQuoteIndex((i) => (i + 1) % QUOTES.length)
        setQuoteVisible(true)
      }, 500)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Wordmark
      if (wordmarkRef.current) {
        gsap.fromTo(
          wordmarkRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.8, ease: 'power2.out', delay: 0.05 }
        )
      }

      // Decorative line
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleY: 0, opacity: 0 },
          { scaleY: 1, opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.1 }
        )
      }

      // Headline words
      const words = headlineRef.current?.querySelectorAll('.headline-word')
      if (words && words.length > 0) {
        gsap.fromTo(
          words,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
        )
      }

      // Subtitle
      if (subtitleRef.current) {
        gsap.fromTo(
          subtitleRef.current,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', delay: 0.7 }
        )
      }

      // Stats
      if (statsRef.current) {
        const statItems = statsRef.current.querySelectorAll('.stat-item')
        gsap.fromTo(
          statItems,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power2.out', delay: 0.9 }
        )
      }

      // Features
      const featureItems = featuresRef.current?.querySelectorAll('li')
      if (featureItems && featureItems.length > 0) {
        gsap.fromTo(
          featureItems,
          { y: 8, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 1.3 }
        )
      }

      // Ambient orb slow float
      if (orbRef.current) {
        gsap.to(orbRef.current, {
          y: -18,
          duration: 6,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        })
        // Slow rotation on inner arcs
        const arcs = orbRef.current.querySelectorAll('.orb-arc')
        arcs.forEach((arc, i) => {
          gsap.to(arc, {
            rotation: i % 2 === 0 ? 360 : -360,
            transformOrigin: '50% 50%',
            duration: 20 + i * 8,
            ease: 'none',
            repeat: -1,
          })
        })
      }
    })

    return () => ctx.revert()
  }, [])

  const quote = QUOTES[quoteIndex]

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — editorial (60%) ── */}
      <div
        className="hidden lg:flex lg:w-[60%] flex-col justify-between relative overflow-hidden"
        style={{ backgroundColor: 'var(--color-obsidian-950)' }}
      >
        {/* Ambient gradient layer */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage: `
              radial-gradient(circle at 15% 85%, rgba(184,134,61,0.07) 0%, transparent 55%),
              radial-gradient(circle at 85% 15%, rgba(184,134,61,0.05) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(184,134,61,0.02) 0%, transparent 70%)
            `,
          }}
        />

        {/* Abstract molecular SVG — ambient background art */}
        <svg
          ref={orbRef}
          className="absolute pointer-events-none"
          aria-hidden="true"
          style={{ right: '-80px', top: '10%', width: '420px', height: '420px', opacity: 0.18 }}
          viewBox="0 0 420 420"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer arc */}
          <circle className="orb-arc" cx="210" cy="210" r="190" stroke="rgba(184,134,61,0.6)" strokeWidth="0.5" strokeDasharray="8 14" />
          {/* Mid arc */}
          <circle className="orb-arc" cx="210" cy="210" r="145" stroke="rgba(184,134,61,0.5)" strokeWidth="0.8" strokeDasharray="3 10" />
          {/* Inner arc */}
          <circle className="orb-arc" cx="210" cy="210" r="95" stroke="rgba(184,134,61,0.7)" strokeWidth="0.5" strokeDasharray="1 8" />
          {/* Core glow */}
          <circle cx="210" cy="210" r="38" stroke="rgba(184,134,61,0.9)" strokeWidth="0.6" fill="none" />
          <circle cx="210" cy="210" r="8" fill="rgba(184,134,61,0.3)" />
          {/* Molecule nodes */}
          {[
            [210, 20], [400, 210], [210, 400], [20, 210],
            [360, 75], [360, 345], [60, 345], [60, 75],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="3" fill="rgba(184,134,61,0.5)" />
          ))}
          {/* Connection lines */}
          <line x1="210" y1="20" x2="400" y2="210" stroke="rgba(184,134,61,0.2)" strokeWidth="0.5" />
          <line x1="400" y1="210" x2="210" y2="400" stroke="rgba(184,134,61,0.2)" strokeWidth="0.5" />
          <line x1="210" y1="400" x2="20" y2="210" stroke="rgba(184,134,61,0.2)" strokeWidth="0.5" />
          <line x1="20" y1="210" x2="210" y2="20" stroke="rgba(184,134,61,0.2)" strokeWidth="0.5" />
        </svg>

        {/* TOP — Wordmark */}
        <div className="relative z-10 px-12 pt-10">
          <span
            ref={wordmarkRef}
            className="opacity-0"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '13px',
              fontWeight: 300,
              letterSpacing: '0.22em',
              color: 'var(--color-alabaster-400)',
              textTransform: 'uppercase',
            }}
          >
            S K I N A U D I T
          </span>
        </div>

        {/* MIDDLE — Editorial content */}
        <div className="relative z-10 px-12 flex flex-col gap-10">
          {/* Decorative gold line */}
          <div
            ref={lineRef}
            className="opacity-0 origin-top"
            style={{ width: '2px', height: '60px', backgroundColor: 'var(--color-sienna-500)' }}
          />

          {/* Headline */}
          <div ref={headlineRef}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, lineHeight: 1.08, color: 'var(--color-alabaster-50)' }}>
              {['Skincare', 'intelligence.', 'Finally.'].map((word) => (
                <span
                  key={word}
                  className="headline-word opacity-0 block"
                  style={{ fontSize: 'clamp(3.5rem, 5.5vw, 4.5rem)' }}
                >
                  {word}
                </span>
              ))}
            </h1>
          </div>

          {/* Subtitle */}
          <p
            ref={subtitleRef}
            className="opacity-0 max-w-xs"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '16px', lineHeight: 1.65, color: 'var(--color-alabaster-400)' }}
          >
            Understand how your routine actually works —
            <br />
            with what you already own.
          </p>

          {/* Stats row */}
          <div ref={statsRef} className="flex gap-8">
            {STATS.map(({ value, label }) => (
              <div key={label} className="stat-item opacity-0 flex flex-col gap-1">
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(1.6rem, 2.5vw, 2rem)',
                    fontWeight: 300,
                    color: 'var(--color-sienna-400)',
                    lineHeight: 1,
                  }}
                >
                  {value}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '11px',
                    fontWeight: 400,
                    letterSpacing: '0.06em',
                    color: 'var(--color-alabaster-500)',
                    textTransform: 'uppercase',
                    maxWidth: '100px',
                    lineHeight: 1.4,
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Rotating quote */}
          <div
            ref={quoteRef}
            style={{
              borderLeft: '2px solid rgba(184,134,61,0.35)',
              paddingLeft: '20px',
              maxWidth: '380px',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              opacity: quoteVisible ? 1 : 0,
              transform: quoteVisible ? 'translateY(0)' : 'translateY(6px)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 300,
                fontSize: 'clamp(1rem, 1.4vw, 1.15rem)',
                fontStyle: 'italic',
                lineHeight: 1.55,
                color: 'var(--color-alabaster-300)',
                marginBottom: '10px',
              }}
            >
              &ldquo;{quote.text}&rdquo;
            </p>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                fontWeight: 400,
                letterSpacing: '0.1em',
                color: 'var(--color-sienna-500)',
                textTransform: 'uppercase',
              }}
            >
              — {quote.author}
            </span>
          </div>
        </div>

        {/* BOTTOM — Features + social proof */}
        <div className="relative z-10 px-12 pb-10 flex flex-col gap-6">
          {/* Thin divider */}
          <div style={{ height: '1px', backgroundColor: 'rgba(184,134,61,0.12)', width: '100%' }} />

          <ul ref={featuresRef} className="flex flex-col gap-3">
            {[
              'Deterministic ingredient analysis',
              'Contextual intelligence (weather, season)',
              'No products to buy',
            ].map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-3 opacity-0"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: '13px', color: 'var(--color-alabaster-400)' }}
              >
                <span style={{ color: 'var(--color-sienna-500)' }}>✦</span>
                {feature}
              </li>
            ))}
          </ul>

          {/* Social proof strip */}
          <div className="flex items-center gap-6 pt-2">
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                fontWeight: 400,
                letterSpacing: '0.14em',
                color: 'var(--color-alabaster-600)',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              Trusted by
            </span>
            <div style={{ height: '1px', flex: 1, backgroundColor: 'rgba(184,134,61,0.1)' }} />
            {['Estheticians', 'Dermatologists', 'Formulators'].map((label) => (
              <span
                key={label}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px',
                  fontWeight: 400,
                  letterSpacing: '0.1em',
                  color: 'var(--color-alabaster-500)',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form (40%) ── */}
      <div
        className="flex-1 lg:w-[40%] flex flex-col justify-center px-8 md:px-12 lg:px-16 py-12"
        style={{ backgroundColor: 'var(--color-obsidian-900)' }}
      >
        {/* Mobile wordmark */}
        <div className="lg:hidden mb-10">
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '12px',
              fontWeight: 300,
              letterSpacing: '0.22em',
              color: 'var(--color-alabaster-400)',
              textTransform: 'uppercase',
            }}
          >
            S K I N A U D I T
          </span>
        </div>

        <div className="w-full max-w-sm mx-auto">{children}</div>
      </div>
    </div>
  )
}
