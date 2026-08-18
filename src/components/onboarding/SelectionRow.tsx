'use client'

import { Info } from 'lucide-react'

type Props = {
  label: string
  icon?: React.ReactNode
  isSelected: boolean
  isDisabled?: boolean
  onClick: () => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void
  /** Renders an "i" affordance between the label and the selection dot —
   *  e.g. to open a definitions panel for this option. Its own click never
   *  toggles selection. */
  onInfoClick?: () => void
  infoLabel?: string
  /** "checkbox" (default) for multi-select lists (role="group" parent, e.g.
   *  StepSkinGoals). Pass "radio" when the parent is role="radiogroup" —
   *  a radiogroup must not contain role="checkbox" children. */
  role?: 'checkbox' | 'radio'
  tabIndex?: number
}

export function SelectionRow({
  label,
  icon,
  isSelected,
  isDisabled = false,
  onClick,
  onKeyDown,
  onInfoClick,
  infoLabel,
  role = 'checkbox',
  tabIndex,
}: Props) {
  return (
    <button
      data-row
      type="button"
      role={role}
      tabIndex={tabIndex}
      onClick={isDisabled ? undefined : onClick}
      onKeyDown={onKeyDown}
      aria-checked={isSelected}
      aria-disabled={isDisabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-card)',
        border: isSelected
          ? '1.5px solid var(--color-sienna-400)'
          : '1px solid var(--color-border)',
        backgroundColor: isSelected
          ? 'var(--color-accent-subtle)'
          : 'var(--color-surface)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.35 : 1,
        textAlign: 'left',
        transition: 'all 200ms var(--ease-luxury)',
        outline: 'none',
        boxShadow: isSelected ? '0 0 0 1px rgba(184,134,61,0.12)' : 'none',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        if (!isSelected && !isDisabled) e.currentTarget.style.borderColor = 'rgba(184,134,61,0.3)'
      }}
      onMouseLeave={(e) => {
        if (!isSelected && !isDisabled) e.currentTarget.style.borderColor = 'var(--color-border)'
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        {icon && (
          <span style={{ color: isSelected ? 'var(--color-sienna-400)' : 'var(--color-alabaster-400)', flexShrink: 0 }}>
            {icon}
          </span>
        )}
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
            fontSize: '0.9375rem',
            color: isSelected ? 'var(--color-alabaster-50)' : 'var(--color-alabaster-300)',
            transition: 'color 200ms ease',
          }}
        >
          {label}
        </span>
      </span>

      <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        {onInfoClick && (
          <span
            role="button"
            tabIndex={0}
            aria-label={infoLabel ?? `More info about ${label}`}
            onClick={(e) => {
              e.stopPropagation()
              onInfoClick()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                onInfoClick()
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              color: 'var(--color-alabaster-400)',
              cursor: 'pointer',
              transition: 'color 180ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-sienna-400)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-alabaster-400)'
            }}
          >
            <Info size={17} strokeWidth={1.5} />
          </span>
        )}

        {/* Selection indicator */}
        <div
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            border: isSelected ? 'none' : '1.5px solid var(--color-obsidian-700)',
            backgroundColor: isSelected ? 'var(--color-sienna-400)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 200ms var(--ease-luxury)',
            flexShrink: 0,
          }}
        >
          {isSelected && (
            <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
              <path
                d="M1 4L4 7L10 1"
                stroke="var(--color-obsidian-950)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </span>
    </button>
  )
}
