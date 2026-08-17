'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { gsap } from 'gsap'
import { StepHeader } from './StepHeader'
import { StepFooter } from './StepFooter'
import { SelectionRow } from './SelectionRow'
import { saveExperienceLevel } from '@/app/actions/onboarding'
import type { ExperienceLevel } from '@prisma/client'

const LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'BEGINNER', label: 'New to skincare' },
  { value: 'INTERMEDIATE', label: 'Somewhat experienced' },
  { value: 'ADVANCED', label: 'Experienced' },
  { value: 'ENTHUSIAST', label: 'Skincare obsessive' },
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
      const cards = cardsRef.current?.querySelectorAll('[data-row]')
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
        {LEVELS.map((l) => (
          <SelectionRow
            key={l.value}
            label={l.label}
            isSelected={level === l.value}
            onClick={() => onChange(l.value)}
          />
        ))}
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

      <StepFooter
        onContinue={handleContinue}
        onBack={onBack}
        isLoading={isPending}
        continueDisabled={!level}
      />
    </div>
  )
}
