'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { gsap } from 'gsap'
import { Info, Sprout, Compass, Sparkles, Gem } from 'lucide-react'
import { StepFooter } from './StepFooter'
import { SelectionRow } from './SelectionRow'
import { InfoSheet, type InfoSheetItem } from './InfoSheet'
import { saveExperienceLevel } from '@/app/actions/onboarding'
import type { ExperienceLevel } from '@prisma/client'

const ICON_SIZE = 20
const ICON_STROKE = 1.5

const LEVELS: { value: ExperienceLevel; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'BEGINNER',
    label: 'New to skincare',
    description: 'You are beginning to build habits or explore products and routines.',
    icon: <Sprout size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  },
  {
    value: 'INTERMEDIATE',
    label: 'Somewhat experienced',
    description: 'You have a basic understanding and some routine consistency.',
    icon: <Compass size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  },
  {
    value: 'ADVANCED',
    label: 'Experienced',
    description: 'You understand ingredients, actives, and how routines work.',
    icon: <Sparkles size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  },
  {
    value: 'ENTHUSIAST',
    label: 'Skincare obsessive',
    description: 'Skincare is a passion and you enjoy continuous refinement and tracking.',
    icon: <Gem size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  },
]

const DEFINITION_ITEMS: InfoSheetItem[] = LEVELS.map((l) => ({
  value: l.value,
  label: l.label,
  description: l.description,
  icon: l.icon,
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
  level: string
  onChange: (v: string) => void
  onContinue: () => void
  onBack: () => void
}

export function StepExperience({ level, onChange, onContinue, onBack }: Props) {
  const cardsRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useEffect(() => {
    const cards = cardsRef.current?.querySelectorAll('[data-row]')
    const ctx = gsap.context(() => {
      if (cards?.length) {
        gsap.fromTo(
          cards,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out', delay: 0.15 }
        )
      }
    })
    return () => ctx.revert()
  }, [])

  const handleContinue = () => {
    if (!level) {
      setError('Please select your experience level.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveExperienceLevel(level as ExperienceLevel)
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  /** Arrow keys move between rows and select as they go, per the WAI-ARIA
   *  radiogroup pattern. Wraps around at both ends. */
  const handleLevelKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta =
      e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1
      : 0
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + LEVELS.length) % LEVELS.length
    onChange(LEVELS[next].value)
    const rows = cardsRef.current?.querySelectorAll<HTMLButtonElement>('[data-row]')
    rows?.[next]?.focus()
  }

  return (
    <div>
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
        How would you describe
        <br />
        your experience with skincare?
      </h2>

      <p style={SUB_COPY}>This helps tailor the Studio to you.</p>

      <div
        ref={cardsRef}
        role="radiogroup"
        aria-label="Skincare experience level"
        style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
      >
        {LEVELS.map((l, index) => {
          const isSelected = level === l.value
          return (
            <SelectionRow
              key={l.value}
              role="radio"
              label={l.label}
              isSelected={isSelected}
              tabIndex={isSelected || (!level && index === 0) ? 0 : -1}
              onClick={() => onChange(l.value)}
              onKeyDown={(e) => handleLevelKeyDown(e, index)}
              onInfoClick={() => setIsSheetOpen(true)}
              infoLabel={`See the definition of "${l.label}"`}
            />
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setIsSheetOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          margin: '1.25rem auto 0',
          padding: '0.25rem 0.5rem',
          border: 'none',
          background: 'transparent',
          color: 'var(--color-sienna-400)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.8125rem',
          cursor: 'pointer',
        }}
      >
        Tap the
        <Info size={14} strokeWidth={1.5} aria-hidden="true" />
        icon to see definitions
      </button>

      {error && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: 'var(--color-blush-500)',
            marginTop: '1rem',
          }}
        >
          {error}
        </p>
      )}

      <StepFooter
        onContinue={handleContinue}
        onBack={onBack}
        isLoading={isPending}
        continueDisabled={!level}
      />

      <InfoSheet
        title="Experience level definitions"
        items={DEFINITION_ITEMS}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        activeValue={level || undefined}
      />
    </div>
  )
}
