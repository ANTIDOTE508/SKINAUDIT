'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import type { WizardUser } from './OnboardingWizard'

type Props = {
  user: WizardUser
  onContinue: () => void
}

export function StepWelcome({ user, onContinue }: Props) {
  const nameRef = useRef<HTMLSpanElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // Keep ref in sync so the timer callback always calls the latest onContinue
  // without restarting the timer on identity changes
  const onContinueRef = useRef(onContinue)
  useLayoutEffect(() => { onContinueRef.current = onContinue }, [onContinue])

  // Auto-advance after 3.2s — fires exactly once on mount
  useEffect(() => {
    const timer = setTimeout(() => onContinueRef.current(), 3200)
    return () => clearTimeout(timer)
  }, [])

  // Entrance choreography
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      // Gold line draw
      tl.fromTo(
        lineRef.current,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.7, ease: 'power3.out' }
      )

      // Headline
      tl.fromTo(
        headlineRef.current,
        { y: 32, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' },
        '-=0.3'
      )

      // Name reveal
      tl.fromTo(
        nameRef.current,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' },
        '-=0.4'
      )

      // Subtitle
      tl.fromTo(
        subtitleRef.current,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.3'
      )

      // Button
      tl.fromTo(
        btnRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power1.out' },
        '-=0.1'
      )
    })
    return () => ctx.revert()
  }, [])

  const displayName = user.name ?? user.email.split('@')[0]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        alignItems: 'flex-start',
      }}
    >
      {/* Gold horizontal line */}
      <div
        ref={lineRef}
        style={{
          width: '56px',
          height: '2px',
          backgroundColor: 'var(--color-sienna-500)',
        }}
      />

      {/* Headline */}
      <div>
        <h1
          ref={headlineRef}
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: 'clamp(3rem, 6vw, 5rem)',
            lineHeight: 1.05,
            color: 'var(--color-alabaster-50)',
            letterSpacing: '-0.01em',
            margin: 0,
          }}
        >
          Welcome to
          <br />
          SkinAudit.
        </h1>
      </div>

      {/* Name personalization */}
      <span
        ref={nameRef}
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '0.9375rem',
          color: 'var(--color-sienna-400)',
          letterSpacing: '0.06em',
        }}
      >
        Signed in as&nbsp;
        <span style={{ color: 'var(--color-alabaster-300)', fontStyle: 'italic' }}>
          {displayName}
        </span>
      </span>

      {/* Subtitle */}
      <p
        ref={subtitleRef}
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
          lineHeight: 1.65,
          color: 'var(--color-alabaster-400)',
          maxWidth: '480px',
          margin: 0,
        }}
      >
        We'll take a few minutes to understand your skin —
        so every insight we surface is genuinely yours.
      </p>

      {/* CTA — skip auto-advance */}
      <button
        ref={btnRef}
        onClick={onContinue}
        className="btn-primary"
        style={{
          marginTop: '1rem',
          opacity: 0,
          minHeight: '52px',
          paddingLeft: '2.5rem',
          paddingRight: '2.5rem',
        }}
      >
        Begin →
      </button>

      {/* Ambient progress hint */}
      <div
        style={{
          marginTop: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            height: '1px',
            width: '120px',
            backgroundColor: 'var(--color-obsidian-700)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'var(--color-sienna-500)',
              animation: 'progress-fill 3.2s linear forwards',
            }}
          />
        </div>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          6 short steps
        </span>
      </div>

      <style>{`
        @keyframes progress-fill {
          from { transform: scaleX(0); transform-origin: left; }
          to   { transform: scaleX(1); transform-origin: left; }
        }
      `}</style>
    </div>
  )
}
