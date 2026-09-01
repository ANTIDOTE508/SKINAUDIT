'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { RadioPill } from './RadioPill'
import { saveRecentChange } from '@/app/actions/onboarding'

// Single-select — the option list is a UI concern, so no enum. `hasChanged`
// records a tri-state answer ("yes" / "a_little" / "no" / "unsure"); the
// server derives the stored boolean from it.
const CHANGE_OPTIONS: { value: string; title: string }[] = [
  { value: 'yes', title: "Yes — there's been a clear shift" },
  { value: 'a_little', title: 'A little — some things feel different' },
  { value: 'no', title: "No — it's been fairly consistent" },
  { value: 'unsure', title: "I'm not sure" },
]

// The follow-up ("What changed?") shows for these answers.
const FOLLOWUP_VALUES = new Set(['yes', 'a_little'])

const DETAIL_OPTIONS: { value: string; label: string }[] = [
  { value: 'breakouts_congestion', label: 'Breakouts or congestion' },
  { value: 'dryness_dehydration', label: 'Dryness or dehydration' },
  { value: 'sensitivity_redness', label: 'Increased sensitivity or redness' },
  { value: 'oiliness', label: 'Oiliness' },
  { value: 'routine_changed', label: 'Something in my routine changed' },
  { value: 'environment_diet_changed', label: 'My environment or diet changed' },
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
  answer: string
  detail: string[]
  onAnswerChange: (v: string) => void
  onDetailChange: (v: string[]) => void
  onContinue: () => void
  onBack: () => void
}

export function StepRecentChange({
  answer,
  detail,
  onAnswerChange,
  onDetailChange,
  onContinue,
  onBack,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const answerLabelId = useId()
  const detailLabelId = useId()

  const showDetail = FOLLOWUP_VALUES.has(answer)
  const canContinue = answer !== '' && (!showDetail || detail.length > 0)

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
    const next = (index + delta + CHANGE_OPTIONS.length) % CHANGE_OPTIONS.length
    handleAnswerChange(CHANGE_OPTIONS[next].value)
    const pills = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-radio-pill]')
    pills?.[next]?.focus()
  }

  const handleAnswerChange = (v: string) => {
    onAnswerChange(v)
    if (!FOLLOWUP_VALUES.has(v) && detail.length > 0) onDetailChange([])
  }

  const toggleDetail = (value: string) => {
    if (detail.includes(value)) {
      onDetailChange(detail.filter((d) => d !== value))
    } else {
      onDetailChange([...detail, value])
    }
  }

  const handleDetailKeyDown = (e: React.KeyboardEvent, value: string) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      toggleDetail(value)
    }
  }

  const handleContinue = () => {
    if (answer === '') {
      setError('Please choose the answer closest to your experience.')
      return
    }
    if (showDetail && detail.length === 0) {
      setError('Please select what changed.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveRecentChange({
          answer,
          recentChangeDetail: showDetail ? detail : [],
        })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef}>
      <div style={{ maxWidth: '30rem' }}>
        <h2 id={answerLabelId} data-reveal style={QUESTION_LABEL}>
          Has the way your skin behaves changed noticeably in the last few
          months?
        </h2>

        <div
          ref={listRef}
          role="radiogroup"
          aria-labelledby={answerLabelId}
          aria-required="true"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
          }}
        >
          {CHANGE_OPTIONS.map((option, index) => {
            const isSelected = answer === option.value
            return (
              <div key={option.value} data-reveal>
                <RadioPill
                  value={option.value}
                  title={option.title}
                  ariaLabel={option.title}
                  selected={isSelected}
                  onChange={(v) => handleAnswerChange(v)}
                  tabIndex={isSelected || (answer === '' && index === 0) ? 0 : -1}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              </div>
            )
          })}
        </div>

        {/* ── Inline follow-up: "Yes" / "A little" ── */}
        {showDetail && (
          <div style={{ marginTop: '2rem' }}>
            <span
              id={detailLabelId}
              className="label-caps"
              style={{ display: 'block', marginBottom: '0.875rem' }}
            >
              What changed? — select all that apply
            </span>

            <div
              role="group"
              aria-labelledby={detailLabelId}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}
            >
              {DETAIL_OPTIONS.map((opt) => {
                const isSelected = detail.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    onKeyDown={(e) => handleDetailKeyDown(e, opt.value)}
                    onClick={() => toggleDetail(opt.value)}
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
