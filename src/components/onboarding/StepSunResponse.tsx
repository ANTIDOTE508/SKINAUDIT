'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { RadioPill } from './RadioPill'
import { saveSunResponse } from '@/app/actions/onboarding'
import { SUN_RESPONSE_SCALE_COUNT } from '@/lib/onboarding-rules'

/** 1 = always burns … 6 = never burns. The index IS the stored value, so the
 *  order of this list and the scale can never drift apart. */
const OPTIONS = [
  'Always burns',
  'Burns easily',
  'Sometimes burns',
  'Rarely burns',
  'Almost never burns',
  'Never burns',
].map((label, i) => ({ value: i + 1, label }))

const SUB_COPY: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 300,
  fontSize: '0.9375rem',
  lineHeight: 1.6,
  color: 'var(--color-alabaster-400)',
  margin: '0 0 2.25rem',
}

type Props = {
  value: number | null
  onChange: (v: number) => void
  onContinue: () => void
  onBack: () => void
}

export function StepSunResponse({ value, onChange, onContinue, onBack }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const groupLabelId = useId()

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
      if (!blocks.length) return
      if (reduced) {
        gsap.set(blocks, { y: 0, opacity: 1 })
        return
      }
      gsap.fromTo(
        blocks,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: 'power3.out', delay: 0.15 }
      )
    }, node)
    return () => ctx.revert()
  }, [])

  /** Arrow keys move between rows and select as they go, per the WAI-ARIA
   *  radiogroup pattern. Wraps around at both ends. */
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta =
      e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1
      : 0
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + OPTIONS.length) % OPTIONS.length
    onChange(OPTIONS[next].value)
    const rows = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-radio-pill]')
    rows?.[next]?.focus()
  }

  const handleContinue = () => {
    if (value == null) {
      setError('Please choose the answer closest to your experience.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveSunResponse(value)
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef}>
      {/* Background — portaled to body so GSAP's transform on the wizard's
          content column doesn't trap this fixed layer inside the 680px
          column. Same mechanism as StepSensitivity. The photograph carries
          its dappled sunlight on the RIGHT, so the scrim is a left-to-right
          gradient: near-opaque under the copy, thinning out to nothing over
          the light. A second bottom-up gradient keeps the footer legible. */}
      {mounted &&
        createPortal(
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
              backgroundColor: 'var(--color-obsidian-950)',
            }}
          >
            <Image
              src="/images/onboarding/step3/bg-sun-response.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="step3-sun-image"
            />
            <div className="step3-sun-scrim" />

            <style>{`
              .step3-sun-image {
                object-fit: cover;
                /* Keep the lit right-hand side in frame on narrow viewports */
                object-position: 72% center;
              }
              @media (min-width: 1024px) {
                .step3-sun-image { object-position: center center; }
              }
              .step3-sun-scrim {
                position: absolute;
                inset: 0;
                background:
                  linear-gradient(
                    to bottom,
                    rgba(6,5,5,0.55) 0%,
                    rgba(6,5,5,0.18) 30%,
                    rgba(6,5,5,0.30) 72%,
                    rgba(6,5,5,0.80) 100%
                  ),
                  linear-gradient(
                    to right,
                    rgba(6,5,5,0.92) 0%,
                    rgba(6,5,5,0.88) 34%,
                    rgba(6,5,5,0.60) 58%,
                    rgba(6,5,5,0.20) 80%,
                    rgba(6,5,5,0.05) 100%
                  );
              }
              /* Below the two-column breakpoint the copy sits over the whole
                 frame, so the horizontal falloff would leave text on light.
                 Flatten it to an even veil and let the dapple read through. */
              @media (max-width: 1023px) {
                .step3-sun-scrim {
                  background:
                    linear-gradient(
                      to bottom,
                      rgba(6,5,5,0.88) 0%,
                      rgba(6,5,5,0.80) 45%,
                      rgba(6,5,5,0.86) 100%
                    );
                }
              }
            `}</style>
          </div>,
          document.body
        )}

      {/* One width for the whole step — heading, rows and footer share it, so
          the footer's Back/Next align with the option rows above them. */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '30rem' }}>
        <h2
          data-reveal
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            color: 'var(--color-alabaster-50)',
            margin: '0 0 1rem',
            textShadow: '0 1px 24px rgba(6,5,5,0.7)',
          }}
        >
          When unprotected skin receives strong sun exposure, what usually
          happens?
        </h2>

        <p data-reveal style={SUB_COPY}>
          This helps us calibrate your natural sun response.
        </p>

        <span
          id={groupLabelId}
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
            clipPath: 'inset(50%)',
            whiteSpace: 'nowrap',
          }}
        >
          How unprotected skin reacts to strong sun exposure
        </span>

        <div
          ref={listRef}
          role="radiogroup"
          aria-labelledby={groupLabelId}
          aria-required="true"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
          }}
        >
          {OPTIONS.map((option, index) => {
            const isSelected = value === option.value
            return (
              <div key={option.value} data-reveal>
                <RadioPill
                  value={String(option.value)}
                  title={option.label}
                  ariaLabel={`${option.label} — option ${option.value} of ${SUN_RESPONSE_SCALE_COUNT}`}
                  leftSlot={option.value}
                  selected={isSelected}
                  onChange={() => onChange(option.value)}
                  tabIndex={isSelected || (value == null && index === 0) ? 0 : -1}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              </div>
            )
          })}
        </div>

        {error && (
          <p
            role="alert"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              color: 'var(--color-blush-500)',
              marginTop: '1rem',
              marginBottom: 0,
            }}
          >
            {error}
          </p>
        )}

        <StepFooter
          onContinue={handleContinue}
          onBack={onBack}
          isLoading={isPending}
          continueDisabled={value == null}
        />
      </div>
    </div>
  )
}
