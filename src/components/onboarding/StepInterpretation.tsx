'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ShieldCheck } from 'lucide-react'
import { StepFooter } from './StepFooter'
import { acknowledgeInterpretation } from '@/app/actions/onboarding'

const BODY_COPY: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 300,
  fontSize: '0.9375rem',
  lineHeight: 1.7,
  color: 'var(--color-alabaster-300)',
  margin: 0,
}

type Props = {
  onContinue: () => void
  onBack: () => void
}

/**
 * Scope-of-service screen: states what SkinAudit does and, just as
 * explicitly, what it does not do. No user input — continuing only
 * advances the resume marker.
 */
export function StepInterpretation({ onContinue, onBack }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const node = rootRef.current
    if (!node) return
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      const blocks = node.querySelectorAll('[data-reveal]')
      const badge = node.querySelector('[data-badge]')

      if (reduced) {
        if (blocks.length) gsap.set(blocks, { y: 0, opacity: 1 })
        if (badge) gsap.set(badge, { scale: 1, opacity: 1 })
        return
      }

      if (blocks.length) {
        gsap.fromTo(
          blocks,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out', delay: 0.15 }
        )
      }
      if (badge) {
        gsap.fromTo(
          badge,
          { scale: 0.7, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.6)', delay: 0.55 }
        )
      }
    }, node)
    return () => ctx.revert()
  }, [])

  const handleContinue = () => {
    setError(null)
    startTransition(async () => {
      try {
        await acknowledgeInterpretation()
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef}>
      {/* Background scene — portaled to body so GSAP's transform on ancestor
          content doesn't trap this fixed layer inside the wizard's 680px
          column. The ribbon artwork carries its light on the right edge and
          is already near-black on the left, so the scrim mainly deepens the
          left/centre where the copy sits and leaves the ribbon readable. */}
      {mounted &&
        createPortal(
          <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none', backgroundColor: 'var(--color-obsidian-950)' }}>
            <Image
              src="/images/onboarding/step10/bg-interpretation-ribbon.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="step10-bg-image"
            />
            <div className="step10-bg-scrim" />

            <style>{`
              .step10-bg-image {
                object-fit: cover;
                object-position: 70% center;
              }
              @media (min-width: 1024px) {
                .step10-bg-image { object-position: center center; }
              }
              .step10-bg-scrim {
                position: absolute;
                inset: 0;
                background: linear-gradient(
                  90deg,
                  rgba(6,5,5,0.92) 0%,
                  rgba(6,5,5,0.82) 40%,
                  rgba(6,5,5,0.45) 70%,
                  rgba(6,5,5,0.15) 100%
                );
              }
            `}</style>
          </div>,
          document.body
        )}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '34rem' }}>
        <h2
          data-reveal
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
            color: 'var(--color-alabaster-50)',
            margin: '0 0 1.5rem',
            textShadow: '0 1px 24px rgba(6,5,5,0.7)',
          }}
        >
          SkinAudit
          <br />
          interprets. You decide.
        </h2>

        <p data-reveal style={BODY_COPY}>
          SkinAudit evaluates ingredient interactions, regimen structure,
          environmental context, and treatment history.
        </p>

        <hr
          data-reveal
          style={{
            border: 'none',
            borderTop: '1px solid var(--color-border)',
            margin: '1.75rem 0',
          }}
        />

        <p data-reveal style={{ ...BODY_COPY, color: 'var(--color-alabaster-400)' }}>
          It does not diagnose skin conditions or replace professional medical care.
        </p>

        {/* Assurance badge */}
        <div
          data-badge
          aria-hidden="true"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            margin: '2.25rem auto 0',
            borderRadius: '50%',
            border: '1px solid var(--color-accent-border)',
            backgroundColor: 'var(--color-accent-subtle)',
            color: 'var(--color-sienna-400)',
            opacity: 0,
          }}
        >
          <ShieldCheck size={28} strokeWidth={1.5} />
        </div>

        {error && (
          <p
            role="alert"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              color: 'var(--color-blush-500)',
              marginTop: '1.5rem',
            }}
          >
            {error}
          </p>
        )}

        <StepFooter onContinue={handleContinue} onBack={onBack} isLoading={isPending} />
      </div>
    </div>
  )
}
