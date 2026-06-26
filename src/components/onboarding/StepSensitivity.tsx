'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { gsap } from 'gsap'
import { StepHeader } from './StepHeader'
import { StepNav } from './StepNav'
import { saveSensitivity } from '@/app/actions/onboarding'

const TICK_LABELS: Record<number, string> = {
  1: 'Not sensitive',
  2: 'Slightly',
  3: 'Moderately',
  4: 'Quite sensitive',
  5: 'Very sensitive',
}

type Props = {
  sensitivity: number
  goals: string[]
  onSensitivityChange: (v: number) => void
  onGoalsChange: (v: string[]) => void
  onContinue: () => void
  onBack: () => void
}

export function StepSensitivity({ sensitivity, onSensitivityChange, onContinue, onBack }: Props) {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const current = sensitivity || 3

  useEffect(() => {
    const node = sliderRef.current
    const ctx = gsap.context(() => {
      if (node) {
        gsap.fromTo(node, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.25 })
      }
    })
    return () => ctx.revert()
  }, [])

  const fillPct = ((current - 1) / 4) * 100

  const handleContinue = () => {
    setError(null)
    startTransition(async () => {
      try {
        await saveSensitivity(current)
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div>
      <StepHeader
        eyebrow="03 / 08"
        title="How sensitive is your skin?"
        subtitle="This helps calibrate your analysis."
      />

      <div ref={sliderRef} style={{ padding: '1.5rem 0 2.5rem' }}>
        {/* Current label */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 300,
              color: 'var(--color-alabaster-50)',
            }}
          >
            {TICK_LABELS[current]}
          </span>
        </div>

        {/* Slider track + input */}
        <div style={{ position: 'relative', padding: '0 0.5rem' }}>
          {/* Visual track */}
          <div
            style={{
              height: '2px',
              borderRadius: '1px',
              background: `linear-gradient(to right, var(--color-sienna-500) ${fillPct}%, var(--color-obsidian-700) ${fillPct}%)`,
              marginBottom: '0.75rem',
              pointerEvents: 'none',
            }}
          />

          {/* Native input on top */}
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={current}
            onChange={(e) => onSensitivityChange(Number(e.target.value))}
            style={{
              position: 'absolute',
              top: '-10px',
              left: 0,
              right: 0,
              width: '100%',
              opacity: 0,
              cursor: 'pointer',
              height: '24px',
              margin: 0,
            }}
            aria-label="Skin sensitivity"
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={current}
            aria-valuetext={TICK_LABELS[current]}
          />

          {/* Thumb visual */}
          <div
            style={{
              position: 'absolute',
              top: '-9px',
              left: `calc(${fillPct}% - 10px + ${fillPct === 0 ? '0.5rem' : fillPct === 100 ? '-0.5rem' : '0px'})`,
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-sienna-400)',
              pointerEvents: 'none',
              transition: 'left 120ms ease',
            }}
          />

          {/* Tick marks */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: n <= current ? 'var(--color-sienna-500)' : 'var(--color-obsidian-700)',
                    transform: n === current ? 'scale(1.4)' : 'scale(1)',
                    transition: 'all 150ms ease',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Endpoint labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <span className="label-caps" style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>Not sensitive</span>
          <span className="label-caps" style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>Very sensitive</span>
        </div>
      </div>

      {error && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--color-blush-500)', marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      <StepNav onContinue={handleContinue} onBack={onBack} isLoading={isPending} />
    </div>
  )
}
