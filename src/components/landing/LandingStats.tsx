import type { ReactNode } from 'react'

const STATS: { value: string; label: ReactNode }[] = [
  {
    value: '2,400+',
    label: 'ingredient interactions mapped',
  },
  {
    value: '87%',
    label: 'of routines carry a silent conflict',
  },
  {
    value: '3.2×',
    label: (
      <>
        better results with
        <br />
        sequencing awareness
      </>
    ),
  },
]

export default function LandingStats() {
  return (
    <section className="stats-section">
      <div className="stats-card">
        {STATS.map(({ value, label }) => (
          <div className="stat" key={value}>
            <div className="stat-number">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
