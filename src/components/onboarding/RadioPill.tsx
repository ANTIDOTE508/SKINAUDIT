'use client'

type Props = {
  /** Stored value this pill represents. Passed back through `onChange`. */
  value: string
  title: string
  /** Optional second line under the title. */
  subtitle?: string
  /** Optional element in the left slot (e.g. a numbered badge). When omitted,
   *  a small radio indicator dot is shown instead. */
  leftSlot?: React.ReactNode
  selected: boolean
  onChange: (value: string) => void
  /** Roving tabindex, managed by the parent radiogroup. */
  tabIndex?: number
  onKeyDown?: (e: React.KeyboardEvent) => void
  /** Overrides the announced label; defaults to the title. */
  ariaLabel?: string
  /** 'roomy' bumps the vertical padding (used by DurationPill on Screen 08). */
  size?: 'default' | 'roomy'
}

/**
 * Full-width selectable pill used by single-choice onboarding steps
 * (sun response, PIH frequency, …). Card shell with a 1px border that turns
 * accent when selected; a left slot for a badge or a radio dot, then a
 * title and optional subtitle. The parent renders these inside a
 * `role="radiogroup"` and drives arrow-key navigation via `onKeyDown` plus
 * a roving `tabIndex`.
 */
export function RadioPill({
  value,
  title,
  subtitle,
  leftSlot,
  selected,
  onChange,
  tabIndex,
  onKeyDown,
  ariaLabel,
  size = 'default',
}: Props) {
  return (
    <button
      type="button"
      role="radio"
      data-radio-pill
      aria-checked={selected}
      aria-label={ariaLabel ?? title}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      onClick={() => onChange(value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        width: '100%',
        textAlign: 'left',
        padding: size === 'roomy' ? '1.25rem 1.125rem' : '0.9375rem 1.125rem',
        borderRadius: '10px',
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
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: selected
            ? '1px solid var(--color-sienna-400)'
            : '1px solid rgba(184,134,61,0.45)',
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '0.8125rem',
          lineHeight: 1,
          color: 'var(--color-sienna-400)',
          transition: 'border-color var(--duration-micro) var(--ease-luxury)',
        }}
      >
        {leftSlot ?? (
          selected ? (
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-sienna-400)',
              }}
            />
          ) : null
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
          {title}
        </span>
        {subtitle && (
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
        )}
      </span>
    </button>
  )
}
