'use client'

import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

type Props = {
  label: string
  description?: string
  icon?: string
  isSelected: boolean
  isMulti?: boolean
  onClick: () => void
}

export function SelectionCard({
  label,
  description,
  icon,
  isSelected,
  isMulti = false,
  onClick,
}: Props) {
  const cardRef = useRef<HTMLButtonElement>(null)

  // Micro-animation on selection
  useEffect(() => {
    if (!cardRef.current) return
    if (isSelected) {
      gsap.fromTo(
        cardRef.current,
        { scale: 0.97 },
        { scale: 1, duration: 0.25, ease: 'back.out(2)' }
      )
    }
  }, [isSelected])

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '0.5rem',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-card)',
        border: isSelected
          ? '1.5px solid var(--color-sienna-400)'
          : '1px solid var(--color-border)',
        backgroundColor: isSelected
          ? 'var(--color-accent-subtle)'
          : 'var(--color-surface)',
        cursor: 'pointer',
        textAlign: 'left',
        transition:
          'border-color 180ms var(--ease-luxury), background-color 180ms var(--ease-luxury)',
        outline: 'none',
        width: '100%',
        boxShadow: isSelected
          ? '0 0 0 1px rgba(184,134,61,0.15), inset 0 0 20px rgba(184,134,61,0.04)'
          : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          gsap.to(e.currentTarget, {
            scale: 1.01,
            duration: 0.18,
            ease: 'power2.out',
          })
          e.currentTarget.style.borderColor = 'rgba(184,134,61,0.35)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          gsap.to(e.currentTarget, {
            scale: 1,
            duration: 0.18,
            ease: 'power2.out',
          })
          e.currentTarget.style.borderColor = 'var(--color-border)'
        }
      }}
    >
      {/* Selection indicator */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          width: '16px',
          height: '16px',
          borderRadius: isMulti ? '4px' : '50%',
          border: isSelected
            ? 'none'
            : '1px solid var(--color-obsidian-700)',
          backgroundColor: isSelected ? 'var(--color-sienna-500)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 180ms var(--ease-luxury)',
          flexShrink: 0,
        }}
      >
        {isSelected && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path
              d="M1 3L3 5L7 1"
              stroke="var(--color-alabaster-50)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Icon */}
      {icon && (
        <span
          style={{
            fontSize: '1.5rem',
            lineHeight: 1,
            marginBottom: '0.25rem',
            filter: isSelected ? 'none' : 'grayscale(0.3)',
            transition: 'filter 180ms ease',
          }}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}

      {/* Label */}
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 400,
          fontSize: '0.9375rem',
          color: isSelected ? 'var(--color-alabaster-50)' : 'var(--color-alabaster-300)',
          letterSpacing: '0.01em',
          paddingRight: '1.5rem',
          transition: 'color 180ms ease',
        }}
      >
        {label}
      </span>

      {/* Description */}
      {description && (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.8125rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
            paddingRight: '1.5rem',
          }}
        >
          {description}
        </span>
      )}
    </button>
  )
}
