'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { RadioPill } from './RadioPill'
import { saveBreakouts } from '@/app/actions/onboarding'
import type { BreakoutPattern } from '@prisma/client'

const PATTERN_OPTIONS: { value: BreakoutPattern; title: string }[] = [
  { value: 'LOCALISED', title: 'Yes — regularly, in specific areas' },
  { value: 'UNPREDICTABLE', title: "Yes — but they're unpredictable, all over" },
  { value: 'OCCASIONAL', title: 'Occasionally — a few times a year' },
  { value: 'RARE_NEVER', title: 'Rarely or never' },
]

// Free-form multi-select — the option list is a UI concern, so no enum.
const AREA_OPTIONS: { value: string; label: string }[] = [
  { value: 'forehead_temples', label: 'Forehead or temples' },
  { value: 't_zone', label: 'T-zone — nose and chin' },
  { value: 'cheeks', label: 'Cheeks' },
  { value: 'jawline_chin', label: 'Jawline or chin' },
  { value: 'back_chest', label: 'Back or chest' },
]

type Props = {
  pattern: BreakoutPattern | null
  areas: string[]
  onPatternChange: (v: BreakoutPattern) => void
  onAreasChange: (v: string[]) => void
  onContinue: () => void
  onBack: () => void
}

export function StepBreakouts({
  pattern,
  areas,
  onPatternChange,
  onAreasChange,
  onContinue,
  onBack,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const patternLabelId = useId()
  const areasLabelId = useId()

  const showAreas = pattern === 'LOCALISED'
  // When the inline follow-up is shown, at least one area must be chosen.
  const canContinue = pattern != null && (!showAreas || areas.length > 0)

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

  const handlePatternChange = (v: BreakoutPattern) => {
    onPatternChange(v)
    // Leaving the "localised" answer makes the area list irrelevant — clear it
    // so a stale selection isn't persisted.
    if (v !== 'LOCALISED' && areas.length > 0) onAreasChange([])
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

  const toggleArea = (areaValue: string) => {
    if (areas.includes(areaValue)) {
      onAreasChange(areas.filter((a) => a !== areaValue))
    } else {
      onAreasChange([...areas, areaValue])
    }
  }

  const handleAreaKeyDown = (e: React.KeyboardEvent, areaValue: string) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      toggleArea(areaValue)
    }
  }

  const handleContinue = () => {
    if (pattern == null) {
      setError('Please choose the answer closest to your experience.')
      return
    }
    if (showAreas && areas.length === 0) {
      setError('Please select where you most often break out.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveBreakouts({
          breakoutPattern: pattern,
          breakoutAreas: pattern === 'LOCALISED' ? areas : [],
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
            margin: '0 0 2.25rem',
          }}
        >
          Do you experience recurring breakouts?
        </h2>

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
          Whether you experience recurring breakouts
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
                  onChange={(v) => handlePatternChange(v as BreakoutPattern)}
                  tabIndex={isSelected || (pattern == null && index === 0) ? 0 : -1}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              </div>
            )
          })}
        </div>

        {/* ── Inline follow-up: only for "regularly, in specific areas" ── */}
        {showAreas && (
          <div style={{ marginTop: '2rem' }}>
            <span
              id={areasLabelId}
              className="label-caps"
              style={{ display: 'block', marginBottom: '0.875rem' }}
            >
              Where do you most often break out? — select all that apply
            </span>

            <div
              role="group"
              aria-labelledby={areasLabelId}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.625rem',
              }}
            >
              {AREA_OPTIONS.map((area) => {
                const isSelected = areas.includes(area.value)
                return (
                  <button
                    key={area.value}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    onKeyDown={(e) => handleAreaKeyDown(e, area.value)}
                    onClick={() => toggleArea(area.value)}
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
                      {area.label}
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
