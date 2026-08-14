'use client'

import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'

const ROUTINES = ['AM Routine', 'PM Routine', 'Weekly Treatment'] as const

export function StudioHeader() {
  const [routine, setRoutine] = useState<string>(ROUTINES[0])
  const [selectFocused, setSelectFocused] = useState(false)

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '2rem',
        flexWrap: 'wrap',
        marginBottom: '2.5rem',
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: 'clamp(2rem, 3vw, 2.5rem)',
            lineHeight: 1.1,
            letterSpacing: '0.01em',
            color: 'var(--color-alabaster-50)',
            margin: '0 0 0.375rem',
          }}
        >
          Studio
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
            margin: 0,
          }}
        >
          Your regimen, visualized and analyzed.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Routine select — native select for accessibility + mobile gestures,
            with the chevron drawn on top so it matches the dark surface. */}
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <select
            value={routine}
            onChange={(e) => setRoutine(e.target.value)}
            onFocus={() => setSelectFocused(true)}
            onBlur={() => setSelectFocused(false)}
            aria-label="Select routine"
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundColor: 'var(--color-surface)',
              border: `1px solid ${
                selectFocused ? 'var(--color-sienna-500)' : 'var(--color-border)'
              }`,
              borderRadius: 'var(--radius-button)',
              color: 'var(--color-alabaster-200)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              fontWeight: 300,
              letterSpacing: '0.02em',
              padding: '0.75rem 2.5rem 0.75rem 1rem',
              cursor: 'pointer',
              outline: 'none',
              transition: 'border-color var(--duration-micro) var(--ease-luxury)',
            }}
          >
            {ROUTINES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <ChevronDown
            size={15}
            strokeWidth={1.5}
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: '0.875rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--color-text-muted)',
            }}
          />
        </div>

        <button type="button" className="btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
          <Plus size={15} strokeWidth={1.5} aria-hidden="true" />
          Add product
        </button>
      </div>
    </header>
  )
}
