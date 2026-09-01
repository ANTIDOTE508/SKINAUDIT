'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
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

  const groupLabelId = useId()
  const historyLabelId = useId()
  const severityLabelId = useId()

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
    <div ref={rootRef}>
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
            margin: '0 0 2.25rem',
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
            <p style={{ ...FOLLOWUP_LABEL, marginTop: '2.5rem' }} id={historyLabelId}>
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

            <p style={FOLLOWUP_LABEL} id={severityLabelId}>
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
