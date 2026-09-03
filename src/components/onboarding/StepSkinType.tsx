'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { RadioPill } from './RadioPill'
import { saveSkinProfile } from '@/app/actions/onboarding'
import type { SkinType } from '@prisma/client'

/**
 * Skin type is inferred from a concrete behavioural scenario (how skin feels
 * 4–6h after cleansing, no products applied) rather than asking the user to
 * self-classify. Each answer maps to exactly one SkinType.
 */
const SKIN_TYPES: { value: SkinType; title: string }[] = [
  { value: 'OILY', title: 'Oily all over — shiny, greasy, pores visible' },
  {
    value: 'COMBINATION',
    title:
      'Oily in my T-zone (forehead, nose, chin), normal or drier on cheeks',
  },
  {
    value: 'BALANCED',
    title: 'Normal — comfortable, not noticeably oily or dry',
  },
  { value: 'DRY', title: 'Dry and tight — pulled feeling, possibly flaky' },
  {
    value: 'DEHYDRATED',
    title:
      'Tight but oily by midday — uncomfortable and shiny at the same time',
  },
]

const SUB_COPY: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 300,
  fontSize: '0.9375rem',
  lineHeight: 1.6,
  color: 'var(--color-alabaster-400)',
  margin: '0 0 2.25rem',
}

type Props = {
  value: string
  onChange: (v: string) => void
  onContinue: () => void
  onBack: () => void
}

export function StepSkinType({ value, onChange, onContinue, onBack }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // createPortal needs a real <body> — only available after mount.
  const [mounted, setMounted] = useState(false)

  const skinTypeLabelId = useId()

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

  /** Arrow keys move between pills and select as they go, per the WAI-ARIA
   *  radiogroup pattern. Wraps around at both ends. */
  const handleSkinTypeKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta =
      e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1
      : 0
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + SKIN_TYPES.length) % SKIN_TYPES.length
    onChange(SKIN_TYPES[next].value)
    const pills = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-radio-pill]')
    pills?.[next]?.focus()
  }

  const handleContinue = () => {
    if (!value) {
      setError('Please choose the answer closest to your experience.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveSkinProfile({ skinType: value as SkinType })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef}>
      {/* Full-bleed background — a slow-pouring bronze fluid macro. The
          warm highlights run on a diagonal from upper-left to lower-right,
          so the scrim is heaviest on the right under the copy and tapers
          toward the lit flow on the left. Same portal pattern as the other
          step backgrounds — escape the 680px content column's transform. */}
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
              src="/images/onboarding/stepRecoveryTime/onboarding-recovery-fluid.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="step5-skin-type-image"
            />
            <div className="step5-skin-type-scrim" />

            <style>{`
              .step5-skin-type-image {
                object-fit: cover;
                object-position: 32% 50%;
                /* A barely-there breathing on the fluid highlights — keeps
                   the photograph from feeling pinned. 22s for one full
                   inhale/exhale; the motion itself is below the threshold
                   of conscious perception. */
                animation: step5-skin-type-drift 22s ease-in-out infinite;
              }
              @keyframes step5-skin-type-drift {
                0%, 100% { transform: scale(1.015) translate(-0.3%, 0.2%); }
                50%      { transform: scale(1.025) translate( 0.3%,-0.2%); }
              }
              @media (prefers-reduced-motion: reduce) {
                .step5-skin-type-image { animation: none; }
              }
              @media (min-width: 1024px) {
                .step5-skin-type-image {
                  object-position: 30% 50%;
                }
              }
              .step5-skin-type-scrim {
                position: absolute;
                inset: 0;
                background:
                  /* Bottom-up: darken the footer area so Back/Next stay
                     legible over the warm lower half of the image. */
                  linear-gradient(
                    to bottom,
                    rgba(6,5,5,0.46) 0%,
                    rgba(6,5,5,0.12) 30%,
                    rgba(6,5,5,0.32) 66%,
                    rgba(6,5,5,0.86) 100%
                  ),
                  /* Right-to-left: heavy under the copy, thinning toward
                     the lit bronze flow on the left. */
                  linear-gradient(
                    to left,
                    rgba(6,5,5,0.94) 0%,
                    rgba(6,5,5,0.82) 30%,
                    rgba(6,5,5,0.48) 54%,
                    rgba(6,5,5,0.18) 78%,
                    rgba(6,5,5,0.08) 100%
                  );
              }
              /* Below the two-column breakpoint the copy sits over the whole
                 frame, so the horizontal falloff would leave text on light.
                 Flatten to an even veil and let the warm tone read through. */
              @media (max-width: 1023px) {
                .step5-skin-type-scrim {
                  background:
                    linear-gradient(
                      to bottom,
                      rgba(6,5,5,0.86) 0%,
                      rgba(6,5,5,0.72) 45%,
                      rgba(6,5,5,0.90) 100%
                    );
                }
              }
              /* Tweak the shared RadioPill for this step only. The pill has
                 a thin translucent background that reads on the obsidian
                 ground but would let the bronze highlights bleed through
                 here. Lift the opacity + add a slight frosted blur so the
                 label stays sharp against the fluid macro. Scoped via
                 .step5-skin-type-root so it doesn't leak to other steps
                 that use the same pill component. */
              .step5-skin-type-root [data-radio-pill] {
                background-color: rgba(6, 5, 5, 0.66) !important;
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
              }
              .step5-skin-type-root [data-radio-pill][aria-checked="true"] {
                background-color: rgba(184, 134, 61, 0.22) !important;
              }
            `}</style>
          </div>,
          document.body,
        )}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '30rem' }} className="step5-skin-type-root">
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
          Think about a morning when you cleansed your face and then went about
          your day without applying any products.
        </h2>

        <p
          data-reveal
          style={{ ...SUB_COPY, textShadow: '0 1px 12px rgba(6,5,5,0.7)' }}
        >
          How would your skin typically feel or look about 4–6 hours later?
        </p>

        <span
          id={skinTypeLabelId}
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
          How your skin feels 4–6 hours after cleansing, with no products applied
        </span>

        <div
          ref={listRef}
          role="radiogroup"
          aria-labelledby={skinTypeLabelId}
          aria-required="true"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
            marginBottom: '2.25rem',
          }}
        >
          {SKIN_TYPES.map((type, index) => {
            const isSelected = value === type.value
            return (
              <div key={type.value} data-reveal>
                <RadioPill
                  value={type.value}
                  title={type.title}
                  ariaLabel={type.title}
                  selected={isSelected}
                  onChange={(v) => onChange(v)}
                  tabIndex={isSelected || (!value && index === 0) ? 0 : -1}
                  onKeyDown={(e) => handleSkinTypeKeyDown(e, index)}
                />
              </div>
            )
          })}
        </div>

        {error && (
          <p
            role="alert"
            style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-blush-500)', marginBottom: '1rem' }}
          >
            {error}
          </p>
        )}

        <StepFooter onContinue={handleContinue} onBack={onBack} isLoading={isPending} continueDisabled={!value} />
      </div>
    </div>
  )
}
