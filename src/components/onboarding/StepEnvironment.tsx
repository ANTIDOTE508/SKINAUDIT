'use client'

import { useRef, useEffect, useState, useTransition, useId } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { gsap } from 'gsap'
import { MapPin, Flame, Droplet, Cloud, Snowflake, Flower, Sun, Leaf } from 'lucide-react'
import { StepFooter } from './StepFooter'
import { CityAutocomplete } from './CityAutocomplete'
import { detectSeason, detectClimateZone } from './environmentAutoDetect'
import { saveEnvironment } from '@/app/actions/onboarding'
import type { ClimateZone, Season } from '@prisma/client'

const ICON_SIZE = 20
const ICON_STROKE = 1.5

// UI label diverges from the Prisma enum value for TEMPERATE: the screenshot
// calls this "Moderate (humid)" — the underlying ClimateZone.TEMPERATE value
// is unchanged, this is a display-only relabel, not a schema change.
const CLIMATE_ZONES: { value: ClimateZone; label: string; icon: React.ReactNode }[] = [
  { value: 'DRY', label: 'Dry', icon: <Flame size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'TEMPERATE', label: 'Moderate (humid)', icon: <Droplet size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'HUMID', label: 'Humid', icon: <Cloud size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
]

// UI label diverges from the Prisma enum value for AUTUMN: the screenshot
// calls this "Fall" — the underlying Season.AUTUMN value is unchanged, this
// is a display-only relabel, not a schema change. Order matches the
// screenshot: Winter, Spring, Summer, Fall.
const SEASONS: { value: Season; label: string; icon: React.ReactNode }[] = [
  { value: 'WINTER', label: 'Winter', icon: <Snowflake size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'SPRING', label: 'Spring', icon: <Flower size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'SUMMER', label: 'Summer', icon: <Sun size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { value: 'AUTUMN', label: 'Fall', icon: <Leaf size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
]

const SUB_COPY: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 300,
  fontSize: '0.9375rem',
  lineHeight: 1.6,
  color: 'var(--color-alabaster-400)',
  margin: '0 0 2.25rem',
}

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
  const rootRef = useRef<HTMLDivElement>(null)
  const climateRef = useRef<HTMLDivElement>(null)
  const seasonRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [countryName, setCountryName] = useState('')

  const climateLabelId = useId()
  const seasonLabelId = useId()

  // Latest props, read inside the async auto-detect flow below so we never
  // overwrite a value the user already set (manually, or from a prior resume)
  // between the fetch starting and resolving, and never dispatch a patch
  // built from stale city/countryCode/climateZone/season closures.
  const propsRef = useRef({ city, countryCode, climateZone, season })
  propsRef.current = { city, countryCode, climateZone, season }
  const climateFetchRef = useRef<AbortController | null>(null)
  // Tracked independently: a city pick can auto-fill one field while the
  // other was already answered manually, so a single shared flag would show
  // the "auto-detected" caption on the wrong section.
  const [climateAutoDetected, setClimateAutoDetected] = useState(false)
  const [seasonAutoDetected, setSeasonAutoDetected] = useState(false)
  // Mirrors of the two flags above, read inside the async detectClimateZone
  // .then() callback so it sees the flag's value at *resolution* time rather
  // than the stale value closed over when the fetch started.
  const climateAutoDetectedRef = useRef(climateAutoDetected)
  climateAutoDetectedRef.current = climateAutoDetected

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    return () => climateFetchRef.current?.abort()
  }, [])

  useEffect(() => {
    if (!countryCode) {
      setCountryName('')
      return
    }
    let cancelled = false
    import('country-state-city').then(({ Country }) => {
      if (cancelled) return
      setCountryName(Country.getCountryByCode(countryCode)?.name ?? '')
    })
    return () => {
      cancelled = true
    }
  }, [countryCode])

  const update = (patch: Partial<EnvironmentData>) => {
    onChange({ ...propsRef.current, ...patch })
  }

  const handleCitySelect = ({
    city: selectedCity,
    countryCode: selectedCountryCode,
    latitude,
    longitude,
  }: {
    city: string
    countryCode: string
    latitude: string | null
    longitude: string | null
  }) => {
    // Cancel any in-flight climate fetch from a previously selected city —
    // its result would otherwise land after this newer selection.
    climateFetchRef.current?.abort()

    const lat = latitude !== null ? Number(latitude) : NaN
    const lng = longitude !== null ? Number(longitude) : NaN
    const canAutoDetect = Boolean(selectedCity) && !Number.isNaN(lat) && !Number.isNaN(lng)

    // A different city is being picked than the one currently on file, so
    // climate/season must be re-derived for it — e.g. Paris -> Rio de
    // Janeiro. This also covers the resume case: on mount, climateZone/season
    // can already be filled from the DB but climateAutoDetected/
    // seasonAutoDetected both start false (they're local state, not
    // persisted), so relying on those flags alone would wrongly treat a
    // resumed value as a manual answer and block re-detection on the very
    // first city change after reload. Re-detect UNLESS the current value is
    // a manual user choice for *this* city (a card click/keypress after
    // landing on it clears the auto-detected flag) — never clobber something
    // the user explicitly picked for the city they're currently on.
    const isDifferentCity = selectedCity !== propsRef.current.city
    const canOverrideSeason = isDifferentCity || seasonAutoDetected || !propsRef.current.season
    const canOverrideClimate = isDifferentCity || climateAutoDetected || !propsRef.current.climateZone

    // Single patch/update call: propsRef.current only refreshes on the next
    // render, so multiple sequential update() calls in this same handler
    // would each merge against the same stale snapshot and the last one to
    // dispatch would clobber city/countryCode set by the earlier calls.
    const patch: Partial<EnvironmentData> = { city: selectedCity, countryCode: selectedCountryCode }
    if (canAutoDetect && canOverrideSeason) {
      patch.season = detectSeason(lat)
      setSeasonAutoDetected(true)
    }
    update(patch)

    if (canAutoDetect && canOverrideClimate) {
      const controller = new AbortController()
      climateFetchRef.current = controller
      detectClimateZone(lat, lng, controller.signal).then((zone) => {
        if (controller.signal.aborted || !zone) return
        // Re-check at resolution time in case the user manually picked a
        // climate while the fetch was in flight — but only treat it as a
        // manual pick if it happened for *this* city (isDifferentCity was
        // already true when the fetch started, so a still-false
        // climateAutoDetectedRef here can't be a stale resume value from
        // the previous city, only a genuine manual override made since).
        if (!isDifferentCity && !climateAutoDetectedRef.current && propsRef.current.climateZone) return
        update({ climateZone: zone })
        setClimateAutoDetected(true)
      })
    }
  }

  const hasValidCity = Boolean(city && countryCode)
  const canContinue = hasValidCity && Boolean(climateZone) && Boolean(season)

  useEffect(() => {
    const node = rootRef.current
    if (!node) return
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      const blocks = node.querySelectorAll('[data-reveal]')
      if (reduced) {
        if (blocks.length) gsap.set(blocks, { y: 0, opacity: 1 })
        return
      }
      if (blocks.length) {
        gsap.fromTo(
          blocks,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, stagger: 0.09, ease: 'power3.out', delay: 0.15 }
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
    }, node)
    return () => ctx.revert()
  }, [])

  /** Arrow keys move between cards and select as they go, per the WAI-ARIA
   *  radiogroup pattern. Wraps around at both ends. */
  const handleClimateKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1
      : 0
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + CLIMATE_ZONES.length) % CLIMATE_ZONES.length
    update({ climateZone: CLIMATE_ZONES[next].value })
    setClimateAutoDetected(false)
    const cards = climateRef.current?.querySelectorAll<HTMLButtonElement>('[data-card]')
    cards?.[next]?.focus()
  }

  const handleSeasonKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1
      : 0
    if (delta === 0) return
    e.preventDefault()
    const next = (index + delta + SEASONS.length) % SEASONS.length
    update({ season: SEASONS[next].value })
    setSeasonAutoDetected(false)
    const cards = seasonRef.current?.querySelectorAll<HTMLButtonElement>('[data-card]')
    cards?.[next]?.focus()
  }

  const handleContinue = () => {
    if (!canContinue) return
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
    <div ref={rootRef}>
      {/* Background scene — portaled to body so GSAP's transform on ancestor
          content doesn't trap this fixed layer inside the wizard's 680px
          column. This step's content (form + two card grids) spans the full
          height, so a single full-bleed treatment with a strong, even scrim
          is used across all breakpoints instead of a top/bottom gradient —
          the dense form must stay legible everywhere. */}
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
        {/* Heading — progress lives in the wizard header's StepCounter, so
            this step carries no eyebrow of its own, matching every other
            rebuilt step. */}
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
            textShadow: '0 1px 24px rgba(6,5,5,0.7)',
          }}
        >
          Where do you live
          <br />
          most of the time?
        </h2>

        <p data-reveal style={SUB_COPY}>
          We factor in environment, season, and climate.
        </p>

        {/* Location field — city autocomplete, country deduced automatically */}
        <div data-reveal style={{ marginBottom: '2rem' }}>
          <span className="label-caps" style={{ display: 'block', marginBottom: '0.75rem' }}>
            Current location
          </span>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              border: '1px solid rgba(184,134,61,0.28)',
              borderRadius: '4px',
              padding: '0.9375rem 1.125rem',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <CityAutocomplete city={city} countryName={countryName} onSelect={handleCitySelect} />
            </div>
            <MapPin
              size={18}
              strokeWidth={1.5}
              aria-hidden="true"
              style={{ flexShrink: 0, color: 'var(--color-sienna-400)' }}
            />
          </div>
        </div>

        {/* Climate */}
        <div data-reveal style={{ marginBottom: '2rem' }}>
          <span
            id={climateLabelId}
            className="label-caps"
            style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}
          >
            Climate
            {climateAutoDetected && (
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 300,
                  fontSize: '0.6875rem',
                  letterSpacing: 'normal',
                  textTransform: 'none',
                  color: 'var(--color-text-muted)',
                }}
              >
                auto-detected from your city — tap to adjust
              </span>
            )}
          </span>
          <div
            ref={climateRef}
            role="radiogroup"
            aria-labelledby={climateLabelId}
            aria-required="true"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
            }}
          >
            {CLIMATE_ZONES.map((zone, index) => {
              const isSelected = climateZone === zone.value
              return (
                <button
                  key={zone.value}
                  type="button"
                  role="radio"
                  data-card
                  aria-checked={isSelected}
                  aria-label={zone.label}
                  tabIndex={isSelected || (!climateZone && index === 0) ? 0 : -1}
                  onKeyDown={(e) => handleClimateKeyDown(e, index)}
                  onClick={() => {
                    update({ climateZone: zone.value })
                    setClimateAutoDetected(false)
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.625rem',
                    padding: '1.125rem 0.75rem',
                    borderRadius: 'var(--radius-card)',
                    border: isSelected
                      ? '1.5px solid var(--color-sienna-400)'
                      : '1px solid var(--color-border)',
                    backgroundColor: isSelected
                      ? 'var(--color-accent-subtle)'
                      : 'var(--color-surface)',
                    cursor: 'pointer',
                    outline: 'none',
                    transition:
                      'border-color 180ms var(--ease-luxury), background-color 180ms var(--ease-luxury)',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: isSelected
                        ? '1px solid var(--color-sienna-400)'
                        : '1px solid rgba(184,134,61,0.28)',
                      color: isSelected ? 'var(--color-sienna-400)' : 'var(--color-alabaster-400)',
                      transition: 'border-color 180ms var(--ease-luxury), color 180ms var(--ease-luxury)',
                    }}
                  >
                    {zone.icon}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 300,
                      fontSize: '0.8125rem',
                      textAlign: 'center',
                      color: isSelected ? 'var(--color-alabaster-50)' : 'var(--color-alabaster-300)',
                      transition: 'color 180ms ease',
                    }}
                  >
                    {zone.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Season */}
        <div data-reveal style={{ marginBottom: '0.5rem' }}>
          <span
            id={seasonLabelId}
            className="label-caps"
            style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}
          >
            Season
            {seasonAutoDetected && (
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 300,
                  fontSize: '0.6875rem',
                  letterSpacing: 'normal',
                  textTransform: 'none',
                  color: 'var(--color-text-muted)',
                }}
              >
                auto-detected from your city — tap to adjust
              </span>
            )}
          </span>
          <div
            ref={seasonRef}
            role="radiogroup"
            aria-labelledby={seasonLabelId}
            aria-required="true"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.625rem',
            }}
          >
            {SEASONS.map((s, index) => {
              const isSelected = season === s.value
              return (
                <button
                  key={s.value}
                  type="button"
                  role="radio"
                  data-card
                  aria-checked={isSelected}
                  aria-label={s.label}
                  tabIndex={isSelected || (!season && index === 0) ? 0 : -1}
                  onKeyDown={(e) => handleSeasonKeyDown(e, index)}
                  onClick={() => {
                    update({ season: s.value })
                    setSeasonAutoDetected(false)
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '1rem 0.5rem',
                    borderRadius: 'var(--radius-card)',
                    border: isSelected
                      ? '1.5px solid var(--color-sienna-400)'
                      : '1px solid var(--color-border)',
                    backgroundColor: isSelected
                      ? 'var(--color-accent-subtle)'
                      : 'var(--color-surface)',
                    cursor: 'pointer',
                    outline: 'none',
                    transition:
                      'border-color 180ms var(--ease-luxury), background-color 180ms var(--ease-luxury)',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: isSelected
                        ? '1px solid var(--color-sienna-400)'
                        : '1px solid rgba(184,134,61,0.28)',
                      color: isSelected ? 'var(--color-sienna-400)' : 'var(--color-alabaster-400)',
                      transition: 'border-color 180ms var(--ease-luxury), color 180ms var(--ease-luxury)',
                    }}
                  >
                    {s.icon}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 300,
                      fontSize: '0.8125rem',
                      textAlign: 'center',
                      color: isSelected ? 'var(--color-alabaster-50)' : 'var(--color-alabaster-300)',
                      transition: 'color 180ms ease',
                    }}
                  >
                    {s.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <p
            role="alert"
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
