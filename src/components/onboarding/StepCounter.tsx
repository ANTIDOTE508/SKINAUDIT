'use client'

type Props = { current: number; total: number }

export function StepCounter({ current, total }: Props) {
  const pct = (current / total) * 100

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: 400,
          letterSpacing: '0.08em',
          color: 'var(--color-text-muted)',
          flexShrink: 0,
        }}
      >
        {String(current).padStart(2, '0')}/{String(total).padStart(2, '0')}
      </span>
      <div
        style={{
          flex: 1,
          height: '1px',
          background: `linear-gradient(to right, var(--color-sienna-500) ${pct}%, var(--color-obsidian-700) ${pct}%)`,
          transition: 'background 0.6s var(--ease-luxury)',
        }}
      />
    </div>
  )
}
