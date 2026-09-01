'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { RadioPill } from './RadioPill'
import { saveRedness } from '@/app/actions/onboarding'
import type { RednessPattern, FlushFadeSpeed } from '@prisma/client'

const PATTERN_OPTIONS: { value: RednessPattern; title: string }[] = [
  { value: 'PERSISTENT', title: "Yes — it's there consistently" },
  { value: 'INTERMITTENT', title: 'Yes — but it comes and goes' },
  { value: 'OCCASIONAL', title: 'Occasionally' },
  { value: 'NONE', title: 'No' },
]

// The follow-up applies to both "Yes" answers.
const AREA_FOLLOWUP_PATTERNS: RednessPattern[] = ['PERSISTENT', 'INTERMITTENT']

// Free-form multi-select — the option list is a UI concern, so no enum.
const AREA_OPTIONS: { value: string; label: string }[] = [
  { value: 'cheeks', label: 'Cheeks' },
  { value: 'nose', label: 'Nose' },
  { value: 'chin', label: 'Chin' },
  { value: 'forehead', label: 'Forehead' },
]

// Flushing triggers — multi-select. "none" is exclusive of the rest.
const FLUSH_TRIGGER_OPTIONS: { value: string; label: string }[] = [
  { value: 'heat', label: 'Heat (warm rooms, hot drinks, hot showers)' },
  { value: 'exercise', label: 'Exercise' },
  { value: 'alcohol', label: 'Alcohol' },
  { value: 'spicy_food', label: 'Spicy food' },
  { value: 'cold_wind', label: 'Cold or wind' },
  { value: 'stress_emotion', label: 'Stress or strong emotions' },
  { value: 'stinging_products', label: 'Skincare products that sting or burn' },
  { value: 'none', label: 'None of the above' },
]

const FADE_OPTIONS: { value: FlushFadeSpeed; title: string }[] = [
  { value: 'MINUTES', title: 'Within a few minutes' },
  { value: 'UP_TO_HOUR', title: 'Within 30–60 minutes' },
  { value: 'HOURS_OR_MORE', title: 'It takes hours, or lingers into the next day' },
]

const FOLLOWUP_LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 300,
  fontSize: 'clamp(1.25rem, 2.5vw, 1.6rem)',
  lineHeight: 1.25,
  letterSpacing: '-0.01em',
  color: 'var(--color-alabaster-50)',
  margin: '0 0 1rem',
}

type Props = {
  pattern: RednessPattern | null
  areas: string[]
  flushTriggers: string[]
  flushFadeSpeed: FlushFadeSpeed | null
  onPatternChange: (v: RednessPattern) => void
  onAreasChange: (v: string[]) => void
  onFlushTriggersChange: (v: string[]) => void
  onFlushFadeSpeedChange: (v: FlushFadeSpeed) => void
  onContinue: () => void
  onBack: () => void
}

export function StepRedness({
  pattern,
  areas,
  flushTriggers,
  flushFadeSpeed,
  onPatternChange,
  onAreasChange,
  onFlushTriggersChange,
  onFlushFadeSpeedChange,
  onContinue,
  onBack,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const fadeListRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const patternLabelId = useId()
  const areasLabelId = useId()
  const flushTriggersLabelId = useId()
  const fadeLabelId = useId()

  const showFollowUp = pattern != null && AREA_FOLLOWUP_PATTERNS.includes(pattern)
  // When the inline follow-up is shown: at least one area, at least one
  // flushing trigger, and a fade speed are all required.
  const canContinue =
    pattern != null &&
    (!showFollowUp ||
      (areas.length > 0 && flushTriggers.length > 0 && flushFadeSpeed != null))

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

  const handlePatternChange = (v: RednessPattern) => {
    onPatternChange(v)
    // Leaving a "Yes" answer makes the whole follow-up irrelevant — clear it
    // so stale selections aren't persisted.
    if (!AREA_FOLLOWUP_PATTERNS.includes(v)) {
      if (areas.length > 0) onAreasChange([])
      if (flushTriggers.length > 0) onFlushTriggersChange([])
      if (flushFadeSpeed != null) {
        onFlushFadeSpeedChange(null as unknown as FlushFadeSpeed)
      }
    }
  }

  const toggleFlushTrigger = (value: string) => {
    if (value === 'none') {
      onFlushTriggersChange(flushTriggers.includes('none') ? [] : ['none'])
      return
    }
    const withoutNone = flushTriggers.filter((t) => t !== 'none')
    if (withoutNone.includes(value)) {
      onFlushTriggersChange(withoutNone.filter((t) => t !== value))
    } else {
      onFlushTriggersChange([...withoutNone, value])
    }
  }

  const handleFlushTriggerKeyDown = (e: React.KeyboardEvent, value: string) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      toggleFlushTrigger(value)
    }
  }

  const handleFadeKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta =
      e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1
      : 0
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + FADE_OPTIONS.length) % FADE_OPTIONS.length
    onFlushFadeSpeedChange(FADE_OPTIONS[next].value)
    const pills = fadeListRef.current?.querySelectorAll<HTMLButtonElement>('[data-radio-pill]')
    pills?.[next]?.focus()
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
    if (showFollowUp) {
      if (areas.length === 0) {
        setError('Please select where the redness is most noticeable.')
        return
      }
      if (flushTriggers.length === 0) {
        setError('Please choose at least one flushing trigger (or “None of the above”).')
        return
      }
      if (flushFadeSpeed == null) {
        setError('Please tell us how quickly the redness fades.')
        return
      }
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveRedness({
          rednessPattern: pattern,
          rednessAreas: showFollowUp ? areas : [],
          flushTriggers: showFollowUp ? flushTriggers : [],
          flushFadeSpeed: showFollowUp ? flushFadeSpeed : null,
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
          Do you notice redness on your cheeks, nose, or chin that&apos;s there
          most of the time — not related to a breakout, exercise, or heat?
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
          Whether you notice persistent facial redness
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
                  onChange={(v) => handlePatternChange(v as RednessPattern)}
                  tabIndex={isSelected || (pattern == null && index === 0) ? 0 : -1}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              </div>
            )
          })}
        </div>

        {/* ── Inline follow-up: only for the two "Yes" answers ── */}
        {showFollowUp && (
          <div style={{ marginTop: '2rem' }}>
            <span
              id={areasLabelId}
              className="label-caps"
              style={{ display: 'block', marginBottom: '0.875rem' }}
            >
              Where is the redness most noticeable? — select all that apply
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

            {/* Flushing triggers (multi-select) */}
            <p style={{ ...FOLLOWUP_LABEL, marginTop: '2.5rem' }} id={flushTriggersLabelId}>
              Does your face flush or turn red easily in response to any of the
              following?
            </p>

            <div
              role="group"
              aria-labelledby={flushTriggersLabelId}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.625rem',
                marginBottom: '2.5rem',
              }}
            >
              {FLUSH_TRIGGER_OPTIONS.map((option) => {
                const isSelected = flushTriggers.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    onKeyDown={(e) => handleFlushTriggerKeyDown(e, option.value)}
                    onClick={() => toggleFlushTrigger(option.value)}
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

            {/* Fade speed (single-select) */}
            <p style={FOLLOWUP_LABEL} id={fadeLabelId}>
              When flushing happens, how quickly does the redness usually fade?
            </p>

            <div
              ref={fadeListRef}
              role="radiogroup"
              aria-labelledby={fadeLabelId}
              aria-required="true"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
              }}
            >
              {FADE_OPTIONS.map((option, index) => {
                const isSelected = flushFadeSpeed === option.value
                return (
                  <div key={option.value}>
                    <RadioPill
                      value={option.value}
                      title={option.title}
                      ariaLabel={option.title}
                      selected={isSelected}
                      onChange={(v) => onFlushFadeSpeedChange(v as FlushFadeSpeed)}
                      tabIndex={isSelected || (flushFadeSpeed == null && index === 0) ? 0 : -1}
                      onKeyDown={(e) => handleFadeKeyDown(e, index)}
                    />
                  </div>
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
