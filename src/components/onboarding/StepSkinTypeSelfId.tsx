'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { saveSkinTypeSelfId } from '@/app/actions/onboarding'
import type { SkinType } from '@prisma/client'

/**
 * Skin type self-identification — inserted early, before any behavioural
 * question. The user picks the label that best matches their own read of
 * their skin; a later behavioural step (StepSkinType) can still refine
 * `skinType`. Six visual cards in a 3×2 grid, each with a macro
 * skin-texture image.
 */
const SKIN_TYPES: {
  value: SkinType
  label: string
  description: string
  image: string
}[] = [
  {
    value: 'BALANCED',
    label: 'Normal',
    description: 'Balanced, minimal dryness or oiliness',
    image: '/images/onboarding/skintype/new/skin-normal.webp',
  },
  {
    value: 'DRY',
    label: 'Dry',
    description: 'Often feels tight, may flake or appear dull',
    image: '/images/onboarding/skintype/new/skin-dry.webp',
  },
  {
    value: 'OILY',
    label: 'Oily',
    description: 'Prone to shine, enlarged pores, and congestion',
    image: '/images/onboarding/skintype/new/skin-oily.webp',
  },
  {
    value: 'COMBINATION',
    label: 'Combination',
    description: 'Oily T-zone, drier on cheeks',
    image: '/images/onboarding/skintype/new/skin-combination.webp',
  },
  {
    value: 'SENSITIVE',
    label: 'Sensitive',
    description: 'Prone to redness, irritation, or stinging',
    image: '/images/onboarding/skintype/new/skin-sensitive.webp',
  },
  {
    value: 'ACNE_PRONE',
    label: 'Acne-prone',
    description: 'Prone to breakouts, clogged pores, and inflammation',
    image: '/images/onboarding/skintype/new/skin-acne-prone.webp',
  },
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
  value: SkinType | null
  onChange: (v: SkinType) => void
  onContinue: () => void
  onBack: () => void
}

export function StepSkinTypeSelfId({ value, onChange, onContinue, onBack }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
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

  /** Arrow keys walk the grid (3 columns) per the WAI-ARIA radiogroup
   *  pattern, selecting as they go and wrapping at both ends. */
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const cols = 3
    let delta = 0
    if (e.key === 'ArrowRight') delta = 1
    else if (e.key === 'ArrowLeft') delta = -1
    else if (e.key === 'ArrowDown') delta = cols
    else if (e.key === 'ArrowUp') delta = -cols
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + SKIN_TYPES.length) % SKIN_TYPES.length
    onChange(SKIN_TYPES[next].value)
    const cards = gridRef.current?.querySelectorAll<HTMLButtonElement>('[data-skintype-card]')
    cards?.[next]?.focus()
  }

  const handleContinue = () => {
    if (!value) {
      setError('Please choose the description closest to your skin.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveSkinTypeSelfId(value)
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef}>
      <div style={{ maxWidth: '38rem' }}>
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
          How would you describe your skin type?
        </h2>

        <p data-reveal style={SUB_COPY}>
          You can refine this later.
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
          Your skin type
        </span>

        <div
          ref={gridRef}
          role="radiogroup"
          aria-labelledby={labelId}
          aria-required="true"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            marginBottom: '2.25rem',
          }}
        >
          {SKIN_TYPES.map((type, index) => {
            const isSelected = value === type.value
            return (
              <button
                key={type.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`${type.label} — ${type.description}`}
                data-skintype-card
                data-reveal
                tabIndex={isSelected || (!value && index === 0) ? 0 : -1}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onClick={() => onChange(type.value)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '0.625rem',
                  padding: '0.875rem',
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
                  boxShadow: isSelected
                    ? '0 0 0 1px rgba(184,134,61,0.15), inset 0 0 20px rgba(184,134,61,0.04)'
                    : 'none',
                  transition:
                    'border-color var(--duration-micro) var(--ease-luxury), background-color var(--duration-micro) var(--ease-luxury)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1 / 1',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    display: 'block',
                  }}
                >
                  <Image
                    src={type.image}
                    alt=""
                    aria-hidden="true"
                    fill
                    // Three cards share the ~608px content column, so each
                    // image renders ~180px wide — cap the request there.
                    sizes="(max-width: 720px) 30vw, 190px"
                    style={{
                      objectFit: 'cover',
                      opacity: isSelected ? 1 : 0.82,
                      filter: isSelected ? 'none' : 'saturate(0.85)',
                      transition:
                        'opacity var(--duration-micro) var(--ease-luxury), filter var(--duration-micro) var(--ease-luxury)',
                    }}
                  />
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 400,
                    fontSize: '0.9375rem',
                    color: isSelected
                      ? 'var(--color-alabaster-50)'
                      : 'var(--color-alabaster-200)',
                  }}
                >
                  {type.label}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 300,
                    fontSize: '0.75rem',
                    lineHeight: 1.4,
                    color: 'var(--color-alabaster-400)',
                  }}
                >
                  {type.description}
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
          continueDisabled={!value}
        />
      </div>
    </div>
  )
}
