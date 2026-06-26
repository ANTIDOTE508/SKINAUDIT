'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { gsap } from 'gsap'
import { StepHeader } from './StepHeader'
import { StepNav } from './StepNav'
import { saveExperienceLevel } from '@/app/actions/onboarding'
import type { ExperienceLevel } from '@prisma/client'

const LEVELS: {
  value: ExperienceLevel
  label: string
  subtitle: string
  description: string
  traits: string[]
}[] = [
  {
    value: 'BEGINNER',
    label: 'Beginner',
    subtitle: 'I\'m just starting out',
    description: 'You use a few products but aren\'t sure how they interact.',
    traits: ['Simple vocabulary', 'Guided recommendations', 'More context in findings'],
  },
  {
    value: 'INTERMEDIATE',
    label: 'Intermediate',
    subtitle: 'I know my basics',
    description: 'You understand actives, layering rules, and patch testing.',
    traits: ['Balanced explanations', 'Ingredient-level detail', 'Standard analysis depth'],
  },
  {
    value: 'ADVANCED',
    label: 'Advanced',
    subtitle: 'I study formulation',
    description: 'You read INCI lists, understand pH, and follow research.',
    traits: ['Concise, technical findings', 'Full formulation data', 'No hand-holding'],
  },
  {
    value: 'ENTHUSIAST',
    label: 'Skincare obsessive',
    subtitle: 'I live and breathe skincare',
    description: 'You track launches, read patents, and may even formulate at home.',
    traits: ['Expert-level depth', 'Raw data access', 'Minimal guidance'],
  },
]

type Props = {
  level: string
  onChange: (v: string) => void
  onContinue: () => void
  onBack: () => void
}

export function StepExperience({ level, onChange, onContinue, onBack }: Props) {
  const cardsRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardsRef.current?.querySelectorAll('[data-card]')
      if (cards?.length) {
        gsap.fromTo(
          cards,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, stagger: 0.12, ease: 'power3.out', delay: 0.3 }
        )
      }
    })
    return () => ctx.revert()
  }, [])

  const handleContinue = () => {
    if (!level) {
      setError('Please select your experience level.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveExperienceLevel(level as ExperienceLevel)
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div>
      <StepHeader
        eyebrow="06 / 08"
        title="How would you describe your experience with skincare?"
        subtitle="This helps tailor the Studio to you."
      />

      <div
        ref={cardsRef}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
      >
        {LEVELS.map((l) => {
          const isSelected = level === l.value
          return (
            <button
              key={l.value}
              data-card
              type="button"
              onClick={() => onChange(l.value)}
              aria-pressed={isSelected}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'start',
                gap: '1rem',
                padding: '1.5rem',
                borderRadius: 'var(--radius-card)',
                border: isSelected
                  ? '1.5px solid var(--color-sienna-400)'
                  : '1px solid var(--color-border)',
                backgroundColor: isSelected
                  ? 'var(--color-accent-subtle)'
                  : 'var(--color-surface)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 200ms var(--ease-luxury)',
                outline: 'none',
                boxShadow: isSelected
                  ? '0 0 0 1px rgba(184,134,61,0.12)'
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(184,134,61,0.3)'
                  gsap.to(e.currentTarget, { scale: 1.005, duration: 0.15, ease: 'power2.out' })
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  gsap.to(e.currentTarget, { scale: 1, duration: 0.15, ease: 'power2.out' })
                }
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.625rem', marginBottom: '0.375rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 400,
                      fontSize: '1.3125rem',
                      color: isSelected ? 'var(--color-alabaster-50)' : 'var(--color-alabaster-300)',
                      transition: 'color 200ms ease',
                    }}
                  >
                    {l.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 300,
                      fontSize: '0.8125rem',
                      fontStyle: 'italic',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    — {l.subtitle}
                  </span>
                </div>

                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 300,
                    fontSize: '0.875rem',
                    color: 'var(--color-alabaster-400)',
                    lineHeight: 1.6,
                    margin: '0 0 0.875rem',
                  }}
                >
                  {l.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {l.traits.map((trait) => (
                    <span
                      key={trait}
                      style={{
                        padding: '0.2rem 0.625rem',
                        borderRadius: '100px',
                        border: '1px solid var(--color-border)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.75rem',
                        fontWeight: 400,
                        color: 'var(--color-text-muted)',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              {/* Radio indicator */}
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: isSelected
                    ? '5px solid var(--color-sienna-500)'
                    : '1.5px solid var(--color-obsidian-700)',
                  backgroundColor: 'transparent',
                  transition: 'all 200ms var(--ease-luxury)',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              />
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
        continueDisabled={!level}
      />
    </div>
  )
}
