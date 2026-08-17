'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { gsap } from 'gsap'
import { StepHeader } from './StepHeader'
import { StepFooter } from './StepFooter'
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
  const [mounted, setMounted] = useState(false)
  const current = sensitivity || 3

  useEffect(() => {
    setMounted(true)
  }, [])

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
      {/* Background portrait — portaled to body so GSAP's transform on
          ancestor content doesn't trap this fixed layer inside the wizard's
          680px column. On mobile/tablet it's a full-bleed cover; on large
          screens it's shown at its own proportions (never cropped/stretched),
          centered behind the form with black margins on either side. */}
      {mounted &&
        createPortal(
          <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none', backgroundColor: 'var(--color-obsidian-950)' }}>
            {/* Mobile / tablet — full-bleed cover */}
            <div className="step3-bg-cover">
              <Image
                src="/images/onboarding/step3/bg-sensitivity-portrait.webp"
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 0px, 100vw"
                className="step3-bg-cover-image"
              />
              <div className="step3-bg-scrim" />
            </div>

            {/* Large screens — proportions preserved (never cropped/stretched),
                scaled to a generous height, centered behind the form with
                black margins on either side */}
            <div className="step3-bg-natural">
              <div className="step3-bg-natural-frame">
                <Image
                  src="/images/onboarding/step3/bg-sensitivity-portrait.webp"
                  alt=""
                  width={290}
                  height={425}
                  priority
                  sizes="600px"
                  className="step3-bg-natural-image"
                />
                <div className="step3-bg-natural-vignette" />
              </div>
            </div>

            <style>{`
              .step3-bg-natural { display: none; }
              .step3-bg-cover {
                position: absolute;
                inset: 0;
              }
              .step3-bg-cover-image {
                object-fit: cover;
                object-position: center 30%;
              }
              /* Tablets: wider viewport, image proportionally wider than tall
                 relative to the portrait crop — bring focus back to center */
              @media (min-width: 768px) and (max-width: 1023px) {
                .step3-bg-cover-image { object-position: center 35%; }
              }
              .step3-bg-scrim {
                position: absolute;
                inset: 0;
                background: linear-gradient(
                  0deg,
                  rgba(6,5,5,0.85) 0%,
                  rgba(6,5,5,0.6) 18%,
                  rgba(6,5,5,0.15) 38%,
                  rgba(6,5,5,0.1) 55%,
                  rgba(6,5,5,0.65) 100%
                );
              }
              @media (min-width: 1024px) {
                .step3-bg-cover { display: none; }
                .step3-bg-natural {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  position: absolute;
                  inset: 0;
                }
                .step3-bg-natural-frame {
                  position: relative;
                  height: min(70vh, 640px);
                  max-width: 90vw;
                  -webkit-mask-image: linear-gradient(
                    to right,
                    transparent 0%,
                    rgba(0,0,0,0.5) 6%,
                    #000 16%,
                    #000 84%,
                    rgba(0,0,0,0.5) 94%,
                    transparent 100%
                  ), linear-gradient(
                    to bottom,
                    transparent 0%,
                    rgba(0,0,0,0.6) 6%,
                    #000 18%,
                    #000 88%,
                    transparent 100%
                  );
                  -webkit-mask-composite: source-in;
                  mask-image: linear-gradient(
                    to right,
                    transparent 0%,
                    rgba(0,0,0,0.5) 6%,
                    #000 16%,
                    #000 84%,
                    rgba(0,0,0,0.5) 94%,
                    transparent 100%
                  ), linear-gradient(
                    to bottom,
                    transparent 0%,
                    rgba(0,0,0,0.6) 6%,
                    #000 18%,
                    #000 88%,
                    transparent 100%
                  );
                  mask-composite: intersect;
                  filter: drop-shadow(0 20px 60px rgba(0,0,0,0.45));
                }
                .step3-bg-natural-image {
                  width: auto !important;
                  height: 100% !important;
                  display: block;
                }
                .step3-bg-natural-vignette {
                  position: absolute;
                  inset: 0;
                  pointer-events: none;
                  background: radial-gradient(
                    ellipse at center,
                    transparent 45%,
                    rgba(6,5,5,0.35) 100%
                  );
                }
              }
            `}</style>
          </div>,
          document.body
        )}

      <div style={{ position: 'relative', zIndex: 1 }}>
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
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '11px',
                      color: n === current ? 'var(--color-obsidian-950)' : 'var(--color-text-muted)',
                      backgroundColor: n === current ? 'var(--color-sienna-400)' : 'transparent',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {n}
                  </span>
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

        <StepFooter onContinue={handleContinue} onBack={onBack} isLoading={isPending} />
      </div>
    </div>
  )
}
