'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { RadioPill } from './RadioPill'
import { saveProductReactivity } from '@/app/actions/onboarding'
import type {
  ProductReactivity,
  InflammatoryHistory,
  ProductReactionSeverity,
} from '@prisma/client'

const OPTIONS: { value: ProductReactivity; title: string }[] = [
  {
    value: 'FREQUENT_STING',
    title:
      'I often feel stinging, burning, or tingling that lasts more than a few minutes',
  },
  {
    value: 'MILD_TRANSIENT',
    title: 'I sometimes notice a mild reaction, but it passes quickly',
  },
  { value: 'RARE', title: 'My skin rarely reacts to new products' },
  { value: 'ALMOST_NEVER', title: 'My skin almost never reacts' },
]

// The reaction-history follow-up shows for the two "reacts" answers.
const FOLLOWUP_VALUES: ProductReactivity[] = ['FREQUENT_STING', 'MILD_TRANSIENT']

const HISTORY_OPTIONS: { value: InflammatoryHistory; title: string }[] = [
  { value: 'FREQUENTLY', title: 'Frequently' },
  { value: 'OCCASIONALLY', title: 'Occasionally' },
  { value: 'RARELY', title: 'Rarely' },
  { value: 'NEVER', title: 'Never' },
]

const SEVERITY_OPTIONS: { value: ProductReactionSeverity; title: string }[] = [
  { value: 'REPEATED', title: 'Yes — this has happened more than once' },
  { value: 'ONCE_OR_TWICE', title: 'Once or twice' },
  { value: 'NO', title: 'No' },
]

const FOLLOWUP_LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 300,
  fontSize: 'clamp(1.25rem, 2.5vw, 1.6rem)',
  lineHeight: 1.25,
  letterSpacing: '-0.01em',
  color: 'var(--color-alabaster-50)',
  margin: '0 0 1rem',
  textShadow: '0 1px 16px rgba(6,5,5,0.7)',
}

type Props = {
  value: ProductReactivity | null
  historyValue: InflammatoryHistory | null
  severityValue: ProductReactionSeverity | null
  onChange: (v: ProductReactivity) => void
  onHistoryChange: (v: InflammatoryHistory) => void
  onSeverityChange: (v: ProductReactionSeverity) => void
  onContinue: () => void
  onBack: () => void
}

export function StepProductReactivity({
  value,
  historyValue,
  severityValue,
  onChange,
  onHistoryChange,
  onSeverityChange,
  onContinue,
  onBack,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const historyListRef = useRef<HTMLDivElement>(null)
  const severityListRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // createPortal needs a real <body> — only available after mount.
  const [mounted, setMounted] = useState(false)

  const groupLabelId = useId()
  const historyLabelId = useId()
  const severityLabelId = useId()

  useEffect(() => {
    setMounted(true)
  }, [])

  const showFollowUp = value != null && FOLLOWUP_VALUES.includes(value)
  const canContinue =
    value != null && (!showFollowUp || (historyValue != null && severityValue != null))

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

  const handleReactivityChange = (v: ProductReactivity) => {
    onChange(v)
    // Leaving a "reacts" answer makes the follow-up irrelevant — clear it so
    // stale values aren't persisted.
    if (!FOLLOWUP_VALUES.includes(v)) {
      if (historyValue != null) onHistoryChange(null as unknown as InflammatoryHistory)
      if (severityValue != null) onSeverityChange(null as unknown as ProductReactionSeverity)
    }
  }

  /** Arrow-key direction for the WAI-ARIA radiogroup pattern; 0 = ignore. */
  const arrowDelta = (e: React.KeyboardEvent) =>
    e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
    : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1
    : 0

  const handleReactivityKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta = arrowDelta(e)
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + OPTIONS.length) % OPTIONS.length
    handleReactivityChange(OPTIONS[next].value)
    listRef.current?.querySelectorAll<HTMLButtonElement>('[data-radio-pill]')[next]?.focus()
  }

  const handleHistoryKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta = arrowDelta(e)
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + HISTORY_OPTIONS.length) % HISTORY_OPTIONS.length
    onHistoryChange(HISTORY_OPTIONS[next].value)
    historyListRef.current?.querySelectorAll<HTMLButtonElement>('[data-radio-pill]')[next]?.focus()
  }

  const handleSeverityKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta = arrowDelta(e)
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + SEVERITY_OPTIONS.length) % SEVERITY_OPTIONS.length
    onSeverityChange(SEVERITY_OPTIONS[next].value)
    severityListRef.current?.querySelectorAll<HTMLButtonElement>('[data-radio-pill]')[next]?.focus()
  }

  const handleContinue = () => {
    if (value == null) {
      setError('Please choose the answer closest to your experience.')
      return
    }
    if (showFollowUp && (historyValue == null || severityValue == null)) {
      setError('Please answer both follow-up questions to continue.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveProductReactivity({
          productReactivity: value,
          inflammatoryHistory: showFollowUp ? historyValue : null,
          productReactionSeverity: showFollowUp ? severityValue : null,
        })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef} className="step11-reactivity-root">
      {/* The photograph sits behind the copy as a wall-to-wall image, but
          framed loosely so the original portrait composition reads (no
          cover-zoom that amputates the lighting). The image is large
          enough to fill any aspect ratio but anchored so the warm droplets
          stay visible in the upper portion — over the heading. The copy
          column rides on top with a frosted, semi-opaque surface so
          labels stay sharp over the lit highlights. Same portal pattern
          as the other step backgrounds — escape the 680px content column's
          transform. */}
      {mounted &&
        createPortal(
          <div
            aria-hidden="true"
            className="step11-reactivity-stage"
          >
            <div className="step11-reactivity-frame">
              <Image
                src="/images/onboarding/stepProductReactivity/onboarding-product-reactivity-portrait.webp"
                alt=""
                fill
                priority
                sizes="(min-width: 768px) 50vw, 80vw"
                className="step11-reactivity-image"
              />
              {/* Four-edge fade: a feathered vignette that dissolves the
                  hard rectangular border of the frame into the obsidian
                  ground. The image is no longer "a picture in a box" —
                  it bleeds out on every side. */}
              <div className="step11-reactivity-vignette" />
              <div className="step11-reactivity-trace" />
            </div>
            <div className="step11-reactivity-scrim" />

            <style>{`
              .step11-reactivity-stage {
                position: fixed;
                inset: 0;
                z-index: 0;
                overflow: hidden;
                pointer-events: none;
                background-color: var(--color-obsidian-950);
              }
              /* The frame is a fixed 2:3 portrait window, dimensioned
                 to the largest size that fits the viewport without
                 being cropped. Centred on the page. The image fills
                 it with object-fit: cover — no stretch, just a
                 sympathetic crop. */
              .step11-reactivity-frame {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                /* Fixed size that respects the image's native 2:3 ratio and
                   stays consistent across viewports — no shrinking on
                   smaller screens. The 720px height is the largest that
                   fits a typical 16:9 laptop viewport with margin; on
                   taller displays the centered position takes care of
                   the rest. */
                width: 480px;
                height: 720px;
                max-width: 90vw;
                max-height: 90vh;
                aspect-ratio: 2 / 3;
                overflow: hidden;
                box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.6);
              }
              .step11-reactivity-image {
                object-fit: cover;
                object-position: 60% 30%;
                /* A breath so the droplets feel alive — same 22s tempo
                   the other step backgrounds use. */
                animation: step11-reactivity-drift 22s ease-in-out infinite;
                will-change: transform;
              }
              @keyframes step11-reactivity-drift {
                0%, 100% { transform: scale(1.02) translate(-0.3%, 0.2%); }
                50%      { transform: scale(1.03) translate( 0.3%,-0.2%); }
              }
              @media (prefers-reduced-motion: reduce) {
                .step11-reactivity-image { animation: none; }
              }
              /* The four-edge vignette: a soft feathering on every side of
                 the frame that dissolves the hard rectangular border into
                 the obsidian ground. Implemented as a fixed-size radial
                 mask anchored to the centre — the corners fade first, then
                 the edges, leaving the centre of the image pristine. */
              .step11-reactivity-vignette {
                position: absolute;
                inset: 0;
                background:
                  /* Outer feathering — the canvas fades to transparent on
                     all four sides, blending into the obsidian ground. */
                  linear-gradient(
                    to right,
                    rgba(6, 5, 5, 0.95) 0%,
                    rgba(6, 5, 5, 0)    12%,
                    rgba(6, 5, 5, 0)    88%,
                    rgba(6, 5, 5, 0.95) 100%
                  ),
                  linear-gradient(
                    to bottom,
                    rgba(6, 5, 5, 0.95) 0%,
                    rgba(6, 5, 5, 0)    12%,
                    rgba(6, 5, 5, 0)    88%,
                    rgba(6, 5, 5, 0.95) 100%
                  );
                /* Multiply so the dark edges of the vignette sit on top of
                   the image and only darken — they don't add a tint. The
                   transparent centre leaves the photograph untouched. */
                mix-blend-mode: multiply;
                pointer-events: none;
              }
              /* The trace: a hairline vertical column of warm light
                 along the right edge of the frame. */
              .step11-reactivity-trace {
                position: absolute;
                top: 0;
                right: 0;
                width: 1px;
                height: 100%;
                background: linear-gradient(
                  to bottom,
                  rgba(184, 134, 61, 0)   0%,
                  rgba(184, 134, 61, 0.10) 22%,
                  rgba(184, 134, 61, 0.28) 50%,
                  rgba(184, 134, 61, 0.10) 78%,
                  rgba(184, 134, 61, 0)   100%
                );
                opacity: 0.7;
                mix-blend-mode: screen;
              }
              /* The page-wide scrim: gentle enough to feel like ambient
                 shadow, just enough to keep the copy readable when the
                 photograph's lit area drifts behind it. */
              .step11-reactivity-scrim {
                position: absolute;
                inset: 0;
                background:
                  linear-gradient(
                    to bottom,
                    rgba(6,5,5,0.40) 0%,
                    rgba(6,5,5,0.12) 28%,
                    rgba(6,5,5,0.28) 60%,
                    rgba(6,5,5,0.86) 100%
                  );
              }
              /* Tweak the shared RadioPill for this step only. */
              .step11-reactivity-root [data-radio-pill] {
                background-color: rgba(6, 5, 5, 0.66) !important;
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
              }
              .step11-reactivity-root [data-radio-pill][aria-checked="true"] {
                background-color: rgba(184, 134, 61, 0.22) !important;
              }
            `}</style>
          </div>,
          document.body,
        )}

      {/* Centre the copy stack in the wizard's 680px column. The flex
          column with `align-items: stretch` (the default for column
          flex containers) means the heading, every radiogroup, the
          error, and the footer all share the same 30rem width and
          align centred with each other, mirroring the centred image
          behind them. `marginInline: auto` centres the column itself
          inside the wizard's wider content row. The h2 + follow-up
          labels opt in to centred text inline; the pill rows stay
          left-aligned for readability of long option text. */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '30rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          marginInline: 'auto',
        }}
      >
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
            textAlign: 'center',
            textShadow: '0 1px 24px rgba(6,5,5,0.7)',
          }}
        >
          When you apply new skincare products — especially serums, exfoliants, or
          actives — how does your skin usually respond?
        </h2>

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
          How your skin responds to new skincare products
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
                  ariaLabel={option.title}
                  selected={isSelected}
                  onChange={(v) => handleReactivityChange(v as ProductReactivity)}
                  tabIndex={isSelected || (value == null && index === 0) ? 0 : -1}
                  onKeyDown={(e) => handleReactivityKeyDown(e, index)}
                />
              </div>
            )
          })}
        </div>

        {/* ── Inline follow-up: only for the two "reacts" answers ── */}
        {showFollowUp && (
          <>
            <p style={{ ...FOLLOWUP_LABEL, marginTop: '2.5rem', textAlign: 'center' }} id={historyLabelId}>
              Does your skin go through periods of persistent dryness, flaking,
              itching, or discomfort?
            </p>

            <div
              ref={historyListRef}
              role="radiogroup"
              aria-labelledby={historyLabelId}
              aria-required="true"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
                marginBottom: '2.5rem',
              }}
            >
              {HISTORY_OPTIONS.map((option, index) => {
                const isSelected = historyValue === option.value
                return (
                  <div key={option.value}>
                    <RadioPill
                      value={option.value}
                      title={option.title}
                      ariaLabel={option.title}
                      selected={isSelected}
                      onChange={(v) => onHistoryChange(v as InflammatoryHistory)}
                      tabIndex={isSelected || (historyValue == null && index === 0) ? 0 : -1}
                      onKeyDown={(e) => handleHistoryKeyDown(e, index)}
                    />
                  </div>
                )
              })}
            </div>

            <p style={{ ...FOLLOWUP_LABEL, textAlign: 'center' }} id={severityLabelId}>
              Have you ever had a product reaction that caused visible redness,
              hives, or a rash — not just mild irritation or a new breakout?
            </p>

            <div
              ref={severityListRef}
              role="radiogroup"
              aria-labelledby={severityLabelId}
              aria-required="true"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
              }}
            >
              {SEVERITY_OPTIONS.map((option, index) => {
                const isSelected = severityValue === option.value
                return (
                  <div key={option.value}>
                    <RadioPill
                      value={option.value}
                      title={option.title}
                      ariaLabel={option.title}
                      selected={isSelected}
                      onChange={(v) => onSeverityChange(v as ProductReactionSeverity)}
                      tabIndex={isSelected || (severityValue == null && index === 0) ? 0 : -1}
                      onKeyDown={(e) => handleSeverityKeyDown(e, index)}
                    />
                  </div>
                )
              })}
            </div>
          </>
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
