'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { gsap } from 'gsap'
import { StepHeader } from './StepHeader'
import { StepNav } from './StepNav'
import { saveGenderIdentity } from '@/app/actions/onboarding'
import type { GenderIdentity } from '@prisma/client'

const OPTIONS: { value: GenderIdentity; label: string; icon: React.ReactNode }[] = [
  {
    value: 'WOMAN',
    label: 'Woman',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="6" r="4" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 10v5M5.5 13h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'MAN',
    label: 'Man',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="6.5" cy="9.5" r="4" stroke="currentColor" strokeWidth="1.2" />
        <path d="M10 6l4-4M14 2h-3.5M14 2v3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: 'NON_BINARY',
    label: 'Non-binary',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="4" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 1v3M8 12v3M1 8h3M12 8h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'OTHER',
    label: 'Another identity',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2l1.5 4.5H14l-3.7 2.7 1.4 4.3L8 11l-3.7 2.5 1.4-4.3L2 6.5h4.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: 'PREFER_NOT_TO_SAY',
    label: 'Prefer not to say',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

type Props = {
  value: string
  onChange: (v: string) => void
  onContinue: () => void
  onBack: () => void
}

export function StepIdentity({ value, onChange, onContinue, onBack }: Props) {
  const listRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const items = listRef.current?.querySelectorAll('[data-row]')
    const ctx = gsap.context(() => {
      if (items?.length) {
        gsap.fromTo(
          items,
          { x: -16, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.45, stagger: 0.07, ease: 'power2.out', delay: 0.2 }
        )
      }
    })
    return () => ctx.revert()
  }, [])

  const handleContinue = () => {
    if (!value) {
      setError('Please select an option to continue.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveGenderIdentity(value as GenderIdentity)
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div>
      <StepHeader
        eyebrow="01 / 08"
        title="First, how do you identify?"
        subtitle="SkinAudit is gender inclusive."
      />

      <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
        {OPTIONS.map((opt) => {
          const isSelected = value === opt.value
          return (
            <button
              key={opt.value}
              data-row
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={isSelected}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
                borderRadius: '6px',
                border: isSelected ? '1.5px solid var(--color-sienna-400)' : '1px solid rgba(255,255,255,0.12)',
                backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'transparent',
                color: isSelected ? 'var(--color-alabaster-50)' : 'var(--color-alabaster-300)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 180ms var(--ease-luxury)',
                outline: 'none',
                width: '100%',
              }}
            >
              <span style={{ color: isSelected ? 'var(--color-sienna-400)' : 'var(--color-alabaster-400)', flexShrink: 0 }}>
                {opt.icon}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', fontWeight: 300 }}>
                {opt.label}
              </span>
              {isSelected && (
                <span style={{ marginLeft: 'auto', color: 'var(--color-sienna-400)', fontSize: '1rem' }}>✓</span>
              )}
            </button>
          )
        })}
      </div>

      {error && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-blush-500)', marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      <StepNav onContinue={handleContinue} onBack={onBack} isLoading={isPending} continueDisabled={!value} />
    </div>
  )
}
