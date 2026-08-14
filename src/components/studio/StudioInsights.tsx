'use client'

import { Droplet, Sparkles, Shield } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Insight = {
  icon: LucideIcon
  text: string
}

const INSIGHTS: Insight[] = [
  { icon: Droplet, text: 'Your regimen shows balanced hydration and barrier support.' },
  { icon: Sparkles, text: 'Retinoid use is optimal for your current skin tolerance.' },
  {
    icon: Shield,
    text: 'Adding a ceramide-rich moisturizer may further strengthen your barrier.',
  },
]

const LAST_UPDATED = 'May 20, 2024'

const panelStyle: React.CSSProperties = {
  padding: '1.75rem',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-card)',
}

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 400,
  fontSize: '1.375rem',
  color: 'var(--color-alabaster-50)',
  letterSpacing: '0.01em',
  margin: '0 0 1.25rem',
}

export function StudioInsights() {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1.5rem',
        alignItems: 'stretch',
      }}
    >
      {/* Key Insights — takes the dominant two thirds */}
      <section aria-labelledby="key-insights-heading" style={{ ...panelStyle, flex: '2 1 380px' }}>
        <h2 id="key-insights-heading" style={headingStyle}>
          Key Insights
        </h2>

        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem',
          }}
        >
          {INSIGHTS.map(({ icon: Icon, text }) => (
            <li
              key={text}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                fontFamily: 'var(--font-body)',
                fontWeight: 300,
                fontSize: '0.875rem',
                lineHeight: 1.6,
                color: 'var(--color-alabaster-300)',
              }}
            >
              <Icon
                size={14}
                strokeWidth={1.5}
                color="var(--color-sienna-400)"
                aria-hidden="true"
                style={{ flexShrink: 0, marginTop: '0.3125rem' }}
              />
              {text}
            </li>
          ))}
        </ul>
      </section>

      {/* Last updated — the narrower third */}
      <section
        aria-labelledby="last-updated-heading"
        style={{
          ...panelStyle,
          flex: '1 1 220px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h2
          id="last-updated-heading"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.6875rem',
            fontWeight: 400,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            margin: '0 0 0.75rem',
          }}
        >
          Last updated
        </h2>

        <time
          dateTime="2024-05-20"
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 300,
            fontSize: '1.5rem',
            lineHeight: 1.2,
            color: 'var(--color-alabaster-50)',
            marginBottom: '0.625rem',
          }}
        >
          {LAST_UPDATED}
        </time>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 300,
            fontSize: '0.8125rem',
            lineHeight: 1.6,
            color: 'var(--color-text-muted)',
            margin: 0,
          }}
        >
          Based on changes in your routine and environment.
        </p>
      </section>
    </div>
  )
}
