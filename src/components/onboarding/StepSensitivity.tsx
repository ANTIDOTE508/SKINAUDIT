'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { gsap } from 'gsap'
import { StepHeader } from './StepHeader'
import { SelectionCard } from './SelectionCard'
import { StepNav } from './StepNav'
import { saveSensitivity } from '@/app/actions/onboarding'
import type { SensitivityLevel } from '@prisma/client'

const SENSITIVITY_LEVELS = [
  {
    value: 'LOW' as SensitivityLevel,
    label: 'Low',
    description: 'My skin tolerates most products without issue.',
    icon: '○',
  },
  {
    value: 'MEDIUM' as SensitivityLevel,
    label: 'Medium',
    description: 'Some products cause mild reactions or irritation.',
    icon: '◑',
  },
  {
    value: 'HIGH' as SensitivityLevel,
    label: 'High',
    description: 'My skin reacts easily — I must patch-test everything.',
    icon: '●',
  },
]

const GOALS = [
  { value: 'barrier_repair', label: 'Restore & repair skin barrier' },
  { value: 'anti_aging', label: 'Address visible signs of aging' },
  { value: 'brightening', label: 'Even skin tone & brighten' },
  { value: 'hydration', label: 'Deep, lasting hydration' },
  { value: 'acne_control', label: 'Control acne & breakouts' },
  { value: 'calm_redness', label: 'Calm inflammation & redness' },
  { value: 'simplify', label: 'Simplify my routine' },
  { value: 'understand', label: 'Understand my routine better' },
]

type Props = {
  sensitivity: string
  goals: string[]
  onSensitivityChange: (v: string) => void
  onGoalsChange: (v: string[]) => void
  onContinue: () => void
  onBack: () => void
}

export function StepSensitivity({
  sensitivity,
  goals,
  onSensitivityChange,
  onGoalsChange,
  onContinue,
  onBack,
}: Props) {
  const cardsRef = useRef<HTMLDivElement>(null)
  const goalsRef = useRef<HTMLDivElement>(null)
  const scaleRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Sensitivity cards
      const cards = cardsRef.current?.querySelectorAll('[data-card]')
      if (cards?.length) {
        gsap.fromTo(
          cards,
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.25 }
        )
      }

      // Visual scale bar
      if (scaleRef.current) {
        gsap.fromTo(
          scaleRef.current,
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: 1, duration: 0.6, ease: 'power2.out', delay: 0.4 }
        )
      }

      // Goal chips
      const goalChips = goalsRef.current?.querySelectorAll('[data-chip]')
      if (goalChips?.length) {
        gsap.fromTo(
          goalChips,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: 'power2.out', delay: 0.55 }
        )
      }
    })
    return () => ctx.revert()
  }, [])

  const toggleGoal = (value: string) => {
    const next = goals.includes(value)
      ? goals.filter((g) => g !== value)
      : [...goals, value]
    onGoalsChange(next)
  }

  const handleContinue = () => {
    if (!sensitivity) {
      setError('Please select your sensitivity level.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveSensitivity({
          sensitivity: sensitivity as SensitivityLevel,
          goals,
        })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div>
      <StepHeader
        eyebrow="Step 2 of 6"
        title="How does your skin react?"
        subtitle="Sensitivity guides how we calibrate ingredient conflict risk in your analysis."
      />

      {/* Sensitivity cards — horizontal layout */}
      <div
        ref={cardsRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        {SENSITIVITY_LEVELS.map((level) => (
          <div key={level.value} data-card>
            <SelectionCard
              label={level.label}
              description={level.description}
              icon={level.icon}
              isSelected={sensitivity === level.value}
              onClick={() => onSensitivityChange(level.value)}
            />
          </div>
        ))}
      </div>

      {/* Visual spectrum */}
      <div
        style={{
          marginBottom: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '10px',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          Resilient
        </span>
        <div
          ref={scaleRef}
          style={{
            flex: 1,
            height: '2px',
            borderRadius: '1px',
            background: 'linear-gradient(90deg, var(--color-sage-600) 0%, var(--color-sienna-400) 50%, var(--color-blush-500) 100%)',
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '10px',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          Reactive
        </span>
      </div>

      {/* Priority goals */}
      <span
        className="label-caps"
        style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '1rem' }}
      >
        Priority goals — what matters most to you?
      </span>
      <div
        ref={goalsRef}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        {GOALS.map((goal) => {
          const isSelected = goals.includes(goal.value)
          return (
            <button
              key={goal.value}
              data-chip
              type="button"
              onClick={() => toggleGoal(goal.value)}
              aria-pressed={isSelected}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '100px',
                border: isSelected
                  ? '1px solid var(--color-sienna-400)'
                  : '1px solid var(--color-border)',
                backgroundColor: isSelected
                  ? 'var(--color-accent-subtle)'
                  : 'transparent',
                color: isSelected
                  ? 'var(--color-sienna-300)'
                  : 'var(--color-alabaster-400)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.8125rem',
                fontWeight: 400,
                cursor: 'pointer',
                transition: 'all 180ms var(--ease-luxury)',
                outline: 'none',
              }}
            >
              {goal.label}
            </button>
          )
        })}
      </div>

      {error && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: 'var(--color-blush-500)',
            marginTop: '1rem',
          }}
        >
          {error}
        </p>
      )}

      <StepNav
        onContinue={handleContinue}
        onBack={onBack}
        isLoading={isPending}
        continueDisabled={!sensitivity}
      />
    </div>
  )
}
