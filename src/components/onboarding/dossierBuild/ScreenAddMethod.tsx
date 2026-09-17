'use client'

import { Search, Camera, Pencil } from 'lucide-react'
import { StepHeader } from '../StepHeader'

const ICON_SIZE = 26
const ICON_STROKE = 1.5

type Props = {
  onChooseSearch: () => void
}

export function ScreenAddMethod({ onChooseSearch }: Props) {
  return (
    <div>
      <StepHeader title="Add a product" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <button
          type="button"
          onClick={onChooseSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-accent-border)',
            backgroundColor: 'var(--color-surface)',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <Search size={ICON_SIZE} strokeWidth={ICON_STROKE} color="var(--color-sienna-400)" aria-hidden="true" />
          <span>
            <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-alabaster-100)' }}>
              Search
            </span>
            <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-alabaster-400)' }}>
              Find a product by brand or name.
            </span>
          </span>
        </button>

        <div
          aria-label="Scan — coming soon"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-accent-border)',
            backgroundColor: 'var(--color-surface)',
            opacity: 0.6,
          }}
        >
          <Camera size={ICON_SIZE} strokeWidth={ICON_STROKE} color="var(--color-sienna-400)" aria-hidden="true" />
          <span>
            <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-alabaster-100)' }}>
              Scan
            </span>
            <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-alabaster-400)' }}>
              Photograph the product or ingredient list. Coming soon.
            </span>
          </span>
        </div>

        <div
          aria-label="Enter manually — coming soon"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-accent-border)',
            backgroundColor: 'var(--color-surface)',
            opacity: 0.6,
          }}
        >
          <Pencil size={ICON_SIZE} strokeWidth={ICON_STROKE} color="var(--color-sienna-400)" aria-hidden="true" />
          <span>
            <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--color-alabaster-100)' }}>
              Enter manually
            </span>
            <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--color-alabaster-400)' }}>
              Add a product that isn&apos;t in our database. Coming soon.
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
