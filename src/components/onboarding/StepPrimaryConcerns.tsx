'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { savePrimaryConcerns } from '@/app/actions/onboarding'

// Free-form multi-select — the option list is a UI concern, so no enum.
// No maximum: the user can pick every concern that currently applies.
const CONCERN_OPTIONS: { value: string; label: string }[] = [
  { value: 'acne_breakouts', label: 'Acne & breakouts' },
  { value: 'aging_fine_lines', label: 'Aging & fine lines' },
  { value: 'pigmentation_dark_spots', label: 'Pigmentation & dark spots' },
  { value: 'dryness_dehydration', label: 'Dryness & dehydration' },
  { value: 'sensitivity_reactivity', label: 'Sensitivity & reactivity' },
  { value: 'redness_rosacea', label: 'Redness & rosacea' },
  { value: 'uneven_texture_pores', label: 'Uneven texture & pores' },
  { value: 'dullness', label: 'Dullness & lack of glow' },
]

const SUB_COPY: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 300,
  fontSize: '0.9375rem',
  lineHeight: 1.6,
  color: 'var(--color-alabaster-400)',
  margin: '0 0 2.25rem',
}

type Props = {
  value: string[]
  onChange: (v: string[]) => void
  onContinue: () => void
  onBack: () => void
}

export function StepPrimaryConcerns({ value, onChange, onContinue, onBack }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const labelId = useId()

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
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.06, ease: 'power3.out', delay: 0.15 }
      )
    }, node)
    return () => ctx.revert()
  }, [])

  const toggle = (concernValue: string) => {
    if (value.includes(concernValue)) {
      onChange(value.filter((v) => v !== concernValue))
    } else {
      onChange([...value, concernValue])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, concernValue: string) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      toggle(concernValue)
    }
  }

  const handleContinue = () => {
    if (value.length === 0) {
      setError('Please select everything that currently applies.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await savePrimaryConcerns(value)
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
          What is your skin dealing with right now?
        </h2>

        <p data-reveal style={SUB_COPY}>
          Select all that currently apply.
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
          Your primary skin concerns right now
        </span>

        <div
          role="group"
          aria-labelledby={labelId}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
            marginBottom: '2.25rem',
          }}
        >
          {CONCERN_OPTIONS.map((option) => {
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
