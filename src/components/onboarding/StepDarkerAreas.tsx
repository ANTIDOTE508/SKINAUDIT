'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { RadioPill } from './RadioPill'
import { saveDarkerAreas } from '@/app/actions/onboarding'

// Single-select — the option list is a UI concern, so no enum. Captures a
// broad range of hyperpigmentation (PIH, sun damage, post-breakout marks)
// through observable experience only.
const AREA_OPTIONS: { value: string; title: string }[] = [
  { value: 'several_areas', title: 'Yes — in several areas' },
  { value: 'one_area', title: 'Yes — in one specific area' },
  { value: 'faded', title: "I have in the past, but they've faded" },
  { value: 'no', title: 'No' },
]

// The follow-up (Q2) shows only when the answer is one of the two "Yes".
const FOLLOWUP_VALUES = new Set(['several_areas', 'one_area'])

// Multi-select. "no_pattern" and "not_applicable" are exclusive of the rest
// and of each other.
const TRIGGER_OPTIONS: { value: string; label: string }[] = [
  { value: 'sun', label: 'Time in the sun' },
  { value: 'irritation', label: 'Skin irritation' },
  { value: 'breakouts', label: 'Breakouts or blemishes' },
  { value: 'no_pattern', label: "I haven't noticed a pattern" },
  { value: 'not_applicable', label: 'Not applicable' },
]

const EXCLUSIVE_TRIGGERS = ['no_pattern', 'not_applicable']

type Props = {
  areas: string
  triggers: string[]
  onAreasChange: (v: string) => void
  onTriggersChange: (v: string[]) => void
  onContinue: () => void
  onBack: () => void
}

export function StepDarkerAreas({
  areas,
  triggers,
  onAreasChange,
  onTriggersChange,
  onContinue,
  onBack,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const areaLabelId = useId()
  const triggersLabelId = useId()

  const showTriggers = FOLLOWUP_VALUES.has(areas)
  const canContinue = areas !== '' && (!showTriggers || triggers.length > 0)

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

  const handleAreasChange = (v: string) => {
    onAreasChange(v)
    // Leaving a "Yes" answer makes the trigger list irrelevant.
    if (!FOLLOWUP_VALUES.has(v) && triggers.length > 0) onTriggersChange([])
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
    const next = (index + delta + AREA_OPTIONS.length) % AREA_OPTIONS.length
    handleAreasChange(AREA_OPTIONS[next].value)
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
    if (areas === '') {
      setError('Please choose the answer closest to your experience.')
      return
    }
    if (showTriggers && triggers.length === 0) {
      setError('Please select at least one option.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveDarkerAreas({
          darkerAreas: areas,
          darkerAreaTriggers: showTriggers ? triggers : [],
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
          id={areaLabelId}
          data-reveal
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            color: 'var(--color-alabaster-50)',
            margin: '0 0 2.25rem',
          }}
        >
          Do you notice areas of your skin that are consistently darker than the
          surrounding skin?
        </h2>

        <div
          ref={listRef}
          role="radiogroup"
          aria-labelledby={areaLabelId}
          aria-required="true"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
          }}
        >
          {AREA_OPTIONS.map((option, index) => {
            const isSelected = areas === option.value
            return (
              <div key={option.value} data-reveal>
                <RadioPill
                  value={option.value}
                  title={option.title}
                  ariaLabel={option.title}
                  selected={isSelected}
                  onChange={(v) => handleAreasChange(v)}
                  tabIndex={isSelected || (areas === '' && index === 0) ? 0 : -1}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              </div>
            )
          })}
        </div>

        {/* ── Inline follow-up (Q2): only for the two "Yes" answers ── */}
        {showTriggers && (
          <div style={{ marginTop: '2rem' }}>
            <span
              id={triggersLabelId}
              className="label-caps"
              style={{ display: 'block', marginBottom: '0.875rem' }}
            >
              When darker areas appear, what tends to make them more noticeable? —
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
