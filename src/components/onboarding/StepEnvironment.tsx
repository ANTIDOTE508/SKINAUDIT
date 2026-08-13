'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { gsap } from 'gsap'
import { StepHeader } from './StepHeader'
import { SelectionCard } from './SelectionCard'
import { StepNav } from './StepNav'
import { saveEnvironment } from '@/app/actions/onboarding'
import type { ClimateZone, Season } from '@prisma/client'

const CLIMATE_ZONES: { value: ClimateZone; label: string; description: string; icon: string }[] = [
  { value: 'DRY', label: 'Dry', description: 'Arid — low humidity, high UV exposure', icon: '☀' },
  { value: 'HUMID', label: 'Humid', description: 'Tropical or subtropical — high moisture', icon: '💧' },
  { value: 'TEMPERATE', label: 'Temperate', description: 'Moderate conditions — seasonal variation', icon: '🌿' },
]

const SEASONS: { value: Season; label: string; icon: string }[] = [
  { value: 'SPRING', label: 'Spring', icon: '🌸' },
  { value: 'SUMMER', label: 'Summer', icon: '☀' },
  { value: 'AUTUMN', label: 'Autumn', icon: '🍂' },
  { value: 'WINTER', label: 'Winter', icon: '❄' },
]

type EnvironmentData = {
  city: string
  countryCode: string
  climateZone: string
  season: string
}

type Props = EnvironmentData & {
  onChange: (data: EnvironmentData) => void
  onContinue: () => void
  onBack: () => void
}

export function StepEnvironment({
  city,
  countryCode,
  climateZone,
  season,
  onChange,
  onContinue,
  onBack,
}: Props) {
  const noticeRef = useRef<HTMLDivElement>(null)
  const climateRef = useRef<HTMLDivElement>(null)
  const seasonRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const update = (patch: Partial<EnvironmentData>) => {
    onChange({ city, countryCode, climateZone, season, ...patch })
  }

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (noticeRef.current) {
        gsap.fromTo(
          noticeRef.current,
          { y: 8, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.3 }
        )
      }

      const climateCards = climateRef.current?.querySelectorAll('[data-card]')
      if (climateCards?.length) {
        gsap.fromTo(
          climateCards,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: 'power2.out', delay: 0.45 }
        )
      }

      const seasonCards = seasonRef.current?.querySelectorAll('[data-card]')
      if (seasonCards?.length) {
        gsap.fromTo(
          seasonCards,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power2.out', delay: 0.65 }
        )
      }
    })
    return () => ctx.revert()
  }, [])

  const handleContinue = () => {
    setError(null)
    startTransition(async () => {
      try {
        await saveEnvironment({
          city: city || undefined,
          countryCode: countryCode || undefined,
          climateZone: (climateZone || undefined) as ClimateZone | undefined,
          season: (season || undefined) as Season | undefined,
        })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  return (
    <div>
      {/* Background scene — portaled to body so GSAP's transform on ancestor
          content doesn't trap this fixed layer inside the wizard's 680px
          column. Unlike step 3, this step's content (form + two card grids)
          spans the full height, so a single full-bleed treatment with a
          strong, even scrim is used across all breakpoints instead of a
          top/bottom gradient — the dense form must stay legible everywhere. */}
      {mounted &&
        createPortal(
          <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none', backgroundColor: 'var(--color-obsidian-950)' }}>
            <Image
              src="/images/onboarding/step5/bg-environment-window.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="step5-bg-image"
            />
            <div className="step5-bg-scrim" />

            <style>{`
              .step5-bg-image {
                object-fit: cover;
                object-position: center 30%;
              }
              @media (min-width: 1024px) {
                .step5-bg-image { object-position: 25% center; }
              }
              .step5-bg-scrim {
                position: absolute;
                inset: 0;
                background:
                  linear-gradient(
                    180deg,
                    rgba(6,5,5,0.55) 0%,
                    rgba(6,5,5,0.45) 40%,
                    rgba(6,5,5,0.65) 100%
                  ),
                  linear-gradient(
                    90deg,
                    rgba(6,5,5,0.2) 0%,
                    rgba(6,5,5,0.55) 55%,
                    rgba(6,5,5,0.7) 100%
                  );
              }
            `}</style>
          </div>,
          document.body
        )}

      <div style={{ position: 'relative', zIndex: 1 }}>
      <StepHeader
        eyebrow="Step 3 of 6"
        title="Where does your skin live?"
        subtitle="Environmental context is one of the most underestimated factors in skincare efficacy."
      />

      {/* Transparency notice */}
      <div
        ref={noticeRef}
        style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-accent-border)',
          backgroundColor: 'var(--color-accent-subtle)',
          marginBottom: '2rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
        }}
      >
        <span style={{ color: 'var(--color-sienna-400)', fontSize: '1rem', flexShrink: 0, marginTop: '2px' }}>
          ✦
        </span>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: 'var(--color-alabaster-400)',
            margin: 0,
          }}
        >
          Your environmental context helps SkinAudit tailor your analysis to your actual conditions.
          You can update this anytime as the season changes or you travel.
        </p>
      </div>

      {/* Location fields */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="env-city" className="label-caps">
            City (optional)
          </label>
          <input
            id="env-city"
            type="text"
            value={city}
            onChange={(e) => update({ city: e.target.value })}
            placeholder="Paris"
            className="input-underline"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="env-country" className="label-caps">
            Country code (optional)
          </label>
          <input
            id="env-country"
            type="text"
            value={countryCode}
            onChange={(e) => update({ countryCode: e.target.value.toUpperCase().slice(0, 2) })}
            placeholder="FR"
            maxLength={2}
            className="input-underline"
            style={{ textTransform: 'uppercase' }}
          />
        </div>
      </div>

      {/* Climate zone */}
      <span
        className="label-caps"
        style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.75rem' }}
      >
        Climate type
      </span>
      <div
        ref={climateRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginBottom: '2rem',
        }}
      >
        {CLIMATE_ZONES.map((zone) => (
          <div key={zone.value} data-card>
            <SelectionCard
              label={zone.label}
              description={zone.description}
              icon={zone.icon}
              isSelected={climateZone === zone.value}
              onClick={() => update({ climateZone: zone.value })}
            />
          </div>
        ))}
      </div>

      {/* Current season */}
      <span
        className="label-caps"
        style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.75rem' }}
      >
        Current season
      </span>
      <div
        ref={seasonRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.625rem',
          marginBottom: '0.5rem',
        }}
      >
        {SEASONS.map((s) => (
          <div key={s.value} data-card>
            <SelectionCard
              label={s.label}
              icon={s.icon}
              isSelected={season === s.value}
              onClick={() => update({ season: s.value })}
            />
          </div>
        ))}
      </div>

      {error && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: 'var(--color-blush-500)',
            marginTop: '0.75rem',
          }}
        >
          {error}
        </p>
      )}

      <StepNav
        onContinue={handleContinue}
        onBack={onBack}
        continueLabel="Continue →"
        isLoading={isPending}
      />
      </div>
    </div>
  )
}
