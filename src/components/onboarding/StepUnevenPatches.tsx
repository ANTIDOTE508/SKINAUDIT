'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { RadioPill } from './RadioPill'
import { saveUnevenPatches } from '@/app/actions/onboarding'
import type { TanPattern } from '@prisma/client'

const OPTIONS: { value: TanPattern; title: string }[] = [
  { value: 'EVEN_TAN', title: 'It tans fairly evenly' },
  { value: 'UNEVEN_PATCHES', title: 'I develop uneven patches or darker spots' },
  { value: 'BURN_PEEL', title: 'I burn and peel, rather than tan' },
  { value: 'NO_CHANGE', title: "I don't notice much change either way" },
]

type Props = {
  value: TanPattern | null
  onChange: (v: TanPattern) => void
  onContinue: () => void
  onBack: () => void
}

export function StepUnevenPatches({ value, onChange, onContinue, onBack }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const groupLabelId = useId()

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
    const pills = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-radio-pill]')
    pills?.[next]?.focus()
  }


  const handleContinue = () => {
    if (value == null) {
      setError('Please choose the answer closest to your experience.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveUnevenPatches(value)
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div ref={rootRef}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '30rem' }}>
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
          After significant sun exposure — a full day outside, a beach weekend —
          does your skin tend to tan evenly, or do you develop uneven patches or
          darker spots in certain areas?
        </h2>

        <span
          id={groupLabelId}
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
          How your skin responds to significant sun exposure
        </span>

        <div
          ref={listRef}
          role="radiogroup"
          aria-labelledby={groupLabelId}
          aria-required="true"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
          }}
        >
          {OPTIONS.map((option, index) => {
            const isSelected = value === option.value
            return (
              <div key={option.value} data-reveal>
                <RadioPill
                  value={option.value}
                  title={option.title}
                  ariaLabel={option.title}
                  selected={isSelected}
                  onChange={(v) => onChange(v as TanPattern)}
                  tabIndex={isSelected || (value == null && index === 0) ? 0 : -1}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
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
          continueDisabled={value == null}
        />
      </div>
    </div>
  )
}
