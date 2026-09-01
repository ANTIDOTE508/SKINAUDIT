'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { gsap } from 'gsap'
import { Info, Sprout, BookOpen, FlaskConical, Sparkles } from 'lucide-react'
import { StepFooter } from './StepFooter'
import { InfoSheet, type InfoSheetItem } from './InfoSheet'
import { saveExperienceLevel } from '@/app/actions/onboarding'
import type { SkincareExperience } from '@prisma/client'

/**
 * Experience level — single select. Each option carries a definition that is
 * shown, verbatim, in the shared InfoSheet when the user taps its ⓘ icon;
 * the tapped option is highlighted inside the panel via `activeValue`.
 */
const OPTIONS: {
  value: SkincareExperience
  label: string
  definition: string
  icon: React.ReactNode
}[] = [
  {
    value: 'NEW',
    label: 'New to skincare',
    definition: 'beginning to build habits or explore products',
    icon: <Sprout size={18} strokeWidth={1.5} />,
  },
  {
    value: 'SOMEWHAT_EXPERIENCED',
    label: 'Somewhat experienced',
    definition: 'basic understanding, some routine consistency',
    icon: <BookOpen size={18} strokeWidth={1.5} />,
  },
  {
    value: 'EXPERIENCED',
    label: 'Experienced',
    definition: 'understand ingredients, actives, and how routines work',
    icon: <FlaskConical size={18} strokeWidth={1.5} />,
  },
  {
    value: 'OBSESSIVE',
    label: 'Skincare obsessive',
    definition:
      'skincare is a passion; enjoy continuous refinement and tracking',
    icon: <Sparkles size={18} strokeWidth={1.5} />,
  },
]

const INFO_ITEMS: InfoSheetItem[] = OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
  description: o.definition,
  icon: o.icon,
}))

const SUB_COPY: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 300,
  fontSize: '0.9375rem',
  lineHeight: 1.6,
  color: 'var(--color-alabaster-400)',
  margin: '0 0 2.25rem',
}

type Props = {
  value: SkincareExperience | null
  onChange: (v: SkincareExperience) => void
  onContinue: () => void
  onBack: () => void
}

export function StepExperienceLevel({ value, onChange, onContinue, onBack }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)
  // The option whose ⓘ was tapped — highlighted in the panel. Null means the
  // panel was opened from the header hint, so nothing is highlighted.
  const [infoValue, setInfoValue] = useState<SkincareExperience | null>(null)

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
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: 'power3.out', delay: 0.15 }
      )
    }, node)
    return () => ctx.revert()
  }, [])

  /** Arrow keys move between pills and select as they go, per the WAI-ARIA
   *  radiogroup pattern. Wraps around at both ends. */
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta =
      e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1
      : 0
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + OPTIONS.length) % OPTIONS.length
    onChange(OPTIONS[next].value)
    const pills = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-exp-radio]')
    pills?.[next]?.focus()
  }

  const openInfo = (v: SkincareExperience | null) => {
    setInfoValue(v)
    setInfoOpen(true)
  }

  const handleContinue = () => {
    if (!value) {
      setError('Please choose the description closest to your experience.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveExperienceLevel(value)
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
          How would you describe your experience with skincare?
        </h2>

        <p data-reveal style={SUB_COPY}>
          This shapes how we present your results.{' '}
          <button
            type="button"
            onClick={() => openInfo(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: 0,
              border: 'none',
              background: 'transparent',
              color: 'var(--color-sienna-400)',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            Tap <Info size={14} strokeWidth={1.5} aria-hidden="true" /> to see definitions.
          </button>
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
          Your experience with skincare
        </span>

        <div
          ref={listRef}
          role="radiogroup"
          aria-labelledby={labelId}
          aria-required="true"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
            marginBottom: '2.25rem',
          }}
        >
          {OPTIONS.map((option, index) => {
            const isSelected = value === option.value
            return (
              <div
                key={option.value}
                data-reveal
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: '0.5rem',
                }}
              >
                <button
                  type="button"
                  role="radio"
                  data-exp-radio
                  aria-checked={isSelected}
                  aria-label={option.label}
                  tabIndex={isSelected || (!value && index === 0) ? 0 : -1}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onClick={() => onChange(option.value)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                    textAlign: 'left',
                    padding: '0.9375rem 1.125rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    outline: 'none',
                    border: isSelected
                      ? '1px solid var(--color-sienna-400)'
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
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: isSelected
                        ? '1px solid var(--color-sienna-400)'
                        : '1px solid rgba(184,134,61,0.45)',
                      color: 'var(--color-sienna-400)',
                    }}
                  >
                    {isSelected ? (
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-sienna-400)',
                        }}
                      />
                    ) : (
                      option.icon
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
                      transition: 'color var(--duration-micro) var(--ease-luxury)',
                    }}
                  >
                    {option.label}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => openInfo(option.value)}
                  aria-label={`What "${option.label}" means`}
                  aria-haspopup="dialog"
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    borderRadius: '10px',
                    border: '1px solid rgba(184,134,61,0.28)',
                    background: 'rgba(6,5,5,0.42)',
                    color: 'var(--color-alabaster-400)',
                    cursor: 'pointer',
                    transition:
                      'border-color var(--duration-micro) var(--ease-luxury), color var(--duration-micro) var(--ease-luxury)',
                  }}
                >
                  <Info size={18} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
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

      <InfoSheet
        title="Experience levels"
        items={INFO_ITEMS}
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
        activeValue={infoValue ?? undefined}
      />
    </div>
  )
}
