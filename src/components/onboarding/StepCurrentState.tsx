'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { RadioPill } from './RadioPill'
import { saveCurrentState } from '@/app/actions/onboarding'

// Single-select — the option list is a UI concern, so no enum.
const STATE_OPTIONS: { value: string; title: string }[] = [
  { value: 'yes_typical', title: 'Yes — this is fairly typical for me' },
  { value: 'mostly', title: 'Mostly — with a few recent changes' },
  {
    value: 'no_different',
    title: 'No — my skin has been behaving differently lately',
  },
  { value: 'unsure', title: "I'm not sure" },
]

// The follow-up ("What has been different lately?") shows for these answers.
const FOLLOWUP_VALUES = new Set(['mostly', 'no_different'])

const DIFF_OPTIONS: { value: string; label: string }[] = [
  { value: 'breakouts_congestion', label: 'Breakouts or congestion' },
  { value: 'dryness_tightness', label: 'Dryness or tightness' },
  { value: 'oiliness', label: 'Oiliness' },
  { value: 'redness_irritation', label: 'Redness or irritation' },
  { value: 'dark_marks_uneven_tone', label: 'Dark marks or uneven tone' },
  { value: 'something_else', label: 'Something else' },
]

const QUESTION_LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 300,
  fontSize: 'clamp(2rem, 4vw, 3rem)',
  lineHeight: 1.1,
  letterSpacing: '-0.01em',
  color: 'var(--color-alabaster-50)',
  margin: '0 0 2.25rem',
}

type Props = {
  normal: string
  diffs: string[]
  onNormalChange: (v: string) => void
  onDiffsChange: (v: string[]) => void
  onContinue: () => void
  onBack: () => void
}

export function StepCurrentState({
  normal,
  diffs,
  onNormalChange,
  onDiffsChange,
  onContinue,
  onBack,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // createPortal needs a real <body> — only available after mount.
  const [mounted, setMounted] = useState(false)

  const stateLabelId = useId()
  const diffsLabelId = useId()

  useEffect(() => {
    setMounted(true)
  }, [])

  const showDiffs = FOLLOWUP_VALUES.has(normal)
  const canContinue = normal !== '' && (!showDiffs || diffs.length > 0)

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
    const next = (index + delta + STATE_OPTIONS.length) % STATE_OPTIONS.length
    handleNormalChange(STATE_OPTIONS[next].value)
    const pills = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-radio-pill]')
    pills?.[next]?.focus()
  }

  const handleNormalChange = (v: string) => {
    onNormalChange(v)
    // Leaving a follow-up answer makes the diff list irrelevant — clear it so
    // a stale selection isn't persisted.
    if (!FOLLOWUP_VALUES.has(v) && diffs.length > 0) onDiffsChange([])
  }

  const toggleDiff = (value: string) => {
    if (diffs.includes(value)) {
      onDiffsChange(diffs.filter((d) => d !== value))
    } else {
      onDiffsChange([...diffs, value])
    }
  }

  const handleDiffKeyDown = (e: React.KeyboardEvent, value: string) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      toggleDiff(value)
    }
  }

  const handleContinue = () => {
    if (normal === '') {
      setError('Please choose the answer closest to your experience.')
      return
    }
    if (showDiffs && diffs.length === 0) {
      setError('Please select what has been different lately.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveCurrentState({
          currentStateNormal: normal,
          currentStateDiffs: showDiffs ? diffs : [],
        })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef}>
      {/* Full-bleed background — same portal pattern as the other step
          backgrounds, so the image escapes the 680px content column's
          transform. The image's lit area sits on the right; scrim is
          heaviest on the left under the copy and tapers to let the warm
          highlights breathe on the right. */}
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
              src="/images/onboarding/stepCurrentState/onboarding-current-state-pattern.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="step17-current-state-image"
            />
            <div className="step17-current-state-scrim" />

            <style>{`
              .step17-current-state-image {
                object-fit: cover;
                object-position: 70% 40%;
                /* A barely-there breathing on the pattern — keeps the
                   photograph from feeling pinned. 22s for one full
                   inhale/exhale; the motion itself is below the
                   threshold of conscious perception. */
                animation: step17-current-state-drift 22s ease-in-out infinite;
              }
              @keyframes step17-current-state-drift {
                0%, 100% { transform: scale(1.015) translate(-0.3%, 0.2%); }
                50%      { transform: scale(1.025) translate( 0.3%,-0.2%); }
              }
              @media (prefers-reduced-motion: reduce) {
                .step17-current-state-image { animation: none; }
              }
              @media (min-width: 1024px) {
                .step17-current-state-image {
                  object-position: 60% 45%;
                }
              }
              .step17-current-state-scrim {
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
                     almost nothing over the lit highlights on the right. */
                  linear-gradient(
                    to right,
                    rgba(6,5,5,0.94) 0%,
                    rgba(6,5,5,0.82) 30%,
                    rgba(6,5,5,0.48) 54%,
                    rgba(6,5,5,0.18) 78%,
                    rgba(6,5,5,0.08) 100%
                  );
              }
              /* Below the two-column breakpoint the copy sits over the
                 whole frame, so the horizontal falloff would leave text
                 on light. Flatten to an even veil and let the warm tone
                 read through. */
              @media (max-width: 1023px) {
                .step17-current-state-scrim {
                  background:
                    linear-gradient(
                      to bottom,
                      rgba(6,5,5,0.86) 0%,
                      rgba(6,5,5,0.72) 45%,
                      rgba(6,5,5,0.90) 100%
                    );
                }
              }
              /* Tweak the shared RadioPill for this step only. The pill
                 has a very thin translucent background that reads on
                 the obsidian ground but would let the warm highlights
                 bleed through here. Lift the opacity + add a slight
                 frosted blur so the label stays sharp. Scoped via
                 .step17-current-state-root so it doesn't leak to
                 other steps that use the same pill component. */
              .step17-current-state-root [data-radio-pill] {
                background-color: rgba(6, 5, 5, 0.66) !important;
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
              }
              .step17-current-state-root [data-radio-pill][aria-checked="true"] {
                background-color: rgba(184, 134, 61, 0.22) !important;
              }
            `}</style>
          </div>,
          document.body,
        )}

      <div
        style={{ position: 'relative', zIndex: 1, maxWidth: '30rem' }}
        className="step17-current-state-root"
      >
        <h2
          id={stateLabelId}
          data-reveal
          style={{ ...QUESTION_LABEL, textShadow: '0 1px 24px rgba(6,5,5,0.7)' }}
        >
          Does your skin feel like its usual self right now?
        </h2>

        <div
          ref={listRef}
          role="radiogroup"
          aria-labelledby={stateLabelId}
          aria-required="true"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
          }}
        >
          {STATE_OPTIONS.map((option, index) => {
            const isSelected = normal === option.value
            return (
              <div key={option.value} data-reveal>
                <RadioPill
                  value={option.value}
                  title={option.title}
                  ariaLabel={option.title}
                  selected={isSelected}
                  onChange={(v) => handleNormalChange(v)}
                  tabIndex={isSelected || (normal === '' && index === 0) ? 0 : -1}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              </div>
            )
          })}
        </div>

        {/* ── Inline follow-up: "Mostly" / "No" ── */}
        {showDiffs && (
          <div style={{ marginTop: '2rem' }}>
            <span
              id={diffsLabelId}
              className="label-caps"
              style={{ display: 'block', marginBottom: '0.875rem' }}
            >
              What has been different lately? — select all that apply
            </span>

            <div
              role="group"
              aria-labelledby={diffsLabelId}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}
            >
              {DIFF_OPTIONS.map((opt) => {
                const isSelected = diffs.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    onKeyDown={(e) => handleDiffKeyDown(e, opt.value)}
                    onClick={() => toggleDiff(opt.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '8px',
                      border: isSelected
                        ? '1.5px solid var(--color-sienna-500)'
                        : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'transparent',
                      cursor: 'pointer',
                      outline: 'none',
                      textAlign: 'left',
                      transition: 'all var(--duration-micro) var(--ease-luxury)',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'flex',
                        flexShrink: 0,
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: isSelected
                          ? '1px solid var(--color-sienna-400)'
                          : '1px solid rgba(184,134,61,0.45)',
                        backgroundColor: isSelected ? 'var(--color-sienna-400)' : 'transparent',
                        transition:
                          'background-color var(--duration-micro) var(--ease-luxury), border-color var(--duration-micro) var(--ease-luxury)',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 300,
                        fontSize: '0.8125rem',
                        lineHeight: 1.3,
                        color: isSelected ? 'var(--color-alabaster-50)' : 'var(--color-alabaster-300)',
                        transition: 'color var(--duration-micro) ease',
                      }}
                    >
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

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
          continueDisabled={!canContinue}
        />
      </div>
    </div>
  )
}
