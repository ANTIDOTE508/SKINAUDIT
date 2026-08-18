'use client'

import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { Camera, Search, Pencil } from 'lucide-react'
import { StepHeader } from './StepHeader'

const ICON_SIZE = 26
const ICON_STROKE = 1.5

// All three routes are placeholders until the product flows are built; they
// render disabled so the step still communicates what's coming without
// offering an action that goes nowhere.
const ADD_METHODS = [
  {
    value: 'search',
    label: 'Search',
    description: 'Search by product name or brand',
    icon: <Search size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  },
  {
    value: 'scan',
    label: 'Scan',
    description: 'Use your camera to scan the label',
    icon: <Camera size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  },
  {
    value: 'manual',
    label: 'Add manually',
    description: 'Enter details manually',
    icon: <Pencil size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  },
]

type Props = {
  onBack: () => void
  onComplete?: () => Promise<void>
}

export function StepProducts({ onBack, onComplete }: Props) {
  const actionsRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)

  const [isFinishing, setIsFinishing] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = actionsRef.current?.querySelectorAll('[data-card]')
      if (cards?.length) {
        gsap.fromTo(
          cards,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.09, ease: 'power2.out', delay: 0.25 }
        )
      }
      if (navRef.current) {
        gsap.fromTo(
          navRef.current,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.55 }
        )
      }
    })
    return () => ctx.revert()
  }, [])

  const handleFinish = async () => {
    setIsFinishing(true)
    setFinishError(null)
    try {
      // onComplete navigates away on success, so isFinishing is deliberately
      // left true — resetting it would flash the idle label mid-navigation.
      if (onComplete) await onComplete()
    } catch {
      setFinishError('Something went wrong. Please try again.')
      setIsFinishing(false)
    }
  }

  return (
    <div>
      {/* No eyebrow: progress lives in the wizard header's StepCounter, which
          is the single source of truth for the step number. A second
          hardcoded "n / total" string here has to be hand-synced on every
          step insertion and has already drifted out of date once. */}
      <StepHeader
        title="Add your first product"
        subtitle="Choose how you'd like to add it."
      />

      {/* Add-method cards */}
      <div
        ref={actionsRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(9.5rem, 1fr))',
          gap: '0.875rem',
          marginBottom: '1.25rem',
        }}
      >
        {ADD_METHODS.map((method) => (
          <button
            key={method.value}
            type="button"
            data-card
            disabled
            aria-label={`${method.label} — coming soon`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '0.75rem',
              padding: '1.75rem 1rem',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-accent-border)',
              backgroundColor: 'var(--color-surface)',
              cursor: 'not-allowed',
              opacity: 0.75,
              textAlign: 'center',
            }}
          >
            <span aria-hidden="true" style={{ display: 'flex', color: 'var(--color-sienna-400)' }}>
              {method.icon}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                fontSize: '0.9375rem',
                color: 'var(--color-alabaster-100)',
              }}
            >
              {method.label}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 300,
                fontSize: '0.75rem',
                lineHeight: 1.45,
                color: 'var(--color-alabaster-400)',
              }}
            >
              {method.description}
            </span>
          </button>
        ))}
      </div>

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '0.8125rem',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          margin: '0 0 2rem',
        }}
      >
        You can always edit or refine later.
      </p>

      {finishError && (
        <p
          role="alert"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: 'var(--color-blush-500)',
            marginBottom: '1rem',
          }}
        >
          {finishError}
        </p>
      )}

      <div ref={navRef} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary"
          style={{ minHeight: '52px' }}
          disabled={isFinishing}
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={handleFinish}
          className="btn-primary"
          style={{ minHeight: '52px', flex: 1, minWidth: '200px' }}
          disabled={isFinishing}
        >
          {isFinishing ? 'Setting up your space…' : 'Continue to Studio'}
        </button>
      </div>
    </div>
  )
}
