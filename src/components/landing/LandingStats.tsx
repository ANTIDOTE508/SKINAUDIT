import StatRow from './StatRow'

const STATS = [
  {
    label: 'Ingredient interactions mapped',
    target: 2400,
    suffix: '+',
    display: '2,400+',
  },
  {
    label: 'Of routines carry a silent conflict',
    target: 87,
    suffix: '%',
    display: '87%',
    transitionDelay: '0.12s',
  },
  {
    label: 'Better results with sequencing awareness',
    target: 3.2,
    suffix: '×',
    display: '3.2×',
    transitionDelay: '0.22s',
  },
] as const

export default function LandingStats() {
  return (
    <section className="stats" aria-label="Key statistics">
      {STATS.map((stat) => (
        <StatRow key={stat.label} {...stat} />
      ))}
    </section>
  )
}
