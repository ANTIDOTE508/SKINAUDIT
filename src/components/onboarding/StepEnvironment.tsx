'use client'

import { useRef, useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { gsap } from 'gsap'
import { MapPin } from 'lucide-react'
import { StepFooter } from './StepFooter'
import { CityAutocomplete } from './CityAutocomplete'
import { detectSeason, detectClimateZone, reverseGeocode } from './environmentAutoDetect'
import { saveEnvironment } from '@/app/actions/onboarding'
import type { ClimateZone, Season } from '@prisma/client'

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
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [countryName, setCountryName] = useState('')

  // Two-state screen: 'ask' shows the geolocation permission prompt, 'manual'
  // shows the city + climate + season form. A resuming user who already has an
  // answer skips straight to 'manual' so they can review/adjust it.
  const hasSavedAnswer = Boolean(climateZone || season || city)
  const [mode, setMode] = useState<'ask' | 'manual'>(hasSavedAnswer ? 'manual' : 'ask')
  // idle → requesting → (done | denied | error), or 'declined' if the user
  // taps Decline. Anything other than idle/requesting reveals the "Set
  // location manually" secondary link.
  const [geoStatus, setGeoStatus] = useState<
    'idle' | 'requesting' | 'done' | 'denied' | 'error' | 'declined'
  >('idle')
  const geoAbortRef = useRef<AbortController | null>(null)

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
    return () => geoAbortRef.current?.abort()
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

  const handleAllowLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('error')
      return
    }
    setError(null)
    setGeoStatus('requesting')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude

        // Season is a pure function of latitude + today's date — set it now.
        const patch: Partial<EnvironmentData> = { season: detectSeason(lat) }

        const controller = new AbortController()
        geoAbortRef.current = controller

        Promise.allSettled([
          detectClimateZone(lat, lng, controller.signal),
          reverseGeocode(lat, lng, controller.signal),
        ]).then(([climateRes, geoRes]) => {
          if (controller.signal.aborted) return

          const zone = climateRes.status === 'fulfilled' ? climateRes.value : null
          const place = geoRes.status === 'fulfilled' ? geoRes.value : null

          if (zone) patch.climateZone = zone
          if (place) {
            patch.city = place.city
            patch.countryCode = place.countryCode
          }

          update(patch)
          setSeasonAutoDetected(true)
          if (zone) setClimateAutoDetected(true)
          setGeoStatus('done')

          // Nothing usable came back — hand the user to the manual form.
          if (!zone && !place) setMode('manual')
        })
      },
      (err) => {
        setGeoStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error')
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 }
    )
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
  // Climate and season are no longer shown or picked on screen — they are
  // derived from the location (lat/lng + date) and persisted in the
  // background. Continue only gates on having a valid city.
  const canContinue = hasValidCity

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
    }, node)
    return () => ctx.revert()
  }, [])

  const persist = () => {
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

  const handleContinue = () => {
    if (!canContinue) return
    persist()
  }

  // Manual form is shown when the user opted into it, or when a geolocation
  // lookup produced at least one usable field (so it can be reviewed/adjusted).
  const showManualForm = mode === 'manual' || geoStatus === 'done'
  const showManualFallbackLink =
    mode === 'ask' &&
    (geoStatus === 'denied' || geoStatus === 'error' || geoStatus === 'declined')

  // Climate/season are still derived and persisted, just no longer surfaced
  // in this summary line.
  const detectedSummary = city && countryName ? `${city}, ${countryName}` : city || ''

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
          SkinAudit uses your general location to understand the environment
          around your routine.
        </h2>

        <p data-reveal style={SUB_COPY}>
          Allow location and we&apos;ll handle the context automatically. We care
          about the city you&apos;re in, not your home address.
        </p>

        {/* ── State A: geolocation permission prompt ── */}
        {!showManualForm && (
          <div data-reveal style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
              <button
                type="button"
                onClick={handleAllowLocation}
                disabled={geoStatus === 'requesting'}
                className="btn-primary"
                style={{
                  minHeight: '52px',
                  paddingLeft: '2.5rem',
                  paddingRight: '2.5rem',
                }}
              >
                {geoStatus === 'requesting' ? 'Detecting…' : 'Allow location access'}
              </button>

              {geoStatus !== 'requesting' && !showManualFallbackLink && (
                <button
                  type="button"
                  onClick={() => setGeoStatus('declined')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px 0',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    fontWeight: 400,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--color-alabaster-400)',
                    transition: 'color 200ms ease',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-sienna-400)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-alabaster-400)'
                  }}
                >
                  Decline
                </button>
              )}
            </div>

            {showManualFallbackLink && (
              <button
                type="button"
                onClick={() => setMode('manual')}
                style={{
                  display: 'block',
                  marginTop: '1rem',
                  background: 'none',
                  border: 'none',
                  padding: '2px 0',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  fontWeight: 400,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-alabaster-400)',
                  transition: 'color 200ms ease',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-sienna-400)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-alabaster-400)'
                }}
              >
                Set location manually
              </button>
            )}

            {(geoStatus === 'denied' || geoStatus === 'declined') && (
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 300,
                  fontSize: '0.8125rem',
                  lineHeight: 1.6,
                  color: 'var(--color-text-muted)',
                  margin: '0.75rem 0 0',
                  maxWidth: '28rem',
                }}
              >
                No problem — you can set your location manually instead.
              </p>
            )}
            {geoStatus === 'error' && (
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 300,
                  fontSize: '0.8125rem',
                  lineHeight: 1.6,
                  color: 'var(--color-text-muted)',
                  margin: '0.75rem 0 0',
                  maxWidth: '28rem',
                }}
              >
                We couldn&apos;t detect your location. You can set it manually
                instead.
              </p>
            )}

            <StepFooter onContinue={() => {}} onBack={onBack} isLoading={false} continueDisabled />
          </div>
        )}

        {/* ── After a successful detection: confirmation banner ── */}
        {showManualForm && geoStatus === 'done' && detectedSummary && (
          <div
            data-reveal
            style={{
              marginBottom: '1.5rem',
              padding: '0.875rem 1rem',
              borderRadius: 'var(--radius-card)',
              border: '1px solid rgba(184,134,61,0.28)',
              backgroundColor: 'var(--color-accent-subtle)',
            }}
          >
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-body)',
                fontWeight: 300,
                fontSize: '0.8125rem',
                color: 'var(--color-alabaster-50)',
              }}
            >
              Detected: {detectedSummary}
            </span>
            <span
              style={{
                display: 'block',
                marginTop: '0.25rem',
                fontFamily: 'var(--font-body)',
                fontWeight: 300,
                fontSize: '0.6875rem',
                color: 'var(--color-text-muted)',
              }}
            >
              Adjust any field below if it looks off.
            </span>
          </div>
        )}

        {/* ── State B: manual city + climate + season form ── */}
        {showManualForm && (
        <>
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

        {/* Climate and season are intentionally not rendered — they are
            derived from the selected location and persisted in the
            background (see handleCitySelect / handleAllowLocation). */}

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
        </>
        )}
      </div>
    </div>
  )
}
