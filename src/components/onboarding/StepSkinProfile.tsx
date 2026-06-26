'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { gsap } from 'gsap'
import { StepHeader } from './StepHeader'
import { SelectionCard } from './SelectionCard'
import { StepNav } from './StepNav'
import { saveSkinProfile } from '@/app/actions/onboarding'
import type { SkinType } from '@prisma/client'

const SKIN_TYPES = [
  {
    value: 'NORMAL' as SkinType,
    label: 'Normal',
    description: 'Balanced — minimal dryness or oiliness',
    icon: '◎',
  },
  {
    value: 'DRY' as SkinType,
    label: 'Dry',
    description: 'Often feels tight, may flake or appear dull',
    icon: '◌',
  },
  {
    value: 'OILY' as SkinType,
    label: 'Oily',
    description: 'Prone to shine, enlarged pores, and congestion',
    icon: '●',
  },
  {
    value: 'COMBINATION' as SkinType,
    label: 'Combination',
    description: 'Oily T-zone, drier on cheeks',
    icon: '◑',
  },
]

const CONCERNS = [
  { value: 'acne', label: 'Acne & breakouts' },
  { value: 'aging', label: 'Aging & fine lines' },
  { value: 'pigmentation', label: 'Pigmentation & dark spots' },
  { value: 'dryness', label: 'Dryness & dehydration' },
  { value: 'sensitivity', label: 'Sensitivity & reactivity' },
  { value: 'redness', label: 'Redness & rosacea' },
  { value: 'texture', label: 'Uneven texture & pores' },
  { value: 'dullness', label: 'Dullness & lack of glow' },
]

type Props = {
  skinType: string
  concerns: string[]
  onSkinTypeChange: (v: string) => void
  onConcernsChange: (v: string[]) => void
  onContinue: () => void
  onBack: () => void
}

export function StepSkinProfile({
  skinType,
  concerns,
  onSkinTypeChange,
  onConcernsChange,
  onContinue,
  onBack,
}: Props) {
  const gridRef = useRef<HTMLDivElement>(null)
  const concernsRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Staggered entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gridRef.current?.querySelectorAll('[data-card]')
      if (cards?.length) {
        gsap.fromTo(
          cards,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: 'power2.out', delay: 0.3 }
        )
      }

      const concernCards = concernsRef.current?.querySelectorAll('[data-card]')
      if (concernCards?.length) {
        gsap.fromTo(
          concernCards,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.6 }
        )
      }
    })
    return () => ctx.revert()
  }, [])

  const toggleConcern = (value: string) => {
    const next = concerns.includes(value)
      ? concerns.filter((c) => c !== value)
      : [...concerns, value]
    onConcernsChange(next)
  }

  const handleContinue = () => {
    if (!skinType) {
      setError('Please select your skin type to continue.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveSkinProfile({
          skinType: skinType as SkinType,
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
        eyebrow="Step 1 of 6"
        title="Tell us about your skin."
        subtitle="Understanding your skin type is the foundation of every insight we surface."
      />

      {/* Skin type grid */}
      <div
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '0.75rem',
          marginBottom: '2.5rem',
        }}
      >
        {SKIN_TYPES.map((type) => (
          <div key={type.value} data-card>
            <SelectionCard
              label={type.label}
              description={type.description}
              icon={type.icon}
              isSelected={skinType === type.value}
              onClick={() => onSkinTypeChange(type.value)}
            />
          </div>
        ))}
      </div>

      {/* Concerns section */}
      <div style={{ marginBottom: '0.5rem' }}>
        <span
          className="label-caps"
          style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '1rem' }}
        >
          Primary concerns — select all that apply
        </span>
        <div
          ref={concernsRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '0.625rem',
          }}
        >
          {CONCERNS.map((concern) => (
            <div key={concern.value} data-card>
              <SelectionCard
                label={concern.label}
                isSelected={concerns.includes(concern.value)}
                isMulti
                onClick={() => toggleConcern(concern.value)}
              />
            </div>
          ))}
        </div>
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
        continueDisabled={!skinType}
      />
    </div>
  )
}
