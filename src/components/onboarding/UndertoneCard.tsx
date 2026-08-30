'use client'

type Props = {
  value: string
  label: string
  subtitle: string
  selected: boolean
  onChange: (value: string) => void
  tabIndex?: number
  onKeyDown?: (e: React.KeyboardEvent) => void
}

/**
 * Large visual selector for Screen 06 (skin undertone). Full-width card with a
 * 40px circle on the left acting as both a visual indicator and a radio.
 * Selected: circle border → accent, inner 20px dot. Used only on Screen 06.
 */
export function UndertoneCard({
  value,
  label,
  subtitle,
  selected,
  onChange,
  tabIndex,
  onKeyDown,
}: Props) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-undertone-card
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      onClick={() => onChange(value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        width: '100%',
        textAlign: 'left',
        padding: '16px',
        borderRadius: '12px',
        cursor: 'pointer',
        outline: 'none',
        border: selected
          ? '1px solid var(--color-sienna-400)'
          : '1px solid rgba(184,134,61,0.28)',
        backgroundColor: selected
          ? 'rgba(184,134,61,0.14)'
          : 'rgba(6,5,5,0.42)',
        transition:
          'border-color var(--duration-micro) var(--ease-luxury), background-color var(--duration-micro) var(--ease-luxury)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'flex',
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: selected
            ? '1.5px solid var(--color-sienna-400)'
            : '1.5px solid rgba(184,134,61,0.45)',
          transition: 'border-color var(--duration-micro) var(--ease-luxury)',
        }}
      >
        {selected && (
          <span
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-sienna-400)',
            }}
          />
        )}
      </span>

      <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span
          aria-hidden="true"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.9375rem',
            color: selected
              ? 'var(--color-alabaster-50)'
              : 'var(--color-alabaster-300)',
            transition: 'color var(--duration-micro) var(--ease-luxury)',
          }}
        >
          {label}
        </span>
        <span
          aria-hidden="true"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.8125rem',
            color: 'var(--color-alabaster-400)',
          }}
        >
          {subtitle}
        </span>
      </span>
    </button>
  )
}
