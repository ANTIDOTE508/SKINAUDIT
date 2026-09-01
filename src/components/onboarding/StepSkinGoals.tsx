'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { saveSkinGoals } from '@/app/actions/onboarding'

// Free-form multi-select — the option list is a UI concern, so no enum.
// Goals are aspirational: they can go beyond the user's current concerns.
const GOAL_OPTIONS: { value: string; label: string }[] = [
  { value: 'lasting_hydration', label: 'Lasting hydration' },
  { value: 'barrier_strength', label: 'Barrier strength' },
  { value: 'even_balanced_tone', label: 'Even, balanced tone' },
  { value: 'reduced_redness', label: 'Reduced redness' },
  { value: 'anti_aging_longevity', label: 'Anti-aging & longevity' },
  { value: 'clearer_skin_acne_control', label: 'Clearer skin & acne control' },
  { value: 'brighter_radiant_skin', label: 'Brighter, more radiant skin' },
  { value: 'refined_pores_texture', label: 'Refined pores & texture' },
  { value: 'firmer_elastic_skin', label: 'Firmer, more elastic skin' },
]

const MAX_GOALS = 3

const SUB_COPY: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 300,
  fontSize: '0.9375rem',
  lineHeight: 1.6,
  color: 'var(--color-alabaster-400)',
  margin: '0 0 1rem',
}

type Props = {
  value: string[]
  onChange: (v: string[]) => void
  onContinue: () => void
  onBack: () => void
}

export function StepSkinGoals({ value, onChange, onContinue, onBack }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // Briefly flags that the cap was hit, so the limit indicator can pulse.
  const [limitHit, setLimitHit] = useState(false)

  const labelId = useId()
  const limitId = useId()

  const atLimit = value.length >= MAX_GOALS

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
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.05, ease: 'power3.out', delay: 0.15 }
      )
    }, node)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!limitHit) return
    const t = setTimeout(() => setLimitHit(false), 900)
    return () => clearTimeout(t)
  }, [limitHit])

  const toggle = (goalValue: string) => {
    if (value.includes(goalValue)) {
      onChange(value.filter((v) => v !== goalValue))
      return
    }
    if (value.length >= MAX_GOALS) {
      // A 4th pick drops the earliest selection so the newest choice wins,
      // and flags the cap so the indicator pulses.
      onChange([...value.slice(1), goalValue])
      setLimitHit(true)
      return
    }
    onChange([...value, goalValue])
  }

  const handleKeyDown = (e: React.KeyboardEvent, goalValue: string) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      toggle(goalValue)
    }
  }

  const handleContinue = () => {
    if (value.length === 0) {
      setError('Please choose at least one goal.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveSkinGoals(value)
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef}>
      <div style={{ maxWidth: '32rem' }}>
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
          What do you want your routine to work toward?
        </h2>

        <p data-reveal style={SUB_COPY}>
          Select up to 3. These can go beyond your current concerns.
        </p>

        <p
          data-reveal
          id={limitId}
          aria-live="polite"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
            fontSize: '0.8125rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: limitHit
              ? 'var(--color-blush-500)'
              : atLimit
                ? 'var(--color-sienna-400)'
                : 'var(--color-alabaster-400)',
            margin: '0 0 2rem',
            transition: 'color var(--duration-micro) var(--ease-luxury)',
          }}
        >
          {value.length} of {MAX_GOALS} selected
          {limitHit ? ' — earliest pick replaced' : atLimit ? ' — limit reached' : ''}
        </p>

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
          Your skin goals — select up to three
        </span>

        <div
          role="group"
          aria-labelledby={labelId}
          aria-describedby={limitId}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
            marginBottom: '2.25rem',
          }}
        >
          {GOAL_OPTIONS.map((option) => {
            const isSelected = value.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                data-reveal
                onKeyDown={(e) => handleKeyDown(e, option.value)}
                onClick={() => toggle(option.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-card)',
                  cursor: 'pointer',
                  outline: 'none',
                  textAlign: 'left',
                  border: isSelected
                    ? '1.5px solid var(--color-sienna-400)'
                    : '1px solid rgba(184,134,61,0.28)',
                  backgroundColor: isSelected
                    ? 'rgba(184,134,61,0.14)'
                    : 'rgba(6,5,5,0.42)',
                  transition:
                    'border-color var(--duration-micro) var(--ease-luxury), background-color var(--duration-micro) var(--ease-luxury)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: 'flex',
                    flexShrink: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                    borderRadius: '5px',
                    border: isSelected
                      ? '1px solid var(--color-sienna-400)'
                      : '1px solid rgba(184,134,61,0.45)',
                    backgroundColor: isSelected ? 'var(--color-sienna-400)' : 'transparent',
                    transition:
                      'background-color var(--duration-micro) var(--ease-luxury), border-color var(--duration-micro) var(--ease-luxury)',
                  }}
                >
                  {isSelected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="var(--color-obsidian-950)"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 300,
                    fontSize: '0.9375rem',
                    color: isSelected
                      ? 'var(--color-alabaster-50)'
                      : 'var(--color-alabaster-300)',
                    transition: 'color var(--duration-micro) ease',
                  }}
                >
                  {option.label}
                </span>
              </button>
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
              marginBottom: '1rem',
            }}
          >
            {error}
          </p>
        )}

        <StepFooter
          onContinue={handleContinue}
          onBack={onBack}
          isLoading={isPending}
          continueDisabled={value.length === 0}
        />
      </div>
    </div>
  )
}
