'use client'

import { ArrowLeft, X } from 'lucide-react'

type Props = {
  title: string
  /** Omitted on screen03 (Add a product), which mockups draw as a sheet with
   *  only a close button, no back arrow. */
  onBack?: () => void
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
  color: 'var(--color-alabaster-400)',
  flexShrink: 0,
  opacity: 0.65,
}

/**
 * Sticky topbar for the add-product screens (mockups 03-06): a back button
 * with a contextual title, plus an optional close button.
 */
export function ScreenHeader({ title, onBack, onClose }: Props) {
  return (
    <header className="db-topbar">
      {onBack ? (
        <button type="button" onClick={onBack} aria-label="Back" style={ICON_BUTTON}>
          <ArrowLeft size={20} strokeWidth={1.5} aria-hidden="true" />
        </button>
      ) : (
        <span />
      )}
      <h1 className="db-topbar-title">{title}</h1>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Close" style={ICON_BUTTON}>
          <X size={20} strokeWidth={1.5} aria-hidden="true" />
        </button>
      )}
    </header>
  )
}
