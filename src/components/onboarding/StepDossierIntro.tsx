'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ArrowRight } from 'lucide-react'
import { acknowledgeDossierIntro } from '@/app/actions/onboarding'

type Props = {
  onContinue: () => void
  onBack: () => void
}

/**
 * Opens the dossier-building portion of onboarding. No user input — the CTA
 * only advances the resume marker and moves to the product picker.
 */
export function StepDossierIntro({ onContinue, onBack }: Props) {
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
      if (reduced) {
        if (blocks.length) gsap.set(blocks, { y: 0, opacity: 1 })
        return
      }
      if (blocks.length) {
        gsap.fromTo(
          blocks,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out', delay: 0.15 }
        )
      }
    }, node)
    return () => ctx.revert()
  }, [])

  const handleContinue = () => {
    setError(null)
    startTransition(async () => {
      try {
        await acknowledgeDossierIntro()
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
          column. The product still-life occupies the lower-right of the
          frame, so the scrim is heaviest at the top-left where the copy
          sits and lifts over the bottles so they stay visible. */}
      {mounted &&
        createPortal(
          <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none', backgroundColor: 'var(--color-obsidian-950)' }}>
            <Image
              src="/images/onboarding/step12/bg-fill-dossier.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="step12-bg-image"
            />
            <div className="step12-bg-scrim" />

            <style>{`
              .step12-bg-image {
                object-fit: cover;
                object-position: center 40%;
              }
              @media (min-width: 1024px) {
                .step12-bg-image { object-position: center 35%; }
              }
              .step12-bg-scrim {
                position: absolute;
                inset: 0;
                background:
                  linear-gradient(
                    180deg,
                    rgba(6,5,5,0.88) 0%,
                    rgba(6,5,5,0.62) 35%,
                    rgba(6,5,5,0.35) 60%,
                    rgba(6,5,5,0.55) 100%
                  ),
                  linear-gradient(
                    90deg,
                    rgba(6,5,5,0.7) 0%,
                    rgba(6,5,5,0.35) 45%,
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
            margin: '0 0 1.25rem',
            textShadow: '0 1px 24px rgba(6,5,5,0.7)',
          }}
        >
          Let&apos;s begin with a few
          <br />
          products you already own.
        </h2>

        <p
          data-reveal
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.9375rem',
            lineHeight: 1.7,
            color: 'var(--color-alabaster-300)',
            margin: 0,
            textShadow: '0 1px 16px rgba(6,5,5,0.8)',
          }}
        >
          SkinAudit evaluates routines using what is already in your cabinet.
        </p>

        {error && (
          <p
            role="alert"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              color: 'var(--color-blush-500)',
              marginTop: '1.5rem',
              marginBottom: 0,
            }}
          >
            {error}
          </p>
        )}

        {/* CTA — sits low in the frame so the still-life stays visible above it */}
        <div data-reveal style={{ marginTop: 'clamp(3rem, 22vh, 12rem)' }}>
          <button
            type="button"
            onClick={handleContinue}
            disabled={isPending}
            className="btn-primary btn-primary-accent"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              width: '100%',
              minHeight: '58px',
              paddingInline: '1.5rem',
            }}
          >
            {/* Spacer mirrors the arrow so the label stays optically centred */}
            <span aria-hidden="true" style={{ width: 20, flexShrink: 0 }} />
            {isPending ? 'Loading…' : 'Fill My Dossier'}
            <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" style={{ flexShrink: 0 }} />
          </button>

          <button
            type="button"
            onClick={onBack}
            disabled={isPending}
            style={{
              display: 'block',
              marginTop: '1rem',
              background: 'none',
              border: 'none',
              padding: '2px 0',
              cursor: isPending ? 'default' : 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              fontWeight: 400,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-alabaster-400)',
              transition: 'color 200ms ease',
            }}
            onMouseEnter={(e) => {
              if (!isPending) {
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-sienna-400)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isPending) {
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-alabaster-400)'
              }
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}
