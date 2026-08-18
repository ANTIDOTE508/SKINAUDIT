'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { StepFooter } from './StepFooter'
import { saveSkinTone } from '@/app/actions/onboarding'
import { SKIN_TONE_SCALE_COUNT } from '@/lib/onboarding-rules'

/** melanin-01 … melanin-11, lightest to darkest. The scale value IS the index
 *  (1-based), so the filename and the stored answer never drift apart. */
const SWATCHES = Array.from({ length: SKIN_TONE_SCALE_COUNT }, (_, i) => {
  const scale = i + 1
  return {
    scale,
    src: `/images/onboarding/step2/melanin-${String(scale).padStart(2, '0')}.webp`,
  }
})

const SUB_COPY: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 300,
  fontSize: '0.9375rem',
  lineHeight: 1.6,
  color: 'var(--color-alabaster-400)',
  margin: '0 0 2.5rem',
}

type Props = {
  value: number | null
  onChange: (v: number) => void
  vitiligo: boolean
  onVitiligoChange: (v: boolean) => void
  onContinue: () => void
  onBack: () => void
}

export function StepSkinTone({
  value,
  onChange,
  vitiligo,
  onVitiligoChange,
  onContinue,
  onBack,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const toneLabelId = useId()
  const vitiligoLabelId = useId()
  const vitiligoDescId = useId()

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
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.09, ease: 'power3.out', delay: 0.15 }
      )
    }, node)
    return () => ctx.revert()
  }, [])

  /** Arrow keys move between swatches and select as they go, per the WAI-ARIA
   *  radiogroup pattern. Wraps around at both ends. */
  const handleToneKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1
      : 0
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + SWATCHES.length) % SWATCHES.length
    onChange(SWATCHES[next].scale)
    const tiles = stripRef.current?.querySelectorAll<HTMLButtonElement>('[data-swatch]')
    tiles?.[next]?.focus()
  }

  const handleContinue = () => {
    if (value == null) {
      setError('Please select the swatch closest to your skin tone.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await saveSkinTone({ skinToneScale: value, vitiligo })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  // Tick position along the rule: centred on the selected swatch's column.
  const tickPercent =
    value == null ? null : ((value - 0.5) / SKIN_TONE_SCALE_COUNT) * 100

  return (
    <div ref={rootRef}>
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
        What best describes
        <br />
        your skin tone?
      </h2>

      <p data-reveal style={SUB_COPY}>
        This helps contextualize how certain ingredients
        <br />
        and environmental factors may affect skin.
      </p>

      {/* ── Swatch strip ── */}
      <div data-reveal style={{ marginBottom: '2.25rem' }}>
        <span
          id={toneLabelId}
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
          Skin tone, from very fair to deep
        </span>

        <div
          ref={stripRef}
          role="radiogroup"
          aria-labelledby={toneLabelId}
          aria-required="true"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${SKIN_TONE_SCALE_COUNT}, 1fr)`,
            gap: '0.375rem',
          }}
        >
          {SWATCHES.map((swatch, index) => {
            const isSelected = value === swatch.scale
            return (
              <button
                key={swatch.scale}
                type="button"
                role="radio"
                data-swatch
                aria-checked={isSelected}
                aria-label={`Skin tone ${swatch.scale} of ${SKIN_TONE_SCALE_COUNT}`}
                onKeyDown={(e) => handleToneKeyDown(e, index)}
                // Roving tabindex: the selected tile (or the first, when none
                // is selected) is the group's single tab stop.
                tabIndex={isSelected || (value == null && index === 0) ? 0 : -1}
                onClick={() => onChange(swatch.scale)}
                className="tone-swatch"
                style={{
                  position: 'relative',
                  padding: 0,
                  aspectRatio: '1 / 2.4',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: isSelected
                    ? '1px solid var(--color-sienna-400)'
                    : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: isSelected ? '0 0 0 2px rgba(184,134,61,0.35)' : 'none',
                  outline: 'none',
                  transition:
                    'border-color var(--duration-micro) var(--ease-luxury), box-shadow var(--duration-micro) var(--ease-luxury)',
                }}
              >
                <Image
                  src={swatch.src}
                  alt=""
                  aria-hidden="true"
                  fill
                  // Eleven tiles share the 680px content column, so each is
                  // ~60px wide — never request more than that.
                  sizes="(max-width: 720px) 9vw, 64px"
                  style={{
                    objectFit: 'cover',
                    opacity: isSelected ? 1 : 0.82,
                    transition: 'opacity var(--duration-micro) var(--ease-luxury)',
                  }}
                />
              </button>
            )
          })}
        </div>

        {/* ── Scale rule with end labels and a tick at the selection ── */}
        <div style={{ marginTop: '1rem' }}>
          <div
            aria-hidden="true"
            style={{ position: 'relative', height: '1px', backgroundColor: 'rgba(184,134,61,0.28)' }}
          >
            {tickPercent !== null && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  left: `${tickPercent}%`,
                  width: '1px',
                  height: '9px',
                  backgroundColor: 'var(--color-sienna-400)',
                  transform: 'translateX(-50%)',
                  transition: 'left var(--duration-micro) var(--ease-luxury)',
                }}
              />
            )}
          </div>
          <div
            aria-hidden="true"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '0.625rem',
            }}
          >
            <span className="label-caps" style={{ color: 'var(--color-alabaster-400)' }}>
              Very fair
            </span>
            <span className="label-caps" style={{ color: 'var(--color-alabaster-400)' }}>
              Deep
            </span>
          </div>
        </div>
      </div>

      {/* ── Vitiligo toggle ── */}
      <div
        data-reveal
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          border: '1px solid rgba(184,134,61,0.28)',
          borderRadius: '4px',
          padding: '1.125rem 1.25rem',
          marginBottom: '0.5rem',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            id={vitiligoLabelId}
            style={{
              display: 'block',
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '0.9375rem',
              color: 'var(--color-alabaster-300)',
            }}
          >
            Do you have vitiligo?
          </span>
          <span
            id={vitiligoDescId}
            style={{
              display: 'block',
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '0.8125rem',
              lineHeight: 1.5,
              color: 'var(--color-alabaster-400)',
              marginTop: '0.25rem',
            }}
          >
            This helps us better interpret sun sensitivity.
          </span>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={vitiligo}
          aria-labelledby={vitiligoLabelId}
          aria-describedby={vitiligoDescId}
          onClick={() => onVitiligoChange(!vitiligo)}
          style={{
            position: 'relative',
            flexShrink: 0,
            width: '48px',
            height: '26px',
            padding: 0,
            borderRadius: '13px',
            cursor: 'pointer',
            outline: 'none',
            border: vitiligo
              ? '1px solid var(--color-sienna-400)'
              : '1px solid rgba(184,134,61,0.28)',
            backgroundColor: vitiligo ? 'rgba(184,134,61,0.22)' : 'transparent',
            transition:
              'background-color var(--duration-micro) var(--ease-luxury), border-color var(--duration-micro) var(--ease-luxury)',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '50%',
              left: vitiligo ? '25px' : '3px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: vitiligo
                ? 'var(--color-sienna-400)'
                : 'var(--color-alabaster-400)',
              transition:
                'left var(--duration-micro) var(--ease-luxury), background-color var(--duration-micro) var(--ease-luxury)',
            }}
          />
        </button>
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
  )
}
