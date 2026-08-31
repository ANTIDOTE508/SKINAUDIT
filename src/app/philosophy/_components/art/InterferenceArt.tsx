/**
 * "The Problem" backdrop: three families of concentric rings centred at
 * different points. Under motion (see philosophy.css) one family turns
 * against the others so the moiré interference never settles — more
 * information, less clarity.
 */

type Ring = {
  cx: number
  cy: number
  step: number
  count: number
  opacity: number
  className: string
}

const RINGS: Ring[] = [
  { cx: 1008, cy: 374, step: 11, count: 164, opacity: 0.22, className: 'if-a' },
  { cx: 1267.2, cy: 572, step: 11, count: 164, opacity: 0.185, className: 'if-b' },
  { cx: 748.8, cy: 880, step: 17, count: 106, opacity: 0.12, className: 'if-c' },
]

export function InterferenceArt() {
  return (
    <svg
      className="art"
      viewBox="0 0 1440 1100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {RINGS.map(({ cx, cy, step, count, opacity, className }) => (
        <g
          key={className}
          className={className}
          fill="none"
          stroke="rgb(196,176,154)"
          strokeOpacity={opacity}
          strokeWidth={1}
        >
          {Array.from({ length: count }, (_, i) => (
            <circle key={i} cx={cx} cy={cy} r={step * (i + 1)} />
          ))}
        </g>
      ))}
    </svg>
  )
}
