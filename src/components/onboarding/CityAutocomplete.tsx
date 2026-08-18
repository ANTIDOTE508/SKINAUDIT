'use client'

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'

type CityMatch = {
  name: string
  countryCode: string
  countryName: string
  latitude: string | null
  longitude: string | null
}

type Props = {
  city: string
  countryName: string
  onSelect: (match: {
    city: string
    countryCode: string
    latitude: string | null
    longitude: string | null
  }) => void
}

const MAX_RESULTS = 8

export function CityAutocomplete({ city, countryName, onSelect }: Props) {
  const [query, setQuery] = useState(city)
  const [results, setResults] = useState<CityMatch[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const dataRef = useRef<
    { name: string; countryCode: string; latitude: string | null; longitude: string | null }[] | null
  >(null)
  const countriesRef = useRef<Map<string, string> | null>(null)
  const [mounted, setMounted] = useState(false)
  // Position of the dropdown, computed from the field's own rect. The list
  // is portaled to <body> rather than absolutely positioned inside this
  // component, because every ancestor `data-reveal` block carries a GSAP
  // `transform` (never cleared after the entrance tween) — each one becomes
  // its own stacking context, so a plain `z-index` here would still be
  // trapped behind the very next `data-reveal` sibling (the Climate section).
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setQuery(city)
  }, [city])

  const menuRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (containerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keep the portaled menu's position pinned to the field while it's open.
  useLayoutEffect(() => {
    if (!isOpen || results.length === 0) return
    const measure = () => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setMenuRect({ top: rect.bottom + 8, left: rect.left, width: rect.width })
    }
    measure()
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [isOpen, results.length])

  const search = useCallback(async (value: string) => {
    if (value.trim().length < 2) {
      setResults([])
      return
    }

    if (!dataRef.current || !countriesRef.current) {
      const { City, Country } = await import('country-state-city')
      dataRef.current = City.getAllCities().map((c) => ({
        name: c.name,
        countryCode: c.countryCode,
        latitude: c.latitude ?? null,
        longitude: c.longitude ?? null,
      }))
      countriesRef.current = new Map(Country.getAllCountries().map((c) => [c.isoCode, c.name]))
    }

    const needle = value.trim().toLowerCase()
    const scored: { match: CityMatch; exact: boolean }[] = []
    for (const c of dataRef.current) {
      const name = c.name.toLowerCase()
      if (name.startsWith(needle)) {
        scored.push({
          match: {
            name: c.name,
            countryCode: c.countryCode,
            countryName: countriesRef.current.get(c.countryCode) ?? c.countryCode,
            latitude: c.latitude,
            longitude: c.longitude,
          },
          exact: name === needle,
        })
      }
    }
    // Exact name matches (e.g. "Paris") surface before longer names sharing
    // the same prefix (e.g. "Parisi") — the dataset has no population figures
    // to rank by, so this is the best available relevance signal.
    scored.sort((a, b) => Number(b.exact) - Number(a.exact))
    setResults(scored.slice(0, MAX_RESULTS).map((s) => s.match))
    setHighlightedIndex(-1)
  }, [])

  useEffect(() => {
    const handle = setTimeout(() => {
      if (query !== city) search(query)
    }, 150)
    return () => clearTimeout(handle)
  }, [query, city, search])

  const commit = (match: CityMatch) => {
    setQuery(match.name)
    setResults([])
    setIsOpen(false)
    onSelect({
      city: match.name,
      countryCode: match.countryCode,
      latitude: match.latitude,
      longitude: match.longitude,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0) commit(results[highlightedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <label htmlFor="env-city" className="label-caps">
        City
      </label>
      <input
        id="env-city"
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
          if (e.target.value !== city) {
            onSelect({ city: '', countryCode: '', latitude: null, longitude: null })
          }
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Start typing a city…"
        autoComplete="off"
        className="input-underline"
        role="combobox"
        aria-expanded={isOpen && results.length > 0}
        aria-autocomplete="list"
      />
      {countryName && (
        <span
          style={{
            display: 'block',
            marginTop: '0.375rem',
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
          }}
        >
          {countryName}
        </span>
      )}

      {mounted &&
        isOpen &&
        results.length > 0 &&
        menuRect &&
        createPortal(
          <ul
            ref={menuRef}
            style={{
              position: 'fixed',
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
              zIndex: 100,
              margin: 0,
              padding: '0.375rem',
              listStyle: 'none',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-raised)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
              maxHeight: '260px',
              overflowY: 'auto',
            }}
          >
            {results.map((match, i) => (
              <li key={`${match.name}-${match.countryCode}-${i}`}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    commit(match)
                  }}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    width: '100%',
                    padding: '0.5rem 0.625rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: i === highlightedIndex ? 'var(--color-accent-subtle)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-alabaster-100)' }}>{match.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{match.countryName}</span>
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )}
    </div>
  )
}
