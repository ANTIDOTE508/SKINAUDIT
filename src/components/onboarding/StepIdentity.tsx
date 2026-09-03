'use client'

import { useRef, useEffect, useState, useTransition, useMemo, useId } from 'react'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { LuxurySelect, type LuxurySelectOption } from '@/components/ui/LuxurySelect'
import { saveIdentity } from '@/app/actions/onboarding'
import { PREFERRED_NAME_MAX_LENGTH, birthYearBounds } from '@/lib/onboarding-rules'
import type { GenderIdentity } from '@prisma/client'

const OPTIONS: { value: GenderIdentity; label: string }[] = [
  { value: 'WOMAN', label: 'Woman' },
  { value: 'MAN', label: 'Man' },
  { value: 'NON_BINARY', label: 'Non-binary' },
  { value: 'OTHER', label: 'Another identity' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ─── Shared field styling ─────────────────────────────────────
const GROUP_LABEL: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontWeight: 300,
  fontSize: '0.9375rem',
  color: 'var(--color-alabaster-300)',
  marginBottom: '0.875rem',
}

const CONTROL_BASE: React.CSSProperties = {
  width: '100%',
  fontFamily: 'var(--font-body)',
  fontWeight: 300,
  fontSize: '0.9375rem',
  color: 'var(--color-alabaster-50)',
  backgroundColor: 'transparent',
  border: '1px solid rgba(184,134,61,0.28)',
  borderRadius: '4px',
  padding: '0.9375rem 1.125rem',
  outline: 'none',
  transition: 'border-color var(--duration-micro) var(--ease-luxury)',
}

type Props = {
  value: string
  onChange: (v: string) => void
  preferredName: string
  onPreferredNameChange: (v: string) => void
  birthMonth: string
  onBirthMonthChange: (v: string) => void
  birthYear: string
  onBirthYearChange: (v: string) => void
  onContinue: () => void
  onBack?: () => void
}

export function StepIdentity({
  value,
  onChange,
  preferredName,
  onPreferredNameChange,
  birthMonth,
  onBirthMonthChange,
  birthYear,
  onBirthYearChange,
  onContinue,
  onBack,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const identityGroupRef = useRef<HTMLDivElement>(null)
  const nameId = useId()
  // These name non-input comboboxes, so they are label ids referenced by
  // aria-labelledby rather than htmlFor targets.
  const monthLabelId = useId()
  const yearLabelId = useId()
  const identityLabelId = useId()

  const monthOptions = useMemo<LuxurySelectOption[]>(
    () => MONTHS.map((label, i) => ({ value: String(i + 1), label })),
    []
  )

  // Descending list so the most likely years sit at the top of the dropdown.
  const yearOptions = useMemo<LuxurySelectOption[]>(() => {
    const { min, max } = birthYearBounds()
    return Array.from({ length: max - min + 1 }, (_, i) => {
      const year = String(max - i)
      return { value: year, label: year }
    })
  }, [])

  useEffect(() => {
    const node = rootRef.current
    if (!node) return
    const ctx = gsap.context(() => {
      const blocks = node.querySelectorAll('[data-reveal]')
      if (blocks.length) {
        gsap.fromTo(
          blocks,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, stagger: 0.09, ease: 'power3.out', delay: 0.15 }
        )
      }
    }, node)
    return () => ctx.revert()
  }, [])

  /** Arrow keys move between chips and select as they go, per the WAI-ARIA
   *  radiogroup pattern. Wraps around at both ends. */
  const handleIdentityKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1
      : 0
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + OPTIONS.length) % OPTIONS.length
    onChange(OPTIONS[next].value)
    const chips = identityGroupRef.current?.querySelectorAll<HTMLButtonElement>('[data-chip]')
    chips?.[next]?.focus()
  }

  // Every field on this step is required before moving on.
  const trimmedName = preferredName.trim()
  const canContinue =
    trimmedName.length > 0 && Boolean(value) && Boolean(birthMonth) && Boolean(birthYear)

  const handleContinue = () => {
    if (!trimmedName) {
      setError('Please tell us what to call you.')
      return
    }
    if (!value) {
      setError('Please choose how you identify to continue.')
      return
    }
    if (!birthMonth || !birthYear) {
      setError('Please select both your birth month and year.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveIdentity({
          genderIdentity: value as GenderIdentity,
          preferredName: trimmedName,
          birthMonth: Number(birthMonth),
          birthYear: Number(birthYear),
        })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef}>
      {/* Heading — progress lives in the wizard header's StepCounter, so this
          step carries no eyebrow of its own. */}
      <h2
        data-reveal
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 300,
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
          color: 'var(--color-alabaster-50)',
          margin: '0 0 2.5rem',
        }}
      >
        Tell us a bit
        <br />
        about you.
      </h2>

      {/* ── Preferred name ── */}
      <div data-reveal style={{ marginBottom: '2rem' }}>
        <label htmlFor={nameId} style={GROUP_LABEL}>
          What should we call you?
        </label>
        <input
          id={nameId}
          type="text"
          value={preferredName}
          onChange={(e) => onPreferredNameChange(e.target.value)}
          placeholder="Enter your preferred name"
          maxLength={PREFERRED_NAME_MAX_LENGTH}
          autoComplete="given-name"
          required
          aria-required="true"
          style={CONTROL_BASE}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-sienna-400)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(184,134,61,0.28)' }}
        />
      </div>

      {/* ── Identity ── */}
      <div data-reveal style={{ marginBottom: '2rem' }}>
        <span id={identityLabelId} style={GROUP_LABEL}>
          How do you identify?
        </span>
        <div
          ref={identityGroupRef}
          role="radiogroup"
          aria-labelledby={identityLabelId}
          aria-required="true"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
          }}
        >
          {OPTIONS.map((opt, index) => {
            const isSelected = value === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                data-chip
                aria-checked={isSelected}
                onKeyDown={(e) => handleIdentityKeyDown(e, index)}
                // Roving tabindex: the selected chip (or the first, when none
                // is selected) is the group's single tab stop.
                tabIndex={isSelected || (!value && opt.value === OPTIONS[0].value) ? 0 : -1}
                onClick={() => onChange(opt.value)}
                style={{
                  ...CONTROL_BASE,
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--color-sienna-400)' : 'rgba(184,134,61,0.28)',
                  backgroundColor: isSelected ? 'rgba(184,134,61,0.10)' : 'transparent',
                  color: isSelected ? 'var(--color-sienna-300)' : 'var(--color-alabaster-300)',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Birth month / year ── */}
      <div data-reveal style={{ marginBottom: '0.5rem' }}>
        <span style={GROUP_LABEL}>When were you born?</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
          <div>
            <span
              id={monthLabelId}
              className="label-caps"
              style={{ display: 'block', color: 'var(--color-alabaster-400)', marginBottom: '0.5rem' }}
            >
              Month
            </span>
            <LuxurySelect
              labelId={monthLabelId}
              value={birthMonth}
              onChange={onBirthMonthChange}
              options={monthOptions}
              placeholder="Select month"
            />
          </div>

          <div>
            <span
              id={yearLabelId}
              className="label-caps"
              style={{ display: 'block', color: 'var(--color-alabaster-400)', marginBottom: '0.5rem' }}
            >
              Year
            </span>
            <LuxurySelect
              labelId={yearLabelId}
              value={birthYear}
              onChange={onBirthYearChange}
              options={yearOptions}
              placeholder="Select year"
            />
          </div>
        </div>
      </div>

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

      {/* Back returns to the step 0 transition screen. */}
      <StepFooter
        onContinue={handleContinue}
        onBack={onBack}
        isLoading={isPending}
        continueDisabled={!canContinue}
      />
    </div>
  )
}
