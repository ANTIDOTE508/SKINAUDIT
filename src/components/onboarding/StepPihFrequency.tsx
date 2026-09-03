'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { RadioPill } from './RadioPill'
import { DurationPill } from './DurationPill'
import { savePihFrequency } from '@/app/actions/onboarding'
import type { PIHFrequency, PIHDuration } from '@prisma/client'

const OPTIONS: { value: PIHFrequency; title: string; subtitle: string }[] = [
  { value: 'OFTEN', title: 'Yes', subtitle: 'Almost always' },
  {
    value: 'SOMETIMES',
    title: 'Sometimes',
    subtitle: 'It depends on where it is or how bad it was',
  },
  {
    value: 'RARELY',
    title: 'Rarely',
    subtitle: "Marks usually fade quickly or don't appear",
  },
  { value: 'NEVER', title: 'Never', subtitle: "I don't notice this" },
]

// The duration follow-up shows only when marks appear often or sometimes.
const FOLLOWUP_VALUES: PIHFrequency[] = ['OFTEN', 'SOMETIMES']

const DURATION_OPTIONS: { value: PIHDuration; label: string }[] = [
  { value: 'LT_1MO', label: 'A few weeks' },
  { value: 'ONE_3MO', label: 'A month or two' },
  { value: 'THREE_6MO', label: 'Several months' },
  { value: 'GT_6MO', label: "They stay for a long time, or don't fully fade" },
]

const SUB_COPY: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 300,
  fontSize: '0.9375rem',
  lineHeight: 1.6,
  color: 'var(--color-alabaster-400)',
  margin: '0 0 0.75rem',
}

type Props = {
  value: PIHFrequency | null
  duration: PIHDuration | null
  onChange: (v: PIHFrequency) => void
  onDurationChange: (v: PIHDuration) => void
  onContinue: () => void
  onBack: () => void
}

export function StepPihFrequency({
  value,
  duration,
  onChange,
  onDurationChange,
  onContinue,
  onBack,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const durationListRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // createPortal needs a real <body> — only available after mount.
  const [mounted, setMounted] = useState(false)

  const groupLabelId = useId()
  const durationLabelId = useId()

  useEffect(() => {
    setMounted(true)
  }, [])

  const showDuration = value != null && FOLLOWUP_VALUES.includes(value)
  // When the duration follow-up is shown, it must be answered before Continue.
  const canContinue = value != null && (!showDuration || duration != null)

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

  const handleFrequencyChange = (v: PIHFrequency) => {
    onChange(v)
    // Leaving an "often" / "sometimes" answer makes the duration irrelevant —
    // clear it so a stale value isn't persisted.
    if (!FOLLOWUP_VALUES.includes(v) && duration != null) {
      onDurationChange(null as unknown as PIHDuration)
    }
  }

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
    handleFrequencyChange(OPTIONS[next].value)
    const pills = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-radio-pill]')
    pills?.[next]?.focus()
  }

  const handleDurationKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta =
      e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1
      : 0
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + DURATION_OPTIONS.length) % DURATION_OPTIONS.length
    onDurationChange(DURATION_OPTIONS[next].value)
    const pills = durationListRef.current?.querySelectorAll<HTMLButtonElement>('[data-radio-pill]')
    pills?.[next]?.focus()
  }

  const handleContinue = () => {
    if (value == null) {
      setError('Please choose the answer closest to your experience.')
      return
    }
    if (showDuration && duration == null) {
      setError('Please choose how long those marks take to fade.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await savePihFrequency({
          pihFrequency: value,
          pihDuration: showDuration ? duration : null,
        })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef} className="step9-pih-root">
      {/* Full-bleed background — a macro of skin lit along its curvature,
          evoking the trace a healing wound leaves behind. The warm light sits
          on a diagonal running from upper-right to lower-centre, so the scrim
          is heaviest on the left and bottom (where the copy + footer live)
          and tapers to let the highlight breathe in the upper-right.
          Same portal pattern as StepSkinGoals / StepSunResponse — escape the
          680px content column's transform. */}
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
              src="/images/onboarding/stepPostHealingSkin/onboarding-post-healing-skin.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="step9-pih-image"
            />
            <div className="step9-pih-scrim" />

            <style>{`
              .step9-pih-image {
                object-fit: cover;
                object-position: 70% 30%;
                /* A very slow pan along the diagonal — like light creeping
                   across skin. The motion is barely perceivable (24s) but
                   it stops the photograph from feeling pinned. */
                animation: step9-pih-drift 24s ease-in-out infinite;
              }
              @keyframes step9-pih-drift {
                0%, 100% { transform: scale(1.02) translate(-0.3%, 0.3%); }
                50%      { transform: scale(1.03) translate( 0.3%,-0.3%); }
              }
              @media (prefers-reduced-motion: reduce) {
                .step9-pih-image { animation: none; }
              }
              @media (min-width: 1024px) {
                .step9-pih-image {
                  object-position: 62% 38%;
                }
              }
              .step9-pih-scrim {
                position: absolute;
                inset: 0;
                background:
                  /* Bottom-up: darken the footer area so the Back/Next stay
                     legible over the warm lower half of the image. */
                  linear-gradient(
                    to bottom,
                    rgba(6,5,5,0.46) 0%,
                    rgba(6,5,5,0.12) 30%,
                    rgba(6,5,5,0.32) 66%,
                    rgba(6,5,5,0.86) 100%
                  ),
                  /* Left-to-right: heavy under the copy, thinning to almost
                     nothing over the lit upper-right corner. */
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
                .step9-pih-scrim {
                  background:
                    linear-gradient(
                      to bottom,
                      rgba(6,5,5,0.86) 0%,
                      rgba(6,5,5,0.72) 45%,
                      rgba(6,5,5,0.90) 100%
                    );
                }
              }
              /* Tweak the shared RadioPill / DurationPill for this step only.
                 They have a very thin translucent background that reads on
                 the obsidian ground but would let the warm caustics bleed
                 through here. Lift the opacity + add a slight frosted blur
                 so the label stays sharp against the skin macro. The
                 .step9-pih-root scope keeps this from leaking to other
                 steps that use the same pill component. */
              .step9-pih-root [data-radio-pill] {
                background-color: rgba(6, 5, 5, 0.66) !important;
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
              }
              .step9-pih-root [data-radio-pill][aria-checked="true"] {
                background-color: rgba(184, 134, 61, 0.22) !important;
              }
            `}</style>
          </div>,
          document.body,
        )}

      {/* One width for the whole step — heading, pills, follow-up, and
          footer share it, so Back/Next align with the options above. */}
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
          When your skin heals from something — a pimple, a cut, an insect bite,
          or friction — does the area typically leave a dark mark behind?
        </h2>

        <p
          data-reveal
          style={{ ...SUB_COPY, textShadow: '0 1px 12px rgba(6,5,5,0.7)' }}
        >
          This includes: dark spots after a breakout clears, a shadow where a
          scratch was, darkening after waxing or threading, or a patch that stays
          discoloured after any kind of irritation.
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
          How often you get dark marks after your skin heals
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
                  value={option.value}
                  title={option.title}
                  subtitle={option.subtitle}
                  ariaLabel={`${option.title} — ${option.subtitle}`}
                  selected={isSelected}
                  onChange={(v) => handleFrequencyChange(v as PIHFrequency)}
                  tabIndex={isSelected || (value == null && index === 0) ? 0 : -1}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              </div>
            )
          })}
        </div>

        {/* ── Inline follow-up: only for "often" / "sometimes" ── */}
        {showDuration && (
          <div style={{ marginTop: '2rem' }}>
            <span
              id={durationLabelId}
              className="label-caps"
              style={{ display: 'block', marginBottom: '0.875rem' }}
            >
              When those marks appear, how long do they typically take to fade?
            </span>

            <div
              ref={durationListRef}
              role="radiogroup"
              aria-labelledby={durationLabelId}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
              }}
            >
              {DURATION_OPTIONS.map((option, index) => {
                const isSelected = duration === option.value
                return (
                  <div key={option.value}>
                    <DurationPill
                      value={option.value}
                      label={option.label}
                      selected={isSelected}
                      onChange={(v) => onDurationChange(v as PIHDuration)}
                      tabIndex={isSelected || (duration == null && index === 0) ? 0 : -1}
                      onKeyDown={(e) => handleDurationKeyDown(e, index)}
                    />
                  </div>
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
