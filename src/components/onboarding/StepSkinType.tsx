'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import {
  Sparkles,
  Droplet,
  Flame,
  Grid2x2,
  ShieldAlert,
  Waves,
  SunDim,
  Circle,
} from 'lucide-react'
import { StepFooter } from './StepFooter'
import { saveSkinProfile } from '@/app/actions/onboarding'
import type { SkinType } from '@prisma/client'

const SKIN_TYPES: { value: SkinType; label: string; description: string; image: string }[] = [
  {
    value: 'BALANCED',
    label: 'Normal',
    description: 'Balanced — minimal dryness or oiliness',
    image: '/images/onboarding/step2/skin-normal.webp',
  },
  {
    value: 'DRY',
    label: 'Dry',
    description: 'Often feels tight, may flake or appear dull',
    image: '/images/onboarding/step2/skin-dry.webp',
  },
  {
    value: 'OILY',
    label: 'Oily',
    description: 'Prone to shine, enlarged pores, and congestion',
    image: '/images/onboarding/step2/skin-oily.webp',
  },
  {
    value: 'COMBINATION',
    label: 'Combination',
    description: 'Oily T-zone, drier on cheeks',
    image: '/images/onboarding/step2/skin-combination.webp',
  },
  {
    value: 'SENSITIVE',
    label: 'Sensitive',
    description: 'Prone to redness, irritation, or stinging',
    image: '/images/onboarding/step2/skin-sensitive.webp',
  },
  {
    value: 'ACNE_PRONE',
    label: 'Acne-prone',
    description: 'Prone to breakouts, clogged pores, and inflammation',
    image: '/images/onboarding/step2/skin-acne-prone.webp',
  },
]

const ICON_SIZE = 18
const ICON_STROKE = 1.5

const CONCERNS: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: 'acne_breakouts', label: 'Acne & breakouts', icon: <Circle size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'aging_fine_lines', label: 'Aging & fine lines', icon: <Waves size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'pigmentation_dark_spots', label: 'Pigmentation & dark spots', icon: <SunDim size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'dryness_dehydration', label: 'Dryness & dehydration', icon: <Droplet size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'sensitivity_reactivity', label: 'Sensitivity & reactivity', icon: <ShieldAlert size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'redness_rosacea', label: 'Redness & rosacea', icon: <Flame size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'uneven_texture_pores', label: 'Uneven texture & pores', icon: <Grid2x2 size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'dullness_glow', label: 'Dullness & lack of glow', icon: <Sparkles size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
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
  value: string
  onChange: (v: string) => void
  concerns: string[]
  onConcernsChange: (v: string[]) => void
  onContinue: () => void
  onBack: () => void
}

export function StepSkinType({ value, onChange, concerns, onConcernsChange, onContinue, onBack }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const skinTypeLabelId = useId()
  const concernsLabelId = useId()

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
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: 'power3.out', delay: 0.15 }
      )
    }, node)
    return () => ctx.revert()
  }, [])

  /** Arrow keys move between cards and select as they go, per the WAI-ARIA
   *  radiogroup pattern. Wraps around at both ends. */
  const handleSkinTypeKeyDown = (e: React.KeyboardEvent, index: number) => {
    const columns = 3
    let delta = 0
    if (e.key === 'ArrowRight') delta = 1
    else if (e.key === 'ArrowLeft') delta = -1
    else if (e.key === 'ArrowDown') delta = columns
    else if (e.key === 'ArrowUp') delta = -columns
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + SKIN_TYPES.length) % SKIN_TYPES.length
    onChange(SKIN_TYPES[next].value)
    const cards = gridRef.current?.querySelectorAll<HTMLButtonElement>('[data-card]')
    cards?.[next]?.focus()
  }

  const toggleConcern = (concernValue: string) => {
    if (concerns.includes(concernValue)) {
      onConcernsChange(concerns.filter((c) => c !== concernValue))
    } else {
      onConcernsChange([...concerns, concernValue])
    }
  }

  const handleConcernKeyDown = (e: React.KeyboardEvent, concernValue: string) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      toggleConcern(concernValue)
    }
  }

  const handleContinue = () => {
    if (!value) {
      setError('Please select your skin type.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveSkinProfile({ skinType: value as SkinType, concerns })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef}>
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
        What best describes your skin?
      </h2>

      <p data-reveal style={SUB_COPY}>
        You can refine this later.
      </p>

      <span
        id={skinTypeLabelId}
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
        Skin type
      </span>

      <div
        ref={gridRef}
        role="radiogroup"
        aria-labelledby={skinTypeLabelId}
        aria-required="true"
        data-reveal
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
              data-card
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${type.label} — ${type.description}`}
              tabIndex={isSelected || (!value && index === 0) ? 0 : -1}
              onKeyDown={(e) => handleSkinTypeKeyDown(e, index)}
              onClick={() => onChange(type.value)}
              style={{
                position: 'relative',
                padding: 0,
                border: isSelected ? '2px solid var(--color-sienna-400)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                overflow: 'hidden',
                outline: 'none',
                textAlign: 'left',
                transition: 'border-color var(--duration-micro) var(--ease-luxury)',
                background: 'transparent',
              }}
            >
              <div style={{ position: 'relative', height: '96px' }}>
                <Image
                  src={type.image}
                  alt=""
                  fill
                  sizes="(max-width: 600px) 33vw, 200px"
                  style={{
                    objectFit: 'cover',
                    opacity: isSelected ? 1 : 0.75,
                    transition: 'opacity var(--duration-micro) ease',
                  }}
                />
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    left: '0.5rem',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: isSelected
                      ? '1px solid var(--color-sienna-400)'
                      : '1px solid rgba(250,250,248,0.6)',
                    backgroundColor: isSelected ? 'var(--color-sienna-400)' : 'rgba(10,9,8,0.35)',
                    boxShadow: '0 0 0 3px rgba(10,9,8,0.25)',
                    transition:
                      'background-color var(--duration-micro) var(--ease-luxury), border-color var(--duration-micro) var(--ease-luxury)',
                  }}
                />
              </div>
              <div
                style={{
                  padding: '0.625rem 0.625rem 0.75rem',
                  backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--color-obsidian-900)',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.9375rem',
                    fontWeight: 300,
                    color: isSelected ? 'var(--color-alabaster-50)' : 'var(--color-alabaster-300)',
                    transition: 'color var(--duration-micro) ease',
                  }}
                >
                  {type.label}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 300,
                    fontSize: '0.6875rem',
                    lineHeight: 1.4,
                    color: 'var(--color-alabaster-400)',
                    marginTop: '0.25rem',
                  }}
                >
                  {type.description}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Primary concerns (multi-select) ── */}
      <div data-reveal style={{ marginBottom: '1.5rem' }}>
        <span id={concernsLabelId} className="label-caps" style={{ display: 'block', marginBottom: '0.875rem' }}>
          Primary concerns — select all that apply
        </span>

        <div
          role="group"
          aria-labelledby={concernsLabelId}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.625rem',
          }}
        >
          {CONCERNS.map((concern) => {
            const isSelected = concerns.includes(concern.value)
            return (
              <button
                key={concern.value}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                onKeyDown={(e) => handleConcernKeyDown(e, concern.value)}
                onClick={() => toggleConcern(concern.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '8px',
                  border: isSelected
                    ? '1.5px solid var(--color-sienna-500)'
                    : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'transparent',
                  cursor: 'pointer',
                  outline: 'none',
                  textAlign: 'left',
                  transition: 'all var(--duration-micro) var(--ease-luxury)',
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
                    borderRadius: '50%',
                    border: isSelected
                      ? '1px solid var(--color-sienna-400)'
                      : '1px solid rgba(184,134,61,0.45)',
                    backgroundColor: isSelected ? 'var(--color-sienna-400)' : 'transparent',
                    transition:
                      'background-color var(--duration-micro) var(--ease-luxury), border-color var(--duration-micro) var(--ease-luxury)',
                  }}
                />
                <span
                  aria-hidden="true"
                  style={{
                    display: 'flex',
                    flexShrink: 0,
                    color: isSelected ? 'var(--color-sienna-400)' : 'var(--color-alabaster-300)',
                  }}
                >
                  {concern.icon}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 300,
                    fontSize: '0.75rem',
                    lineHeight: 1.3,
                    color: isSelected ? 'var(--color-alabaster-50)' : 'var(--color-alabaster-300)',
                    transition: 'color var(--duration-micro) ease',
                  }}
                >
                  {concern.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-blush-500)', marginBottom: '1rem' }}
        >
          {error}
        </p>
      )}

      <StepFooter onContinue={handleContinue} onBack={onBack} isLoading={isPending} continueDisabled={!value} />
    </div>
  )
}
