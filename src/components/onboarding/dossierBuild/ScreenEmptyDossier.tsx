'use client'

import { Settings } from 'lucide-react'
import { ScreenHeader } from './ScreenHeader'

type Props = {
  onAddProduct: () => void
  /** Opens the permanent Dossier section — not built yet, so it is surfaced
   *  but disabled rather than silently omitted (the mockup shows the gear). */
  onOpenSettings?: () => void
}

/** Mockup 02: the four status chips, every count at zero on a fresh Dossier. */
const CHIPS = [
  { label: 'All', count: 0, active: true },
  { label: 'Active', count: 0, active: false },
  { label: 'Seasonal', count: 0, active: false },
  { label: 'Archived', count: 0, active: false },
]

export function ScreenEmptyDossier({ onAddProduct, onOpenSettings }: Props) {
  return (
    <>
      <ScreenHeader
        activeSection="dossier"
        action={
          <button
            type="button"
            onClick={onOpenSettings}
            disabled={!onOpenSettings}
            aria-label="Dossier settings — coming soon"
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              cursor: onOpenSettings ? 'pointer' : 'default',
              color: 'var(--color-alabaster-400)',
              opacity: 0.6,
              flexShrink: 0,
              lineHeight: 0,
            }}
          >
            <Settings size={18} strokeWidth={1.3} aria-hidden="true" />
          </button>
        }
      />

      <nav className="db-tabs" role="tablist">
        {CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            role="tab"
            aria-selected={chip.active}
            className={`db-tab${chip.active ? ' active' : ''}`}
          >
            {chip.label} ({chip.count})
          </button>
        ))}
      </nav>

      {/* Centred empty state, vertically centred in the space left above the CTA */}
      <div
        className="db-content"
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <svg
          width={76}
          height={76}
          viewBox="0 0 76 76"
          fill="none"
          aria-hidden="true"
          style={{ marginBottom: '1.25rem' }}
          stroke="var(--color-alabaster-300)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Two staggered bottles — matches the mockup's empty-state mark. */}
          <rect x="27" y="16" width="6" height="7" rx="1.5" />
          <rect x="22" y="23" width="16" height="36" rx="3.5" />
          <rect x="49" y="39" width="4" height="6" rx="1" />
          <rect x="45" y="45" width="12" height="20" rx="3" />
        </svg>

        <h3
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: '1.375rem',
            lineHeight: 1.2,
            color: 'var(--color-alabaster-50)',
            margin: '0 0 0.75rem',
          }}
        >
          Your Dossier is empty
        </h3>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.875rem',
            lineHeight: 1.7,
            color: 'var(--color-alabaster-400)',
            margin: 0,
            maxWidth: '19rem',
          }}
        >
          Add your skincare products to get started. Products in your Dossier can be used in your
          rituals, but are not evaluated until they&apos;re assigned.
        </p>

        <button
          type="button"
          onClick={onAddProduct}
          className="btn-primary btn-primary-accent"
          style={{ width: '100%', maxWidth: '320px', minHeight: '52px' }}
        >
          + Add Product
        </button>
      </div>
    </>
  )
}
