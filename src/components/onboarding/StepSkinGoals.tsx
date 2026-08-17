'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { gsap } from 'gsap'
import { StepHeader } from './StepHeader'
import { StepFooter } from './StepFooter'
import { SelectionRow } from './SelectionRow'
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
    const items = listRef.current?.querySelectorAll('[data-row]')
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

      <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
        {GOALS.map((goal) => {
          const isSelected = value.includes(goal.value)
          return (
            <SelectionRow
              key={goal.value}
              label={goal.label}
              isSelected={isSelected}
              isDisabled={isAtMax && !isSelected}
              onClick={() => toggle(goal.value)}
            />
          )
        })}
      </div>

      {error && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-blush-500)', marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      <StepFooter onContinue={handleContinue} onBack={onBack} isLoading={isPending} continueDisabled={value.length === 0} />
    </div>
  )
}
