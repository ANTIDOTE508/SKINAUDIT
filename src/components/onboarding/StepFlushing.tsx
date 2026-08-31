'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { RadioPill } from './RadioPill'
import { saveFlushing } from '@/app/actions/onboarding'
import type { FlushFadeSpeed } from '@prisma/client'

// Free-form multi-select — the option list is a UI concern, so no enum.
// "none" is exclusive: picking it clears the rest and vice versa.
const TRIGGER_OPTIONS: { value: string; label: string }[] = [
  { value: 'heat', label: 'Heat (warm rooms, hot drinks, hot showers)' },
  { value: 'exercise', label: 'Exercise' },
  { value: 'alcohol', label: 'Alcohol' },
  { value: 'spicy_food', label: 'Spicy food' },
  { value: 'cold_wind', label: 'Cold or wind' },
  { value: 'stress_emotion', label: 'Stress or strong emotions' },
  { value: 'stinging_products', label: 'Skincare products that sting or burn' },
  { value: 'none', label: 'None of the above' },
]

const FADE_OPTIONS: { value: FlushFadeSpeed; title: string }[] = [
  { value: 'MINUTES', title: 'Within a few minutes' },
  { value: 'UP_TO_HOUR', title: 'Within 30–60 minutes' },
  { value: 'HOURS_OR_MORE', title: 'It takes hours, or lingers into the next day' },
]

type Props = {
  triggers: string[]
  fadeSpeed: FlushFadeSpeed | null
  onTriggersChange: (v: string[]) => void
  onFadeSpeedChange: (v: FlushFadeSpeed) => void
  onContinue: () => void
  onBack: () => void
}

export function StepFlushing({
  triggers,
  fadeSpeed,
  onTriggersChange,
  onFadeSpeedChange,
  onContinue,
  onBack,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const fadeListRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const triggersLabelId = useId()
  const fadeLabelId = useId()

  // Both questions are required.
  const canContinue = triggers.length > 0 && fadeSpeed != null

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

  const toggleTrigger = (value: string) => {
    if (value === 'none') {
      onTriggersChange(triggers.includes('none') ? [] : ['none'])
      return
    }
    const withoutNone = triggers.filter((t) => t !== 'none')
    if (withoutNone.includes(value)) {
      onTriggersChange(withoutNone.filter((t) => t !== value))
    } else {
      onTriggersChange([...withoutNone, value])
    }
  }

  const handleTriggerKeyDown = (e: React.KeyboardEvent, value: string) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      toggleTrigger(value)
    }
  }

  /** Arrow keys move between pills and select as they go, per the WAI-ARIA
   *  radiogroup pattern. Wraps around at both ends. */
  const handleFadeKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta =
      e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1
      : 0
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + FADE_OPTIONS.length) % FADE_OPTIONS.length
    onFadeSpeedChange(FADE_OPTIONS[next].value)
    const pills = fadeListRef.current?.querySelectorAll<HTMLButtonElement>('[data-radio-pill]')
    pills?.[next]?.focus()
  }

  const handleContinue = () => {
    if (triggers.length === 0) {
      setError('Please choose at least one option (or “None of the above”).')
      return
    }
    if (fadeSpeed == null) {
      setError('Please tell us how quickly the redness fades.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveFlushing({ flushTriggers: triggers, flushFadeSpeed: fadeSpeed })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef}>
      <div style={{ maxWidth: '30rem' }}>
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

        {/* ── Question A: triggers (multi-select) ── */}
        <h2
          id={triggersLabelId}
          data-reveal
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: 'var(--color-alabaster-50)',
            margin: '0 0 1.25rem',
          }}
        >
          Does your face flush or turn red easily in response to any of the
          following?
        </h2>

        <div
          role="group"
          aria-labelledby={triggersLabelId}
          data-reveal
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.625rem',
            marginBottom: '2.5rem',
          }}
        >
          {TRIGGER_OPTIONS.map((option) => {
            const isSelected = triggers.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                onKeyDown={(e) => handleTriggerKeyDown(e, option.value)}
                onClick={() => toggleTrigger(option.value)}
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
                  {option.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Question B: fade speed (single-select) ── */}
        <p
          id={fadeLabelId}
          data-reveal
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: 'clamp(1.25rem, 2.5vw, 1.6rem)',
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
            color: 'var(--color-alabaster-50)',
            margin: '0 0 1rem',
          }}
        >
          When flushing happens, how quickly does the redness usually fade?
        </p>

        <div
          ref={fadeListRef}
          role="radiogroup"
          aria-labelledby={fadeLabelId}
          aria-required="true"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
          }}
        >
          {FADE_OPTIONS.map((option, index) => {
            const isSelected = fadeSpeed === option.value
            return (
              <div key={option.value} data-reveal>
                <RadioPill
                  value={option.value}
                  title={option.title}
                  ariaLabel={option.title}
                  selected={isSelected}
                  onChange={(v) => onFadeSpeedChange(v as FlushFadeSpeed)}
                  tabIndex={isSelected || (fadeSpeed == null && index === 0) ? 0 : -1}
                  onKeyDown={(e) => handleFadeKeyDown(e, index)}
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
          continueDisabled={!canContinue}
        />
      </div>
    </div>
  )
}
