'use client'

import { ArrowLeft, X } from 'lucide-react'

type SectionNavProps = {
  /** 'dossier' | 'studio' — which section link is highlighted. */
  activeSection: 'dossier' | 'studio'
  onNavigateStudio?: () => void
  /** Trailing icon action on the topbar, e.g. the settings gear. */
  action?: React.ReactNode
}

type TitleNavProps = {
  title: string
  /** Omitted on screen03 (Add a product), which mockups draw as a sheet with
   *  only a close button, no back arrow. */
  onBack?: () => void
  onClose?: () => void
}

type Props = SectionNavProps | TitleNavProps

function isTitleNav(props: Props): props is TitleNavProps {
  return 'title' in props
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
 * Sticky topbar for the Dossier build flow, matching the two nav patterns the
 * mockups use: a section switcher (Dossier / Studio, mockups 02 and 07) or a
 * back button with a contextual title (mockups 04-06).
 */
export function ScreenHeader(props: Props) {
  if (isTitleNav(props)) {
    const { title, onBack, onClose } = props
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

  const { activeSection, onNavigateStudio, action } = props
  return (
    <header className="db-topbar">
      <nav className="db-section-nav" aria-label="Main sections">
        <button
          type="button"
          className={`db-section-link${activeSection === 'dossier' ? ' active' : ''}`}
          aria-current={activeSection === 'dossier' ? 'page' : undefined}
        >
          Dossier
        </button>
        <span className="db-section-sep" aria-hidden="true">
          /
        </span>
        <button
          type="button"
          className={`db-section-link${activeSection === 'studio' ? ' active' : ''}`}
          onClick={onNavigateStudio}
        >
          Studio
        </button>
      </nav>
      {action}
    </header>
  )
}
