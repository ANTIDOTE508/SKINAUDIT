'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { gsap } from 'gsap'
import { StepHeader } from './StepHeader'
import { StepNav } from './StepNav'
import { saveGoals } from '@/app/actions/onboarding'

const MAX_GOALS = 3

const GOALS = [
  { value: 'hydration', label: 'Hydration' },
  { value: 'barrier_support', label: 'Barrier support' },
  { value: 'even_tone', label: 'Even tone' },
  { value: 'anti_redness', label: 'Anti-redness' },
  { value: 'anti_aging', label: 'Anti-aging / longevity' },
  { value: 'acne_control', label: 'Acne control' },
  { value: 'brightening', label: 'Brightening' },
  { value: 'pore_refinement', label: 'Pore refinement' },
  { value: 'firmness', label: 'Firmness / elasticity' },
]

type Props = {
  value: string[]
  onChange: (v: string[]) => void
  onContinue: () => void
  onBack: () => void
}

export function StepSkinGoals({ value, onChange, onContinue, onBack }: Props) {
  const listRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const items = listRef.current?.querySelectorAll('[data-item]')
    const ctx = gsap.context(() => {
      if (items?.length) {
        gsap.fromTo(
          items,
          { x: -12, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.2 }
        )
      }
    })
    return () => ctx.revert()
  }, [])

  const toggle = (goal: string) => {
    if (value.includes(goal)) {
      onChange(value.filter((g) => g !== goal))
    } else if (value.length < MAX_GOALS) {
      onChange([...value, goal])
    }
  }

  const isAtMax = value.length >= MAX_GOALS

  const handleContinue = () => {
    if (value.length === 0) {
      setError('Choose at least one goal.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveGoals(value)
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div>
      <StepHeader
        eyebrow="04 / 08"
        title="What are your skin goals?"
        subtitle="Select up to 3."
      />

      {/* Count indicator */}
      <div style={{ marginBottom: '1rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: isAtMax ? 'var(--color-sienna-400)' : 'var(--color-text-muted)',
          }}
        >
          {isAtMax
            ? `${value.length} of ${MAX_GOALS} — deselect one to change`
            : value.length > 0
            ? `${value.length} of ${MAX_GOALS} selected`
            : `Choose up to ${MAX_GOALS}`}
        </span>
      </div>

      <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {GOALS.map((goal) => {
          const isSelected = value.includes(goal.value)
          const isDisabled = isAtMax && !isSelected

          return (
            <button
              key={goal.value}
              data-item
              type="button"
              onClick={() => toggle(goal.value)}
              aria-pressed={isSelected}
              aria-disabled={isDisabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '0.875rem 1rem',
                borderRadius: '6px',
                border: isSelected ? '1.5px solid var(--color-sienna-400)' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'transparent',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.35 : 1,
                transition: 'all 200ms var(--ease-luxury)',
                outline: 'none',
                width: '100%',
                textAlign: 'left',
              }}
            >
              {/* Circle checkbox */}
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: isSelected ? '5px solid var(--color-sienna-500)' : '1.5px solid rgba(255,255,255,0.25)',
                  flexShrink: 0,
                  transition: 'border 200ms ease',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  fontWeight: 300,
                  color: isSelected ? 'var(--color-alabaster-50)' : 'var(--color-alabaster-300)',
                }}
              >
                {goal.label}
              </span>
            </button>
          )
        })}
      </div>

      {error && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-blush-500)', marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      <StepNav onContinue={handleContinue} onBack={onBack} isLoading={isPending} continueDisabled={value.length === 0} />
    </div>
  )
}
