'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { StepHeader } from './StepHeader'
import { StepFooter } from './StepFooter'
import { saveSkinProfile } from '@/app/actions/onboarding'
import type { SkinType } from '@prisma/client'

const SKIN_TYPES: { value: SkinType; label: string; image: string }[] = [
  { value: 'BALANCED', label: 'Balanced', image: '/images/onboarding/step2/skin-normal.webp' },
  { value: 'DRY', label: 'Dry', image: '/images/onboarding/step2/skin-dry.webp' },
  { value: 'OILY', label: 'Oily', image: '/images/onboarding/step2/skin-oily.webp' },
  { value: 'COMBINATION', label: 'Combination', image: '/images/onboarding/step2/skin-combination.webp' },
  { value: 'SENSITIVE', label: 'Sensitive', image: '/images/onboarding/step2/skin-sensitive.webp' },
  { value: 'ACNE_PRONE', label: 'Acne-prone', image: '/images/onboarding/step2/skin-acne-prone.webp' },
]

type Props = {
  value: string
  onChange: (v: string) => void
  onContinue: () => void
  onBack: () => void
}

export function StepSkinType({ value, onChange, onContinue, onBack }: Props) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll('[data-card]')
    const ctx = gsap.context(() => {
      if (cards?.length) {
        gsap.fromTo(
          cards,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: 'power2.out', delay: 0.2 }
        )
      }
    })
    return () => ctx.revert()
  }, [])

  const handleContinue = () => {
    if (!value) {
      setError('Please select your skin type.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveSkinProfile({ skinType: value as SkinType })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div>
      <StepHeader
        eyebrow="02 / 08"
        title="What best describes your skin?"
        subtitle="You can refine this later."
      />

      <div
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        {SKIN_TYPES.map((type) => {
          const isSelected = value === type.value
          return (
            <button
              key={type.value}
              data-card
              type="button"
              onClick={() => onChange(type.value)}
              aria-pressed={isSelected}
              style={{
                padding: 0,
                border: isSelected ? '2px solid var(--color-sienna-400)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                overflow: 'hidden',
                outline: 'none',
                transition: 'border-color 180ms var(--ease-luxury)',
                background: 'transparent',
              }}
            >
              <div style={{ position: 'relative', height: '100px' }}>
                <Image
                  src={type.image}
                  alt={type.label}
                  fill
                  sizes="(max-width: 600px) 33vw, 200px"
                  style={{
                    objectFit: 'cover',
                    opacity: isSelected ? 1 : 0.75,
                    transition: 'opacity 180ms ease',
                  }}
                />
              </div>
              {/* Label */}
              <div
                style={{
                  padding: '0.625rem 0.5rem',
                  backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--color-obsidian-900)',
                  textAlign: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.9375rem',
                    fontWeight: 300,
                    color: isSelected ? 'var(--color-alabaster-50)' : 'var(--color-alabaster-300)',
                    transition: 'color 180ms ease',
                  }}
                >
                  {type.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-blush-500)', marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      <StepFooter onContinue={handleContinue} onBack={onBack} isLoading={isPending} continueDisabled={!value} />
    </div>
  )
}
