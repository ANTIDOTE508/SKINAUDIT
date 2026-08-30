'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { DurationPill } from './DurationPill'
import { savePihDuration } from '@/app/actions/onboarding'
import type { PIHDuration } from '@prisma/client'

const OPTIONS: { value: PIHDuration; label: string }[] = [
  { value: 'LT_1MO', label: 'Less than 1 month' },
  { value: 'ONE_3MO', label: '1 to 3 months' },
  { value: 'THREE_6MO', label: '3 to 6 months' },
  { value: 'GT_6MO', label: 'More than 6 months' },
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
  value: PIHDuration | null
  onChange: (v: PIHDuration) => void
  onContinue: () => void
  onBack: () => void
}

export function StepPihDuration({ value, onChange, onContinue, onBack }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const groupLabelId = useId()

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

  // Duration is optional — a null answer is valid and stored as-is.
  const handleContinue = () => {
    setError(null)
    startTransition(async () => {
      try {
        await savePihDuration(value)
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '30rem' }}>
        <span
          data-reveal
          aria-hidden="true"
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            marginBottom: '1rem',
            borderRadius: 'var(--radius-badge)',
            border: '1px solid var(--color-sienna-600)',
            fontFamily: 'var(--font-body)',
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.12em',
            color: 'var(--color-sienna-500)',
            textTransform: 'uppercase',
          }}
        >
          Follow-up
        </span>

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
          }}
        >
          How long do these dark marks usually last?
        </h2>

        <p data-reveal style={SUB_COPY}>
          Think about how long the marks typically take to fade.
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
          How long dark marks usually last before they fade
        </span>

        <div
          ref={listRef}
          role="radiogroup"
          aria-labelledby={groupLabelId}
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
                <DurationPill
                  value={option.value}
                  label={option.label}
                  selected={isSelected}
                  onChange={(v) => onChange(v as PIHDuration)}
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
        />
      </div>
    </div>
  )
}
