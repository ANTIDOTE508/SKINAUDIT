'use client'

import type { ReactNode } from 'react'
import { ArrowLeft, X } from 'lucide-react'

type Props = {
  title: string
  /** Trailing affordance on the title row — a settings gear on the empty state. */
  action?: ReactNode
  /** Shown in its own row above the title, matching the mockups' navigation row. */
  onBack?: () => void
  /** Trailing close affordance, on the same row as the back arrow. */
  onClose?: () => void
}

const ICON_BUTTON: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  color: 'var(--color-alabaster-300)',
  flexShrink: 0,
}

/**
 * Screen title block for the Dossier build flow. The mockups use a smaller
 * serif title than the onboarding wizard's StepHeader, with navigation
 * affordances sitting on their own row above it.
 */
export function ScreenHeader({ title, action, onBack, onClose }: Props) {
  const hasNavRow = Boolean(onBack || onClose)

  return (
    <div>
      {hasNavRow && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            // Pull the row back so the 34px hit area optically aligns with the
            // 24px icons the mockups draw flush to the card padding.
            margin: '-0.5rem -0.5rem 0.5rem',
          }}
        >
          {onBack ? (
            <button type="button" onClick={onBack} aria-label="Back" style={ICON_BUTTON}>
              <ArrowLeft size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>
          ) : (
            <span />
          )}

          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close" style={ICON_BUTTON}>
              <X size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: 'clamp(1.5rem, 2.4vw, 1.875rem)',
            lineHeight: 1.15,
            letterSpacing: '-0.01em',
            color: 'var(--color-alabaster-50)',
            margin: 0,
          }}
        >
          {title}
        </h2>

        {action}
      </div>
    </div>
  )
}
