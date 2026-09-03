'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { RadioPill } from './RadioPill'
import { saveDehydrationCheck } from '@/app/actions/onboarding'
import type { OilyAndTight } from '@prisma/client'

const OPTIONS: { value: OilyAndTight; title: string }[] = [
  { value: 'OFTEN', title: 'Often' },
  { value: 'SOMETIMES', title: 'Sometimes' },
  { value: 'RARELY', title: 'Rarely' },
  { value: 'NEVER', title: 'Never' },
  { value: 'UNSURE', title: "I'm not sure" },
]

type Props = {
  value: OilyAndTight | null
  onChange: (v: OilyAndTight) => void
  onContinue: () => void
  onBack: () => void
}

export function StepDehydrationCheck({ value, onChange, onContinue, onBack }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // createPortal needs a real <body> — only available after mount.
  const [mounted, setMounted] = useState(false)

  const labelId = useId()

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
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta =
      e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1
      : 0
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + OPTIONS.length) % OPTIONS.length
    onChange(OPTIONS[next].value)
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
        await saveDehydrationCheck(value)
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef}>
      {/* Full-bleed background — a macro of water droplets beading on dark
          skin, with warm light catching the meniscus of each droplet. The
          lit droplets cluster in the right-centre, the upper-left falls
          into shadow. Scrim heaviest on the left and bottom (where the
          copy + footer live) and tapers to let the bright droplets
          breathe on the right. Same portal pattern as the other step
          backgrounds — escape the 680px content column's transform. */}
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
              src="/images/onboarding/stepDehydrationCheck/onboarding-dehydration-water.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="step6-dehydration-image"
            />
            <div className="step6-dehydration-scrim" />

            <style>{`
              .step6-dehydration-image {
                object-fit: cover;
                object-position: 60% 55%;
                /* A slow drift across the droplets — like ambient light
                   breathing across the surface. 22s for one full
                   inhale/exhale; the motion itself is below the threshold
                   of conscious perception. */
                animation: step6-dehydration-drift 22s ease-in-out infinite;
              }
              @keyframes step6-dehydration-drift {
                0%, 100% { transform: scale(1.02) translate(-0.3%, 0.2%); }
                50%      { transform: scale(1.03) translate( 0.3%,-0.2%); }
              }
              @media (prefers-reduced-motion: reduce) {
                .step6-dehydration-image { animation: none; }
              }
              @media (min-width: 1024px) {
                .step6-dehydration-image {
                  object-position: 58% 60%;
                }
              }
              .step6-dehydration-scrim {
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
                  /* Left-to-right: heavy under the copy, thinning to
                     almost nothing over the lit droplets on the right. */
                  linear-gradient(
                    to right,
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
                .step6-dehydration-scrim {
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
                 a very thin translucent background that reads on the
                 obsidian ground but would let the lit droplets bleed
                 through here. Lift the opacity + add a slight frosted blur
                 so the label stays sharp against the macro. Scoped via
                 .step6-dehydration-root so it doesn't leak to other steps
                 that use the same pill component. */
              .step6-dehydration-root [data-radio-pill] {
                background-color: rgba(6, 5, 5, 0.66) !important;
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
              }
              .step6-dehydration-root [data-radio-pill][aria-checked="true"] {
                background-color: rgba(184, 134, 61, 0.22) !important;
              }
            `}</style>
          </div>,
          document.body,
        )}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '30rem' }} className="step6-dehydration-root">
        <h2
          data-reveal
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            color: 'var(--color-alabaster-50)',
            margin: '0 0 2.25rem',
            textShadow: '0 1px 24px rgba(6,5,5,0.7)',
          }}
        >
          Does your skin ever feel tight or lacking in comfort even when it looks
          oily or shiny?
        </h2>

        <span
          id={labelId}
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
          Whether your skin feels tight or uncomfortable even when it looks oily
        </span>

        <div
          ref={listRef}
          role="radiogroup"
          aria-labelledby={labelId}
          aria-required="true"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
            marginBottom: '2.25rem',
          }}
        >
          {OPTIONS.map((option, index) => {
            const isSelected = value === option.value
            return (
              <div key={option.value} data-reveal>
                <RadioPill
                  value={option.value}
                  title={option.title}
                  ariaLabel={option.title}
                  selected={isSelected}
                  onChange={(v) => onChange(v as OilyAndTight)}
                  tabIndex={isSelected || (!value && index === 0) ? 0 : -1}
                  onKeyDown={(e) => handleKeyDown(e, index)}
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
