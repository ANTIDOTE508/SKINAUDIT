'use client'

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { StepFooter } from './StepFooter'
import { detectSeason, detectClimateZone } from './environmentAutoDetect'
import {
  countryName,
  guessCityFromTimeZone,
  loadGeoData,
  placeLine,
  resolveSavedCity,
  searchCities,
  snapToCity,
  type City,
  type GeoData,
} from './location/geoData'
import { WorldMap } from './location/worldMap'
import { saveEnvironment } from '@/app/actions/onboarding'
import type { ClimateZone, Season } from '@prisma/client'
import './location/stepLocation.css'

// Screen 20 — dot-matrix world map (templates/stepLocation/stepLocation.html,
// spec in stepLocation_spec.md). Three ways to set the city — search, tap the
// map, Locate me — all end in the same flight + pin drop. Only the city and
// country are kept; climate and season are derived from the city's
// coordinates and persisted in the background, never shown on screen.

// "I split my time between two places" is built but off. Preview it by
// opening the onboarding with #multicity at the end of the URL. The second
// city is not persisted yet (no column for it).
const FEATURES = { multiCity: false }

const noopSubscribe = () => () => {}

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
  // createPortal needs a real <body> — only available after mount.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const multiCity = useSyncExternalStore(
    noopSubscribe,
    () => FEATURES.multiCity || location.hash === '#multicity',
    () => FEATURES.multiCity,
  )
  const [data, setData] = useState<GeoData | null>(null)
  const [loadError, setLoadError] = useState(false)

  const [main, setMain] = useState<City | null>(null)
  const [second, setSecond] = useState<City | null>(null)
  const [split, setSplit] = useState(false)
  const [slot, setSlot] = useState<0 | 1>(0)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<City[]>([])
  const [listOpen, setListOpen] = useState(false)
  const [active, setActive] = useState(0)

  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [hintVisible, setHintVisible] = useState(true)
  const [locating, setLocating] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<WorldMap | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // In-flight climate lookup for the committed city; Next awaits it so the
  // saved climate always belongs to the saved city.
  const climateFetch = useRef<{
    controller: AbortController
    promise: Promise<ClimateZone | null>
  } | null>(null)
  // The City last committed — compared by identity, so two same-name cities
  // in one country (Springfield IL / MO) still count as a change.
  const committedRef = useRef<City | null>(null)
  // Set once the user picks a city, so the async opening move never
  // overrides their choice.
  const userPickedRef = useRef(false)
  // False after unmount (e.g. Back during the location permission prompt).
  const aliveRef = useRef(true)

  // Latest props, read from async callbacks so a resolved climate lookup is
  // merged into fresh city/season values instead of a stale closure.
  const propsRef = useRef({ city, countryCode, climateZone, season })
  // Latest pin state, read from the map's tap callback (bound once).
  const pinsRef = useRef({ main, second, split, slot })
  useLayoutEffect(() => {
    propsRef.current = { city, countryCode, climateZone, season }
    pinsRef.current = { main, second, split, slot }
  })

  useEffect(() => {
    aliveRef.current = true
    let cancelled = false
    loadGeoData()
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setLoadError(true))
    return () => {
      cancelled = true
      aliveRef.current = false
      climateFetch.current?.controller.abort()
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  // The wizard's own header (counter + sign out) stays visible: the map layer
  // starts right under it, tracking its height across breakpoints.
  useLayoutEffect(() => {
    const root = rootRef.current
    const header = document.querySelector<HTMLElement>('[data-onboarding-header]')
    if (!root || !header) return
    const sync = () => root.style.setProperty('--sl-top', `${header.getBoundingClientRect().bottom}px`)
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(header)
    return () => ro.disconnect()
  }, [mounted])

  const toast = (msg: string) => {
    setToastMsg(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200)
  }

  /** Make `c` the user's city: persistable fields + derived climate/season. */
  const commit = (c: City) => {
    const prev = propsRef.current
    const committed = committedRef.current
    // Before any commit, the saved props are the reference (resume case).
    const sameCity = committed
      ? committed === c
      : prev.city === c.name && prev.countryCode === c.cc
    committedRef.current = c
    if (sameCity && climateFetch.current) return
    climateFetch.current?.controller.abort()
    climateFetch.current = null
    onChange({
      ...prev,
      city: c.name,
      countryCode: c.cc,
      season: sameCity && prev.season ? prev.season : detectSeason(c.lat),
      climateZone: sameCity ? prev.climateZone : '',
    })
    if (sameCity && prev.climateZone) return
    const controller = new AbortController()
    const promise = detectClimateZone(c.lat, c.lon, controller.signal)
    climateFetch.current = { controller, promise }
    promise.then((zone) => {
      if (controller.signal.aborted || !zone || committedRef.current !== c) return
      onChange({ ...propsRef.current, climateZone: zone })
    })
  }

  const choose = (c: City, how: 'search' | 'tap' | 'city' | 'locate') => {
    const { main: m, second: s, split: sp, slot: sl } = pinsRef.current
    const target = how === 'locate' || !sp ? 0 : sl
    if (target === 1 && m && c === m) {
      toast("That's already your main city")
      return
    }
    const nextMain = target === 0 ? c : m
    const nextSecond = target === 1 ? c : s
    userPickedRef.current = true
    if (target === 0) {
      setMain(c)
      commit(c)
    } else setSecond(c)
    mapRef.current?.setPins(nextMain, nextSecond, sp, c)
    if (how === 'tap') toast(`Pinned to ${c.name}, the nearest city`)
    setHintVisible(false)
  }
  const chooseRef = useRef(choose)
  useLayoutEffect(() => {
    chooseRef.current = choose
  })

  // Boot the map once the data and the portaled canvas are both there.
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!data || !canvas || !wrap) return
    const map = new WorldMap(canvas, wrap, data, {
      fontFamily: getComputedStyle(wrap).fontFamily || 'system-ui, sans-serif',
      onTap: (c, onDot) => chooseRef.current(c, onDot ? 'city' : 'tap'),
    })
    mapRef.current = map

    // Opening move: the saved city on resume, else a guess from the time
    // zone, flown to from the whole-world view.
    let cancelled = false
    const { city: savedCity, countryCode: savedCc } = propsRef.current
    resolveSavedCity(data, savedCity, savedCc).then((saved) => {
      // The user already picked a city while this resolved: keep their choice.
      if (cancelled || userPickedRef.current) return
      const start = saved ?? (savedCity ? null : guessCityFromTimeZone(data.cities))
      if (start) {
        setMain(start)
        commit(start)
      }
      map.intro(start)
    })

    return () => {
      cancelled = true
      map.destroy()
      mapRef.current = null
    }
    // commit/onChange are read through refs at call time; boot once per data load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mounted])

  /* ---------- search ---------- */

  const onQuery = (v: string) => {
    setQuery(v)
    const r = data ? searchCities(data.cities, v) : []
    setResults(r)
    setListOpen(v.trim().length > 0)
    setActive(0)
  }

  const pick = (c: City | undefined) => {
    if (!c) return
    setQuery('')
    setResults([])
    setListOpen(false)
    inputRef.current?.blur()
    choose(c, 'search')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!listOpen || !results.length) {
      if (e.key === 'Escape') setListOpen(false)
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(results[active])
    } else if (e.key === 'Escape') {
      setListOpen(false)
    }
  }

  /* ---------- Locate me ---------- */

  // Browser location → nearest city in the dataset. The raw coordinate never
  // leaves this function: only the resolved city is kept.
  const locate = () => {
    const failed = () => {
      if (!aliveRef.current) return
      setLocating(false)
      toast("We couldn't find you. Search for your city instead.")
      inputRef.current?.focus()
    }
    if (!data || typeof navigator === 'undefined' || !navigator.geolocation) return failed()
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!aliveRef.current) return
        const c = snapToCity(data.cities, { lon: pos.coords.longitude, lat: pos.coords.latitude })
        setLocating(false)
        choose(c, 'locate')
        toast(`Found you in ${c.name}`)
      },
      failed,
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    )
  }

  /* ---------- multi-city (flagged) ---------- */

  const toggleSplit = () => {
    const on = !split
    setSplit(on)
    if (on) setSlot(1)
    else {
      setSecond(null)
      setSlot(0)
      mapRef.current?.setPins(main, null, false, null)
    }
  }

  /* ---------- next ---------- */

  const canContinue = Boolean(city && countryCode)
  const handleContinue = () => {
    if (!canContinue) return
    setError(null)
    startTransition(async () => {
      try {
        // A city picked just before Next may still be resolving its climate:
        // wait for it, and send null (clears the column) when it's unknown so
        // the previous city's climate never sticks to the new one.
        let zone = (climateZone || null) as ClimateZone | null
        if (!zone && climateFetch.current) zone = await climateFetch.current.promise
        await saveEnvironment({
          city: city || undefined,
          countryCode: countryCode || undefined,
          climateZone: zone,
          season: (season || undefined) as Season | undefined,
        })
        onContinue()
      } catch {
        setError('Unable to save. Please try again.')
      }
    })
  }

  const cityName = main?.name ?? city
  const cityLine = main ? placeLine(main) : countryName(countryCode)
  const showList = listOpen && query.trim().length > 0

  if (!mounted) return null

  return createPortal(
    <div className="sl-root" ref={rootRef}>
      <div className="sl-mapwrap" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          className="sl-map"
          aria-label="World map. Tap to choose the nearest city, or use the search field."
        />
        <div className="sl-mapfade" />
        <div className="sl-zoom sl-glass">
          <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()}>
            +
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()}>
            −
          </button>
        </div>
        <div className="sl-maphint sl-glass" hidden={!hintVisible || !data}>
          Tap the map to drop a pin
        </div>
        <div className="sl-toast sl-glass" role="status" hidden={!toastMsg}>
          {toastMsg}
        </div>
      </div>

      <section className="sl-panel sl-glass" aria-label="Your location">
        <h1>SkinAudit uses your general location to understand the environment around your routine.</h1>
        <p className="sl-sub">
          Allow location and we&apos;ll handle the context automatically. We care about the city
          you&apos;re in, not your home address.
        </p>

        <div className="sl-city">
          <span className="sl-eyebrow">Current location</span>
          <h2 className={cityName ? undefined : 'is-empty'}>{cityName || 'Not set yet'}</h2>
          {cityLine && <div className="sl-country">{cityLine}</div>}
        </div>

        <div className="sl-search">
          <div className="sl-field">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={() => setTimeout(() => setListOpen(false), 150)}
              onFocus={() => query && setListOpen(true)}
              placeholder={split && slot === 1 ? 'Search your second city' : 'Search any city'}
              autoComplete="off"
              role="combobox"
              aria-expanded={showList && results.length > 0}
              aria-controls="sl-sugg"
              aria-autocomplete="list"
              aria-activedescendant={showList && results.length ? `sl-opt-${active}` : undefined}
              aria-label="Search any city"
              disabled={!data}
            />
            <button type="button" className="sl-locate" onClick={locate} disabled={!data || locating}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                <circle cx="12" cy="12" r="7" />
              </svg>
              <span>{locating ? 'Locating…' : 'Locate me'}</span>
            </button>
          </div>
          {showList && results.length > 0 && (
            <ul className="sl-sugg" id="sl-sugg" role="listbox">
              {results.map((c, i) => (
                <li
                  key={`${c.name}-${c.cc}-${c.lat}-${c.lon}`}
                  role="option"
                  id={`sl-opt-${i}`}
                  aria-selected={i === active}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    className={i === active ? 'active' : undefined}
                    // mousedown fires before the input's blur closes the list.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(c)}
                  >
                    {c.name}
                    <span>{placeLine(c)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {showList && data && results.length === 0 && (
            <div className="sl-sugg sl-sugg-empty" role="status">
              No city found. Try a nearby larger city.
            </div>
          )}
        </div>

        {loadError && (
          <p className="sl-error" role="alert">
            The map couldn&apos;t load. Check your connection and reload the page.
          </p>
        )}

        {multiCity && (
          <div className="sl-second">
            <button
              type="button"
              className="sl-switch"
              role="switch"
              aria-checked={split}
              onClick={toggleSplit}
            >
              <span>I split my time between two places</span>
              <span className="knob" aria-hidden="true" />
            </button>
            {split && (
              <div>
                <p className="sl-fine" style={{ marginBottom: 8 }}>
                  Tap the map or search to add your second city.
                </p>
                <div className="sl-chipsel" role="group" aria-label="Which pin to place">
                  <button type="button" aria-pressed={slot === 0} onClick={() => setSlot(0)}>
                    Main city
                  </button>
                  <button type="button" aria-pressed={slot === 1} onClick={() => setSlot(1)}>
                    Second city
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="sl-error" role="alert">
            {error}
          </p>
        )}
      </section>

      <footer className="sl-foot">
        <StepFooter
          onContinue={handleContinue}
          onBack={onBack}
          isLoading={isPending}
          continueDisabled={!canContinue}
        />
      </footer>
    </div>,
    document.body,
  )
}
