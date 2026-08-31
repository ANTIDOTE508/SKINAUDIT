'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { RadioPill } from './RadioPill'
import { saveMelasma } from '@/app/actions/onboarding'
import type { MelasmaPattern } from '@prisma/client'

const PATTERN_OPTIONS: { value: MelasmaPattern; title: string }[] = [
  { value: 'SYMMETRICAL', title: 'Yes — I have symmetrical darker patches' },
  { value: 'ASYMMETRICAL', title: "I have darker patches, but they're not symmetrical" },
  { value: 'FADED', title: "I had them at some point but they've faded" },
  { value: 'NONE', title: 'No' },
]

// Free-form multi-select — the option list is a UI concern, so no enum.
// "none" and "unsure" are exclusive of each other and of the rest.
const TRIGGER_OPTIONS: { value: string; label: string }[] = [
  { value: 'sun', label: 'Sun exposure' },
  { value: 'pregnancy', label: 'Pregnancy or postpartum period' },
  { value: 'hormonal_contraception', label: 'Hormonal contraception — pill, patch, IUD' },
  { value: 'hrt', label: 'Hormone replacement therapy' },
  { value: 'none', label: 'None of the above' },
  { value: 'unsure', label: "I'm not sure" },
]

const EXCLUSIVE_TRIGGERS = ['none', 'unsure']

type Props = {
  pattern: MelasmaPattern | null
  triggers: string[]
  onPatternChange: (v: MelasmaPattern) => void
  onTriggersChange: (v: string[]) => void
  onContinue: () => void
  onBack: () => void
}

export function StepMelasma({
  pattern,
  triggers,
  onPatternChange,
  onTriggersChange,
  onContinue,
  onBack,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const patternLabelId = useId()
  const triggersLabelId = useId()

  const showTriggers = pattern === 'SYMMETRICAL'
  // When the inline follow-up is shown, at least one option must be chosen.
  const canContinue = pattern != null && (!showTriggers || triggers.length > 0)

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

  const handlePatternChange = (v: MelasmaPattern) => {
    onPatternChange(v)
    // Leaving the "symmetrical" answer makes the trigger list irrelevant.
    if (v !== 'SYMMETRICAL' && triggers.length > 0) onTriggersChange([])
  }

  /** Arrow keys move between pills and select as they go, per the WAI-ARIA
   *  radiogroup pattern. Wraps around at both ends. */
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta =
      e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1
      : 0
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + PATTERN_OPTIONS.length) % PATTERN_OPTIONS.length
    handlePatternChange(PATTERN_OPTIONS[next].value)
    const pills = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-radio-pill]')
    pills?.[next]?.focus()
  }

  const toggleTrigger = (value: string) => {
    if (EXCLUSIVE_TRIGGERS.includes(value)) {
      onTriggersChange(triggers.includes(value) ? [] : [value])
      return
    }
    const cleaned = triggers.filter((t) => !EXCLUSIVE_TRIGGERS.includes(t))
    if (cleaned.includes(value)) {
      onTriggersChange(cleaned.filter((t) => t !== value))
    } else {
      onTriggersChange([...cleaned, value])
    }
  }

  const handleTriggerKeyDown = (e: React.KeyboardEvent, value: string) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      toggleTrigger(value)
    }
  }

  const handleContinue = () => {
    if (pattern == null) {
      setError('Please choose the answer closest to your experience.')
      return
    }
    if (showTriggers && triggers.length === 0) {
      setError('Please choose at least one option (or “None of the above”).')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveMelasma({
          melasmaPattern: pattern,
          melasmaTriggers: showTriggers ? triggers : [],
        })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef}>
      <div style={{ maxWidth: '30rem' }}>
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
          Do you have darker patches on your face that appear symmetrically —
          meaning both sides of your face in the same location?
        </h2>

        <p
          data-reveal
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.9375rem',
            lineHeight: 1.6,
            color: 'var(--color-alabaster-400)',
            margin: '0 0 2.25rem',
          }}
        >
          Common locations: both cheeks in the same area, the upper lip, the
          centre of the forehead, or the bridge of the nose. These patches often
          look brownish or greyish, and may be more noticeable after sun exposure
          or certain hormonal changes.
        </p>

        <span
          id={patternLabelId}
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
          Whether you have symmetrical darker patches on your face
        </span>

        <div
          ref={listRef}
          role="radiogroup"
          aria-labelledby={patternLabelId}
          aria-required="true"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
          }}
        >
          {PATTERN_OPTIONS.map((option, index) => {
            const isSelected = pattern === option.value
            return (
              <div key={option.value} data-reveal>
                <RadioPill
                  value={option.value}
                  title={option.title}
                  ariaLabel={option.title}
                  selected={isSelected}
                  onChange={(v) => handlePatternChange(v as MelasmaPattern)}
                  tabIndex={isSelected || (pattern == null && index === 0) ? 0 : -1}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              </div>
            )
          })}
        </div>

        {/* ── Inline follow-up: only for "symmetrical darker patches" ── */}
        {showTriggers && (
          <div style={{ marginTop: '2rem' }}>
            <span
              id={triggersLabelId}
              className="label-caps"
              style={{ display: 'block', marginBottom: '0.875rem' }}
            >
              Have you noticed these patches worsen with any of the following? —
              select all that apply
            </span>

            <div
              role="group"
              aria-labelledby={triggersLabelId}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.625rem',
              }}
            >
              {TRIGGER_OPTIONS.map((option) => {
                const isSelected = triggers.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    onKeyDown={(e) => handleTriggerKeyDown(e, option.value)}
                    onClick={() => toggleTrigger(option.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 0.875rem',
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
                        width: '16px',
                        height: '16px',
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
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 300,
                        fontSize: '0.8125rem',
                        lineHeight: 1.3,
                        color: isSelected ? 'var(--color-alabaster-50)' : 'var(--color-alabaster-300)',
                        transition: 'color var(--duration-micro) ease',
                      }}
                    >
                      {option.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {error && (
          <p
            role="alert"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              color: 'var(--color-blush-500)',
              marginTop: '1rem',
              marginBottom: 0,
            }}
          >
            {error}
          </p>
        )}

        <StepFooter
          onContinue={handleContinue}
          onBack={onBack}
          isLoading={isPending}
          continueDisabled={!canContinue}
        />
      </div>
    </div>
  )
}
