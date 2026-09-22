'use client'

import type { ComponentType, CSSProperties } from 'react'
import { Search, Camera, Pencil, ChevronRight } from 'lucide-react'
import { ScreenHeader } from './ScreenHeader'

type Props = {
  onChooseSearch: () => void
  onClose: () => void
}

type Method = {
  key: string
  icon: ComponentType<{ size?: number; strokeWidth?: number; color?: string }>
  label: string
  description: string
}

const CARD: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.125rem',
  width: '100%',
  padding: '1.25rem',
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--color-accent-border)',
  backgroundColor: 'var(--color-surface)',
  textAlign: 'left',
  font: 'inherit',
  cursor: 'pointer',
}

const ICON_SIZE = 26
const ICON_STROKE = 1.5

// Mockup drives all three rows to the same search flow — Scan and Enter
// manually have no dedicated implementation yet, so they land the user on
// Search rather than being disabled.
const METHODS: Method[] = [
  {
    key: 'search',
    icon: Search,
    label: 'Search',
    description: 'Find a product by brand or name.',
  },
  {
    key: 'scan',
    icon: Camera,
    label: 'Scan',
    description: 'Photograph the product or ingredient list.',
  },
  {
    key: 'manual',
    icon: Pencil,
    label: 'Enter manually',
    description: "Add a product that isn't in our database.",
  },
]

export function ScreenAddMethod({ onChooseSearch, onClose }: Props) {
  return (
    <div>
      <ScreenHeader title="Add a product" onClose={onClose} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {METHODS.map(({ key, icon: Icon, label, description }) => (
          <button key={key} type="button" onClick={onChooseSearch} style={CARD}>
            <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} color="var(--color-sienna-400)" />
            <span style={{ display: 'block', minWidth: 0, flex: 1 }}>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  color: 'var(--color-alabaster-100)',
                  marginBottom: '0.25rem',
                }}
              >
                {label}
              </span>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  lineHeight: 1.5,
                  color: 'var(--color-alabaster-400)',
                }}
              >
                {description}
              </span>
            </span>
            <ChevronRight
              size={16}
              strokeWidth={1.5}
              color="var(--color-alabaster-400)"
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
