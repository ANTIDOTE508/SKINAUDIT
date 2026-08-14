'use client'

/**
 * Open-ring arc gauge, ~270° sweep with the gap at the bottom.
 *
 * Geometry: the arc starts at bottom-left (135° in standard SVG coords) and
 * sweeps clockwise to bottom-right. Rather than compute an arc path, we draw a
 * full circle and use stroke-dasharray to expose only 270° of it, then rotate
 * the whole thing so the gap lands at the bottom. The fill uses the same
 * dasharray trick scaled by `value`, so no external chart library is involved.
 */

const SIZE = 180
const STROKE = 8
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const SWEEP = 0.75 // 270° of 360°

export function HealthGauge({
  value,
  label,
  badge,
}: {
  value: number
  label: string
  badge: string
}) {
  const trackLength = CIRCUMFERENCE * SWEEP
  const fillLength = trackLength * (value / 100)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.875rem',
      }}
    >
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="meter"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
          /* Rotate so the dash gap sits centred at the bottom. */
          style={{ transform: 'rotate(135deg)' }}
        >
          {/* Track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--color-obsidian-800)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${trackLength} ${CIRCUMFERENCE}`}
          />
          {/* Fill */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--color-sienna-500)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${fillLength} ${CIRCUMFERENCE}`}
          />
        </svg>

        {/* Centred readout */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 300,
              fontSize: '3.5rem',
              lineHeight: 1,
              color: 'var(--color-alabaster-50)',
            }}
          >
            {value}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
            }}
          >
            <span
              aria-hidden="true"
              style={{ color: 'var(--color-sienna-400)', fontSize: '0.625rem' }}
            >
              &#9670;
            </span>
            {badge}
          </span>
        </div>
      </div>

      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </span>
    </div>
  )
}
