'use client'

type Metric = {
  label: string
  /** Large serif display value. */
  value: string
  /** Right-aligned raw score, e.g. "8/100". Omitted for the index card. */
  score?: string
  /** Small qualitative badge shown beside the value. */
  badge?: string
  /** 0–100. Drives the bar width. */
  percent: number
  /** Accent bars are reserved for the headline metric only. */
  accent?: boolean
}

const METRICS: Metric[] = [
  { label: 'Regimen Health Index', value: '78', badge: 'Good', percent: 78, accent: true },
  { label: 'Irritation Risk', value: 'Low', score: '8/100', percent: 8 },
  { label: 'Barrier Support', value: 'Good', score: '72/100', percent: 72 },
  { label: 'Compatibility', value: 'Good', score: '84/100', percent: 84 },
]

function ProgressBar({ percent, accent }: { percent: number; accent?: boolean }) {
  return (
    <div
      role="meter"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        width: '100%',
        height: '3px',
        borderRadius: '2px',
        backgroundColor: 'var(--color-obsidian-700)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: '100%',
          borderRadius: '2px',
          backgroundColor: accent ? 'var(--color-sienna-500)' : 'var(--color-alabaster-300)',
        }}
      />
    </div>
  )
}

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <div
      style={{
        flex: '1 1 180px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1.25rem',
        backgroundColor: 'var(--color-surface-raised)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.6875rem',
          fontWeight: 400,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        {metric.label}
      </span>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 300,
              fontSize: '1.875rem',
              lineHeight: 1,
              color: 'var(--color-alabaster-50)',
            }}
          >
            {metric.value}
          </span>
          {metric.badge && (
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.625rem',
                fontWeight: 400,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-sienna-300)',
                backgroundColor: 'var(--color-accent-subtle)',
                border: '1px solid var(--color-accent-border)',
                borderRadius: 'var(--radius-badge)',
                padding: '0.1875rem 0.4375rem',
                whiteSpace: 'nowrap',
              }}
            >
              {metric.badge}
            </span>
          )}
        </div>

        {metric.score && (
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              fontWeight: 300,
              color: 'var(--color-text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            {metric.score}
          </span>
        )}
      </div>

      <ProgressBar percent={metric.percent} accent={metric.accent} />
    </div>
  )
}

export function RegimenOverview() {
  return (
    <section
      aria-labelledby="regimen-overview-heading"
      style={{
        padding: '1.75rem',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        marginBottom: '2rem',
      }}
    >
      <h2
        id="regimen-overview-heading"
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 400,
          fontSize: '1.375rem',
          color: 'var(--color-alabaster-50)',
          letterSpacing: '0.01em',
          margin: '0 0 1.25rem',
        }}
      >
        Regimen Overview
      </h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {METRICS.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>
    </section>
  )
}
