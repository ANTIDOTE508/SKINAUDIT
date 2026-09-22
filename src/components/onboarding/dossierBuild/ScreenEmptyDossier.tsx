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
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <ScreenHeader
        title="Dossier"
        action={
          <button
            type="button"
            onClick={onOpenSettings}
            disabled={!onOpenSettings}
            aria-label="Dossier settings — coming soon"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              marginTop: '0.25rem',
              cursor: onOpenSettings ? 'pointer' : 'default',
              color: 'var(--color-alabaster-300)',
              flexShrink: 0,
              lineHeight: 0,
            }}
          >
            <Settings size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
        }
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid rgba(196, 176, 154,0.18)',
          marginBottom: '1.5rem',
        }}
      >
        {CHIPS.map((chip) => (
          <span
            key={chip.label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-badge)',
              border: '1px solid',
              borderColor: chip.active ? 'var(--color-accent-border)' : 'var(--color-border)',
              backgroundColor: chip.active ? 'var(--color-accent-subtle)' : 'transparent',
              color: chip.active ? 'var(--color-alabaster-100)' : 'var(--color-alabaster-400)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              fontWeight: 400,
              whiteSpace: 'nowrap',
            }}
          >
            {chip.label}&nbsp;({chip.count})
          </span>
        ))}
      </div>

      {/* Centred empty state, vertically centred in the space left above the CTA */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          paddingBottom: '2rem',
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
      </div>

      <button
        type="button"
        onClick={onAddProduct}
        className="btn-primary btn-primary-accent"
        style={{ width: '100%', minHeight: '56px' }}
      >
        + Add Product
      </button>
    </div>
  )
}
