'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { RadioPill } from './RadioPill'
import { saveReactionHistory } from '@/app/actions/onboarding'
import type { InflammatoryHistory, ProductReactionSeverity } from '@prisma/client'

const HISTORY_OPTIONS: { value: InflammatoryHistory; title: string }[] = [
  {
    value: 'DIAGNOSED',
    title: 'Yes — I have been diagnosed or I know I have this',
  },
  {
    value: 'SUSPECTED',
    title:
      'I suspect I might — I have chronic dryness, flakiness, or skin that never feels comfortable',
  },
  { value: 'NO', title: 'No' },
]

const SEVERITY_OPTIONS: { value: ProductReactionSeverity; title: string }[] = [
  { value: 'REPEATED', title: 'Yes — this has happened more than once' },
  { value: 'ONCE_OR_TWICE', title: 'Once or twice' },
  { value: 'NO', title: 'No' },
]

const QUESTION_LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 300,
  fontSize: 'clamp(1.25rem, 2.5vw, 1.6rem)',
  lineHeight: 1.25,
  letterSpacing: '-0.01em',
  color: 'var(--color-alabaster-50)',
  margin: '0 0 1rem',
}

type Props = {
  historyValue: InflammatoryHistory | null
  severityValue: ProductReactionSeverity | null
  onHistoryChange: (v: InflammatoryHistory) => void
  onSeverityChange: (v: ProductReactionSeverity) => void
  onContinue: () => void
  onBack: () => void
}

export function StepReactionHistory({
  historyValue,
  severityValue,
  onHistoryChange,
  onSeverityChange,
  onContinue,
  onBack,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const historyListRef = useRef<HTMLDivElement>(null)
  const severityListRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const historyLabelId = useId()
  const severityLabelId = useId()

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

  /** Arrow keys move between pills within one group and select as they go,
   *  per the WAI-ARIA radiogroup pattern. Wraps around at both ends. */
  const handleHistoryKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta =
      e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1
      : 0
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + HISTORY_OPTIONS.length) % HISTORY_OPTIONS.length
    onHistoryChange(HISTORY_OPTIONS[next].value)
    const pills = historyListRef.current?.querySelectorAll<HTMLButtonElement>('[data-radio-pill]')
    pills?.[next]?.focus()
  }

  const handleSeverityKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta =
      e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1
      : 0
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + SEVERITY_OPTIONS.length) % SEVERITY_OPTIONS.length
    onSeverityChange(SEVERITY_OPTIONS[next].value)
    const pills = severityListRef.current?.querySelectorAll<HTMLButtonElement>('[data-radio-pill]')
    pills?.[next]?.focus()
  }

  const handleContinue = () => {
    if (historyValue == null || severityValue == null) {
      setError('Please answer both questions to continue.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveReactionHistory({
          inflammatoryHistory: historyValue,
          productReactionSeverity: severityValue,
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
        {/* ── Question A ───────────────────────────────────── */}
        <p id={historyLabelId} data-reveal style={QUESTION_LABEL}>
          Do you have a personal or family history of eczema, atopic dermatitis,
          or psoriasis?
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
              <div key={option.value} data-reveal>
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

        {/* ── Question B ───────────────────────────────────── */}
        <p id={severityLabelId} data-reveal style={QUESTION_LABEL}>
          Have you ever had a product reaction that caused visible redness, hives,
          or a rash — not just mild irritation or a new breakout?
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
              <div key={option.value} data-reveal>
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
          continueDisabled={historyValue == null || severityValue == null}
        />
      </div>
    </div>
  )
}
